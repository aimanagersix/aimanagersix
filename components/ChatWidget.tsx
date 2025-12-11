
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Collaborator, Message, CollaboratorStatus } from '../types';
import { FaComment, FaPaperPlane, FaArrowLeft, FaUsers } from './common/Icons';
import { FaTimes, FaBullhorn, FaCircle } from 'react-icons/fa';

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
    onlineUserIds?: Set<string>; // NEW PROP
}

// Constants for the General Channel (Broadcast)
// This UUID must match the one inserted via SQL in DatabaseSchemaModal
const GENERAL_CHANNEL_ID = '00000000-0000-0000-0000-000000000000';

export const ChatWidget: React.FC<ChatWidgetProps> = ({ currentUser, collaborators, messages, onSendMessage, onMarkMessagesAsRead, isOpen, onToggle, activeChatCollaboratorId, onSelectConversation, unreadMessagesCount, onlineUserIds }) => {
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const collaboratorMap = useMemo(() => new Map(collaborators.map(c => [c.id, c])), [collaborators]);

    // Add General Channel to collaborator list if not present (mock it visually)
    const generalChannelUser: Collaborator = useMemo(() => {
        const existing = collaborators.find(c => c.id === GENERAL_CHANNEL_ID);
        if (existing) return existing;
        return {
            id: GENERAL_CHANNEL_ID,
            fullName: 'Canal Geral',
            email: 'general@system.local',
            numeroMecanografico: 'SYS',
            role: 'System',
            status: CollaboratorStatus.Ativo, // Fixed Type
            canLogin: false,
            receivesNotifications: false
        };
    }, [collaborators]);

    const conversations = useMemo(() => {
        if (!currentUser) return [];
        const convos = new Map<string, { lastMessage: Message | null, unreadCount: number, isGeneral?: boolean }>();

        // Initialize General Channel
        convos.set(GENERAL_CHANNEL_ID, { lastMessage: null, unreadCount: 0, isGeneral: true });

        messages.forEach(msg => {
            // Handle General Channel messages
            if (msg.receiverId === GENERAL_CHANNEL_ID) {
                const existing = convos.get(GENERAL_CHANNEL_ID)!;
                // Since it's broadcast, everyone "receives" it except sender. 
                // Read status for general channel is tricky without per-user read table, 
                // so we simplify: it's unread if timestamp > last visit (not implemented) or just show count.
                // For simplicity in this architecture:
                const isUnread = !msg.read && msg.senderId !== currentUser.id;
                
                if (!existing.lastMessage || new Date(msg.timestamp) >= new Date(existing.lastMessage.timestamp)) {
                    existing.lastMessage = msg;
                }
                // Logic for unread in broadcast needs a separate table or local storage track. 
                // Skipping detailed unread count for General in this version to avoid DB complexity.
                return;
            }

            const otherPartyId = msg.senderId === currentUser.id ? msg.receiverId : msg.senderId;
            if (otherPartyId === currentUser.id) return;

            const existing = convos.get(otherPartyId);
            const isUnread = !msg.read && msg.receiverId === currentUser.id;
            let currentUnread = existing?.unreadCount || 0;

            if (!existing || (existing.lastMessage && new Date(msg.timestamp) >= new Date(existing.lastMessage.timestamp))) {
                 if (isUnread && (!existing || !existing.lastMessage || msg.id !== existing.lastMessage.id)) {
                    currentUnread++;
                }
                convos.set(otherPartyId, { lastMessage: msg, unreadCount: currentUnread });
            } else if (isUnread) {
                 if (existing) existing.unreadCount++;
            }
        });

        // Add any currently online users to the list even if no messages yet
        if (onlineUserIds) {
            onlineUserIds.forEach(id => {
                if (id !== currentUser.id && !convos.has(id) && id !== GENERAL_CHANNEL_ID) {
                    // Verify user exists in collabs list (might be new)
                    const userExists = collaborators.some(c => c.id === id);
                    if (userExists) {
                        convos.set(id, { lastMessage: null, unreadCount: 0 });
                    }
                }
            });
        }

        return Array.from(convos.entries())
            .map(([collaboratorId, data]) => ({ collaboratorId, ...data }))
            .sort((a, b) => {
                // General always top
                if (a.isGeneral) return -1;
                if (b.isGeneral) return 1;
                
                // Online users prioritize
                const aOnline = onlineUserIds?.has(a.collaboratorId);
                const bOnline = onlineUserIds?.has(b.collaboratorId);
                if (aOnline && !bOnline) return -1;
                if (!aOnline && bOnline) return 1;

                const timeA = a.lastMessage ? new Date(a.lastMessage.timestamp).getTime() : 0;
                const timeB = b.lastMessage ? new Date(b.lastMessage.timestamp).getTime() : 0;
                return timeB - timeA;
            });
    }, [messages, currentUser, onlineUserIds, collaborators]);
    
    useEffect(() => {
        if (isOpen && activeChatCollaboratorId) {
             // Only mark DM as read, not general channel (as it would mark for everyone)
             if (activeChatCollaboratorId !== GENERAL_CHANNEL_ID) {
                onMarkMessagesAsRead(activeChatCollaboratorId);
             }
        }
    }, [isOpen, activeChatCollaboratorId, onMarkMessagesAsRead, messages]);


    const currentMessages = useMemo(() => {
        if (!currentUser || !activeChatCollaboratorId) return [];
        
        if (activeChatCollaboratorId === GENERAL_CHANNEL_ID) {
            return messages
                .filter(msg => msg.receiverId === GENERAL_CHANNEL_ID)
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        }

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
    
    // Resolve active collaborator (handle general channel case)
    const activeCollaborator = activeChatCollaboratorId === GENERAL_CHANNEL_ID 
        ? generalChannelUser 
        : collaboratorMap.get(activeChatCollaboratorId || '');
        
    const isActiveOnline = activeChatCollaboratorId && onlineUserIds?.has(activeChatCollaboratorId);

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
                         {activeCollaborator.id === GENERAL_CHANNEL_ID ? (
                             <div className="w-8 h-8 rounded-full bg-white text-brand-primary flex items-center justify-center font-bold flex-shrink-0"><FaBullhorn /></div>
                         ) : activeCollaborator.photoUrl ? (
                            <img src={activeCollaborator.photoUrl} alt={activeCollaborator.fullName} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-brand-secondary flex items-center justify-center font-bold text-white flex-shrink-0 text-sm">{activeCollaborator.fullName.charAt(0)}</div>
                        )}
                        <div>
                            <h3 className="font-semibold truncate text-sm">{activeCollaborator.fullName}</h3>
                            {activeCollaborator.id !== GENERAL_CHANNEL_ID && (
                                <span className={`text-xs flex items-center gap-1 ${isActiveOnline ? 'text-green-300' : 'text-gray-300'}`}>
                                    <FaCircle className={`h-2 w-2 ${isActiveOnline ? 'text-green-400' : 'text-gray-400'}`} /> 
                                    {isActiveOnline ? 'Online' : 'Offline'}
                                </span>
                            )}
                        </div>
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
                            // Identify sender name for General Channel or Group
                            const senderName = isSender ? 'Eu' : (collaboratorMap.get(msg.senderId)?.fullName || 'Desconhecido');

                            return (
                                <div key={msg.id} className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-3 rounded-xl ${isSender ? 'bg-brand-secondary text-white' : 'bg-gray-700 text-on-surface-dark'}`}>
                                        {activeChatCollaboratorId === GENERAL_CHANNEL_ID && !isSender && (
                                            <p className="text-[10px] font-bold text-brand-secondary mb-1">{senderName}</p>
                                        )}
                                        <p className="text-sm break-words">{msg.content}</p>
                                        <p className={`text-[10px] mt-1 text-right ${isSender ? 'text-blue-200' : 'text-gray-400'}`}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
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
                     {conversations.map(({ collaboratorId, lastMessage, unreadCount, isGeneral }) => {
                        const collaborator = collaboratorId === GENERAL_CHANNEL_ID ? generalChannelUser : collaboratorMap.get(collaboratorId);
                        if (!collaborator) return null;
                        
                        const isOnline = onlineUserIds ? onlineUserIds.has(collaboratorId) : false;

                        return (
                            <button key={collaboratorId} onClick={() => onSelectConversation(collaboratorId)} className={`w-full text-left p-3 flex items-center gap-3 hover:bg-gray-800/50 border-b border-gray-700 ${isGeneral ? 'bg-blue-900/10' : ''}`}>
                                <div className="relative flex-shrink-0">
                                    {isGeneral ? (
                                         <div className="w-10 h-10 rounded-full bg-white text-brand-primary flex items-center justify-center font-bold text-lg"><FaBullhorn /></div>
                                    ) : collaborator.photoUrl ? (
                                        <img src={collaborator.photoUrl} alt={collaborator.fullName} className="w-10 h-10 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-brand-secondary flex items-center justify-center font-bold text-white text-sm">{collaborator.fullName.charAt(0)}</div>
                                    )}
                                    {!isGeneral && isOnline && (
                                        <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-400 ring-2 ring-surface-dark" title="Online"/>
                                    )}
                                </div>
                                <div className="flex-grow overflow-hidden">
                                    <div className="flex justify-between items-center">
                                        <p className={`font-semibold truncate text-sm ${isGeneral ? 'text-brand-secondary' : 'text-on-surface-dark'}`}>{collaborator.fullName}</p>
                                        {unreadCount > 0 && <span className="bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0">{unreadCount}</span>}
                                    </div>
                                    <p className="text-xs text-on-surface-dark-secondary truncate mt-0.5">
                                        {lastMessage ? (lastMessage.content) : (isGeneral ? "Comunicados gerais para todos." : "Nova conversa")}
                                    </p>
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
