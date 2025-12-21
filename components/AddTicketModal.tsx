
import React, { useState, useEffect, useMemo } from 'react';
import Math from 'react'; // Apenas para garantir que imports não quebrem nada
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
    
    const [formData, setFormData] = useState<any>({
        title: '',
        description: '',
        status: 'Pedido',
        category: 'Geral',
        impact_criticality: 'Baixa',
        request_date: new Date().toISOString(),
        collaborator_id: currentUser?.id || '',
        entidade_id: currentUser?.entidade_id || '', 
        team_id: '',
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

    // Pedido 1: Resolver nome da Localização com detecção de RLS
    const resolvedLocationName = useMemo(() => {
        if (canEditAdvanced && !ticketToEdit) return ""; 
        
        const instId = currentUser?.instituicao_id;
        const entId = currentUser?.entidade_id;

        const inst = instituicoes.find(i => i.id === instId);
        const ent = entidades.find(e => e.id === entId);
        
        if (inst && ent) return `${inst.name} > ${ent.name}`;
        if (inst) return inst.name;
        if (ent) return ent.name;

        // Caso o ID exista mas o objeto não esteja no array (Provável RLS)
        if (instId) return "Localização Identificada (Nome em Sincronização...)";
        
        return "Localização não definida no perfil";
    }, [currentUser, entidades, instituicoes, canEditAdvanced, ticketToEdit]);

    // Filtrar entidades pela instituição do utilizador se não for admin global
    const availableEntidades = useMemo(() => {
        if (isSuperAdmin) return entidades;
        if (!currentUser?.instituicao_id) return [];
        return entidades.filter(e => e.instituicao_id === currentUser.instituicao_id);
    }, [entidades, currentUser, isSuperAdmin]);

    // Resolver equipamentos do utilizador selecionado
    const userEquipment = useMemo(() => {
        const userId = formData.collaborator_id;
        if (!userId) return [];
        
        const activeAssignedEqIds = new Set(
            assignments
                .filter(a => a.collaborator_id === userId && !a.return_date)
                .map(a => a.equipment_id)
        );
        
        return equipment
            .filter(e => activeAssignedEqIds.has(e.id))
            .sort((a, b) => a.description.localeCompare(b.description));
    }, [formData.collaborator_id, equipment, assignments]);

    // Resolver licenças de software instaladas nos equipamentos do utilizador
    const userLicenses = useMemo(() => {
        const userId = formData.collaborator_id;
        if (!userId || userEquipment.length === 0) return [];
        
        const activeEqIds = new Set(userEquipment.map(e => e.id));
        const activeLicIds = new Set(
            licenseAssignments
                .filter(la => activeEqIds.has(la.equipment_id) && !la.return_date)
                .map(la => la.software_license_id)
        );
        
        return softwareLicenses
            .filter(lic => activeLicIds.has(lic.id))
            .sort((a, b) => (a.product_name || '').localeCompare(b.product_name || ''));
    }, [formData.collaborator_id, userEquipment, softwareLicenses, licenseAssignments]);

    // Lógica de técnicos por equipa
    const filteredTechnicians = useMemo(() => {
        if (!formData.team_id) {
            return [];
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
            
            // Forçar contexto do utilizador logado para utilizadores sem permissão técnica
            if (!ticketToEdit && !canEditAdvanced) {
                finalData.status = 'Pedido';
                finalData.collaborator_id = currentUser?.id;
                finalData.entidade_id = currentUser?.entidade_id || null;
            }
            
            // Limpeza de campos de ativos baseada na seleção
            if (assetType === 'none') {
                finalData.equipment_id = null;
                finalData.software_license_id = null;
            } else if (assetType === 'hardware') {
                finalData.software_license_id = null;
            } else {
                finalData.equipment_id = null;
            }

            await onSave(finalData);
            onClose();
        } finally { 
            setIsSaving(false); 
        }
    };

    return (
        <Modal title={ticketToEdit ? `Editar Ticket #${ticketToEdit.id.substring(0,8)}` : "Abrir Novo Ticket de Suporte"} onClose={onClose} maxWidth="max-w-4xl">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-1">
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
                        <label className="block text-sm font-medium text-gray-400 mb-1 flex items-center gap-2">
                            <FaBuilding className="text-brand-secondary" /> Entidade / Localização
                        </label>
                        {canEditAdvanced ? (
                            <select 
                                value={formData.entidade_id || ''} 
                                onChange={e => setFormData({...formData, entidade_id: e.target.value})} 
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm"
                                required
                            >
                                <option value="">-- Selecione Local --</option>
                                {availableEntidades.map(ent => <option key={ent.id} value={ent.id}>{ent.name}</option>)}
                            </select>
                        ) : (
                            <div className="w-full bg-gray-800 border border-gray-700 text-gray-400 rounded p-2 text-sm font-semibold truncate" title={resolvedLocationName}>
                                {resolvedLocationName}
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-4 border border-gray-700 rounded-lg p-3 bg-gray-900/30">
                    <div className="flex justify-between items-center">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <FaUserTie className="text-brand-secondary" /> Contexto do Requerente
                        </label>
                        {canEditAdvanced && (
                            <select 
                                value={formData.collaborator_id} 
                                onChange={e => setFormData({...formData, collaborator_id: e.target.value})} 
                                className="bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 text-xs"
                            >
                                <option value="">-- Selecione Requerente --</option>
                                {collaborators.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                            </select>
                        )}
                        {!canEditAdvanced && (
                             <div className="text-sm font-bold text-white flex items-center gap-2">
                                <FaUserTie size={14} className="text-brand-secondary"/> {currentUser?.full_name}
                             </div>
                        )}
                    </div>

                    <div className="bg-blue-900/10 border border-blue-500/20 rounded p-4 space-y-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <label className="block text-[10px] font-bold text-blue-400 uppercase mb-2 flex items-center gap-1">
                                    <FaLaptop size={10} /> Vincular Ativo de Origem
                                </label>
                                <div className="flex gap-2 mb-3">
                                    <button 
                                        type="button" 
                                        onClick={() => setAssetType('none')}
                                        disabled={!canEditAdvanced}
                                        className={`flex-1 py-1 text-[10px] rounded border transition-all ${assetType === 'none' ? 'bg-blue-600 border-blue-400 text-white' : 'bg-gray-800 border-gray-700 text-gray-500'} ${!canEditAdvanced ? 'cursor-default opacity-80' : ''}`}
                                    >Nenhum</button>
                                    <button 
                                        type="button" 
                                        onClick={() => setAssetType('hardware')}
                                        disabled={!canEditAdvanced}
                                        className={`flex-1 py-1 text-[10px] rounded border transition-all ${assetType === 'hardware' ? 'bg-blue-600 border-blue-400 text-white' : 'bg-gray-800 border-gray-700 text-gray-500'} ${!canEditAdvanced ? 'cursor-default opacity-80' : ''}`}
                                    >Hardware</button>
                                    <button 
                                        type="button" 
                                        onClick={() => setAssetType('software')}
                                        disabled={!canEditAdvanced}
                                        className={`flex-1 py-1 text-[10px] rounded border transition-all ${assetType === 'software' ? 'bg-blue-600 border-blue-400 text-white' : 'bg-gray-800 border-gray-700 text-gray-500'} ${!canEditAdvanced ? 'cursor-default opacity-80' : ''}`}
                                    >Software</button>
                                </div>

                                {assetType === 'hardware' && (
                                    <select 
                                        value={formData.equipment_id || ''} 
                                        onChange={e => setFormData({...formData, equipment_id: e.target.value})}
                                        disabled={!canEditAdvanced}
                                        className="w-full bg-gray-800 border border-blue-500/30 text-white rounded p-2 text-xs disabled:opacity-80"
                                    >
                                        <option value="">-- Selecione Equipamento --</option>
                                        {userEquipment.map(eq => <option key={eq.id} value={eq.id}>{eq.description} (SN: {eq.serial_number})</option>)}
                                        {userEquipment.length === 0 && <option disabled>Nenhum equipamento atribuído</option>}
                                    </select>
                                )}

                                {assetType === 'software' && (
                                    <select 
                                        value={formData.software_license_id || ''} 
                                        onChange={e => setFormData({...formData, software_license_id: e.target.value})}
                                        disabled={!canEditAdvanced}
                                        className="w-full bg-gray-800 border border-blue-500/30 text-white rounded p-2 text-xs disabled:opacity-80"
                                    >
                                        <option value="">-- Selecione Licença/Software --</option>
                                        {userLicenses.map(lic => <option key={lic.id} value={lic.id}>{lic.product_name}</option>)}
                                        {userLicenses.length === 0 && <option disabled>Nenhuma licença atribuída</option>}
                                    </select>
                                )}
                            </div>

                            <div className="flex-1 border-l border-blue-500/20 pl-4 hidden sm:block">
                                <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Informação de Referência</p>
                                <div className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar">
                                    {!formData.collaborator_id ? (
                                        <p className="text-[10px] text-gray-600 italic">Selecione um requerente para ver ativos.</p>
                                    ) : (
                                        <>
                                            <p className="text-[10px] text-gray-400 font-bold">Resumo de Ativos em Uso:</p>
                                            <p className="text-[10px] text-gray-500">{userEquipment.length} Equipamentos</p>
                                            <p className="text-[10px] text-gray-500">{userLicenses.length} Licenças de Software</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
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
                                {filteredTechnicians.length === 0 ? (
                                    <option value="">{formData.team_id ? "-- Nenhum técnico disponível nesta equipa --" : "-- Selecione uma equipa primeiro --"}</option>
                                ) : (
                                    <>
                                        <option value="">-- Não Atribuído (Fila de Equipa) --</option>
                                        {filteredTechnicians.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                                    </>
                                )}
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
