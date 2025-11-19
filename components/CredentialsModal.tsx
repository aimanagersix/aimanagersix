
import React, { useState } from 'react';
import Modal from './common/Modal';
import { FaCopy, FaCheck } from 'react-icons/fa';
import { LockClosedIcon, MailIcon } from './common/Icons';

interface CredentialsModalProps {
    onClose: () => void;
    email: string;
    password?: string;
}

const CredentialsModal: React.FC<CredentialsModalProps> = ({ onClose, email, password }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (password) {
            navigator.clipboard.writeText(`Email: ${email}\nPassword: ${password}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <Modal title="Credenciais de Acesso Criadas" onClose={onClose} maxWidth="max-w-lg">
            <div className="space-y-6">
                <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg">
                    <p className="text-yellow-200 text-sm">
                        <strong>Importante:</strong> Por motivos de segurança, a password <u>não é enviada</u> no email de confirmação automática. 
                        Por favor, copie as credenciais abaixo e envie-as ao colaborador através de um canal seguro.
                    </p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Email</label>
                        <div className="flex items-center bg-gray-700 rounded-md p-3 border border-gray-600">
                            <MailIcon className="h-5 w-5 text-gray-400 mr-3" />
                            <span className="text-white font-mono select-all">{email}</span>
                        </div>
                    </div>

                    {password && (
                        <div>
                            <label className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Password Temporária</label>
                            <div className="flex items-center justify-between bg-gray-700 rounded-md p-3 border border-gray-600">
                                <div className="flex items-center overflow-hidden">
                                    <LockClosedIcon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                                    <span className="text-white font-mono select-all truncate">{password}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-gray-700">
                    <button 
                        type="button" 
                        onClick={handleCopy} 
                        className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors"
                    >
                        {copied ? <FaCheck className="text-green-400" /> : <FaCopy />}
                        {copied ? 'Copiado!' : 'Copiar Credenciais'}
                    </button>
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default CredentialsModal;
