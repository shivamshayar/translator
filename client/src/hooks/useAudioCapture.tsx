import { useState, useEffect, useRef } from 'react';

interface UseAudioCaptureOptions {
  enabled?: boolean;
  bufferSize?: number;
  sampleRate?: number;
  onAudioData?: (base64Audio: string) => void;
  onError?: (error: Error) => void;
}

const useAudioCapture = ({
  enabled = false,
  bufferSize = 4096,
  sampleRate = 44100,
  onAudioData,
  onError,
}: UseAudioCaptureOptions = {}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  const startRecording = async () => {
    try {
      if (isRecording) return;
      
      // Reset any previous errors
      setError(null);
      
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Create audio context
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate,
      });
      
      // Create audio source from stream
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      
      // Create script processor for capturing audio data
      processorRef.current = audioContextRef.current.createScriptProcessor(
        bufferSize,
        1,
        1
      );
      
      // Create MediaRecorder with specific MIME type and bitrate
      try {
        // Try to use a more compatible audio format
        mediaRecorderRef.current = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus',
          audioBitsPerSecond: 16000  // Lower bitrate for better processing
        });
      } catch (codecError) {
        console.warn("Opus codec not supported, falling back to default codec", codecError);
        mediaRecorderRef.current = new MediaRecorder(stream);
      }
      
      chunksRef.current = [];
      
      // Set up data handling
      mediaRecorderRef.current.ondataavailable = (event) => {
        console.log(`Audio data received, size: ${event.data.size} bytes`);
        
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        
          // Convert to base64 and send to callback
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = (reader.result as string)?.split(',')[1];
            if (base64data && onAudioData) {
              console.log(`Sending audio data, length: ${base64data.length} chars`);
              onAudioData(base64data);
            } else {
              console.warn("Could not process audio data or callback not provided");
            }
            // Reset chunks for next audio segment
            chunksRef.current = [];
          };
          reader.onerror = (readerError) => {
            console.error("Error reading audio blob:", readerError);
            chunksRef.current = [];
          };
          reader.readAsDataURL(blob);
        } else {
          console.warn("Received empty audio data");
        }
      };
      
      // Start recording
      mediaRecorderRef.current.start(2000); // Collect data every 2 seconds (reduced from 3)
      
      // Connect the processor
      sourceRef.current.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);
      
      setIsRecording(true);
    } catch (err) {
      console.error('Error starting audio capture:', err);
      setError(err as Error);
      onError?.(err as Error);
    }
  };
  
  const stopRecording = () => {
    if (!isRecording) return;
    
    // Stop MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    // Disconnect and clean up audio processing
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    
    // Stop all audio tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    
    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    setIsRecording(false);
  };
  
  // Only handle the cleanup on unmount, don't automatically start/stop
  // based on enabled prop since we're controlling it manually in AudioBroadcaster
  useEffect(() => {
    return () => {
      if (isRecording) {
        stopRecording();
      }
    };
  }, [isRecording]);
  
  return {
    isRecording,
    error,
    startRecording,
    stopRecording,
  };
};

export default useAudioCapture;