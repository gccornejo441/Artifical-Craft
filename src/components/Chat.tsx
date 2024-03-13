import React, { useState, useEffect } from 'react';
import styles from './Chat.module.css';

const Chat = ({ ws, messageFromWs, wsState }: ChatProps) : React.JSX.Element => {
    let [codeInput, setCodeInput] = useState<ClientPackage>({
        type: "MESSAGE",
        message: ""
    });
    let [sessionID, setSessionID] = useState<string>("");

    useEffect(() => {
        const cachedSessionID = localStorage.getItem("sessionID");
        const cachedSDP = JSON.parse(localStorage.getItem("sdp") || '{}');
        
        if (cachedSessionID && cachedSDP) {
            setSessionID(cachedSessionID);
        }
    })

    const sendMessage = (): void => {
        if (codeInput.message === '') {
            alert('Please enter a message');
        } else if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            console.log("Outgoing message", codeInput);
            ws.current.send(JSON.stringify(codeInput));
        } else {
            alert('WebSocket not connected or not ready');
            console.error('WebSocket not connected or not ready');
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
        <h1 className={styles.title}>WebSocket Chat: {sessionID}</h1>
        <h2 className={styles.title}>WebSocket State: {wsState}</h2>
        <p className={styles.message}>Message: {messageFromWs}</p>
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
