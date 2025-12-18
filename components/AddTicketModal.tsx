import React, { useState, useEffect, useMemo, useRef } from 'react';
import Modal from './common/Modal';
import { Ticket, Entidade, Collaborator, UserRole, CollaboratorStatus, Team, Equipment, EquipmentType, Assignment, TicketCategory, CriticalityLevel, CIARating, TicketCategoryItem, SecurityIncidentType, SecurityIncidentTypeItem, TicketStatus, TicketActivity, Supplier, Instituicao } from '../types';
import { FaTrash as DeleteIcon, FaShieldAlt, FaExclamationTriangle, FaMagic, FaSpinner, FaCheck, FaLandmark, FaDownload, SpinnerIcon } from './common/Icons';
import { analyzeTicketRequest, findSimilarPastTickets, isAiConfigured } from '../services/geminiService';
// Fix: Use correct FontAwesome icon names from react-icons/fa
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
}

const MAX_FILES = 3;
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export const AddTicketModal: React.FC<AddTicketModalProps> = ({ onClose, onSave, ticketToEdit, escolasDepartamentos: entidades, instituicoes, collaborators, suppliers = [], teams, currentUser, userPermissions, equipment, equipmentTypes, assignments, categories, securityIncidentTypes = [], pastTickets = [], initialData }) => {
    
    const activeCategories = useMemo(() => categories.filter(c => c.is_active).map(c => c.name), [categories]);
    const canManage = userPermissions.canManage || currentUser?.role === 'Admin' || currentUser?.role === 'SuperAdmin';
    const modalTitle = ticketToEdit ? "Editar Ticket de Suporte" : "Abrir Novo Ticket de Suporte";

    const [formData, setFormData] = useState<Partial<Ticket>>(() => {
        if (ticketToEdit) return { ...ticketToEdit };
        
        // Nova Lógica de Triagem: Geral + Pendente Atribuição
        const triageTeam = teams.find(t => t.name === 'Pendente Atribuição');
        const generalCategory = categories.find(c => c.name === 'Geral');

        const baseData: any = {
            title: initialData?.title || '',
            description: initialData?.description || '',
            // Atribui a equipa de triagem por defeito se existir
            team_id: triageTeam?.id || '',
            // Atribui a categoria Geral por defeito se existir
            category: initialData?.category || generalCategory?.name || activeCategories[0] || 'Geral',
            impactCriticality: (initialData?.impactCriticality as CriticalityLevel) || CriticalityLevel.Low,
        };
        
        // Mantém a compatibilidade: se a categoria sugerida tiver uma equipa específica 
        // e não for a inicialização padrão "Geral", respeita a configuração da categoria.
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

    const [attachments, setAttachments] = useState<{ name: string; dataUrl: string; size: number }[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const aiConfigured = isAiConfigured();
     
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
        try {
            const dataToSave: any = { ...formData, attachments: attachments.map(a => ({ name: a.name, dataUrl: a.dataUrl })) };
            await onSave(ticketToEdit ? { ...ticketToEdit, ...dataToSave } : dataToSave);
            onClose();
        } catch (error) { console.error(error); }
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
                    {/* HIDE TEAM SELECTION FOR NORMAL USERS */}
                    {canManage ? (
                        <div>
                            <label className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Equipa de Suporte</label>
                            <select name="team_id" value={formData.team_id} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2">
                                <option value="">-- Sem Equipa (Geral) --</option>
                                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                    ) : (
                        <div className="flex items-center text-xs text-gray-500 italic pt-6 bg-gray-800/30 px-3 rounded border border-gray-700">
                           A equipa será atribuída automaticamente pela triagem técnica.
                        </div>
                    )}
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Assunto</label>
                    <input type="text" name="title" value={formData.title} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.title ? 'border-red-500' : 'border-gray-600'}`} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Descrição do Problema</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} rows={4} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.description ? 'border-red-500' : 'border-gray-600'}`} placeholder="Descreva o problema..."></textarea>
                </div>
                
                <div className="flex justify-end gap-4 pt-4 border-t border-gray-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary">Salvar</button>
                </div>
            </form>
        </Modal>
    );
};