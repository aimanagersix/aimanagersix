import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Collaborator, Message } from '../types';
import { FaComment, FaPaperPlane, FaArrowLeft } from './common/Icons';
import { FaTimes } from 'react-icons/fa';

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
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ currentUser, collaborators, messages, onSendMessage, onMarkMessagesAsRead, isOpen, onToggle, activeChatCollaboratorId, onSelectConversation, unreadMessagesCount }) => {
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const collaboratorMap = useMemo(() => new Map(collaborators.map(c => [c.id, c])), [collaborators]);

    const conversations = useMemo(() => {
        if (!currentUser) return [];
        const convos = new Map<string, { lastMessage: Message, unreadCount: number }>();

        messages.forEach(msg => {
            const otherPartyId = msg.senderId === currentUser.id ? msg.receiverId : msg.senderId;
            if (otherPartyId === currentUser.id) return;

            const existing = convos.get(otherPartyId);
            const isUnread = !msg.read && msg.receiverId === currentUser.id;
            let currentUnread = existing?.unreadCount || 0;

            if (!existing || new Date(msg.timestamp) >= new Date(existing.lastMessage.timestamp)) {
                 if (isUnread && (!existing || msg.id !== existing.lastMessage.id)) {
                    currentUnread++;
                }
                convos.set(otherPartyId, { lastMessage: msg, unreadCount: currentUnread });
            } else if (isUnread) {
                 existing.unreadCount++;
            }
        });

        return Array.from(convos.entries())
            .map(([collaboratorId, data]) => ({ collaboratorId, ...data }))
            .sort((a, b) => new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime());
    }, [messages, currentUser]);
    
    useEffect(() => {
        if (isOpen && activeChatCollaboratorId) {
            onMarkMessagesAsRead(activeChatCollaboratorId);
        }
    }, [isOpen, activeChatCollaboratorId, onMarkMessagesAsRead, messages]);


    const currentMessages = useMemo(() => {
        if (!currentUser || !activeChatCollaboratorId) return [];
        return messages
            .filter(msg =>
                (msg.senderId === currentUser.id && msg.receiverId === activeChatCollaboratorId) ||
                (msg.senderId === activeChatCollaboratorId && msg.receiverId === currentUser.id)
            )
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [messages, currentUser, activeChatCollaboratorId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [currentMessages, isOpen, activeChatCollaboratorId]);
    
    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !activeChatCollaboratorId) return;
        onSendMessage(activeChatCollaboratorId, newMessage);
        setNewMessage('');
    };
    
    const activeCollaborator = collaboratorMap.get(activeChatCollaboratorId || '');

    if (!currentUser) return null;

    if (!isOpen) {
        return (
            <button
                onClick={onToggle}
                className="fixed bottom-6 right-6 z-40 bg-brand-primary h-16 w-16 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-brand-secondary transition-transform transform hover:scale-110"
                aria-label="Abrir chat"
            >
                <FaComment className="h-7 w-7" />
                {unreadMessagesCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center border-2 border-background-dark">
                        {unreadMessagesCount}
                    </span>
                )}
            </button>
        );
    }
    
    return (
        <div className="fixed bottom-6 right-6 z-40 w-[380px] h-[520px] bg-surface-dark shadow-2xl rounded-xl flex flex-col border border-gray-700">
             {/* Header */}
            <div className="flex-shrink-0 flex justify-between items-center p-3 bg-brand-primary text-white rounded-t-lg">
                {activeChatCollaboratorId && activeCollaborator ? (
                     <div className="flex items-center gap-2">
                        <button onClick={() => onSelectConversation(null)} className="p-1 hover:bg-white/10 rounded-full" aria-label="Voltar"><FaArrowLeft /></button>
                         <div className="w-8 h-8 rounded-full bg-brand-secondary flex items-center justify-center font-bold text-white flex-shrink-0 text-sm">{activeCollaborator.fullName.charAt(0)}</div>
                        <h3 className="font-semibold truncate">{activeCollaborator.fullName}</h3>
                    </div>
                ) : (
                    <h3 className="font-semibold text-lg">Mensagens</h3>
                )}
                <button onClick={onToggle} className="p-1 hover:bg-white/10 rounded-full" aria-label="Fechar chat"><FaTimes /></button>
            </div>
            
            {/* Body */}
            {activeChatCollaboratorId ? (
                // Message View
                 <div className="flex-grow flex flex-col overflow-hidden">
                    <div className="flex-grow overflow-y-auto p-3 space-y-4 bg-gray-900/50">
                        {currentMessages.map(msg => {
                            const isSender = msg.senderId === currentUser.id;
                            return (
                                <div key={msg.id} className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-xs p-3 rounded-xl ${isSender ? 'bg-brand-secondary text-white' : 'bg-gray-700 text-on-surface-dark'}`}>
                                        <p className="text-sm break-words">{msg.content}</p>
                                        <p className={`text-xs mt-1 text-right ${isSender ? 'text-blue-200' : 'text-on-surface-dark-secondary'}`}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </div>
                            );
                        })}
                         <div ref={messagesEndRef} />
                    </div>
                    <form onSubmit={handleSendMessage} className="flex-shrink-0 p-3 border-t border-gray-700">
                        <div className="flex items-center gap-2">
                            <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Escreva a sua mensagem..." className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg p-2 focus:ring-brand-secondary focus:border-brand-secondary text-sm" autoFocus />
                            <button type="submit" className="p-2.5 bg-brand-secondary text-white rounded-lg hover:bg-brand-primary disabled:opacity-50" disabled={!newMessage.trim()}><FaPaperPlane className="h-5 w-5" /></button>
                        </div>
                    </form>
                </div>
            ) : (
                // Conversation List View
                <div className="flex-grow overflow-y-auto">
                     {conversations.map(({ collaboratorId, lastMessage, unreadCount }) => {
                        const collaborator = collaboratorMap.get(collaboratorId);
                        if (!collaborator) return null;
                        return (
                            <button key={collaboratorId} onClick={() => onSelectConversation(collaboratorId)} className="w-full text-left p-3 flex items-center gap-3 hover:bg-gray-800/50 border-b border-gray-700">
                                <div className="w-10 h-10 rounded-full bg-brand-secondary flex items-center justify-center font-bold text-white flex-shrink-0">{collaborator.fullName.charAt(0)}</div>
                                <div className="flex-grow overflow-hidden">
                                    <div className="flex justify-between items-center">
                                        <p className="font-semibold truncate text-on-surface-dark">{collaborator.fullName}</p>
                                        {unreadCount > 0 && <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0">{unreadCount}</span>}
                                    </div>
                                    <p className="text-sm text-on-surface-dark-secondary truncate">{lastMessage.content}</p>
                                </div>
                            </button>
                        );
                    })}
                    {conversations.length === 0 && <p className="text-center text-on-surface-dark-secondary p-4">Nenhuma conversa iniciada.</p>}
                </div>
            )}
        </div>
    );
};