import { useState, useEffect, useRef } from 'react';

interface UseWebSocketOptions {
  url: string;
  onOpen?: (event: Event) => void;
  onMessage?: (data: string) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  reconnectInterval?: number;
  reconnectAttempts?: number;
  autoReconnect?: boolean;
}

const useWebSocket = ({
  url,
  onOpen,
  onMessage,
  onClose,
  onError,
  reconnectInterval = 3000,
  reconnectAttempts = 5,
  autoReconnect = true,
}: UseWebSocketOptions) => {
  const [connected, setConnected] = useState<WebSocket | null>(null);
  const [error, setError] = useState<Event | null>(null);
  
  const ws = useRef<WebSocket | null>(null);
  const reconnectCount = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const connect = () => {
    if (ws.current?.readyState === WebSocket.OPEN) return;
    
    try {
      console.log(`Connecting to WebSocket at ${url}`);
      const socket = new WebSocket(url);
      
      socket.onopen = (event) => {
        console.log('WebSocket connected successfully');
        setConnected(socket);
        setError(null);
        reconnectCount.current = 0;
        onOpen?.(event);
      };
      
      socket.onmessage = (event) => {
        try {
          // Try to parse to check if valid JSON
          JSON.parse(event.data);
          onMessage?.(event.data);
        } catch (error) {
          console.warn("Received invalid JSON in WebSocket message:", error);
          console.log("Raw message:", event.data);
          // Still pass the data to the handler in case it's not JSON
          onMessage?.(event.data);
        }
      };
      
      socket.onclose = (event) => {
        console.log(`WebSocket disconnected with code: ${event.code}, reason: ${event.reason || 'No reason provided'}`);
        setConnected(null);
        onClose?.(event);
        
        if (autoReconnect && reconnectCount.current < reconnectAttempts) {
          reconnectCount.current += 1;
          const delayMs = reconnectInterval * Math.pow(1.5, reconnectCount.current - 1); // Exponential backoff
          console.log(`Attempting to reconnect (${reconnectCount.current}/${reconnectAttempts}) in ${delayMs}ms`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delayMs);
        } else if (reconnectCount.current >= reconnectAttempts) {
          console.error(`Max reconnection attempts (${reconnectAttempts}) reached. Please refresh the page.`);
        }
      };
      
      socket.onerror = (event) => {
        console.error('WebSocket error', event);
        setError(event);
        onError?.(event);
      };
      
      ws.current = socket;
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setError(error as Event);
      
      // Still try to reconnect
      if (autoReconnect && reconnectCount.current < reconnectAttempts) {
        reconnectCount.current += 1;
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log(`Attempting to reconnect after error (${reconnectCount.current}/${reconnectAttempts})`);
          connect();
        }, reconnectInterval);
      }
    }
  };
  
  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.close();
    }
  };
  
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [url]);
  
  return {
    connected,
    error,
    connect,
    disconnect,
  };
};

export default useWebSocket;
