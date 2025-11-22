
import React, { useState, useEffect, useRef } from 'react';
import { FaMagic, FaSpinner, FaArrowRight, FaMicrophone } from 'react-icons/fa';
import { parseNaturalLanguageAction, isAiConfigured } from '../services/geminiService';
import { Brand, EquipmentType, Collaborator } from '../types';

interface MagicCommandBarProps {
    brands: Brand[];
    types: EquipmentType[];
    collaborators: Collaborator[];
    currentUser: Collaborator | null;
    onAction: (intent: string, data: any) => void;
}

const MagicCommandBar: React.FC<MagicCommandBarProps> = ({ brands, types, collaborators, currentUser, onAction }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const aiConfigured = isAiConfigured();

    // Hotkey listener (Ctrl+K or Cmd+K)
    useEffect(() => {
        if (!aiConfigured) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [aiConfigured]);

    // Auto-focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !aiConfigured) return;

        setIsLoading(true);
        try {
            const context = {
                brands: brands.map(b => b.name),
                types: types.map(t => t.name),
                users: collaborators.map(c => ({ name: c.fullName, id: c.id })),
                currentUser: currentUser?.id || ''
            };

            const result = await parseNaturalLanguageAction(input, context);
            
            if (result.intent !== 'unknown' && result.confidence > 0.6) {
                onAction(result.intent, result.data);
                setIsOpen(false);
                setInput('');
            } else {
                alert("Desculpe, não percebi o pedido. Tente reformular.");
            }
        } catch (error) {
            console.error(error);
            alert("Erro ao processar o pedido com a IA.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!aiConfigured) return null;

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 bg-gray-800/80 backdrop-blur-md border border-gray-600 text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-3 hover:bg-gray-700 hover:scale-105 transition-all duration-200 group"
                title="Magic Command Bar (Ctrl+K)"
            >
                <FaMagic className="text-brand-secondary group-hover:animate-pulse" />
                <span className="text-sm font-medium">Comando IA...</span>
                <span className="text-xs bg-gray-900 px-1.5 py-0.5 rounded text-gray-400 border border-gray-700">Ctrl+K</span>
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-[20vh] transition-all">
            <div className="w-full max-w-2xl mx-4">
                <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-700 overflow-hidden transform transition-all scale-100 ring-1 ring-white/10">
                    <form onSubmit={handleSubmit} className="relative flex items-center p-4">
                        <FaMagic className={`h-6 w-6 ml-2 ${isLoading ? 'text-purple-400 animate-pulse' : 'text-brand-secondary'}`} />
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Descreva o que quer fazer (ex: 'Criar portátil Dell para o João', 'Ticket impressora avariada')..."
                            className="w-full bg-transparent border-none text-white text-lg px-4 focus:ring-0 placeholder-gray-500 font-medium"
                            autoComplete="off"
                        />
                        <div className="flex items-center gap-2">
                            {isLoading && <FaSpinner className="animate-spin text-gray-400 h-5 w-5" />}
                            {!isLoading && (
                                <button 
                                    type="submit"
                                    className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 text-gray-300 transition-colors"
                                >
                                    <FaArrowRight />
                                </button>
                            )}
                        </div>
                    </form>
                    
                    {/* Suggestions / Footer */}
                    <div className="bg-gray-800/50 px-4 py-2 border-t border-gray-700 flex justify-between items-center text-xs text-gray-400">
                        <div className="flex gap-3">
                            <span>Sugestões:</span>
                            <span className="hover:text-white cursor-pointer" onClick={() => setInput("Adicionar portátil Dell Latitude serial 123")}>"Adicionar portátil..."</span>
                            <span className="hover:text-white cursor-pointer" onClick={() => setInput("Criar ticket: Internet lenta no escritório")}>"Criar ticket..."</span>
                            <span className="hover:text-white cursor-pointer" onClick={() => setInput("Pesquisar por João Silva")}>"Pesquisar..."</span>
                        </div>
                        <div>
                            <span className="bg-gray-700 px-1.5 rounded text-[10px] mr-1">ESC</span> para fechar
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Invisible overlay to close on click outside */}
            <div className="absolute inset-0 -z-10" onClick={() => setIsOpen(false)}></div>
        </div>
    );
};

export default MagicCommandBar;
