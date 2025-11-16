import React from 'react';
import Modal from './Modal';

interface InfoModalProps {
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const InfoModal: React.FC<InfoModalProps> = ({ onClose, title, children }) => {
    return (
        <Modal title={title} onClose={onClose}>
            <div className="text-on-surface-dark-secondary">
                {children}
            </div>
        </Modal>
    );
};

export default InfoModal;