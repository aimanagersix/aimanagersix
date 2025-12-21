
import React, { useState, useEffect, useMemo } from 'react';
import Modal from './common/Modal';
import { Ticket, Entidade, Collaborator, Team, TeamMember, TicketCategoryItem, SecurityIncidentTypeItem, CriticalityLevel, TicketStatus, Instituicao, ModuleKey, PermissionAction, Equipment, Assignment, SoftwareLicense, LicenseAssignment, UserRole } from '../types';
import { FaShieldAlt, FaSpinner, FaHistory, FaExclamationTriangle, FaUsers, FaUserTie, FaBuilding, FaLaptop, FaKey } from './common/Icons';

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
    equipment: Equipment[];
    assignments: Assignment[];
    softwareLicenses: SoftwareLicense[];
    licenseAssignments: LicenseAssignment[];
}

export const AddTicketModal: React.FC<AddTicketModalProps> = ({ 
    onClose, onSave, ticketToEdit, collaborators, teams, teamMembers = [], currentUser, categories, securityIncidentTypes = [], checkPermission, escolasDepartamentos: entidades, instituicoes,
    equipment, assignments, softwareLicenses, licenseAssignments
}) => {
    const [isSaving, setIsSaving] = useState(false);
    const [assetType, setAssetType] = useState<'none' | 'hardware' | 'software'>('none');
    
    const triagemTeam = useMemo(() => teams.find(t => t.name === 'Triagem'), [teams]);

    const [formData, setFormData] = useState<any>({
        title: '',
        description: '',
        status: 'Pedido',
        category: 'Geral',
        impact_criticality: 'Baixa',
        request_date: new Date().toISOString(),
        collaborator_id: currentUser?.id || '',
        entidade_id: currentUser?.entidade_id || '', 
        instituicao_id: currentUser?.instituicao_id || '', 
        team_id: triagemTeam?.id || '',
        technician_id: '',
        security_incident_type: '',
        equipment_id: '',
        software_license_id: ''
    });

    const canEditAdvanced = checkPermission('tickets', 'edit');
    const isSuperAdmin = currentUser?.role === UserRole.SuperAdmin;

    useEffect(() => {
        if (ticketToEdit) {
            setFormData({ ...ticketToEdit });
            if (ticketToEdit.equipment_id) setAssetType('hardware');
            else if (ticketToEdit.software_license_id) setAssetType('software');
        }
    }, [ticketToEdit]);

    const resolvedLocationName = useMemo(() => {
        const instId = formData.instituicao_id || currentUser?.instituicao_id;
        const entId = formData.entidade_id || currentUser?.entidade_id;
        const inst = instituicoes.find(i => i.id === instId);
        const ent = entidades.find(e => e.id === entId);
        if (inst && ent) return `${inst.name} > ${ent.name}`;
        if (inst) return inst.name;
        if (ent) return ent.name;
        return "Localização não definida";
    }, [currentUser, entidades, instituicoes, formData.instituicao_id, formData.entidade_id]);

    const userEquipment = useMemo(() => {
        const userId = formData.collaborator_id;
        if (!userId) return [];
        const activeAssignedEqIds = new Set(assignments.filter(a => String(a.collaborator_id || '').toLowerCase() === String(userId).toLowerCase() && !a.return_date).map(a => a.equipment_id));
        return equipment.filter(e => activeAssignedEqIds.has(e.id)).sort((a, b) => (a.description || '').localeCompare(b.description || ''));
    }, [formData.collaborator_id, equipment, assignments]);

    const userLicenses = useMemo(() => {
        const userId = formData.collaborator_id;
        if (!userId || userEquipment.length === 0) return [];
        const activeEqIds = new Set(userEquipment.map(e => e.id));
        const activeLicIds = new Set(licenseAssignments.filter(la => activeEqIds.has(la.equipment_id) && !la.return_date).map(la => la.software_license_id));
        return softwareLicenses.filter(lic => activeLicIds.has(lic.id)).sort((a, b) => (a.product_name || '').localeCompare(b.product_name || ''));
    }, [formData.collaborator_id, userEquipment, softwareLicenses, licenseAssignments]);

    const filteredTechnicians = useMemo(() => {
        if (!formData.team_id) return [];
        const memberIds = new Set(teamMembers.filter(tm => tm.team_id === formData.team_id).map(tm => tm.collaborator_id));
        return collaborators.filter(c => memberIds.has(c.id)).sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
    }, [formData.team_id, collaborators, teamMembers]);

    const currentIsSecurity = categories.find(c => c.name === formData.category)?.is_security;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const finalData = { ...formData };
            if (currentUser?.instituicao_id && !isSuperAdmin) finalData.instituicao_id = currentUser.instituicao_id;
            if (!currentIsSecurity) finalData.security_incident_type = null;
            if (!ticketToEdit && !canEditAdvanced) {
                finalData.status = 'Pedido';
                finalData.category = 'Geral';
                finalData.team_id = triagemTeam?.id || null;
                finalData.collaborator_id = currentUser?.id;
                finalData.entidade_id = currentUser?.entidade_id || null;
            }
            if (assetType === 'none') { finalData.equipment_id = null; finalData.software_license_id = null; }
            else if (assetType === 'hardware') finalData.software_license_id = null;
            else finalData.equipment_id = null;

            await onSave(finalData);
            onClose();
        } catch (err: any) {
            alert("Erro ao gravar ticket: " + (err.message || "Erro de rede."));
        } finally { setIsSaving(false); }
    };

    return (
        <Modal title={ticketToEdit ? `Editar Ticket #${ticketToEdit.id.substring(0,8)}` : "Abrir Novo Ticket de Suporte"} onClose={onClose} maxWidth="max-w-4xl">
            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto max-h-[75vh] pr-2 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Categoria do Pedido</label>
                        {canEditAdvanced ? (
                            <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm focus:ring-brand-primary">
                                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                        ) : (
                            <div className="w-full bg-gray-800 border border-gray-700 text-gray-400 rounded p-2 text-sm">Geral (Triagem)</div>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1 flex items-center gap-2"><FaHistory className="text-brand-secondary" /> Estado Atual</label>
                        {canEditAdvanced ? (
                            <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full bg-gray-800 border border-gray-600 text-white rounded p-2 text-sm font-bold text-brand-secondary">
                                <option value="Pedido">Pedido (Novo)</option>
                                <option value="Em progresso">Em progresso</option>
                                <option value="Finalizado">Finalizado</option>
                                <option value="Cancelado">Cancelado</option>
                            </select>
                        ) : (
                            <div className="w-full bg-gray-800 border border-gray-700 text-brand-secondary rounded p-2 text-sm font-bold">Pedido</div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-gray-400 mb-1">Assunto / Título Curto</label>
                        <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm" placeholder="Ex: Falha no acesso à VPN" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1 flex items-center gap-2"><FaBuilding className="text-brand-secondary" /> Entidade / Localização</label>
                        <div className="w-full bg-gray-800 border border-gray-700 text-gray-400 rounded p-2 text-sm font-semibold truncate">{resolvedLocationName}</div>
                    </div>
                </div>

                <div className="space-y-4 border border-gray-700 rounded-lg p-3 bg-gray-900/30">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2"><FaUserTie className="text-brand-secondary" /> Requerente: {currentUser?.full_name}</label>
                    <div className="bg-blue-900/10 border border-blue-500/20 rounded p-4">
                        <label className="block text-[10px] font-bold text-blue-400 uppercase mb-2 flex items-center gap-1"><FaLaptop size={10} /> Vincular Ativo</label>
                        <div className="flex gap-2 mb-3">
                            {['none', 'hardware', 'software'].map(t => (
                                <button key={t} type="button" onClick={() => setAssetType(t as any)} className={`flex-1 py-1 text-[10px] rounded border transition-all ${assetType === t ? 'bg-blue-600 border-blue-400 text-white' : 'bg-gray-800 border-gray-700 text-gray-500'}`}>{t === 'none' ? 'Nenhum' : t.charAt(0).toUpperCase() + t.slice(1)}</button>
                            ))}
                        </div>
                        {assetType === 'hardware' && (
                            <select value={formData.equipment_id || ''} onChange={e => setFormData({...formData, equipment_id: e.target.value})} className="w-full bg-gray-800 border border-blue-500/30 text-white rounded p-2 text-xs">
                                <option value="">-- Selecione Equipamento --</option>
                                {userEquipment.map(eq => <option key={eq.id} value={eq.id}>{eq.description} (SN: {eq.serial_number})</option>)}
                            </select>
                        )}
                        {assetType === 'software' && (
                            <select value={formData.software_license_id || ''} onChange={e => setFormData({...formData, software_license_id: e.target.value})} className="w-full bg-gray-800 border border-blue-500/30 text-white rounded p-2 text-xs">
                                <option value="">-- Selecione Software --</option>
                                {userLicenses.map(lic => <option key={lic.id} value={lic.id}>{lic.product_name}</option>)}
                            </select>
                        )}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Descrição Detalhada do Problema</label>
                    <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={4} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm" placeholder="Descreva o que aconteceu..." required />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-700 pt-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1 flex items-center gap-2"><FaUsers className="text-blue-400" /> Atribuir a Equipa</label>
                        {canEditAdvanced ? (
                            <select value={formData.team_id || ''} onChange={e => setFormData({...formData, team_id: e.target.value})} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm">
                                <option value="">-- Pendente Atribuição --</option>
                                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        ) : (
                            <div className="w-full bg-gray-800 border border-gray-700 text-gray-400 rounded p-2 text-sm">Triagem</div>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1 flex items-center gap-2"><FaUserTie className="text-green-400" /> Técnico Responsável</label>
                        {canEditAdvanced ? (
                            <select value={formData.technician_id || ''} onChange={e => setFormData({...formData, technician_id: e.target.value})} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm">
                                <option value="">-- Não Atribuído (Fila de Equipa) --</option>
                                {filteredTechnicians.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                            </select>
                        ) : (
                            <div className="w-full bg-gray-800 border border-gray-700 text-gray-400 rounded p-2 text-sm">Não Atribuído</div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-500">Cancelar</button>
                    <button type="submit" disabled={isSaving} className="px-6 py-2 bg-brand-primary text-white rounded text-sm font-bold hover:bg-brand-secondary flex items-center gap-2 shadow-lg">
                        {isSaving ? <FaSpinner className="animate-spin" /> : null} {ticketToEdit ? 'Guardar' : 'Abrir Ticket'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
