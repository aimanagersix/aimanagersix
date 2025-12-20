import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Collaborator, Message, CollaboratorStatus, ModuleKey, PermissionAction } from '../types';
import { FaComment, FaPaperPlane, FaArrowLeft, FaTimes } from './common/Icons';
import { FaBullhorn } from 'react-icons/fa';

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
}

const GENERAL_CHANNEL_ID = '00000000-0000-0000-0000-000000000000';

export const ChatWidget: React.FC<ChatWidgetProps> = ({ currentUser, collaborators, messages, onSendMessage, onMarkMessagesAsRead, isOpen, onToggle, activeChatCollaboratorId, onSelectConversation, unreadMessagesCount, checkPermission }) => {
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const collaboratorMap = useMemo(() => new Map(collaborators.map(c => [c.id, c])), [collaborators]);

    const conversations = useMemo(() => {
        if (!currentUser) return [];
        const convos = new Map<string, { lastMessage: Message | null, unreadCount: number, isGeneral?: boolean }>();
        convos.set(GENERAL_CHANNEL_ID, { lastMessage: null, unreadCount: 0, isGeneral: true });

        messages.forEach(msg => {
            if (msg.receiver_id === GENERAL_CHANNEL_ID) {
                const existing = convos.get(GENERAL_CHANNEL_ID)!;
                if (!existing.lastMessage || new Date(msg.timestamp) >= new Date(existing.lastMessage.timestamp)) existing.lastMessage = msg;
                return;
            }
            const otherPartyId = msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_id;
            if (otherPartyId === currentUser.id) return;
            const isUnread = !msg.read && msg.receiver_id === currentUser.id;
            const existing = convos.get(otherPartyId);
            if (!existing || (existing.lastMessage && new Date(msg.timestamp) >= new Date(existing.lastMessage.timestamp))) {
                 convos.set(otherPartyId, { lastMessage: msg, unreadCount: (existing?.unreadCount || 0) + (isUnread ? 1 : 0) });
            } else if (isUnread) { if (existing) existing.unreadCount++; }
        });
        return Array.from(convos.entries()).map(([collaboratorId, data]) => ({ collaboratorId, ...data })).sort((a,b) => (b.lastMessage?.timestamp || '').localeCompare(a.lastMessage?.timestamp || ''));
    }, [messages, currentUser]);

    useEffect(() => {
        if (isOpen && activeChatCollaboratorId && activeChatCollaboratorId !== GENERAL_CHANNEL_ID) onMarkMessagesAsRead(activeChatCollaboratorId);
    }, [isOpen, activeChatCollaboratorId, onMarkMessagesAsRead]);

    if (!currentUser) return null;

    return (
        <>
            {!isOpen ? (
                <button onClick={onToggle} className="fixed bottom-6 right-6 z-40 bg-brand-primary h-14 w-14 rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 transition-all">
                    <FaComment size={24} />
                    {unreadMessagesCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-background-dark">{unreadMessagesCount}</span>}
                </button>
            ) : (
                <div className="fixed bottom-6 right-6 z-40 w-[350px] h-[500px] bg-surface-dark shadow-2xl rounded-xl flex flex-col border border-gray-700 animate-fade-in overflow-hidden">
                    <div className="flex-shrink-0 flex justify-between items-center p-3 bg-brand-primary text-white">
                        {activeChatCollaboratorId ? (
                            <div className="flex items-center gap-2">
                                <button onClick={() => onSelectConversation(null)} className="p-1"><FaArrowLeft size={14}/></button>
                                <h3 className="font-bold text-sm truncate">{activeChatCollaboratorId === GENERAL_CHANNEL_ID ? 'Canal Geral' : collaboratorMap.get(activeChatCollaboratorId)?.full_name}</h3>
                            </div>
                        ) : <h3 className="font-bold">Chat Interno</h3>}
                        <button onClick={onToggle}><FaTimes size={16}/></button>
                    </div>

                    <div className="flex-grow overflow-hidden flex flex-col bg-gray-900/50">
                        {activeChatCollaboratorId ? (
                            <div className="flex-grow flex flex-col overflow-hidden">
                                <div className="flex-grow overflow-y-auto p-3 space-y-3 custom-scrollbar">
                                    {messages.filter(m => (m.receiver_id === activeChatCollaboratorId && m.sender_id === currentUser.id) || (m.sender_id === activeChatCollaboratorId && m.receiver_id === currentUser.id) || (activeChatCollaboratorId === GENERAL_CHANNEL_ID && m.receiver_id === GENERAL_CHANNEL_ID)).sort((a,b) => a.timestamp.localeCompare(b.timestamp)).map(msg => (
                                        <div key={msg.id} className={`flex ${msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] p-2 rounded-lg text-sm ${msg.sender_id === currentUser.id ? 'bg-brand-secondary text-white' : 'bg-gray-700 text-gray-200'}`}>
                                                {activeChatCollaboratorId === GENERAL_CHANNEL_ID && msg.sender_id !== currentUser.id && <p className="text-[10px] font-bold text-brand-secondary">{collaboratorMap.get(msg.sender_id)?.full_name || 'Sistema'}</p>}
                                                <p>{msg.content}</p>
                                                <p className="text-[8px] text-right opacity-50">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                                <form onSubmit={e => { e.preventDefault(); if(newMessage.trim()){ onSendMessage(activeChatCollaboratorId, newMessage); setNewMessage(''); } }} className="p-2 border-t border-gray-700 bg-gray-800 flex gap-2">
                                    <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Escreva..." className="flex-grow bg-gray-700 rounded p-2 text-sm text-white focus:outline-none" />
                                    <button type="submit" disabled={!newMessage.trim()} className="p-2 text-brand-secondary"><FaPaperPlane size={18}/></button>
                                </form>
                            </div>
                        ) : (
                            <div className="overflow-y-auto custom-scrollbar">
                                {conversations.map(c => {
                                    const col = c.collaboratorId === GENERAL_CHANNEL_ID ? { full_name: 'Canal Geral', photo_url: null } : collaboratorMap.get(c.collaboratorId);
                                    if(!col) return null;
                                    return (
                                        <button key={c.collaboratorId} onClick={() => onSelectConversation(c.collaboratorId)} className="w-full text-left p-3 flex items-center gap-3 hover:bg-gray-800 border-b border-gray-800 transition-colors">
                                            <div className="w-10 h-10 rounded-full bg-brand-secondary flex items-center justify-center font-bold text-white overflow-hidden">
                                                {c.isGeneral ? <FaBullhorn /> : (col.photo_url ? <img src={col.photo_url} className="w-full h-full object-cover"/> : col.full_name.charAt(0))}
                                            </div>
                                            <div className="flex-grow overflow-hidden">
                                                <div className="flex justify-between items-center"><p className="font-bold text-sm truncate text-white">{col.full_name}</p>{c.unreadCount > 0 && <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{c.unreadCount}</span>}</div>
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