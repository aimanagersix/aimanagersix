
import React, { useState, useEffect, useMemo } from 'react';
import Modal from './common/Modal';
import { Ticket, Entidade, Collaborator, Team, TeamMember, TicketCategoryItem, SecurityIncidentTypeItem, CriticalityLevel, TicketStatus, Instituicao, ModuleKey, PermissionAction } from '../types';
import { FaShieldAlt, FaSpinner, FaHistory, FaExclamationTriangle, FaUsers, FaUserTie } from './common/Icons';

interface AddTicketModalProps {
    onClose: () => void;
    onSave: (ticket: any) => Promise<any>;
    ticketToEdit?: Ticket | null;
    escolasDepartamentos: Entidade[];
    instituicoes: Instituicao[];
    collaborators: Collaborator[];
    teams: Team[];
    teamMembers: TeamMember[];
    currentUser: Collaborator | null;
    categories: TicketCategoryItem[];
    securityIncidentTypes?: SecurityIncidentTypeItem[];
    checkPermission: (module: ModuleKey, action: PermissionAction) => boolean;
}

export const AddTicketModal: React.FC<AddTicketModalProps> = ({ 
    onClose, onSave, ticketToEdit, collaborators, teams, teamMembers = [], currentUser, categories, securityIncidentTypes = [], checkPermission 
}) => {
    const [isSaving, setIsSaving] = useState(false);
    
    const [formData, setFormData] = useState<any>({
        title: '',
        description: '',
        status: 'Pedido',
        category: 'Geral',
        impact_criticality: 'Baixa',
        request_date: new Date().toISOString(),
        collaborator_id: currentUser?.id || '',
        team_id: '',
        technician_id: '',
        security_incident_type: ''
    });

    const canEditAdvanced = checkPermission('tickets', 'edit');

    useEffect(() => {
        if (ticketToEdit) {
            setFormData({ ...ticketToEdit });
        }
    }, [ticketToEdit]);

    // Filtrar técnicos baseada na equipa selecionada
    const filteredTechnicians = useMemo(() => {
        if (!formData.team_id) {
            return collaborators.sort((a, b) => a.full_name.localeCompare(b.full_name));
        }
        const memberIds = new Set(
            teamMembers
                .filter(tm => tm.team_id === formData.team_id)
                .map(tm => tm.collaborator_id)
        );
        return collaborators
            .filter(c => memberIds.has(c.id))
            .sort((a, b) => a.full_name.localeCompare(b.full_name));
    }, [formData.team_id, collaborators, teamMembers]);

    useEffect(() => {
        if (formData.team_id && formData.technician_id) {
            const isValid = filteredTechnicians.some(t => t.id === formData.technician_id);
            if (!isValid) {
                setFormData((prev: any) => ({ ...prev, technician_id: '' }));
            }
        }
    }, [formData.team_id, filteredTechnicians]);

    const isSecurityCategory = (categoryName: string) => {
        const cat = categories.find(c => c.name === categoryName);
        return cat?.is_security || (categoryName || '').toLowerCase().includes('segurança');
    };

    const currentIsSecurity = isSecurityCategory(formData.category);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const finalData = { ...formData };
            if (!currentIsSecurity) {
                finalData.security_incident_type = null;
            }
            // Para novos tickets de utilizadores básicos, garantir o estado "Pedido"
            if (!ticketToEdit && !canEditAdvanced) {
                finalData.status = 'Pedido';
            }
            await onSave(finalData);
            onClose();
        } finally { 
            setIsSaving(false); 
        }
    };

    return (
        <Modal title={ticketToEdit ? `Editar Ticket #${ticketToEdit.id.substring(0,8)}` : "Abrir Novo Ticket de Suporte"} onClose={onClose} maxWidth="max-w-3xl">
            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto max-h-[75vh] pr-2 custom-scrollbar">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Categoria do Pedido</label>
                        {canEditAdvanced ? (
                            <select 
                                value={formData.category} 
                                onChange={e => setFormData({...formData, category: e.target.value})} 
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm focus:ring-brand-primary"
                            >
                                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                        ) : (
                            <div className="w-full bg-gray-800 border border-gray-700 text-gray-400 rounded p-2 text-sm">
                                {formData.category || 'Geral'}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1 flex items-center gap-2">
                             <FaHistory className="text-brand-secondary" /> Estado Atual
                        </label>
                        {canEditAdvanced ? (
                            <select 
                                value={formData.status} 
                                onChange={e => setFormData({...formData, status: e.target.value})} 
                                className="w-full bg-gray-800 border border-gray-600 text-white rounded p-2 text-sm font-bold text-brand-secondary"
                            >
                                <option value="Pedido">Pedido (Novo)</option>
                                <option value="Em progresso">Em progresso</option>
                                <option value="Finalizado">Finalizado</option>
                                <option value="Cancelado">Cancelado</option>
                            </select>
                        ) : (
                            <div className="w-full bg-gray-800 border border-gray-700 text-brand-secondary rounded p-2 text-sm font-bold">
                                {formData.status}
                            </div>
                        )}
                    </div>
                </div>

                {currentIsSecurity && (
                    <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-lg space-y-4 animate-fade-in">
                        <h4 className="text-red-400 font-bold text-xs uppercase flex items-center gap-2">
                            <FaShieldAlt /> Detalhes do Incidente (NIS2 Compliance)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Natureza da Ameaça</label>
                                {canEditAdvanced ? (
                                    <select 
                                        value={formData.security_incident_type || ''} 
                                        onChange={e => setFormData({...formData, security_incident_type: e.target.value})} 
                                        className="w-full bg-gray-800 border border-red-500/30 text-white rounded p-2 text-sm"
                                        required={currentIsSecurity}
                                    >
                                        <option value="">-- Selecione o Tipo --</option>
                                        {securityIncidentTypes?.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                                    </select>
                                ) : (
                                    <div className="w-full bg-gray-800 border border-red-900/30 text-gray-400 rounded p-2 text-sm">
                                        {formData.security_incident_type || 'Não especificado'}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Criticidade do Impacto</label>
                                {canEditAdvanced ? (
                                    <select 
                                        value={formData.impact_criticality || 'Baixa'} 
                                        onChange={e => setFormData({...formData, impact_criticality: e.target.value})} 
                                        className="w-full bg-gray-800 border border-red-500/30 text-white rounded p-2 text-sm"
                                    >
                                        {Object.values(CriticalityLevel).map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                ) : (
                                    <div className="w-full bg-gray-800 border border-red-900/30 text-gray-400 rounded p-2 text-sm">
                                        {formData.impact_criticality}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Assunto / Título Curto</label>
                    <input 
                        type="text" 
                        value={formData.title} 
                        onChange={e => setFormData({...formData, title: e.target.value})} 
                        className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm" 
                        placeholder="Ex: Falha no acesso à VPN"
                        required 
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Descrição Detalhada do Problema</label>
                    <textarea 
                        value={formData.description} 
                        onChange={e => setFormData({...formData, description: e.target.value})} 
                        rows={4} 
                        className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm" 
                        placeholder="Descreva o que aconteceu..."
                        required 
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-700 pt-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1 flex items-center gap-2">
                            <FaUsers className="text-blue-400" /> Atribuir a Equipa
                        </label>
                        {canEditAdvanced ? (
                            <select 
                                value={formData.team_id || ''} 
                                onChange={e => setFormData({...formData, team_id: e.target.value})} 
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm"
                            >
                                <option value="">-- Pendente Atribuição --</option>
                                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        ) : (
                            <div className="w-full bg-gray-800 border border-gray-700 text-gray-400 rounded p-2 text-sm">
                                {teams.find(t => t.id === formData.team_id)?.name || 'Pendente'}
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1 flex items-center gap-2">
                            <FaUserTie className="text-green-400" /> Técnico Responsável
                        </label>
                        {canEditAdvanced ? (
                            <select 
                                value={formData.technician_id || ''} 
                                onChange={e => setFormData({...formData, technician_id: e.target.value})} 
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm disabled:opacity-50"
                            >
                                <option value="">-- Não Atribuído (Fila de Equipa) --</option>
                                {filteredTechnicians.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                            </select>
                        ) : (
                            <div className="w-full bg-gray-800 border border-gray-700 text-gray-400 rounded p-2 text-sm">
                                {collaborators.find(c => c.id === formData.technician_id)?.full_name || 'Não Atribuído'}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-500">Cancelar</button>
                    <button 
                        type="submit" 
                        disabled={isSaving} 
                        className="px-6 py-2 bg-brand-primary text-white rounded text-sm font-bold hover:bg-brand-secondary flex items-center gap-2 shadow-lg disabled:opacity-50"
                    >
                        {isSaving ? <FaSpinner className="animate-spin" /> : null}
                        {ticketToEdit ? 'Guardar Alterações' : 'Abrir Ticket'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
