
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Modal from './common/Modal';
import { Ticket, Entidade, Collaborator, UserRole, CollaboratorStatus, Team, Equipment, EquipmentType, Assignment, TicketCategory, CriticalityLevel, CIARating, TicketCategoryItem, SecurityIncidentTypeItem, TicketStatus, TicketActivity, Supplier, Instituicao, ConfigItem } from '../types';
import { FaTrash as DeleteIcon, FaShieldAlt, FaExclamationTriangle, FaMagic, FaSpinner, FaCheck, FaLandmark, FaDownload, SpinnerIcon } from './common/Icons';
import { analyzeTicketRequest, findSimilarPastTickets, isAiConfigured } from '../services/geminiService';
import { FaLightbulb, FaLock, FaUserTie, FaTruck, FaUsers, FaBuilding, FaTools } from 'react-icons/fa';
import RegulatoryNotificationModal from './RegulatoryNotificationModal';
import * as dataService from '../services/dataService';
import { getSupabase } from '../services/supabaseClient';

interface AddTicketModalProps {
    onClose: () => void;
    onSave: (ticket: Omit<Ticket, 'id' | 'requestDate' | 'status' | 'finishDate'> | Ticket) => Promise<any>;
    ticketToEdit?: Ticket | null;
    escolasDepartamentos: Entidade[];
    instituicoes: Instituicao[];
    collaborators: Collaborator[];
    suppliers?: Supplier[];
    teams: Team[];
    currentUser: Collaborator | null;
    userPermissions: { viewScope: string; canManage?: boolean };
    equipment: Equipment[];
    equipmentTypes: EquipmentType[];
    assignments: Assignment[];
    categories: TicketCategoryItem[];
    securityIncidentTypes?: SecurityIncidentTypeItem[]; 
    pastTickets?: Ticket[];
    initialData?: Partial<Ticket> | null;
    statusOptions?: ConfigItem[];
}

