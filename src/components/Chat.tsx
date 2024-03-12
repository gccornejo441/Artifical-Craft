import React, { useState } from 'react';
import styles from './Chat.module.css';

type WebSocketState = "CONNECTING" | "OPEN" | "CLOSING" | "CLOSED" | "UNKNOWN";

interface ChatProps {
    ws: React.RefObject<WebSocket>;
    messageFromWs: string
    wsState: WebSocketState
}

type OutgoingMessageType = "MESSAGE" | "CODE";
interface ClientPackage {
    type: OutgoingMessageType,
    message: string
}

const Chat = ({ ws, messageFromWs, wsState }: ChatProps) : React.JSX.Element => {
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
        <div className={styles.container}>
        <h2 className={styles.title}>WebSocket State: {wsState}</h2>
        <p>Message: {messageFromWs}</p>
        <input
            className={styles.messageInput}
            type="text"
            value={codeInput.message}
            onChange={handleChange}
        />
        <div>
            <button className={styles.button} onClick={sendMessage}>Send Message</button>
            <button className={styles.button} onClick={disconnect}>Disconnect</button>
        </div>
    </div>
    );
};

export default Chat;
