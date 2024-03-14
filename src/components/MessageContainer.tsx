import React, { useEffect, useState } from 'react';
import styles from './MessageContainer.module.css';

// Define the props interface for type safety
interface MessageContainerProps {
    message: string;
}

export const MessageContainer = ({message}: MessageContainerProps) : React.JSX.Element => {
    const [messages, setMessages] = useState<string[]>([]);

    useEffect(() => {
        setMessages(messages => [...messages, message]);
    }, [message]);

    return (
        <div className={styles.messageContainer}>
            <div className={styles.messageBubble}>
                {messages.map((msg, index) => (
                    <p key={index} className={styles.message}>{msg}</p>
                ))}
            </div>
        </div>
    );
}
