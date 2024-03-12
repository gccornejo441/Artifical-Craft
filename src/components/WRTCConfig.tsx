import React, { useState, useEffect, useRef } from 'react';

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

type WebSocketState = "CONNECTING" | "OPEN" | "CLOSING" | "CLOSED" | "UNKNOWN";

interface WebRTCChatProps {
    ws: React.RefObject<WebSocket>;
    messageFromWs: string
    wsState: WebSocketState
}

const WebRTCChat: React.FC<WebRTCChatProps> = ({ ws, messageFromWs, wsState }) => {

    useEffect(() => {
        if (!ws.current) return;

        const wsCurrent = ws.current;

        return () => {
            wsCurrent.close();
        };
    }, []);

    const sendMessage = () => {
        const msgInput = document.getElementById('message') as HTMLInputElement;
        const msg = msgInput.value

        if (msg === '') {
            alert('Please enter a message');
        } else {
            console.log("Outgoing message", msg);
            if (ws.current) {
                ws.current.send(msg);
            } else {
                alert('WebSocket not connected');
                console.error('WebSocket not connected');
            }
        }
    };

    const disconnect = () => {
        if (ws.current) {
            ws.current.close();
        } else {
            alert('WebSocket not connected');
            console.error('WebSocket not connected');
        }
    };

    return (
        <div>

            <h2>WebSocket State: {wsState}</h2>
            <p>Message: {messageFromWs}</p>
            <input type="text" id="message" />
            <div>
                <button onClick={sendMessage}>Send Message</button>
                <button onClick={disconnect}>Disconnect</button>
            </div>
        </div>
    );
};

export default WebRTCChat;
