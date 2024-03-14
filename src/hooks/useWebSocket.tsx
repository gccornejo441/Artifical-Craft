import { useEffect, useRef, useState } from 'react';
import { handleIceCandidate, handleOffer, useWebRTCClient } from './useWebRTCClient';

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
  const { peerConnection, setPeerConnection } = useWebRTCClient();

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
      console.log("Message recieved of type", event.data);
      console.log("PEER CONNECTION", peerConnection);
      if (typeof event.data === 'string') {

        if (peerConnection) {
          const data: ServerMessage = JSON.parse(event.data);
          debugger;
          switch (data.type) {
            case 'OFFER':
              handleOffer(data.sdp!, peerConnection, wsCurrent);
              break;
            case 'ICE_CANDIDATE':
              handleIceCandidate(data.candidate!, peerConnection);
              break;
            case 'ANSWER':
              peerConnection.setRemoteDescription(data.sdp!)
                .catch((error) => console.error('Error handling ANSWER:', error));
              break;
            case 'CODE':
              localStorage.setItem("code", data.message);
              break;
            case 'PRODUCE_CODE':
              localStorage.setItem("code", data.message);
              break;
            case 'MESSAGE':
              setMessage(data.message);
              break;
            default:
              console.error('Unknown message type:', data.type);
          }

        } else {
          console.log("PeerConnection is null, cannot handle offer or ICE candidate.");
        }

      } else {
        try {
          const message = JSON.parse(event.data);

          if (message.sessionID && message.sdp) {
            localStorage.setItem("sessionID", message.sessionID);
            localStorage.setItem("sdp", JSON.stringify(message.sdp));

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

  }, [url, ws, peerConnection]);

  const sendMessage = (data: ClientPackage) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
    }
  };

  return { ws, wsState, message, sendMessage };
};
