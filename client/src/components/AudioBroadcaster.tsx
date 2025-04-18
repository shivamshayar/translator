import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Radio } from 'lucide-react';
import useAudioCapture from '@/hooks/useAudioCapture';
import useWebSocket from '@/hooks/useWebSocket';
import AudioWaveAnimation from './AudioWaveAnimation';

interface AudioBroadcasterProps {
  eventId: number;
}

const AudioBroadcaster = ({ eventId }: AudioBroadcasterProps) => {
  const [broadcasting, setBroadcasting] = useState(false);
  const [sessionId] = useState(() => `organizer-${Date.now()}`);
  const [participants, setParticipants] = useState<number>(0);

  // Set up WebSocket connection
  const { connected, error: wsError } = useWebSocket({
    url: `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws`,
    onOpen: () => {
      // Join the event as organizer when connection is established
      if (connected) {
        connected.send(JSON.stringify({
          type: "join",
          eventId,
          sessionId,
          isOrganizer: true,
        }));
      }
    },
    onMessage: (data) => {
      try {
        const message = JSON.parse(data);
        
        if (message.type === 'participant_count') {
          setParticipants(message.count);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    }
  });

  // Initialize audio capture hook
  const { isRecording, error, startRecording, stopRecording } = useAudioCapture({
    enabled: broadcasting,
    onAudioData: (base64Audio) => {
      if (connected && broadcasting) {
        console.log("Sending audio data to server via WebSocket");
        try {
          connected.send(JSON.stringify({
            type: "audio_data",
            eventId,
            audioBase64: base64Audio
          }));
        } catch (sendError) {
          console.error("Error sending audio data:", sendError);
          // Attempt to reconnect if connection appears broken
          if (connected.readyState !== WebSocket.OPEN) {
            console.warn("WebSocket not open, audio data not sent");
          }
        }
      } else {
        console.warn(`Cannot send audio data. Connected: ${Boolean(connected)}, Broadcasting: ${broadcasting}`);
      }
    },
    onError: (err) => {
      console.error("Audio capture error:", err);
      setBroadcasting(false);
    }
  });

  // Toggle broadcasting state
  const toggleBroadcasting = async () => {
    if (broadcasting) {
      setBroadcasting(false);
      stopRecording();
    } else {
      // Request microphone permission and start broadcasting
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setBroadcasting(true);
        await startRecording();
      } catch (err) {
        console.error("Microphone access denied:", err);
        alert("You need to grant microphone permission to broadcast audio.");
      }
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (isRecording) {
        stopRecording();
      }
    };
  }, [isRecording, stopRecording]);

  return (
    <Card className={`mb-6 ${broadcasting ? 'border-red-500 border-2' : ''}`}>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between">
          <div className="flex items-center mb-4 sm:mb-0">
            <div className="mr-4">
              {broadcasting ? (
                <div className="relative">
                  <div className="absolute -top-1 -right-1">
                    <Badge variant="default" className="bg-red-500 animate-pulse h-3 w-3 rounded-full p-0" />
                  </div>
                  <Radio className="h-8 w-8 text-primary" />
                </div>
              ) : (
                <Radio className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <div>
              <h3 className="font-medium text-lg">Audio Broadcasting</h3>
              <div className="flex items-center mt-1">
                <p className="text-sm text-gray-500 mr-3">Status: 
                  {broadcasting ? (
                    <span className="text-green-600 font-medium ml-1">Live</span>
                  ) : (
                    <span className="text-gray-500 ml-1">Offline</span>
                  )}
                </p>
                {broadcasting && (
                  <>
                    <AudioWaveAnimation isActive={true} />
                    <span className="ml-2 text-xs text-red-500 animate-pulse font-medium">Microphone active</span>
                  </>
                )}
              </div>
              {participants > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {participants} participant{participants !== 1 ? 's' : ''} connected
                </p>
              )}
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Button
              onClick={toggleBroadcasting}
              variant={broadcasting ? "destructive" : "default"}
              className="min-w-[140px]"
              disabled={!connected}
            >
              {broadcasting ? (
                <>
                  <MicOff className="h-4 w-4 mr-2 text-red-500" />
                  Stop Broadcasting
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 mr-2" />
                  Start Broadcasting
                </>
              )}
            </Button>
          </div>
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-md">
            Error: {error.message || "Failed to access microphone. Please check your device settings."}
          </div>
        )}
        
        {wsError && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-md">
            Connection Error: Unable to connect to server. Broadcasting will not work.
          </div>
        )}
        
        {!connected && !wsError && (
          <div className="mt-4 p-3 bg-yellow-50 text-yellow-700 text-sm rounded-md">
            Connecting to server... Please wait.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AudioBroadcaster;