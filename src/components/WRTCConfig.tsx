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

const WebRTCChat = () => {
    const [message, setMessage] = useState<string>()
    const [wsState, setWsState] = useState<WebSocketState>("UNKNOWN");
    const ws = useRef<WebSocket>();

    useEffect(() => {
        ws.current = new WebSocket("ws://localhost:8080/ws");
        const wsCurrent = ws.current;

        const checkWsState = () => setWsState(WebSocketReadyState(wsCurrent));

        wsCurrent.onopen = (event) => {
            console.log("Connected 😀");
            checkWsState();
        };

        wsCurrent.onmessage = (event) => {
            console.log("Message received", event.data);
            if (typeof (event.data) === 'string') {
                setMessage(event.data);
            } else if (event.data instanceof Blob) {
                const reader = new FileReader();
                reader.onload =  () => {
                    reader.result ?? setMessage('No result available from reader');
                    setMessage(reader.result?.toString());
                };
                reader.readAsText(event.data);
            } else if (event.data instanceof ArrayBuffer) {
                const decoder = new TextDecoder('utf-8');
                const text = decoder.decode(event.data);
                setMessage(text);
            }
        };

        wsCurrent.onerror = (error) => {
            console.error("WebSocket Error", error);
            checkWsState();
        };

        wsCurrent.onclose = (event) => {
            console.log("Disconnected", event.reason);
            checkWsState();
        };

        checkWsState(); 

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
            if (ws.current){
                ws.current.send(msg);
            } else {    
                alert('WebSocket not connected');
                console.error('WebSocket not connected');
            }
        }
    };

    const disconnect = () => {
        if(ws.current) {
            ws.current.close();
        } else {
            alert('WebSocket not connected');
            console.error('WebSocket not connected');
        }
    };

    return (
        <div>
            <h2>WebSocket State: {wsState}</h2>
            <p>Message: {message}</p>
            <input type="text" id="message" />
            <div>
                <button onClick={sendMessage}>Send Message</button>
                <button style={{ background: "blue" }} onClick={disconnect}>Disconnect</button>
            </div>
        </div>
    );
};

export default WebRTCChat;
