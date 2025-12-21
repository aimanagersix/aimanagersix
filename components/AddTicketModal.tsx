
import React, { useState, useEffect, useMemo } from 'react';
import Modal from './common/Modal';
import { Ticket, Entidade, Collaborator, Team, TeamMember, TicketCategoryItem, SecurityIncidentTypeItem, CriticalityLevel, TicketStatus, Instituicao, ModuleKey, PermissionAction, Equipment, Assignment, SoftwareLicense, LicenseAssignment, UserRole } from '../types';
import { FaShieldAlt, FaSpinner, FaHistory, FaExclamationTriangle, FaUsers, FaUserTie, FaBuilding, FaLaptop, FaKey, FaBoxOpen, FaExternalLinkAlt, FaInfoCircle } from './common/Icons';

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
    onViewEquipment?: (equipment: Equipment) => void;
    onViewLicense?: (license: SoftwareLicense) => void;
}

export const AddTicketModal: React.FC<AddTicketModalProps> = ({ 
    onClose, onSave, ticketToEdit, collaborators, teams, teamMembers = [], currentUser, categories, securityIncidentTypes = [], checkPermission, escolasDepartamentos: entidades, instituicoes,
    equipment, assignments, softwareLicenses, licenseAssignments,
    onViewEquipment, onViewLicense
}) => {
    const [isSaving, setIsSaving] = useState(false);
    const isEditMode = !!ticketToEdit;
    
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
        }
    }, [ticketToEdit]);

    const resolvedLocationName = useMemo(() => {
        const instId = formData.instituicao_id || (ticketToEdit ? ticketToEdit.instituicao_id : currentUser?.instituicao_id);
        const entId = formData.entidade_id || (ticketToEdit ? ticketToEdit.entidade_id : currentUser?.entidade_id);
        
        const inst = instituicoes.find(i => i.id === instId);
        const ent = entidades.find(e => e.id === entId);
        
        if (inst && ent) return `${inst.name} > ${ent.name}`;
        if (inst) return inst.name;
        if (ent) return ent.name;
        return "Localização de Origem";
    }, [currentUser, entidades, instituicoes, formData.instituicao_id, formData.entidade_id, ticketToEdit]);

    const requesterAssets = useMemo(() => {
        const userId = formData.collaborator_id;
        if (!userId) return { equipment: [], licenses: [] };
        
        const activeAssignedEqIds = new Set(assignments.filter(a => a.collaborator_id === userId && !a.return_date).map(a => a.equipment_id));
        const userEq = equipment.filter(e => activeAssignedEqIds.has(e.id)).sort((a, b) => (a.description || '').localeCompare(b.description || ''));
        
        const activeEqIds = new Set(userEq.map(e => e.id));
        const activeLicIds = new Set(licenseAssignments.filter(la => activeEqIds.has(la.equipment_id) && !la.return_date).map(la => la.software_license_id));
        const userLic = softwareLicenses.filter(lic => activeLicIds.has(lic.id)).sort((a, b) => (a.product_name || '').localeCompare(b.product_name || ''));
        
        return { equipment: userEq, licenses: userLic };
    }, [formData.collaborator_id, equipment, assignments, softwareLicenses, licenseAssignments]);

    const filteredTechnicians = useMemo(() => {
        if (!formData.team_id) return [];
        const memberIds = new Set(teamMembers.filter(tm => tm.team_id === formData.team_id).map(tm => tm.collaborator_id));
        return collaborators.filter(c => memberIds.has(c.id)).sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
    }, [formData.team_id, collaborators, teamMembers]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const finalData = { ...formData };
            if (currentUser?.instituicao_id && !isSuperAdmin) finalData.instituicao_id = currentUser.instituicao_id;
            
            if (!isEditMode && !canEditAdvanced) {
                finalData.status = 'Pedido';
                finalData.category = 'Geral';
                finalData.team_id = triagemTeam?.id || null;
                finalData.collaborator_id = currentUser?.id;
                finalData.entidade_id = currentUser?.entidade_id || null;
            }

            await onSave(finalData);
            onClose();
        } catch (err: any) {
            alert("Erro ao gravar ticket: " + (err.message || "Erro de rede."));
        } finally { setIsSaving(false); }
    };

    return (
        <Modal title={isEditMode ? `Ticket #${ticketToEdit?.id.substring(0,8)}` : "Abrir Novo Ticket de Suporte"} onClose={onClose} maxWidth="max-w-4xl">
            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto max-h-[75vh] pr-2 custom-scrollbar">
                
                <div className="bg-gray-800/40 p-4 rounded-lg border border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                            <FaBuilding className="text-brand-secondary" /> Localização / Entidade
                        </label>
                        <div className="w-full bg-gray-900 border border-gray-600 text-gray-400 rounded p-2 text-sm font-semibold truncate">
                            {resolvedLocationName}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                            <FaUserTie className="text-brand-secondary" /> Requerente
                        </label>
                        <div className="w-full bg-gray-900 border border-gray-600 text-gray-400 rounded p-2 text-sm font-semibold">
                            {collaborators.find(c => c.id === formData.collaborator_id)?.full_name || "Utilizador Externo"}
                        </div>
                    </div>
                </div>

                <div className="bg-blue-900/10 border border-blue-500/20 rounded-lg p-4 animate-fade-in">
                    <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <FaInfoCircle /> Contexto do Requerente (Inventário Ativo)
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <p className="text-[10px] font-black text-gray-500 uppercase">Equipamentos ({requesterAssets.equipment.length})</p>
                            {requesterAssets.equipment.length > 0 ? requesterAssets.equipment.map(eq => (
                                <div key={eq.id} className="flex items-center justify-between bg-gray-800 p-2 rounded border border-gray-700 hover:border-brand-primary transition-all group">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-white truncate">{eq.description}</p>
                                        <p className="text-[10px] text-gray-500 font-mono">SN: {eq.serial_number}</p>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => { onViewEquipment?.(eq); }}
                                        className="p-1.5 bg-gray-700 text-blue-400 rounded hover:bg-blue-500 hover:text-white transition-colors"
                                        title="Abrir Ficha Técnica"
                                    >
                                        <FaExternalLinkAlt size={10} />
                                    </button>
                                </div>
                            )) : <p className="text-xs text-gray-600 italic">Sem equipamentos.</p>}
                        </div>

                        <div className="space-y-2">
                            <p className="text-[10px] font-black text-gray-500 uppercase">Licenças Software ({requesterAssets.licenses.length})</p>
                            {requesterAssets.licenses.length > 0 ? requesterAssets.licenses.map(lic => (
                                <div key={lic.id} className="flex items-center justify-between bg-gray-800 p-2 rounded border border-gray-700 hover:border-brand-primary transition-all group">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-white truncate">{lic.product_name}</p>
                                        <p className="text-[10px] text-gray-500 font-mono truncate">{lic.license_key}</p>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => { onViewLicense?.(lic); }}
                                        className="p-1.5 bg-gray-700 text-yellow-400 rounded hover:bg-yellow-500 hover:text-white transition-colors"
                                        title="Ver Licença"
                                    >
                                        <FaExternalLinkAlt size={10} />
                                    </button>
                                </div>
                            )) : <p className="text-xs text-gray-600 italic">Sem licenças.</p>}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Categoria</label>
                        {canEditAdvanced ? (
                            <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm focus:ring-brand-primary outline-none">
                                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                        ) : (
                            <div className="w-full bg-gray-900 border border-gray-700 text-gray-400 rounded p-2 text-sm">{formData.category || "Geral"}</div>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1 flex items-center gap-2"><FaHistory className="text-brand-secondary" /> Estado</label>
                        {canEditAdvanced ? (
                            <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full bg-gray-800 border border-gray-600 text-white rounded p-2 text-sm font-bold text-brand-secondary outline-none">
                                <option value="Pedido">Pedido (Novo)</option>
                                <option value="Em progresso">Em progresso</option>
                                <option value="Finalizado">Finalizado</option>
                                <option value="Cancelado">Cancelado</option>
                            </select>
                        ) : (
                            <div className="w-full bg-gray-900 border border-gray-700 text-brand-secondary rounded p-2 text-sm font-bold uppercase">{formData.status}</div>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Assunto / Título</label>
                        <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm" placeholder="Ex: Problema no monitor" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Descrição Detalhada</label>
                        <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={4} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm" placeholder="Descreva o que aconteceu..." required />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-700 pt-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1 flex items-center gap-2"><FaUsers className="text-blue-400" /> Equipa Técnica</label>
                        {canEditAdvanced ? (
                            <select value={formData.team_id || ''} onChange={e => setFormData({...formData, team_id: e.target.value})} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm">
                                <option value="">-- Por atribuir --</option>
                                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        ) : (
                            <div className="w-full bg-gray-900 border border-gray-700 text-gray-400 rounded p-2 text-sm italic">
                                {teams.find(t => t.id === formData.team_id)?.name || "Pendente"}
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1 flex items-center gap-2"><FaUserTie className="text-green-400" /> Técnico Atribuído</label>
                        {canEditAdvanced ? (
                            <select value={formData.technician_id || ''} onChange={e => setFormData({...formData, technician_id: e.target.value})} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm">
                                <option value="">-- Não Atribuído --</option>
                                {filteredTechnicians.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                            </select>
                        ) : (
                            <div className="w-full bg-gray-900 border border-gray-700 text-gray-400 rounded p-2 text-sm italic">
                                {collaborators.find(c => c.id === formData.technician_id)?.full_name || "Não Atribuído"}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-500">Cancelar</button>
                    <button type="submit" disabled={isSaving} className="px-6 py-2 bg-brand-primary text-white rounded text-sm font-bold hover:bg-brand-secondary flex items-center gap-2 shadow-lg">
                        {isSaving ? <FaSpinner className="animate-spin" /> : null} {isEditMode ? 'Guardar Alterações' : 'Submeter Pedido'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
