

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Modal from './common/Modal';
import { Ticket, Entidade, Collaborator, UserRole, CollaboratorStatus, Team } from '../types';
import { DeleteIcon } from './common/Icons';

interface AddTicketModalProps {
    onClose: () => void;
    onSave: (ticket: Omit<Ticket, 'id' | 'requestDate' | 'status' | 'finishDate'> | Ticket) => Promise<any>;
    ticketToEdit?: Ticket | null;
    escolasDepartamentos: Entidade[];
    collaborators: Collaborator[];
    teams: Team[];
    currentUser: Collaborator | null;
    userPermissions: { viewScope: string };
}

const MAX_FILES = 3;
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const AddTicketModal: React.FC<AddTicketModalProps> = ({ onClose, onSave, ticketToEdit, escolasDepartamentos: entidades, collaborators, teams, currentUser, userPermissions }) => {
    const [formData, setFormData] = useState({
        entidadeId: entidades[0]?.id || '',
        collaboratorId: '',
        description: '',
        teamId: '',
    });
    const [attachments, setAttachments] = useState<{ name: string; dataUrl: string; size: number }[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);
     
    const isUtilizador = userPermissions.viewScope === 'own';

    const availableCollaborators = useMemo(() => {
        if (isUtilizador && currentUser) {
            return [currentUser];
        }
        return collaborators.filter(c => c.entidadeId === formData.entidadeId && c.status === CollaboratorStatus.Ativo);
    }, [formData.entidadeId, collaborators, isUtilizador, currentUser]);


    useEffect(() => {
        if (ticketToEdit) {
            setFormData({
                entidadeId: ticketToEdit.entidadeId,
                collaboratorId: ticketToEdit.collaboratorId,
                description: ticketToEdit.description,
                teamId: ticketToEdit.teamId || '',
            });
            setAttachments(ticketToEdit.attachments?.map(a => ({ ...a, size: 0 })) || []); // size is only for validation on upload
        } else if (isUtilizador && currentUser) {
            setFormData({
                entidadeId: currentUser.entidadeId,
                collaboratorId: currentUser.id,
                description: '',
                teamId: '',
            });
        } else {
             setFormData({
                entidadeId: entidades[0]?.id || '',
                collaboratorId: collaborators.find(c => c.entidadeId === entidades[0]?.id)?.id || '',
                description: '',
                teamId: '',
            });
        }
    }, [ticketToEdit, entidades, collaborators, isUtilizador, currentUser]);

    useEffect(() => {
        if (!ticketToEdit && !isUtilizador && availableCollaborators.length > 0) {
            setFormData(prev => ({...prev, collaboratorId: availableCollaborators[0].id}));
        }
    }, [formData.entidadeId, availableCollaborators, ticketToEdit, isUtilizador]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.entidadeId) newErrors.entidadeId = "A entidade é obrigatória.";
        if (!formData.collaboratorId) newErrors.collaboratorId = "O colaborador é obrigatório.";
        if (!formData.description.trim()) newErrors.description = "A descrição do problema é obrigatória.";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        if (attachments.length + files.length > MAX_FILES) {
            alert(`Não pode anexar mais de ${MAX_FILES} ficheiros.`);
            return;
        }
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.size > MAX_FILE_SIZE) {
                alert(`O ficheiro "${file.name}" é demasiado grande. O limite é de 2MB.`);
                continue;
            }

            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                const dataUrl = loadEvent.target?.result as string;
                setAttachments(prev => [...prev, { name: file.name, dataUrl, size: file.size }]);
            };
            reader.readAsDataURL(file);
        }
        // Reset file input to allow selecting the same file again if removed
        e.target.value = '';
    };
    
    const handleRemoveAttachment = (indexToRemove: number) => {
        setAttachments(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        
        const dataToSubmit = {
            ...formData,
            teamId: formData.teamId || undefined,
            attachments: attachments.map(({ name, dataUrl }) => ({ name, dataUrl })),
        };

        if (ticketToEdit) {
            onSave({ ...ticketToEdit, ...dataToSubmit });
        } else {
            onSave(dataToSubmit as Omit<Ticket, 'id' | 'requestDate' | 'status' | 'finishDate'>);
        }
        onClose();
    };

    const modalTitle = ticketToEdit ? "Editar Ticket" : "Adicionar Novo Ticket";

    return (
        <Modal title={modalTitle} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="entidadeId" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Entidade</label>
                        <select 
                            name="entidadeId" 
                            id="entidadeId" 
                            value={formData.entidadeId} 
                            onChange={handleChange} 
                            className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.entidadeId ? 'border-red-500' : 'border-gray-600'} disabled:bg-gray-800 disabled:cursor-not-allowed`}
                            disabled={isUtilizador}
                        >
                            <option value="" disabled>Selecione uma entidade</option>
                            {entidades.map(entidade => (
                                <option key={entidade.id} value={entidade.id}>{entidade.name}</option>
                            ))}
                        </select>
                        {errors.entidadeId && <p className="text-red-400 text-xs italic mt-1">{errors.entidadeId}</p>}
                    </div>
                    <div>
                        <label htmlFor="collaboratorId" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Colaborador</label>
                        <select 
                            name="collaboratorId" 
                            id="collaboratorId" 
                            value={formData.collaboratorId} 
                            onChange={handleChange} 
                            className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.collaboratorId ? 'border-red-500' : 'border-gray-600'} disabled:bg-gray-800 disabled:cursor-not-allowed`}
                             disabled={isUtilizador || availableCollaborators.length === 0}
                        >
                            <option value="" disabled>Selecione um colaborador</option>
                            {availableCollaborators.map(col => (
                                <option key={col.id} value={col.id}>{col.fullName}</option>
                            ))}
                        </select>
                         {errors.collaboratorId && <p className="text-red-400 text-xs italic mt-1">{errors.collaboratorId}</p>}
                    </div>
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Descrição do Problema</label>
                    <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={4} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.description ? 'border-red-500' : 'border-gray-600'}`} ></textarea>
                    {errors.description && <p className="text-red-400 text-xs italic mt-1">{errors.description}</p>}
                </div>

                <div>
                    <label htmlFor="teamId" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Atribuir à Equipa (Opcional)</label>
                    <select
                        name="teamId"
                        id="teamId"
                        value={formData.teamId}
                        onChange={handleChange}
                        className="w-full bg-gray-700 border text-white rounded-md p-2 border-gray-600"
                    >
                        <option value="">Nenhuma</option>
                        {teams.map(team => (
                            <option key={team.id} value={team.id}>{team.name}</option>
                        ))}
                    </select>
                </div>


                <div>
                    <label className="block text-sm font-medium text-on-surface-dark-secondary mb-2">Anexos</label>
                    <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700">
                        {attachments.length > 0 && (
                            <ul className="space-y-2 mb-3">
                                {attachments.map((file, index) => (
                                    <li key={index} className="flex justify-between items-center text-sm p-2 bg-surface-dark rounded-md">
                                        <span className="truncate text-on-surface-dark-secondary">
                                            {file.name}
                                            {file.size > 0 && <span className="text-xs ml-2 text-gray-400">({formatFileSize(file.size)})</span>}
                                        </span>
                                        <button type="button" onClick={() => handleRemoveAttachment(index)} className="text-red-400 hover:text-red-300 ml-2">
                                            <DeleteIcon className="h-4 w-4" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                        <input
                            type="file"
                            multiple
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            className="hidden"
                            accept="image/*,application/pdf"
                        />
                         <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={attachments.length >= MAX_FILES}
                            className="w-full px-4 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {`Anexar Ficheiros (${attachments.length}/${MAX_FILES})`}
                        </button>
                    </div>
                </div>
                
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary">Salvar</button>
                </div>
            </form>
        </Modal>
    );
};

export default AddTicketModal;