import React, { useState, FormEvent } from 'react';
import Modal from './Modal';

interface FormState {
    code: string;
  }

  interface ModalFormProps {
    ws: React.RefObject<WebSocket>;
  }
  
const ModalForm = ({ ws }: ModalFormProps) => {
    const [isModalOpen, setIsModalOpen] = useState<boolean>(true);
    let [codeInput, setCodeInput] = useState<ClientPackage>({
        type: "CODE",
        message: ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCodeInput({ ...codeInput, message: e.target.value });
    };

    const sendMessage = (): void => {
        if (codeInput.message === '') {
            alert('Please enter a message');
        } else if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            console.log("Outgoing message", codeInput);
            ws.current.send(JSON.stringify(codeInput));
            setIsModalOpen(false);
        } else {
            alert('WebSocket not connected or not ready');
            console.error('WebSocket not connected or not ready');
            setIsModalOpen(false);
        }
    };

    const produceCode = (): void => {
        if(ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({type: "PRODUCE_CODE", message: ""}));
            setIsModalOpen(false);
        }
    }
    
    return (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
            <h2>Enter code</h2>
            <label htmlFor="code">Code</label>
                    <input
                        type="text"
                        placeholder="Enter code"
                        name="code"
                        value={codeInput.message}
                        style={{ textAlign: 'center' }}
                        onChange={handleChange}
                    />
                    <label htmlFor="code">Code</label>
                    <button className="button-primary" onClick={sendMessage}>Send Code</button>
                    <button onClick={produceCode} >Don't have code?</button>
        </Modal>
    );
}

export default ModalForm;
