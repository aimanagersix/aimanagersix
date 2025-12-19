
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Collaborator, Message, CollaboratorStatus, ModuleKey, PermissionAction } from '../types';
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
    onlineUserIds?: Set<string>;
    checkPermission?: (module: ModuleKey, action: PermissionAction) => boolean;
}

const GENERAL_CHANNEL_ID = '00000000-0000-0000-0000-000000000000';

export const ChatWidget: React.FC<ChatWidgetProps> = ({ currentUser, collaborators, messages, onSendMessage, onMarkMessagesAsRead, isOpen, onToggle, activeChatCollaboratorId, onSelectConversation, unreadMessagesCount, onlineUserIds, checkPermission }) => {
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const canChatP2P = checkPermission ? checkPermission('chat_p2p' as any, 'view' as any) : true;
    const canChatGeneral = checkPermission ? checkPermission('chat_general' as any, 'view' as any) : true;

    const collaboratorMap = useMemo(() => new Map(collaborators.map(c => [c.id, c])), [collaborators]);

    const generalChannelUser: Collaborator = useMemo(() => ({
        id: GENERAL_CHANNEL_ID,
        fullName: 'Canal Geral',
        email: 'general@system.local',
        role: 'Sistema',
        status: CollaboratorStatus.Ativo,
        canLogin: false,
        receivesNotifications: false
    }), []);

    const conversations = useMemo(() => {
        if (!currentUser) return [];
        const convos = new Map<string, { lastMessage: Message | null, unreadCount: number, isGeneral?: boolean }>();

        if (canChatGeneral) {
            convos.set(GENERAL_CHANNEL_ID, { lastMessage: null, unreadCount: 0, isGeneral: true });
        }

        messages.forEach(msg => {
            if (msg.receiverId === GENERAL_CHANNEL_ID) {
                if (canChatGeneral) {
                    const existing = convos.get(GENERAL_CHANNEL_ID)!;
                    if (!existing.lastMessage || new Date(msg.timestamp) >= new Date(existing.lastMessage.timestamp)) {
                        existing.lastMessage = msg;
                    }
                }
                return;
            }

            if (!canChatP2P) return;

            const otherPartyId = msg.senderId === currentUser.id ? msg.receiverId : msg.senderId;
            if (otherPartyId === currentUser.id) return;
            const existing = convos.get(otherPartyId);
            const isUnread = !msg.read && msg.receiverId === currentUser.id;
            let currentUnread = existing?.unreadCount || 0;

            if (!existing || (existing.lastMessage && new Date(msg.timestamp) >= new Date(existing.lastMessage.timestamp))) {
                 if (isUnread) currentUnread++;
                 convos.set(otherPartyId, { lastMessage: msg, unreadCount: currentUnread });
            } else if (isUnread) {
                 if (existing) existing.unreadCount++;
            }
        });

        if (canChatP2P && onlineUserIds) {
            onlineUserIds.forEach(id => {
                if (id !== currentUser.id && !convos.has(id) && id !== GENERAL_CHANNEL_ID && collaboratorMap.has(id)) {
                    convos.set(id, { lastMessage: null, unreadCount: 0 });
                }
            });
        }

        return Array.from(convos.entries()).map(([collaboratorId, data]) => ({ collaboratorId, ...data }))
            .sort((a, b) => {
                if (a.isGeneral) return -1;
                if (b.isGeneral) return 1;
                const aOnline = onlineUserIds?.has(a.collaboratorId);
                const bOnline = onlineUserIds?.has(b.collaboratorId);
                if (aOnline && !bOnline) return -1;
                if (!aOnline && bOnline) return 1;
                return (b.lastMessage ? new Date(b.lastMessage.timestamp).getTime() : 0) - (a.lastMessage ? new Date(a.lastMessage.timestamp).getTime() : 0);
            });
    }, [messages, currentUser, onlineUserIds, canChatP2P, canChatGeneral, collaboratorMap]);
    
    useEffect(() => {
        if (isOpen && activeChatCollaboratorId && activeChatCollaboratorId !== GENERAL_CHANNEL_ID) {
            onMarkMessagesAsRead(activeChatCollaboratorId);
        }
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [isOpen, activeChatCollaboratorId, messages]);

    if (!currentUser) return null;

    return (
        <>
            {!isOpen ? (
                <button onClick={onToggle} className="fixed bottom-6 right-6 z-40 bg-brand-primary h-16 w-16 rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 transition-all">
                    <FaComment className="h-7 w-7" />
                    {unreadMessagesCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center border-2 border-background-dark">{unreadMessagesCount}</span>}
                </button>
            ) : (
                <div className="fixed bottom-6 right-6 z-40 w-[380px] h-[520px] bg-surface-dark shadow-2xl rounded-xl flex flex-col border border-gray-700 animate-fade-in">
                    <div className="flex-shrink-0 flex justify-between items-center p-3 bg-brand-primary text-white rounded-t-lg">
                        {activeChatCollaboratorId ? (
                            <div className="flex items-center gap-2">
                                <button onClick={() => onSelectConversation(null)} className="p-1 hover:bg-white/10 rounded-full"><FaArrowLeft /></button>
                                <div className="relative">
                                    <div className="w-8 h-8 rounded-full bg-white text-brand-primary flex items-center justify-center font-bold text-xs overflow-hidden">
                                        {activeChatCollaboratorId === GENERAL_CHANNEL_ID ? <FaBullhorn /> : (collaboratorMap.get(activeChatCollaboratorId)?.photoUrl ? <img src={collaboratorMap.get(activeChatCollaboratorId)!.photoUrl} className="w-full h-full object-cover"/> : collaboratorMap.get(activeChatCollaboratorId)?.fullName.charAt(0))}
                                    </div>
                                    {onlineUserIds?.has(activeChatCollaboratorId) && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-brand-primary rounded-full"></span>}
                                </div>
                                <h3 className="font-semibold text-sm truncate">{activeChatCollaboratorId === GENERAL_CHANNEL_ID ? 'Canal Geral' : collaboratorMap.get(activeChatCollaboratorId)?.fullName}</h3>
                            </div>
                        ) : <h3 className="font-semibold text-lg">Mensagens</h3>}
                        <button onClick={onToggle} className="p-1 hover:bg-white/10 rounded-full"><FaTimes /></button>
                    </div>

                    <div className="flex-grow overflow-hidden flex flex-col bg-gray-900/50">
                        {activeChatCollaboratorId ? (
                            <div className="flex-grow flex flex-col overflow-hidden">
                                <div className="flex-grow overflow-y-auto p-3 space-y-4 custom-scrollbar">
                                    {messages.filter(m => (m.receiverId === activeChatCollaboratorId && m.senderId === currentUser.id) || (m.senderId === activeChatCollaboratorId && m.receiverId === currentUser.id) || (activeChatCollaboratorId === GENERAL_CHANNEL_ID && m.receiverId === GENERAL_CHANNEL_ID)).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).map(msg => (
                                        <div key={msg.id} className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] p-2.5 rounded-xl text-sm ${msg.senderId === currentUser.id ? 'bg-brand-secondary text-white' : 'bg-gray-700 text-on-surface-dark'}`}>
                                                {activeChatCollaboratorId === GENERAL_CHANNEL_ID && msg.senderId !== currentUser.id && <p className="text-[10px] font-bold text-brand-secondary mb-1">{collaboratorMap.get(msg.senderId)?.fullName || 'Sistema'}</p>}
                                                <p>{msg.content}</p>
                                                <p className="text-[9px] mt-1 text-right opacity-60">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                                <form onSubmit={(e) => { e.preventDefault(); if(newMessage.trim()) { onSendMessage(activeChatCollaboratorId, newMessage); setNewMessage(''); } }} className="p-3 border-t border-gray-700 bg-gray-800">
                                    <div className="flex gap-2">
                                        <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Escreva..." className="flex-grow bg-gray-700 border-none rounded-lg p-2 text-sm text-white focus:ring-1 focus:ring-brand-secondary" />
                                        <button type="submit" disabled={!newMessage.trim()} className="p-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary disabled:opacity-50"><FaPaperPlane /></button>
                                    </div>
                                </form>
                            </div>
                        ) : (
                            <div className="overflow-y-auto custom-scrollbar">
                                {conversations.map(c => {
                                    const col = c.collaboratorId === GENERAL_CHANNEL_ID ? generalChannelUser : collaboratorMap.get(c.collaboratorId);
                                    if(!col) return null;
                                    const isOnline = onlineUserIds?.has(c.collaboratorId);
                                    return (
                                        <button key={c.collaboratorId} onClick={() => onSelectConversation(c.collaboratorId)} className="w-full text-left p-3 flex items-center gap-3 hover:bg-gray-800 border-b border-gray-800 transition-colors">
                                            <div className="relative">
                                                <div className="w-10 h-10 rounded-full bg-brand-secondary flex items-center justify-center font-bold text-white overflow-hidden">
                                                    {c.isGeneral ? <FaBullhorn /> : (col.photoUrl ? <img src={col.photoUrl} className="w-full h-full object-cover"/> : col.fullName.charAt(0))}
                                                </div>
                                                {isOnline && !c.isGeneral && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-gray-900 rounded-full"></span>}
                                            </div>
                                            <div className="flex-grow overflow-hidden">
                                                <div className="flex justify-between items-center">
                                                    <p className={`font-bold text-sm truncate ${c.isGeneral ? 'text-brand-secondary' : 'text-white'}`}>{col.fullName}</p>
                                                    {c.unreadCount > 0 && <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{c.unreadCount}</span>}
                                                </div>
                                                <p className="text-xs text-gray-500 truncate">{c.lastMessage?.content || (c.isGeneral ? 'Comunicados Globais' : 'Iniciar conversa...')}</p>
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
