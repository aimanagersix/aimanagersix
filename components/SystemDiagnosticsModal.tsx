
import React from 'react';
import Modal from './common/Modal';
import { FaCheckCircle } from 'react-icons/fa';

interface SystemDiagnosticsModalProps {
    onClose: () => void;
}

const SystemDiagnosticsModal: React.FC<SystemDiagnosticsModalProps> = ({ onClose }) => {
    return (
        <Modal title="Diagnóstico de Sistema" onClose={onClose}>
            <div className="p-8 text-center">
                <div className="flex justify-center mb-4">
                    <FaCheckCircle className="text-green-500 text-5xl" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Sistema Operacional</h3>
                <p className="text-gray-400 mb-6">
                    A aplicação foi carregada corretamente. Se estiver a ver esta mensagem, o ciclo de renderização do React está funcional.
                </p>
                <div className="flex justify-center">
                     <button onClick={onClose} className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">
                        Fechar
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default SystemDiagnosticsModal;
