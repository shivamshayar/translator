import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { nanoid } from "nanoid";
import { supportedLanguages } from "@/lib/languages";
import AudioWaveAnimation from "@/components/AudioWaveAnimation";
import useWebSocket from "@/hooks/useWebSocket";
import useAudioCapture from "@/hooks/useAudioCapture";

interface ParticipantInterfaceProps {
  eventId: string;
}

interface TranslationMessage {
  id: number;
  eventId: number;
  originalText: string;
  translatedText: string | null;
  language: string;
  timestamp: string;
  originalLanguage?: string;
}

const ParticipantInterface = ({ eventId }: ParticipantInterfaceProps) => {
  const [sessionId, setSessionId] = useState<string>(() => {
    // Try to get existing session ID from localStorage
    const savedSession = localStorage.getItem(`event_session_${eventId}`);
    return savedSession || nanoid();
  });
  
  const [selectedLanguage, setSelectedLanguage] = useState<string>("English");
  const [enableAudio, setEnableAudio] = useState<boolean>(false);
  const [translations, setTranslations] = useState<TranslationMessage[]>([]);
  
  // Define Event type for better type safety
  interface Event {
    id: number;
    name: string;
    date: string;
    time?: string;
    location: string;
    description?: string;
    eventType?: string;
    supportedLanguages?: string[];
    audioConfig?: string;
    enableAudioTranslation?: boolean;
    organizerId: number;
    createdAt: string;
  }
  
  const [eventInfo, setEventInfo] = useState<Event | null>(null);
  const translationsEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Query for event details
  const { data: event, isLoading: eventLoading } = useQuery<Event>({
    queryKey: [`/api/events/${eventId}`],
    enabled: Boolean(eventId),
    queryFn: async ({ queryKey }) => {
      const response = await fetch(queryKey[0] as string);
      if (!response.ok) {
        throw new Error('Failed to fetch event details');
      }
      return response.json() as Promise<Event>;
    }
  });
  
  const [connectionStatus, setConnectionStatus] = useState<string>("connecting");
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Set up WebSocket connection
  const { connected, error: wsError, connect: reconnectWebSocket } = useWebSocket({
    url: `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws`,
    onMessage: (data) => {
      try {
        console.log("Received WebSocket message:", data.substring(0, 100) + (data.length > 100 ? '...' : ''));
        
        let message;
        try {
          message = JSON.parse(data);
        } catch (parseError) {
          console.error("Failed to parse message as JSON:", parseError);
          console.log("Raw message:", data);
          return;
        }
        
        console.log("Processing message type:", message.type);
        
        switch (message.type) {
          case "connection_established":
            console.log("Server connection established. Joining event...");
            setConnectionStatus("established");
            setConnectionError(null);
            break;
            
          case "session_joined":
            console.log("Joined session successfully:", message.sessionId);
            localStorage.setItem(`event_session_${eventId}`, message.sessionId);
            setSessionId(message.sessionId);
            setConnectionStatus("joined");
            setConnectionError(null);
            break;
            
          case "event_info":
            console.log("Received event info:", message.event?.name);
            setEventInfo(message.event);
            break;
            
          case "recent_translations":
            if (message.translations && Array.isArray(message.translations)) {
              console.log(`Received ${message.translations.length} recent translations`);
              
              // Sort translations by timestamp
              const sortedTranslations = [...message.translations].sort(
                (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
              );
              
              setTranslations(sortedTranslations);
            }
            break;
            
          case "translation":
            if (message.translation) {
              console.log(`Received new translation in ${message.translation.language}:`, 
                message.translation.translatedText || message.translation.originalText);
              
              // Prevent duplicates by checking if we already have this ID
              setTranslations(prev => {
                if (prev.some(t => t.id === message.translation.id)) {
                  return prev;
                }
                return [...prev, message.translation];
              });
            }
            break;
            
          case "audio_translation":
            if (message.audioBase64 && enableAudio && audioRef.current) {
              console.log("Received audio translation, playing...");
              try {
                const audio = audioRef.current;
                audio.src = `data:audio/mp3;base64,${message.audioBase64}`;
                audio.play().catch(err => {
                  console.error("Error playing audio:", err);
                  // Try to play again with user interaction if autoplay failed
                  const playPromise = audio.play();
                  if (playPromise !== undefined) {
                    playPromise.catch(() => {
                      // Auto-play was prevented, show a message that audio needs manual interaction
                      setConnectionError("Audio playback failed. Please interact with the page to enable audio.");
                    });
                  }
                });
              } catch (audioError) {
                console.error("Error setting up audio playback:", audioError);
              }
            }
            break;
            
          case "participant_count":
            console.log(`Participant count updated: ${message.count}`);
            // You could add a state to show this information if needed
            break;
            
          case "processing_status":
            console.log(`Processing status: ${message.status} - ${message.message}`);
            break;
            
          case "error":
            console.error("WebSocket error from server:", message.message);
            setConnectionError(message.message);
            break;
            
          default:
            console.warn("Received unknown message type:", message.type);
        }
      } catch (error) {
        console.error("Error handling WebSocket message:", error);
      }
    },
    onOpen: (event) => {
      console.log("WebSocket connection opened");
      setConnectionStatus("connected");
      setConnectionError(null);
      
      // Join the event when connection is established
      setTimeout(() => {
        console.log(`Joining event ${eventId} with session ${sessionId} and language ${selectedLanguage}`);
        sendMessage({
          type: "join",
          eventId: parseInt(eventId),
          sessionId,
          language: selectedLanguage,
          enableAudio
        });
      }, 500); // Small delay to ensure the connection is fully established
    },
    onClose: (event) => {
      console.log(`WebSocket closed with code ${event.code} and reason: ${event.reason || 'No reason provided'}`);
      setConnectionStatus("disconnected");
      
      if (event.code !== 1000) { // Not a normal closure
        setConnectionError(`Connection closed (${event.code}). Please refresh the page.`);
      }
    },
    onError: (event) => {
      console.error("WebSocket error:", event);
      setConnectionStatus("error");
      setConnectionError("Connection error. Please check your internet connection and try again.");
    },
    reconnectInterval: 3000,
    reconnectAttempts: 5
  });
  
  // Function to send messages to the WebSocket server
  const sendMessage = (message: any) => {
    if (connected) {
      connected.send(JSON.stringify(message));
    }
  };
  
  // Handle language change
  useEffect(() => {
    if (connected && sessionId) {
      sendMessage({
        type: "update_language",
        language: selectedLanguage
      });
    }
  }, [selectedLanguage, connected, sessionId]);
  
  // Handle audio toggle
  useEffect(() => {
    if (connected && sessionId) {
      sendMessage({
        type: "toggle_audio",
        enableAudio
      });
    }
  }, [enableAudio, connected, sessionId]);
  
  // Scroll to bottom when new translations arrive
  useEffect(() => {
    if (translationsEndRef.current) {
      translationsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [translations]);
  
  // Format display time from timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Event Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              {eventLoading || !event ? (
                <>
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </>
              ) : (
                <>
                  <h1 className="text-xl font-semibold text-gray-900">{event.name}</h1>
                  <p className="text-sm text-gray-500">{event.location} • {event.date}</p>
                </>
              )}
            </div>
            <div className="mt-3 sm:mt-0">
              <div className="flex items-center">
                <Label htmlFor="language-select" className="block text-sm font-medium text-gray-700 mr-3">
                  Translation:
                </Label>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {supportedLanguages.map(language => (
                      <SelectItem key={language} value={language}>
                        {language}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Audio Controls */}
      <div className="bg-white shadow-sm mt-1">
        <div className="max-w-7xl mx-auto py-3 px-4">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="flex items-center mb-3 sm:mb-0">
              <div className="mr-3">
                <AudioWaveAnimation isActive={connectionStatus === "joined" || connectionStatus === "connected"} />
              </div>
              <span className="text-sm font-medium text-gray-900">
                {(() => {
                  switch (connectionStatus) {
                    case "connecting":
                      return "Connecting to server...";
                    case "established":
                      return "Connected, joining event...";
                    case "connected":
                      return "Connected to server";
                    case "joined":
                      return "Listening for translations...";
                    case "disconnected":
                      return "Disconnected";
                    case "error":
                      return "Connection error";
                    default:
                      return "Initializing...";
                  }
                })()}
              </span>
              {connectionStatus === "joined" && (
                <span className="ml-2 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  Live
                </span>
              )}
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-2">Text</span>
                <Switch 
                  checked={enableAudio} 
                  onCheckedChange={setEnableAudio} 
                  id="audio-toggle"
                  disabled={connectionStatus !== "joined"}
                />
                <span className="text-sm text-gray-900 ml-2">Audio</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="inline-flex items-center px-3 py-1.5 text-xs rounded-full shadow-sm"
              >
                <Info className="h-4 w-4 mr-1" />
                Help
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Connection Status and Errors */}
      {(wsError || connectionError) && (
        <div className="bg-red-50 p-4 mx-4 mt-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Connection Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{connectionError || "Unable to connect to translation service. Please refresh the page or try again later."}</p>
              </div>
              {(connectionStatus === "disconnected" || connectionStatus === "error") && (
                <div className="mt-3">
                  <Button 
                    size="sm" 
                    onClick={() => {
                      reconnectWebSocket();
                      setConnectionStatus("connecting");
                      setConnectionError(null);
                    }}
                  >
                    Reconnect
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {connectionStatus === "joined" && enableAudio && (
        <div className="bg-blue-50 p-4 mx-4 mt-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Audio Enabled</h3>
              <div className="mt-1 text-sm text-blue-700">
                <p>Translations will be read aloud in {selectedLanguage}. Please ensure your volume is turned up.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Translations Container */}
      <div className="flex-grow px-4 py-6 overflow-auto">
        <div className="max-w-3xl mx-auto space-y-4">
          {translations.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow-sm text-center">
              <p className="text-gray-500">Waiting for translations to appear...</p>
              <p className="text-sm text-gray-400 mt-2">Translations will display here as the speaker talks.</p>
            </div>
          ) : (
            translations.map((translation, index) => {
              const isOriginal = translation.language === "English";
              const showTranslation = translation.language === selectedLanguage;
              
              if (!showTranslation) return null;
              
              return (
                <div 
                  key={`${translation.id}-${index}`}
                  className={`bg-white p-4 rounded-lg shadow-sm border-l-4 ${
                    isOriginal ? "border-gray-300" : "border-primary"
                  }`}
                >
                  <div className="flex justify-between mb-2">
                    <span className={`text-xs font-medium ${
                      isOriginal ? "text-gray-500" : "text-primary"
                    }`}>
                      {isOriginal ? "ORIGINAL (English)" : translation.language.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatTime(translation.timestamp)}
                    </span>
                  </div>
                  <p className="text-gray-900">
                    {isOriginal ? translation.originalText : translation.translatedText}
                  </p>
                </div>
              );
            })
          )}
          <div ref={translationsEndRef} />
        </div>
      </div>
      
      {/* Hidden audio element for speech synthesis */}
      <audio ref={audioRef} style={{ display: 'none' }} controls />
    </div>
  );
};

export default ParticipantInterface;
