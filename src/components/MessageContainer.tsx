import React, { useEffect, useState } from 'react';

import styles from './MessageContainer.module.css';


export const MessageContainer = ({message}: MessageContainerProps) : React.JSX.Element => {
    const [messages, setMessages] = useState<string[]>([]);

    useEffect(() => {
        
        setMessages([...messages, message]);
    }, []);

    return (
        <div className={styles.messageContainer}>
            <div className={styles.messageBubble}>
                {messages.map((msg, index) => (
                    <p key={index} className={styles.message}>{msg}</p>
                ))}
            </div>
        </div>
    )
}