
import React, { useState } from 'react';
import { Policy } from '../types';
import { FaCheck, FaFileSignature, FaShieldAlt } from 'react-icons/fa';

interface PolicyAcceptanceModalProps {
    policies: Policy[];
    onAccept: (policyId: string, version: string) => Promise<void>;
}

const PolicyAcceptanceModal: React.FC<PolicyAcceptanceModalProps> = ({ policies, onAccept }) => {
    const [currentPolicyIndex, setCurrentPolicyIndex] = useState(0);
    const [isAccepting, setIsAccepting] = useState(false);
    const [hasRead, setHasRead] = useState(false);

    const policy = policies[currentPolicyIndex];

    const handleAccept = async () => {
        if (!hasRead) return;
        setIsAccepting(true);
        try {
            await onAccept(policy.id, policy.version);
            setHasRead(false); // Reset for next
            if (currentPolicyIndex < policies.length - 1) {
                setCurrentPolicyIndex(prev => prev + 1);
            }
            // If it was the last one, the parent component (App.tsx) will unmount this modal automatically as the list of pending policies empties.
        } catch (e) {
            alert("Erro ao registar aceitação.");
        } finally {
            setIsAccepting(false);
        }
    };

    const isUrl = (string: string) => {
        try { return Boolean(new URL(string)); } catch (e) { return false; }
    };

    if (!policy) return null;

    return (
        <div className="fixed inset-0 bg-gray-900 z-[100] flex flex-col items-center justify-center p-4">
            <div className="bg-surface-dark max-w-4xl w-full rounded-xl shadow-2xl border border-gray-700 flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-6 border-b border-gray-700 bg-gray-800 rounded-t-xl text-center">
                    <div className="inline-flex p-3 rounded-full bg-brand-primary/20 mb-3">
                        <FaShieldAlt className="text-3xl text-brand-secondary" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Atualização de Políticas de Segurança</h2>
                    <p className="text-gray-400 mt-2">
                        Para continuar a utilizar a aplicação, é necessário ler e aceitar as políticas abaixo.
                        <span className="block text-sm mt-1 text-brand-secondary">
                            Documento {currentPolicyIndex + 1} de {policies.length}
                        </span>
                    </p>
                </div>

                {/* Content */}
                <div className="flex-grow overflow-y-auto p-6 bg-gray-900/50">
                    <h3 className="text-xl font-bold text-white mb-4">{policy.title} <span className="text-xs font-normal text-gray-500 ml-2">v{policy.version}</span></h3>
                    
                    <div className="bg-white text-black p-6 rounded shadow-inner min-h-[300px] overflow-y-auto whitespace-pre-wrap">
                        {isUrl(policy.content) ? (
                            <div className="text-center py-10">
                                <p className="mb-4 font-bold">Este documento está alojado externamente.</p>
                                <a href={policy.content} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-lg">
                                    Clique aqui para abrir o documento
                                </a>
                            </div>
                        ) : (
                            policy.content
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-gray-700 bg-gray-800 rounded-b-xl">
                    <label className="flex items-center justify-center gap-3 cursor-pointer mb-4 p-3 bg-gray-700 rounded hover:bg-gray-600 transition-colors">
                        <input 
                            type="checkbox" 
                            checked={hasRead} 
                            onChange={e => setHasRead(e.target.checked)}
                            className="w-5 h-5 rounded border-gray-500 text-brand-primary focus:ring-brand-secondary"
                        />
                        <span className="text-white font-medium">Declaro que li e compreendi o documento acima.</span>
                    </label>

                    <button 
                        onClick={handleAccept}
                        disabled={!hasRead || isAccepting}
                        className="w-full py-3 bg-brand-primary hover:bg-brand-secondary text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {isAccepting ? 'A registar...' : <>Aceitar e Continuar <FaCheck /></>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PolicyAcceptanceModal;
