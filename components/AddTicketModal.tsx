
import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { Ticket, Entidade, Collaborator, Team, TicketCategoryItem, SecurityIncidentTypeItem, CriticalityLevel, TicketStatus, Instituicao } from '../types';
import { FaShieldAlt, FaSpinner } from './common/Icons';

interface AddTicketModalProps {
    onClose: () => void;
    onSave: (ticket: any) => Promise<any>;
    ticketToEdit?: Ticket | null;
    escolasDepartamentos: Entidade[];
    // Fix: Added instituicoes prop
    instituicoes: Instituicao[];
    collaborators: Collaborator[];
    teams: Team[];
    currentUser: Collaborator | null;
    categories: TicketCategoryItem[];
    securityIncidentTypes?: SecurityIncidentTypeItem[];
}

export const AddTicketModal: React.FC<AddTicketModalProps> = ({ onClose, onSave, ticketToEdit, collaborators, teams, currentUser, categories, securityIncidentTypes = [] }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState<any>({
        title: '',
        description: '',
        status: 'Pedido',
        category: 'Geral',
        impact_criticality: 'Baixa',
        request_date: new Date().toISOString(),
        collaborator_id: currentUser?.id,
        team_id: '',
        technician_id: '',
        security_incident_type: ''
    });

    useEffect(() => {
        if (ticketToEdit) setFormData({ ...ticketToEdit });
    }, [ticketToEdit]);

    const isSecurity = categories.find(c => c.name === formData.category)?.is_security || (formData.category || '').toLowerCase().includes('segurança');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSave(formData);
            onClose();
        } finally { setIsSaving(false); }
    };

    return (
        <Modal title={ticketToEdit ? "Editar Ticket" : "Abrir Ticket"} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Categoria</label>
                        <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2">
                            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Impacto (NIS2)</label>
                        <select value={formData.impact_criticality} onChange={e => setFormData({...formData, impact_criticality: e.target.value})} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2">
                            {Object.values(CriticalityLevel).map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                    </div>
                </div>

                {isSecurity && (
                    <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-lg space-y-3">
                        <label className="block text-xs font-bold text-red-400 uppercase">Tipo de Incidente de Segurança</label>
                        <select value={formData.security_incident_type} onChange={e => setFormData({...formData, security_incident_type: e.target.value})} className="w-full bg-gray-800 border border-red-500/30 text-white rounded p-2">
                            <option value="">-- Selecione --</option>
                            {securityIncidentTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                        </select>
                    </div>
                )}

                <div>
                    <label className="block text-sm text-gray-400 mb-1">Assunto</label>
                    <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2" required />
                </div>
                <div>
                    <label className="block text-sm text-gray-400 mb-1">Descrição Detalhada</label>
                    <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={4} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2" required />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded">Cancelar</button>
                    <button type="submit" disabled={isSaving} className="px-4 py-2 bg-brand-primary text-white rounded flex items-center gap-2">
                        {isSaving ? <FaSpinner className="animate-spin" /> : null} Gravar Ticket
                    </button>
                </div>
            </form>
        </Modal>
    );
};
