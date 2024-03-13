// hooks/useWebSocket.tsx
import { useEffect, useRef, useState } from 'react';

export const WebSocketReadyState = (websocket: WebSocket) : string => {
    switch (websocket.readyState) { 
      case WebSocket.CONNECTING:
        return "CONNECTING";
      case WebSocket.OPEN:
        return "OPEN";
      case WebSocket.CLOSING:
        return "CLOSING";
      case WebSocket.CLOSED:
        return "CLOSED";
      default:
        return "UNKNOWN";
    }
  };

export const useWebSocket = (url: string) => {
  const ws = useRef<WebSocket | null>(null);
  const [wsState, setWsState] = useState("UNKNOWN");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    ws.current = new WebSocket(url);
    if (!ws.current) return;

    const wsCurrent = ws.current;
    const checkWsState = () => setWsState(WebSocketReadyState(wsCurrent));

    wsCurrent.onopen = () => {
      console.log("Connected 😀");
      checkWsState();
    };

    //Message received {
    //"sessionID":"37f4393f-1999-4a13-9560-a341a20af0dd",
    //"sdp":
    //{"type":"offer",
    //"sdp":"v=0\r\no=- 9162965593960627838 1710295559 IN IP4 0.0.0.0\r\ns=-\r\nt=0 0\r\na=fingerprint:sha-256 AF:C1:82:30:53:56:04:6F:8F:BA:79:F1:19:42:80:79:C7:42:22:3E:F1:BA:EA:E4:4A:8A:C3:44:46:2F:90:28\r\na=extmap-allow-mixed\r\n"}}
    wsCurrent.onmessage = (event) => {
      console.log("Message received", event.data);
      
      if (typeof event.data === 'string') {
        const message = JSON.parse(event.data);
        
        if (message.sessionID && message.sdp) {
          localStorage.setItem("sessionID", message.sessionID);
          localStorage.setItem("sdp", JSON.stringify(message.sdp));
          
          console.log("Session information cached");
        }
        
        setMessage(event.data);
      }
    };

    wsCurrent.onerror = (error) => {
      console.error("WebSocket Error", error);
      checkWsState();
    };

    return () => {
      wsCurrent.close();
    };
    
  }, [url, ws]);

  const sendMessage = (data: ClientPackage) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
    }
  };

  return { ws, wsState, message, sendMessage };
};
