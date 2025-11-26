import React, { useRef } from 'react';
import { XIcon } from './Icons';

interface ModalProps {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
    maxWidth?: string;
}

const Modal: React.FC<ModalProps> = ({ title, onClose, children, maxWidth = 'max-w-3xl' }) => {
    // Referência para guardar onde o clique começou
    const mouseDownTarget = useRef<EventTarget | null>(null);

    const handleMouseDown = (e: React.MouseEvent) => {
        mouseDownTarget.current = e.target;
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        // Apenas fecha se o clique começou E terminou no overlay (fundo escuro)
        // Isso previne que selecionar texto (arrastar de dentro para fora) feche o modal
        if (mouseDownTarget.current === e.currentTarget && e.target === e.currentTarget) {
            onClose();
        }
        mouseDownTarget.current = null;
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4"
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
        >
            <div 
                className={`bg-surface-dark rounded-xl shadow-2xl w-full ${maxWidth} transform transition-all flex flex-col max-h-screen`}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()} // Garante que cliques dentro não propaguem para o overlay
            >
                <div className="flex-shrink-0 flex justify-between items-center p-6 border-b border-gray-700 no-print">
                    <h2 className="text-2xl font-semibold text-white">{title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <XIcon />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;