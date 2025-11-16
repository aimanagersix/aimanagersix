import React, { useState, useEffect, useMemo, useRef } from 'react';
import Modal from './common/Modal';
import { Collaborator, Message } from '../types';
import { FaPaperPlane } from './common/Icons';

interface ChatModalProps {
    onClose: () => void;
    targetCollaborator: Collaborator;
    currentUser: Collaborator;
    messages: Message[];
    onSendMessage: (receiverId: string, content: string) => void;
    onMarkMessagesAsRead: (senderId: string) => void;
}

const ChatModal: React.FC<ChatModalProps> = ({ onClose, targetCollaborator, currentUser, messages, onSendMessage, onMarkMessagesAsRead }) => {
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        onMarkMessagesAsRead(targetCollaborator.id);
    }, [onMarkMessagesAsRead, targetCollaborator.id]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const conversationMessages = useMemo(() => {
        return messages
            .filter(msg =>
                (msg.senderId === currentUser.id && msg.receiverId === targetCollaborator.id) ||
                (msg.senderId === targetCollaborator.id && msg.receiverId === currentUser.id)
            )
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [messages, currentUser.id, targetCollaborator.id]);

    useEffect(() => {
        scrollToBottom();
    }, [conversationMessages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === '') return;
        onSendMessage(targetCollaborator.id, newMessage);
        setNewMessage('');
    };

    return (
        <Modal title={`Conversa com ${targetCollaborator.fullName}`} onClose={onClose} maxWidth="max-w-2xl">
            <div className="flex flex-col h-[60vh]">
                <div className="flex-grow overflow-y-auto p-4 bg-gray-900/50 rounded-lg space-y-4">
                    {conversationMessages.length > 0 ? conversationMessages.map(msg => {
                        const isSender = msg.senderId === currentUser.id;
                        return (
                            <div key={msg.id} className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-xs md:max-w-md p-3 rounded-xl ${isSender ? 'bg-brand-primary text-white' : 'bg-gray-700 text-on-surface-dark'}`}>
                                    <p className="text-sm">{msg.content}</p>
                                    <p className={`text-xs mt-1 ${isSender ? 'text-blue-200' : 'text-on-surface-dark-secondary'}`}>
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-on-surface-dark-secondary">Nenhuma mensagem ainda. Envie a primeira!</p>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleSendMessage} className="flex-shrink-0 mt-4">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Escreva a sua mensagem..."
                            className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg p-3 focus:ring-brand-secondary focus:border-brand-secondary"
                            autoFocus
                        />
                        <button
                            type="submit"
                            className="p-3 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary disabled:opacity-50"
                            disabled={!newMessage.trim()}
                        >
                            <FaPaperPlane className="h-5 w-5" />
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default ChatModal;