const MAX_FILES = 3;
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export const AddTicketModal: React.FC<AddTicketModalProps> = ({ onClose, onSave, ticketToEdit, escolasDepartamentos: entidades, instituicoes, collaborators, suppliers = [], teams, currentUser, userPermissions, equipment, equipmentTypes, assignments, categories, securityIncidentTypes = [], pastTickets = [], initialData, statusOptions = [] }) => {
    
    const activeCategories = useMemo(() => categories.filter(c => c.is_active).map(c => c.name), [categories]);
    const canManage = userPermissions.canManage || currentUser?.role === 'Admin' || currentUser?.role === 'SuperAdmin' || currentUser?.role === 'Técnico';
    const modalTitle = ticketToEdit ? "Editar Ticket de Suporte" : "Abrir Novo Ticket de Suporte";

    const [formData, setFormData] = useState<Partial<Ticket>>(() => {
        if (ticketToEdit) return { ...ticketToEdit };
        
        const triageTeam = teams.find(t => t.name === 'Pendente Atribuição');
        const generalCategory = categories.find(c => c.name === 'Geral');

        const baseData: any = {
            title: initialData?.title || '',
            description: initialData?.description || '',
            team_id: triageTeam?.id || '',
            category: initialData?.category || generalCategory?.name || activeCategories[0] || 'Geral',
            impactCriticality: (initialData?.impactCriticality as CriticalityLevel) || CriticalityLevel.Low,
            status: 'Pedido'
        };
        
        if (!generalCategory || baseData.category !== 'Geral') {
            const defaultCatObj = categories.find(c => c.name === baseData.category);
            if (defaultCatObj?.default_team_id) baseData.team_id = defaultCatObj.default_team_id;
        }

        if (currentUser) {
            baseData.entidadeId = currentUser.entidadeId;
            baseData.collaboratorId = currentUser.id;
        }
        
        return baseData;
    });

    useEffect(() => {
        if (!ticketToEdit && currentUser && !formData.collaboratorId) {
            setFormData(prev => ({
                ...prev,
                collaboratorId: currentUser.id,
                entidadeId: currentUser.entidadeId
            }));
        }
    }, [currentUser, ticketToEdit]);

    const [attachments, setAttachments] = useState<{ name: string; dataUrl: string; size: number }[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);
     
    const isSecurityIncident = useMemo(() => {
        const selectedCatObj = categories.find(c => c.name === formData.category);
        return selectedCatObj?.is_security || (formData.category || '').toLowerCase().includes('segurança');
    }, [formData.category, categories]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'category') {
             const catObj = categories.find(c => c.name === value);
             setFormData(prev => ({ ...prev, category: value, team_id: catObj?.default_team_id || prev.team_id }));
        } else setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.title?.trim()) newErrors.title = "O assunto é obrigatório.";
        if (!formData.description?.trim()) newErrors.description = "A descrição é obrigatória.";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setIsSaving(true);
        try {
            const dataToSave: any = { 
                ...formData, 
                attachments: attachments.map(a => ({ name: a.name, dataUrl: a.dataUrl })) 
            };
            
            if (!dataToSave.team_id) dataToSave.team_id = null;
            if (!dataToSave.equipmentId) dataToSave.equipmentId = null;
            if (!dataToSave.technicianId) dataToSave.technicianId = null;

            await onSave(ticketToEdit ? { ...ticketToEdit, ...dataToSave } : dataToSave);
            onClose();
        } catch (error: any) { 
            console.error("Error saving ticket:", error);
            alert("Erro ao gravar ticket: " + (error.message || "Erro desconhecido. Verifique as suas permissões."));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal title={modalTitle} onClose={onClose} maxWidth="max-w-3xl">
             <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Categoria</label>
                        <select 
                            name="category" 
                            value={formData.category} 
                            onChange={handleChange} 
                            disabled={!canManage}
                            className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {activeCategories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                        </select>
                    </div>
                    {/* Alterado para ser visível a todos, mas apenas editável por quem tem permissão */}
                    <div>
                        <label className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Estado {!canManage && '(Consulta)'}</label>
                        <select 
                            name="status" 
                            value={formData.status} 
                            onChange={handleChange} 
                            disabled={!canManage}
                            className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 disabled:bg-gray-800 disabled:text-gray-400"
                        >
                            {statusOptions.length > 0 ? statusOptions.map(opt => <option key={opt.id} value={opt.name}>{opt.name}</option>) : (
                                <>
                                    <option value="Pedido">Pedido</option>
                                    <option value="Em progresso">Em progresso</option>
                                    <option value="Finalizado">Finalizado</option>
                                    <option value="Cancelado">Cancelado</option>
                                </>
                            )}
                        </select>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Assunto</label>
                        <input type="text" name="title" value={formData.title} onChange={handleChange} disabled={!canManage && !!ticketToEdit} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.title ? 'border-red-500' : 'border-gray-600'} disabled:bg-gray-800 disabled:text-gray-400`} />
                        {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
                    </div>
                    {/* Equipa visível apenas para consulta para o utilizador comum */}
                    <div>
                        <label className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Equipa de Suporte {!canManage && '(Consulta)'}</label>
                        <select name="team_id" value={formData.team_id || ''} onChange={handleChange} disabled={!canManage} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 disabled:bg-gray-800 disabled:text-gray-400">
                            <option value="">-- Sem Equipa (Geral) --</option>
                            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Descrição do Problema</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} disabled={!canManage && !!ticketToEdit} rows={4} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.description ? 'border-red-500' : 'border-gray-600'} disabled:bg-gray-800 disabled:text-gray-400`} placeholder="Descreva o problema..."></textarea>
                    {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description}</p>}
                </div>
                
                <div className="flex justify-end gap-4 pt-4 border-t border-gray-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500" disabled={isSaving}>Cancelar</button>
                    {(canManage || !ticketToEdit) && (
                        <button type="submit" disabled={isSaving} className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary flex items-center gap-2">
                            {isSaving ? <FaSpinner className="animate-spin" /> : null}
                            {isSaving ? 'A Gravar...' : 'Salvar'}
                        </button>
                    )}
                </div>
            </form>
        </Modal>
    );
};
