import React, { useState } from 'react';

type WebSocketState = "CONNECTING" | "OPEN" | "CLOSING" | "CLOSED" | "UNKNOWN";

interface WebRTCChatProps {
    ws: React.RefObject<WebSocket>;
    messageFromWs: string
    wsState: WebSocketState
}

type OutgoingMessageType = "MESSAGE" | "CODE";
interface ClientPackage {
    type: OutgoingMessageType,
    message: string
}

const WebRTCChat = ({ ws, messageFromWs, wsState }: WebRTCChatProps) : React.JSX.Element => {
    let [codeInput, setCodeInput] = useState<ClientPackage>({
        type: "MESSAGE",
        message: ""
    });

    const sendMessage = (): void => {
        if (codeInput.message === '') {
            alert('Please enter a message');
        } else if (ws.current) {
            console.log("Outgoing message", codeInput);
            ws.current.send(JSON.stringify(codeInput));
        } else {
            alert('WebSocket not connected');
            console.error('WebSocket not connected');
        }
    };


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCodeInput({ ...codeInput, message: e.target.value });
    };

    const disconnect = (): void => {
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
        <input
            style={{ background: '#000', color: '#fff' }}
            type="text"
            value={codeInput.message}
            onChange={handleChange}
        />
        <div>
            <button onClick={sendMessage}>Send Message</button>
            <button onClick={disconnect}>Disconnect</button>
        </div>
    </div>
    );
};

export default WebRTCChat;
