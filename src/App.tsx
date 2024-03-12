import React, { useRef, useEffect, useState } from 'react';
import WebRTCChat from './components/WRTCConfig';
import ModalForm from './components/Form';
import './App.css';

const WebSocketReadyState = (websocket: WebSocket) => {
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

interface FormState {
  code: string;
}

type WebSocketState = "CONNECTING" | "OPEN" | "CLOSING" | "CLOSED" | "UNKNOWN";

function App() {
  var ws = useRef<WebSocket | null>(null);
  const [wsState, setWsState] = useState<WebSocketState>("UNKNOWN");
  const [message, setMessage] = useState<string>("")
  const [formData, setFormData] = useState<FormState>({
    code: "",
  });

  useEffect(() => {
    ws.current = new WebSocket("ws://localhost:8080/ws");
    if (!ws.current) return;

    const wsCurrent = ws.current;
    const checkWsState = () => setWsState(WebSocketReadyState(wsCurrent));

    ws.current.onopen = (event) => {
      console.log("Connected 😀");
      checkWsState();
    };

    ws.current.onmessage = (event) => {
      console.log("Message received", event.data);
      if (typeof (event.data) === 'string') {
        setMessage(event.data);
      }
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket Error", error);
      checkWsState();
    };

  }, [ws])

  return (
    <div className="App">
      <header className="App-header">
        <ModalForm
          ws={ws}
          formData={formData}
          setFormData={setFormData}
        />
        <WebRTCChat
          wsState={wsState}
          messageFromWs={message}
          ws={ws} />
      </header>
    </div>
  );
}

export default App;
