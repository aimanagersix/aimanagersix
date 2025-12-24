
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Modal from './common/Modal';
import { Ticket, Entidade, Collaborator, Team, TeamMember, TicketCategoryItem, SecurityIncidentTypeItem, CriticalityLevel, TicketStatus, Instituicao, ModuleKey, PermissionAction, Equipment, Assignment, SoftwareLicense, LicenseAssignment, UserRole } from '../types';
import { FaShieldAlt, FaSpinner, FaHistory, FaExclamationTriangle, FaUsers, FaUserTie, FaBuilding, FaLaptop, FaKey, FaBoxOpen, FaExternalLinkAlt, FaInfoCircle, FaCamera, FaTrash, FaPaperclip } from './common/Icons';

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
    const fileInputRef = useRef<HTMLInputElement>(null);
    
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
        software_license_id: '',
        attachments: []
    });

    const canEditAdvanced = checkPermission('tickets', 'edit');
    const isSuperAdmin = currentUser?.role === UserRole.SuperAdmin;

    useEffect(() => {
        if (ticketToEdit) {
            setFormData({ ...ticketToEdit, attachments: ticketToEdit.attachments || [] });
        }
    }, [ticketToEdit]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (!file.type.startsWith('image/')) {
                alert('Apenas são permitidas imagens.');
                continue;
            }
            if (file.size > 2 * 1024 * 1024) {
                alert('Imagens não podem exceder 2MB.');
                continue;
            }

            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                const dataUrl = loadEvent.target?.result as string;
                setFormData((prev: any) => ({
                    ...prev,
                    attachments: [...prev.attachments, { name: file.name, dataUrl }]
                }));
            };
            reader.readAsDataURL(file);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeAttachment = (index: number) => {
        setFormData((prev: any) => ({
            ...prev,
            attachments: prev.attachments.filter((_: any, i: number) => i !== index)
        }));
    };

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
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-2"><FaBuilding className="text-brand-secondary" /> Localização / Entidade</label>
                        <div className="w-full bg-gray-900 border border-gray-600 text-gray-400 rounded p-2 text-sm font-semibold truncate">{resolvedLocationName}</div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-2"><FaUserTie className="text-brand-secondary" /> Requerente</label>
                        <div className="w-full bg-gray-900 border border-gray-600 text-gray-400 rounded p-2 text-sm font-semibold">{collaborators.find(c => c.id === formData.collaborator_id)?.full_name || "Utilizador Externo"}</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Assunto / Título</label>
                            {isEditMode ? <div className="w-full bg-gray-900 border border-gray-700 text-gray-400 rounded p-2 text-sm italic">{formData.title}</div> : <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm" placeholder="Ex: Problema no monitor" required />}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Descrição Detalhada</label>
                            {isEditMode ? <div className="w-full bg-gray-900 border border-gray-700 text-gray-400 rounded p-2 text-sm italic whitespace-pre-wrap min-h-[100px]">{formData.description}</div> : <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={4} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm" placeholder="Descreva o que aconteceu..." required />}
                        </div>
                        
                        {/* Imagens Anexadas */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-400 flex items-center gap-2"><FaCamera className="text-brand-secondary"/> Anexos de Imagem</label>
                                {!isEditMode && <button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded">Adicionar</button>}
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileChange} />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {formData.attachments?.map((file: any, idx: number) => (
                                    <div key={idx} className="relative group aspect-square rounded-lg border border-gray-700 overflow-hidden bg-black">
                                        <img src={file.dataUrl} className="w-full h-full object-cover" />
                                        <button type="button" onClick={() => removeAttachment(idx)} className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><FaTrash size={10}/></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Categoria</label>
                                {canEditAdvanced ? <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm">{categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select> : <div className="w-full bg-gray-900 border border-gray-700 text-gray-400 rounded p-2 text-sm">{formData.category || "Geral"}</div>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1 flex items-center gap-2"><FaHistory className="text-brand-secondary" /> Estado</label>
                                {canEditAdvanced ? <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full bg-gray-800 border border-gray-600 text-white rounded p-2 text-sm font-bold text-brand-secondary outline-none"><option value="Pedido">Pedido</option><option value="Em progresso">Em progresso</option><option value="Finalizado">Finalizado</option><option value="Cancelado">Cancelado</option></select> : <div className="w-full bg-gray-900 border border-gray-700 text-brand-secondary rounded p-2 text-sm font-bold uppercase">{formData.status}</div>}
                            </div>
                        </div>

                        <div className="bg-blue-900/10 border border-blue-500/20 rounded-lg p-3">
                            <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Contexto Ativos</h4>
                            <div className="space-y-1">
                                {requesterAssets.equipment.slice(0,2).map(eq => <div key={eq.id} className="text-[10px] text-gray-400 flex justify-between"><span className="truncate">{eq.description}</span><span className="font-mono text-gray-600">{eq.serial_number}</span></div>)}
                            </div>
                        </div>

                        {canEditAdvanced && (
                            <div className="space-y-4 pt-2 border-t border-gray-700">
                                <div><label className="block text-sm font-medium text-gray-400 mb-1 flex items-center gap-2"><FaUsers className="text-blue-400" /> Equipa Técnica</label><select value={formData.team_id || ''} onChange={e => setFormData({...formData, team_id: e.target.value})} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm"><option value="">-- Selecione --</option>{teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
                                <div><label className="block text-sm font-medium text-gray-400 mb-1 flex items-center gap-2"><FaUserTie className="text-green-400" /> Técnico Atribuído</label><select value={formData.technician_id || ''} onChange={e => setFormData({...formData, technician_id: e.target.value})} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm"><option value="">-- Não Atribuído --</option>{filteredTechnicians.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}</select></div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-500">Cancelar</button>
                    <button type="submit" disabled={isSaving} className="px-6 py-2 bg-brand-primary text-white rounded text-sm font-bold hover:bg-brand-secondary flex items-center gap-2 shadow-lg">{isSaving ? <FaSpinner className="animate-spin" /> : null} {isEditMode ? 'Guardar Alterações' : 'Submeter Pedido'}</button>
                </div>
            </form>
        </Modal>
    );
};
