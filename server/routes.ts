import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { nanoid } from "nanoid";
import { z } from "zod";
import { insertEventSchema, insertParticipantSchema, insertTranslationSchema } from "@shared/schema";
import { transcribeAudio, translateText, generateSpeech } from "./openai";

// Utility function to get error message safely
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return 'Unknown error';
}

// Track active WebSocket connections by event ID
interface EventConnection {
  ws: WebSocket;
  language: string;
  sessionId: string;
  enableAudio: boolean;
  isOrganizer?: boolean;
}

const activeConnections = new Map<number, EventConnection[]>();

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Setup WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  console.log('WebSocket server initialized on path: /ws');
  
  wss.on('listening', () => {
    console.log('WebSocket server is listening for connections');
  });
  
  wss.on('connection', async (ws, req) => {
    const clientIp = req.socket.remoteAddress;
    console.log(`WebSocket connection established from ${clientIp}`);
    
    let sessionId: string = '';
    let eventId: number = 0;
    let language: string = 'English';
    let enableAudio: boolean = false;
    let clientInfo = '[Unidentified Client]';
    
    // Send initial connection acknowledgment
    try {
      ws.send(JSON.stringify({
        type: 'connection_established',
        message: 'Connected to translation server'
      }));
    } catch (error) {
      console.error('Error sending initial connection message:', error);
    }
    
    // Handle incoming messages from participant
    ws.on('message', async (message) => {
      try {
        console.log(`Received WebSocket message: ${message.toString().substring(0, 100)}${message.toString().length > 100 ? '...' : ''}`);
        
        let data;
        try {
          data = JSON.parse(message.toString());
        } catch (parseError) {
          console.error('Failed to parse WebSocket message as JSON:', parseError);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format: Message must be valid JSON'
          }));
          return;
        }
        
        // Log message type
        console.log(`Processing message type: ${data.type}`);
        
        // Handle different message types
        switch (data.type) {
          case 'join':
            // Join or create a session for a specific event
            if (!data.eventId) {
              throw new Error('Missing eventId in join request');
            }
            
            eventId = parseInt(data.eventId);
            sessionId = data.sessionId || nanoid();
            language = data.language || 'English';
            enableAudio = data.enableAudio || false;
            const isOrganizer = data.isOrganizer || false;
            
            clientInfo = `[Event: ${eventId}, Session: ${sessionId.substring(0, 6)}..., Role: ${isOrganizer ? 'Organizer' : 'Participant'}, Language: ${language}]`;
            console.log(`Client ${clientInfo} joining event`);
            
            // Add connection to active connections for this event
            if (!activeConnections.has(eventId)) {
              activeConnections.set(eventId, []);
              console.log(`Created new connection group for event ${eventId}`);
            }
            
            // Check if session already exists and remove old connection if needed
            const existingConnectionIndex = activeConnections.get(eventId)?.findIndex(c => c.sessionId === sessionId);
            if (existingConnectionIndex !== undefined && existingConnectionIndex >= 0) {
              console.log(`Found existing connection for session ${sessionId}, replacing it`);
              const connections = activeConnections.get(eventId) || [];
              // Close previous connection if it exists
              const oldConnection = connections[existingConnectionIndex];
              if (oldConnection.ws.readyState === WebSocket.OPEN) {
                oldConnection.ws.close();
              }
              // Remove old connection
              connections.splice(existingConnectionIndex, 1);
            }
            
            // Add new connection
            activeConnections.get(eventId)?.push({
              ws,
              language,
              sessionId,
              enableAudio,
              isOrganizer
            });
            console.log(`Added ${isOrganizer ? 'organizer' : 'participant'} connection to event ${eventId}, total connections: ${activeConnections.get(eventId)?.length || 0}`);
            
            // Create participant record if it doesn't exist and not an organizer
            if (!isOrganizer) {
              try {
                const existingParticipant = await storage.getParticipantBySessionId(sessionId);
                if (!existingParticipant) {
                  await storage.createParticipant({
                    eventId,
                    sessionId,
                    language
                  });
                  console.log(`Created new participant record for session ${sessionId}`);
                } else {
                  console.log(`Found existing participant record for session ${sessionId}`);
                }
              } catch (participantError) {
                console.error(`Error managing participant record: ${getErrorMessage(participantError)}`);
              }
            }
            
            // Send recent translations to the new participant
            try {
              const recentTranslations = await storage.getRecentTranslations(eventId, 10);
              console.log(`Sending ${recentTranslations.length} recent translations to client ${clientInfo}`);
              ws.send(JSON.stringify({
                type: 'recent_translations',
                translations: recentTranslations
              }));
            } catch (translationsError) {
              console.error(`Error fetching recent translations: ${getErrorMessage(translationsError)}`);
            }
            
            // Send event info
            try {
              const event = await storage.getEvent(eventId);
              if (event) {
                console.log(`Sending event info to client ${clientInfo}`);
                ws.send(JSON.stringify({
                  type: 'event_info',
                  event
                }));
              } else {
                console.warn(`Event with ID ${eventId} not found`);
                ws.send(JSON.stringify({
                  type: 'error',
                  message: `Event with ID ${eventId} not found`
                }));
              }
            } catch (eventError) {
              console.error(`Error fetching event info: ${getErrorMessage(eventError)}`);
            }
            
            // Send the session ID back to the client
            console.log(`Confirming session join to client ${clientInfo}`);
            ws.send(JSON.stringify({
              type: 'session_joined',
              sessionId,
              eventId,
              language,
              isOrganizer
            }));
            
            // Update participant count for all clients in this event
            try {
              const participantConnections = activeConnections.get(eventId) || [];
              const participantCount = participantConnections.filter(c => !c.isOrganizer).length;
              const organizerCount = participantConnections.filter(c => c.isOrganizer).length;
              
              console.log(`Event ${eventId} stats: ${participantCount} participants, ${organizerCount} organizers`);
              
              // Send updated participant count to all clients
              for (const conn of participantConnections) {
                if (conn.ws.readyState === WebSocket.OPEN) {
                  conn.ws.send(JSON.stringify({
                    type: 'participant_count',
                    count: participantCount
                  }));
                }
              }
            } catch (countError) {
              console.error(`Error updating participant count: ${getErrorMessage(countError)}`);
            }
            break;
            
          case 'update_language':
            // Update participant's language preference
            language = data.language;
            
            // Update the connection in activeConnections
            if (activeConnections.has(eventId)) {
              const connections = activeConnections.get(eventId);
              const connectionIndex = connections?.findIndex(c => c.sessionId === sessionId);
              
              if (connectionIndex !== undefined && connectionIndex >= 0 && connections) {
                connections[connectionIndex].language = language;
              }
            }
            
            // Update in database
            const participant = await storage.getParticipantBySessionId(sessionId);
            if (participant) {
              await storage.updateParticipant(participant.id, { language });
            }
            break;
            
          case 'toggle_audio':
            // Toggle audio translation option
            enableAudio = data.enableAudio;
            
            // Update the connection in activeConnections
            if (activeConnections.has(eventId)) {
              const connections = activeConnections.get(eventId);
              const connectionIndex = connections?.findIndex(c => c.sessionId === sessionId);
              
              if (connectionIndex !== undefined && connectionIndex >= 0 && connections) {
                connections[connectionIndex].enableAudio = enableAudio;
              }
            }
            break;
            
          case 'audio_data':
            // Process audio data from organizer
            if (!data.eventId || !data.audioBase64) {
              console.error(`Client ${clientInfo}: Missing eventId or audio data in audio_data message`);
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Missing eventId or audio data'
              }));
              break;
            }
            
            // Check audio data format
            if (typeof data.audioBase64 !== 'string') {
              console.error(`Client ${clientInfo}: Audio data is not a string`);
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Audio data must be a base64 encoded string'
              }));
              break;
            }
            
            const audioEventId = parseInt(data.eventId);
            const audioDataLength = data.audioBase64.length;
            
            console.log(`Client ${clientInfo}: Received audio data (${audioDataLength} chars) for event ID: ${audioEventId}`);
            
            // Check if event exists
            const eventExists = await storage.getEvent(audioEventId);
            if (!eventExists) {
              console.error(`Client ${clientInfo}: Event with ID ${audioEventId} not found`);
              ws.send(JSON.stringify({
                type: 'error',
                message: `Event with ID ${audioEventId} not found`
              }));
              break;
            }
            
            // Check if client is authorized (should be an organizer)
            const senderConnection = activeConnections.get(audioEventId)?.find(c => c.sessionId === sessionId);
            if (!senderConnection?.isOrganizer) {
              console.error(`Client ${clientInfo}: Unauthorized audio data submission from non-organizer`);
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Only organizers can broadcast audio'
              }));
              break;
            }
            
            // Audio processing
            try {
              // Audio data size check
              if (audioDataLength < 50) {
                console.log(`Client ${clientInfo}: Audio data too small (${audioDataLength} chars), likely silence`);
                ws.send(JSON.stringify({
                  type: 'processing_status',
                  status: 'skipped',
                  message: 'Audio chunk too small, likely silence'
                }));
                break;
              }
              
              // Send acknowledgment to client that we received the audio
              ws.send(JSON.stringify({
                type: 'processing_status',
                status: 'processing',
                message: 'Audio received, processing...'
              }));
              
              // Transcribe audio using OpenAI Whisper
              console.log(`Client ${clientInfo}: Starting audio transcription for ${audioDataLength} chars of audio data`);
              const transcription = await transcribeAudio(data.audioBase64);
              console.log(`Client ${clientInfo}: Transcription result: "${transcription}"`);
              
              // Check for empty transcription
              if (!transcription || transcription.trim().length === 0) {
                console.log(`Client ${clientInfo}: Empty transcription result, skipping processing`);
                ws.send(JSON.stringify({
                  type: 'processing_status',
                  status: 'complete',
                  message: 'No speech detected in audio'
                }));
                break;
              }
              
              // Create translation record for original language (English)
              console.log(`Client ${clientInfo}: Creating translation record for English (original)`);
              const translation = await storage.createTranslation({
                eventId: audioEventId,
                originalText: transcription,
                translatedText: null,
                language: 'English'  // Original language
              });
            
              // Notify sender that transcription was successful
              ws.send(JSON.stringify({
                type: 'processing_status',
                status: 'transcribed',
                message: 'Audio transcribed successfully',
                transcription
              }));
              
              // Get all connections for this event and their languages
              const eventConnections = activeConnections.get(audioEventId) || [];
              const uniqueLanguages = Array.from(new Set(eventConnections.map(c => c.language)));
              console.log(`Client ${clientInfo}: Processing translations for ${uniqueLanguages.length} languages`);
              
              // Send the original English transcription to English clients immediately
              const clientsForEnglish = eventConnections.filter(c => c.language === 'English');
              console.log(`Client ${clientInfo}: Sending original to ${clientsForEnglish.length} English clients`);
              
              for (const client of clientsForEnglish) {
                if (client.ws.readyState === WebSocket.OPEN) {
                  try {
                    client.ws.send(JSON.stringify({
                      type: 'translation',
                      translation: translation,
                      originalText: transcription,
                      originalLanguage: 'English'
                    }));
                  } catch (sendError) {
                    console.error(`Error sending English translation to client: ${getErrorMessage(sendError)}`);
                  }
                }
              }
              
              // Generate translations for each non-English language
              const translationPromises = uniqueLanguages
                .filter(lang => lang !== 'English')
                .map(async (targetLanguage) => {
                  try {
                    console.log(`Client ${clientInfo}: Translating to ${targetLanguage}...`);
                    const translatedText = await translateText(transcription, targetLanguage);
                    
                    // Store translation
                    const translationRecord = await storage.createTranslation({
                      eventId: audioEventId,
                      originalText: transcription,
                      translatedText: translatedText,
                      language: targetLanguage
                    });
                    
                    // Get clients for this language
                    const clientsForLanguage = eventConnections.filter(c => c.language === targetLanguage);
                    console.log(`Client ${clientInfo}: Sending translation to ${clientsForLanguage.length} clients for ${targetLanguage}`);
                    
                    // Send text translation to all clients for this language
                    for (const client of clientsForLanguage) {
                      if (client.ws.readyState === WebSocket.OPEN) {
                        try {
                          // Send text translation
                          client.ws.send(JSON.stringify({
                            type: 'translation',
                            translation: translationRecord,
                            originalText: transcription,
                            originalLanguage: 'English'
                          }));
                          
                          // Generate and send audio if client has audio enabled
                          if (client.enableAudio) {
                            console.log(`Client ${clientInfo}: Generating speech for ${targetLanguage}...`);
                            const audioBase64 = await generateSpeech(translatedText, 'nova', targetLanguage.substring(0, 2).toLowerCase());
                            client.ws.send(JSON.stringify({
                              type: 'audio_translation',
                              audioBase64,
                              text: translatedText
                            }));
                          }
                        } catch (sendError) {
                          console.error(`Error sending translation to client: ${getErrorMessage(sendError)}`);
                        }
                      }
                    }
                    
                    return { language: targetLanguage, success: true };
                  } catch (translationError) {
                    console.error(`Error translating to ${targetLanguage}:`, translationError);
                    return { language: targetLanguage, success: false, error: getErrorMessage(translationError) };
                  }
                });
              
              // Wait for all translations to complete
              const translationResults = await Promise.allSettled(translationPromises);
              
              // Report completion to sender
              const successfulTranslations = translationResults.filter(r => r.status === 'fulfilled' && r.value.success).length;
              const failedTranslations = translationResults.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;
              
              ws.send(JSON.stringify({
                type: 'processing_status',
                status: 'complete',
                message: `Processing complete. Successful translations: ${successfulTranslations}, Failed: ${failedTranslations}`,
                transcription,
                details: {
                  successfulTranslations,
                  failedTranslations,
                  totalLanguages: uniqueLanguages.length
                }
              }));
              
            } catch (error) {
              console.error(`Client ${clientInfo}: Error processing audio:`, error);
              
              // Send detailed error to client
              let errorMessage = getErrorMessage(error);
              let errorDetails: Record<string, any> = {};
              
              // Check for specific OpenAI API errors
              if (error && typeof error === 'object') {
                const apiError = error as any;
                
                if (apiError.response) {
                  errorDetails = {
                    status: apiError.response.status || 'unknown',
                    statusText: apiError.response.statusText || 'unknown',
                    data: apiError.response.data || {}
                  };
                  
                  if (apiError.response.status === 401) {
                    errorMessage = 'OpenAI API key is invalid or missing. Please check your API key.';
                  } else if (apiError.response.status === 429) {
                    errorMessage = 'OpenAI API rate limit exceeded. Please try again later.';
                  }
                }
              }
              
              ws.send(JSON.stringify({
                type: 'error',
                message: errorMessage,
                details: errorDetails
              }));
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: getErrorMessage(error)
        }));
      }
    });
    
    // Handle disconnection
    ws.on('close', (code, reason) => {
      console.log(`WebSocket connection ${clientInfo} closed with code: ${code}, reason: ${reason || 'No reason provided'}`);
      
      // Remove connection from active connections
      if (eventId && activeConnections.has(eventId)) {
        const connections = activeConnections.get(eventId) || [];
        const connectionCount = connections.length;
        const updatedConnections = connections.filter(c => c.sessionId !== sessionId);
        const newConnectionCount = updatedConnections.length;
        
        console.log(`Removed client ${clientInfo} from event ${eventId}. Connections: ${connectionCount} → ${newConnectionCount}`);
        
        if (newConnectionCount > 0) {
          activeConnections.set(eventId, updatedConnections);
          
          // Update participant count for remaining clients
          const participantCount = updatedConnections.filter(c => !c.isOrganizer).length;
          const organizerCount = updatedConnections.filter(c => c.isOrganizer).length;
          
          console.log(`Updated event ${eventId} stats after disconnection: ${participantCount} participants, ${organizerCount} organizers`);
          
          // Notify all remaining clients about the updated participant count
          for (const conn of updatedConnections) {
            if (conn.ws.readyState === WebSocket.OPEN) {
              try {
                conn.ws.send(JSON.stringify({
                  type: 'participant_count',
                  count: participantCount
                }));
              } catch (sendError) {
                console.error(`Error sending updated participant count: ${getErrorMessage(sendError)}`);
              }
            }
          }
        } else {
          console.log(`No more connections for event ${eventId}, removing event from active connections`);
          activeConnections.delete(eventId);
        }
      } else {
        console.log(`No event ID associated with the closing connection ${clientInfo}`);
      }
    });
  });
  
  // Event management routes
  app.post('/api/events', async (req: Request, res: Response) => {
    try {
      const validatedData = insertEventSchema.parse(req.body);
      const newEvent = await storage.createEvent(validatedData);
      return res.status(201).json(newEvent);
    } catch (error) {
      console.error('Error creating event:', error);
      return res.status(400).json({ message: getErrorMessage(error) });
    }
  });
  
  app.get('/api/events', async (req: Request, res: Response) => {
    try {
      const organizerId = req.query.organizerId ? parseInt(req.query.organizerId as string) : null;
      let events;
      
      if (organizerId) {
        events = await storage.getEventsByOrganizer(organizerId);
      } else {
        events = await storage.getAllEvents();
      }
      
      return res.json(events);
    } catch (error) {
      console.error('Error fetching events:', error);
      return res.status(500).json({ message: getErrorMessage(error) });
    }
  });
  
  app.get('/api/events/:id', async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      const event = await storage.getEvent(eventId);
      
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }
      
      return res.json(event);
    } catch (error) {
      console.error('Error fetching event:', error);
      return res.status(500).json({ message: getErrorMessage(error) });
    }
  });
  
  app.put('/api/events/:id', async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      const validatedData = insertEventSchema.partial().parse(req.body);
      
      const updatedEvent = await storage.updateEvent(eventId, validatedData);
      
      if (!updatedEvent) {
        return res.status(404).json({ message: 'Event not found' });
      }
      
      return res.json(updatedEvent);
    } catch (error) {
      console.error('Error updating event:', error);
      return res.status(400).json({ message: getErrorMessage(error) });
    }
  });
  
  app.delete('/api/events/:id', async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      const success = await storage.deleteEvent(eventId);
      
      if (!success) {
        return res.status(404).json({ message: 'Event not found' });
      }
      
      return res.json({ success: true });
    } catch (error) {
      console.error('Error deleting event:', error);
      return res.status(500).json({ message: getErrorMessage(error) });
    }
  });
  
  // Participant management
  app.post('/api/participants', async (req: Request, res: Response) => {
    try {
      const validatedData = insertParticipantSchema.parse(req.body);
      const newParticipant = await storage.createParticipant(validatedData);
      return res.status(201).json(newParticipant);
    } catch (error) {
      console.error('Error creating participant:', error);
      return res.status(400).json({ message: getErrorMessage(error) });
    }
  });
  
  app.get('/api/participants/event/:eventId', async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const participants = await storage.getParticipantsByEvent(eventId);
      return res.json(participants);
    } catch (error) {
      console.error('Error fetching participants:', error);
      return res.status(500).json({ message: getErrorMessage(error) });
    }
  });
  
  // Translation history
  app.get('/api/translations/event/:eventId', async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const translations = await storage.getTranslationsByEvent(eventId);
      return res.json(translations);
    } catch (error) {
      console.error('Error fetching translations:', error);
      return res.status(500).json({ message: getErrorMessage(error) });
    }
  });
  
  return httpServer;
}
