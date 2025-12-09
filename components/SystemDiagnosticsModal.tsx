
import React from 'react';
import Modal from './common/Modal';

interface SystemDiagnosticsModalProps {
    onClose: () => void;
}

const SystemDiagnosticsModal: React.FC<SystemDiagnosticsModalProps> = ({ onClose }) => {
    return (
        <Modal title="Diagnóstico de Sistema" onClose={onClose}>
            <div className="p-4 text-center">
                <p>Funcionalidade desativada.</p>
                <div className="mt-4">
                     <button onClick={onClose} className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">
                        Fechar
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default SystemDiagnosticsModal;
