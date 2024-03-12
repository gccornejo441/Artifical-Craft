import React, { useState, FormEvent } from 'react';
import Modal from './Modal';

interface FormState {
    code: string;
  }

  interface ModalFormProps {
    formData: FormState;     
    setFormData: React.Dispatch<React.SetStateAction<FormState>>;
    ws: React.RefObject<WebSocket>;
  }
  
const ModalForm: React.FC<ModalFormProps> = ({ formData, setFormData, ws }) => {
    const [isModalOpen, setIsModalOpen] = useState<boolean>(true);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement> | React.ChangeEvent<HTMLSelectElement>
    ) => {
        console.log(e.target.value)
        const target = e.target;
        const name = target.name; // Use 'name' attribute for form elements
        const value = target.value;
        setFormData(prevFormData => ({
            ...prevFormData,
            [name]: value,
        }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        
        if (ws.current) {
            ws.current.send(formData.code);
            console.log("Message sent", formData.code);
        }

        setIsModalOpen(false);
    };

    return (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
            <form onSubmit={handleSubmit}>
                <fieldset>
                    <label htmlFor="code">Code</label>
                    <input
                        type="text"
                        placeholder="Enter code"
                        name="code"
                        value={formData.code}
                        style={{ textAlign: 'center' }}
                        onChange={handleChange}
                    />
                    <input className="button-primary" type="submit" value="Send" />
                </fieldset>
            </form>
        </Modal>
    );
}

export default ModalForm;
