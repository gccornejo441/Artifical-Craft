import { useEffect, useRef, useState } from 'react';

export const WebSocketReadyState = (websocket: WebSocket): string => {
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

    wsCurrent.onmessage = (event) => {
      console.log("Message received", event.data);

      if (typeof event.data === 'string') {
        try {
          const message = JSON.parse(event.data);

          if (message.sessionID && message.sdp) {
            sessionStorage.setItem("sessionID", message.sessionID);
            sessionStorage.setItem("sdp", JSON.stringify(message.sdp));

            console.log("Session information cached");

          } else {
            console.log("Received message:", message.message);
            setMessage(message.message);
          }
        } catch (error) {
          console.error("Error parsing JSON from WebSocket message:", error);
        }
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
