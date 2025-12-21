
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Collaborator, Message, ModuleKey, PermissionAction } from '../types';
import { FaComment, FaPaperPlane, FaArrowLeft, FaTimes, FaBroom } from './common/Icons';
import { FaBullhorn } from 'react-icons/fa';
import * as dataService from '../services/dataService';

interface ChatWidgetProps {
    currentUser: Collaborator | null;
    collaborators: Collaborator[];
    messages: Message[];
    onSendMessage: (receiverId: string, content: string) => void;
    onMarkMessagesAsRead: (senderId: string) => void;
    isOpen: boolean;
    onToggle: () => void;
    activeChatCollaboratorId: string | null;
    onSelectConversation: (id: string | null) => void;
    unreadMessagesCount: number;
    checkPermission?: (module: ModuleKey, action: PermissionAction) => boolean;
    // Callback para navegação externa
    onNavigateToTicket?: (ticketId: string) => void;
}

const GENERAL_CHANNEL_ID = '00000000-0000-0000-0000-000000000000';
const SYSTEM_SENDER_ID = '00000000-0000-0000-0000-000000000000';

export const ChatWidget: React.FC<ChatWidgetProps> = ({ 
    currentUser, collaborators, messages, onSendMessage, onMarkMessagesAsRead, 
    isOpen, onToggle, activeChatCollaboratorId, onSelectConversation, 
    unreadMessagesCount, onNavigateToTicket, checkPermission
}) => {
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const collaboratorMap = useMemo(() => new Map(collaborators.map(c => [c.id, c])), [collaborators]);

    // Função auxiliar para validar se o sistema pode exibir uma mensagem baseada no perfil
    const canSeeSystemMessage = (content: string) => {
        if (!checkPermission) return true;
        const upper = content.toUpperCase();
        const isTicket = upper.includes('TICKET') || upper.includes('ATRIBUIÇÃO') || upper.includes('ATUALIZAÇÃO');
        const isLicense = upper.includes('LICENÇA');
        const isWarranty = upper.includes('GARANTIA');

        if (isTicket && !checkPermission('msg_tickets', 'view')) return false;
        if (isLicense && !checkPermission('msg_licenses', 'view')) return false;
        if (isWarranty && !checkPermission('msg_warranties', 'view')) return false;
        return true;
    };

    const conversations = useMemo(() => {
        if (!currentUser) return [];
        const convos = new Map<string, { lastMessage: Message | null, unreadCount: number, isGeneral?: boolean }>();
        convos.set(GENERAL_CHANNEL_ID, { lastMessage: null, unreadCount: 0, isGeneral: true });

        messages.forEach(msg => {
            if (msg.receiver_id === GENERAL_CHANNEL_ID) {
                // Filtro de recepção para o resumo da conversa
                if (msg.sender_id === SYSTEM_SENDER_ID && !canSeeSystemMessage(msg.content)) return;

                const existing = convos.get(GENERAL_CHANNEL_ID)!;
                if (!existing.lastMessage || new Date(msg.timestamp) >= new Date(existing.lastMessage.timestamp)) {
                    existing.lastMessage = msg;
                }
                
                if (!msg.read && msg.sender_id !== currentUser.id) {
                    existing.unreadCount++;
                }
                return;
            }
            const otherPartyId = msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_id;
            if (otherPartyId === currentUser.id) return;
            const isUnread = !msg.read && msg.receiver_id === currentUser.id && msg.sender_id !== currentUser.id;
            const existing = convos.get(otherPartyId);
            if (!existing || (existing.lastMessage && new Date(msg.timestamp) >= new Date(existing.lastMessage.timestamp))) {
                 convos.set(otherPartyId, { lastMessage: msg, unreadCount: (existing?.unreadCount || 0) + (isUnread ? 1 : 0) });
            } else if (isUnread) { if (existing) existing.unreadCount++; }
        });
        return Array.from(convos.entries()).map(([collaboratorId, data]) => ({ collaboratorId, ...data })).sort((a,b) => (b.lastMessage?.timestamp || '').localeCompare(a.lastMessage?.timestamp || ''));
    }, [messages, currentUser, checkPermission]);

    useEffect(() => {
        if (isOpen && activeChatCollaboratorId && activeChatCollaboratorId !== GENERAL_CHANNEL_ID) onMarkMessagesAsRead(activeChatCollaboratorId);
    }, [isOpen, activeChatCollaboratorId, onMarkMessagesAsRead]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen && activeChatCollaboratorId) scrollToBottom();
    }, [messages, activeChatCollaboratorId, isOpen]);

    const handleMessageClick = (content: string) => {
        if (activeChatCollaboratorId !== GENERAL_CHANNEL_ID) return;
        const ticketMatch = content.match(/\[#([a-f0-9-]+)\]/i);
        if (ticketMatch && ticketMatch[1] && onNavigateToTicket) {
            onNavigateToTicket(ticketMatch[1]);
        }
    };

    const handleResetGeneralMessages = async () => {
        if (window.confirm("Deseja marcar todas as notificações do Canal Geral como lidas?")) {
            try {
                await dataService.markGeneralMessagesAsRead();
                dataService.invalidateLocalCache();
            } catch (e) {
                console.error("Erro ao resetar canal geral:", e);
            }
        }
    };

    if (!currentUser) return null;

    return (
        <>
            {!isOpen ? (
                <button onClick={onToggle} className="fixed bottom-6 right-6 z-40 bg-brand-primary h-14 w-14 rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 transition-all border-2 border-white/10">
                    <FaComment size={24} />
                    {unreadMessagesCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-background-dark animate-bounce">{unreadMessagesCount}</span>}
                </button>
            ) : (
                <div className="fixed bottom-6 right-6 z-40 w-[350px] h-[500px] bg-surface-dark shadow-2xl rounded-xl flex flex-col border border-gray-700 animate-fade-in overflow-hidden">
                    <div className="flex-shrink-0 flex justify-between items-center p-3 bg-brand-primary text-white">
                        {activeChatCollaboratorId ? (
                            <div className="flex items-center gap-2 overflow-hidden flex-1">
                                <button onClick={() => onSelectConversation(null)} className="p-1 hover:bg-white/10 rounded transition-colors flex-shrink-0"><FaArrowLeft size={14}/></button>
                                <h3 className="font-bold text-sm truncate">{activeChatCollaboratorId === GENERAL_CHANNEL_ID ? 'Canal Geral' : collaboratorMap.get(activeChatCollaboratorId)?.full_name}</h3>
                            </div>
                        ) : <h3 className="font-bold">Chat Interno</h3>}
                        
                        <div className="flex items-center gap-1">
                            {activeChatCollaboratorId === GENERAL_CHANNEL_ID && (
                                <button 
                                    onClick={handleResetGeneralMessages} 
                                    className="p-1.5 hover:bg-white/10 rounded transition-colors text-white"
                                    title="Marcar todas como lidas (Reset)"
                                >
                                    <FaBroom size={14} />
                                </button>
                            )}
                            <button onClick={onToggle} className="p-1 hover:bg-white/10 rounded transition-colors"><FaTimes size={16}/></button>
                        </div>
                    </div>

                    <div className="flex-grow overflow-hidden flex flex-col bg-gray-950">
                        {activeChatCollaboratorId ? (
                            <div className="flex-grow flex flex-col overflow-hidden">
                                <div className="flex-grow overflow-y-auto p-3 space-y-3 custom-scrollbar">
                                    {messages.filter(m => {
                                        const isFromThisConvo = (m.receiver_id === activeChatCollaboratorId && m.sender_id === currentUser.id) || 
                                                               (m.sender_id === activeChatCollaboratorId && m.receiver_id === currentUser.id) || 
                                                               (activeChatCollaboratorId === GENERAL_CHANNEL_ID && m.receiver_id === GENERAL_CHANNEL_ID);
                                        if (!isFromThisConvo) return false;

                                        // Filtro de recepção de mensagens de sistema para visualização da conversa
                                        if (activeChatCollaboratorId === GENERAL_CHANNEL_ID && m.sender_id === SYSTEM_SENDER_ID) {
                                            return canSeeSystemMessage(m.content);
                                        }
                                        return true;
                                    }).sort((a,b) => a.timestamp.localeCompare(b.timestamp)).map(msg => {
                                        const isMyMessage = msg.sender_id === currentUser.id;
                                        const isSystem = activeChatCollaboratorId === GENERAL_CHANNEL_ID && msg.sender_id === SYSTEM_SENDER_ID;
                                        const hasTicketLink = activeChatCollaboratorId === GENERAL_CHANNEL_ID && msg.content.match(/\[#([a-f0-9-]+)\]/i);

                                        return (
                                            <div key={msg.id} className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                                                <div 
                                                    onClick={() => handleMessageClick(msg.content)}
                                                    className={`max-w-[85%] p-2 rounded-lg text-sm transition-all ${isMyMessage ? 'bg-brand-secondary text-white' : 'bg-gray-800 text-gray-200'} ${hasTicketLink ? 'cursor-pointer hover:ring-2 hover:ring-brand-primary shadow-lg border border-brand-primary/20' : ''}`}
                                                >
                                                    {isSystem && <p className="text-[10px] font-black text-brand-secondary mb-1 flex items-center gap-1"><FaBullhorn size={10}/> SISTEMA</p>}
                                                    {!isSystem && !isMyMessage && activeChatCollaboratorId === GENERAL_CHANNEL_ID && <p className="text-[10px] font-bold text-gray-500 mb-1">{collaboratorMap.get(msg.sender_id)?.full_name}</p>}
                                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                                    {hasTicketLink && <p className="text-[8px] mt-1 text-brand-secondary font-bold underline italic">Clique para consultar o ticket</p>}
                                                    <p className="text-[8px] text-right opacity-40 mt-1">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>
                                <form onSubmit={e => { e.preventDefault(); if(newMessage.trim()){ onSendMessage(activeChatCollaboratorId, newMessage); setNewMessage(''); } }} className="p-2 border-t border-gray-800 bg-gray-900 flex gap-2">
                                    <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Escreva..." className="flex-grow bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white focus:outline-none focus:border-brand-primary" />
                                    <button type="submit" disabled={!newMessage.trim()} className="p-2 text-brand-secondary hover:text-brand-primary transition-colors disabled:opacity-30"><FaPaperPlane size={18}/></button>
                                </form>
                            </div>
                        ) : (
                            <div className="overflow-y-auto custom-scrollbar h-full">
                                {conversations.map(c => {
                                    const col = c.collaboratorId === GENERAL_CHANNEL_ID ? { full_name: 'Canal Geral', photo_url: null } : collaboratorMap.get(c.collaboratorId);
                                    if(!col) return null;
                                    return (
                                        <button key={c.collaboratorId} onClick={() => onSelectConversation(c.collaboratorId)} className="w-full text-left p-3 flex items-center gap-3 hover:bg-gray-800 border-b border-gray-800 transition-colors group">
                                            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center font-bold text-white overflow-hidden border border-gray-700 group-hover:border-brand-primary transition-colors">
                                                {c.isGeneral ? <FaBullhorn className="text-brand-secondary" /> : (col.photo_url ? <img src={col.photo_url} className="w-full h-full object-cover" alt=""/> : col.full_name.charAt(0))}
                                            </div>
                                            <div className="flex-grow overflow-hidden">
                                                <div className="flex justify-between items-center"><p className="font-bold text-sm truncate text-white">{col.full_name}</p>{c.unreadCount > 0 && <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">{c.unreadCount}</span>}</div>
                                                <p className="text-xs text-gray-500 truncate">{c.lastMessage?.content || 'Sem mensagens'}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};
