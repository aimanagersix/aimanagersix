import React from 'react';
import Modal from './Modal';

interface ConfirmationModalProps {
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmButtonClass?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
    onClose, 
    onConfirm, 
    title, 
    message, 
    confirmText = 'Excluir', 
    cancelText = 'Cancelar',
    confirmButtonClass = 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
}) => {
    return (
        <Modal title={title} onClose={onClose}>
            <div className="text-on-surface-dark-secondary">
                <p>{message}</p>
                <div className="flex justify-end gap-4 pt-6">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-dark focus:ring-gray-500"
                    >
                        {cancelText}
                    </button>
                    <button 
                        type="button" 
                        onClick={onConfirm} 
                        className={`px-4 py-2 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-dark ${confirmButtonClass}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmationModal;
