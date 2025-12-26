
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Modal from './common/Modal';
import { Ticket, Entidade, Collaborator, Team, TeamMember, TicketCategoryItem, SecurityIncidentTypeItem, CriticalityLevel, TicketStatus, Instituicao, ModuleKey, PermissionAction, Equipment, Assignment, SoftwareLicense, LicenseAssignment, UserRole, Holiday, Supplier } from '../types';
import { FaShieldAlt, FaSpinner, FaHistory, FaExclamationTriangle, FaUsers, FaUserTie, FaBuilding, FaLaptop, FaKey, FaBoxOpen, FaExternalLinkAlt, FaInfoCircle, FaCamera, FaTrash, FaPlus, FaPaperclip, FaBalanceScale, FaClock } from './common/Icons';

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
    suppliers?: Supplier[];
    onViewEquipment?: (equipment: Equipment) => void;
    onViewLicense?: (license: SoftwareLicense) => void;
    holidays?: Holiday[]; 
}

export const AddTicketModal: React.FC<AddTicketModalProps> = ({ 
    onClose, onSave, ticketToEdit, collaborators, teams, teamMembers = [], currentUser, categories, securityIncidentTypes = [], checkPermission, escolasDepartamentos: entidades, instituicoes,
    equipment, assignments, softwareLicenses, licenseAssignments, suppliers = [],
    onViewEquipment, onViewLicense, holidays = []
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
        requester_supplier_id: '',
        regulatory_status: 'NotRequired',
        regulatory_24h_deadline: '',
        regulatory_72h_deadline: '',
        attachments: []
    });

    const canEditAdvanced = checkPermission('tickets', 'edit');
    const isSuperAdmin = currentUser?.role === UserRole.SuperAdmin;

    useEffect(() => {
        if (ticketToEdit) {
            setFormData({ ...ticketToEdit, attachments: ticketToEdit.attachments || [] });
        }
    }, [ticketToEdit]);

    const isSecurityIncident = useMemo(() => {
        const cat = categories.find(c => c.name === formData.category);
        return cat?.is_security === true || formData.category === 'Incidente de Segurança';
    }, [formData.category, categories]);

    const technicianVacationAlert = useMemo(() => {
        if (!formData.technician_id || !holidays.length) return null;
        const now = new Date();
        const next48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
        const upcomingAbsence = holidays.find(h => h.collaborator_id === formData.technician_id && new Date(h.start_date) >= now && new Date(h.start_date) <= next48h);
        if (upcomingAbsence) {
            const team = teams.find(t => t.id === formData.team_id);
            return `Técnico de férias em breve (${new Date(upcomingAbsence.start_date).toLocaleDateString()}). ${team?.vacation_auto_reassign ? 'Reatribuição automática ativa.' : 'Atenção: Sem reatribuição automática.'}`;
        }
        return null;
    }, [formData.technician_id, formData.team_id, holidays, teams]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (!file.type.startsWith('image/')) continue;
            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                const dataUrl = loadEvent.target?.result as string;
                setFormData((prev: any) => ({ ...prev, attachments: [...prev.attachments, { name: file.name, dataUrl }] }));
            };
            reader.readAsDataURL(file);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeAttachment = (index: number) => {
        setFormData((prev: any) => ({ ...prev, attachments: prev.attachments.filter((_: any, i: number) => i !== index) }));
    };

    const requesterAssets = useMemo(() => {
        const userId = formData.collaborator_id;
        if (!userId) return { equipment: [], licenses: [] };
        const activeAssignedEqIds = new Set(assignments.filter(a => a.collaborator_id === userId && !a.return_date).map(a => a.equipment_id));
        const userEq = equipment.filter(e => activeAssignedEqIds.has(e.id));
        const activeEqIds = new Set(userEq.map(e => e.id));
        const activeLicIds = new Set(licenseAssignments.filter(la => activeEqIds.has(la.equipment_id) && !la.return_date).map(la => la.software_license_id));
        const userLic = softwareLicenses.filter(lic => activeLicIds.has(lic.id));
        return { equipment: userEq, licenses: userLic };
    }, [formData.collaborator_id, equipment, assignments, softwareLicenses, licenseAssignments]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const finalData = { ...formData };
            if (!isEditMode && !canEditAdvanced) {
                finalData.status = 'Pedido';
                finalData.team_id = triagemTeam?.id || null;
            }
            await onSave(finalData);
            onClose();
        } catch (err: any) { alert("Erro ao gravar ticket: " + (err.message || "Erro de rede.")); }
        finally { setIsSaving(false); }
    };

    return (
        <Modal title={isEditMode ? `Gestão de Ticket #${ticketToEdit?.id.substring(0,8)}` : "Abrir Novo Ticket de Suporte"} onClose={onClose} maxWidth="max-w-5xl">
            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto max-h-[80vh] pr-2 custom-scrollbar">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                        <div className="bg-gray-800/40 p-3 rounded border border-gray-700">
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Identificação do Requerente</label>
                            <div className="grid grid-cols-1 gap-3">
                                <div>
                                    <label className="block text-[9px] text-gray-400 mb-1">Colaborador Interno</label>
                                    <select value={formData.collaborator_id} onChange={e => setFormData({...formData, collaborator_id: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded p-1.5 text-xs text-white">
                                        <option value="">-- Selecione Colaborador --</option>
                                        {collaborators.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                                    </select>
                                </div>
                                {canEditAdvanced && (
                                    <div>
                                        <label className="block text-[9px] text-gray-400 mb-1">OU Fornecedor Externo (B2B)</label>
                                        <select value={formData.requester_supplier_id || ''} onChange={e => setFormData({...formData, requester_supplier_id: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded p-1.5 text-xs text-white">
                                            <option value="">-- Selecione Fornecedor --</option>
                                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Assunto / Título</label>
                            <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm focus:border-brand-primary outline-none" required />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descrição</label>
                            <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={4} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm focus:border-brand-primary outline-none" required />
                        </div>
                        
                        <div className="border-t border-gray-700 pt-3">
                            <label className="block text-[10px] font-black text-gray-400 uppercase flex items-center gap-2 mb-2"><FaCamera className="text-brand-secondary"/> Anexos de Evidência</label>
                            <div className="grid grid-cols-3 gap-2">
                                {formData.attachments?.map((file: any, idx: number) => (
                                    <div key={idx} className="relative aspect-square rounded border border-gray-700 overflow-hidden bg-black">
                                        <img src={file.dataUrl} className="w-full h-full object-cover" alt="" />
                                        <button type="button" onClick={() => removeAttachment(idx)} className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full"><FaTrash size={8}/></button>
                                    </div>
                                ))}
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square border-2 border-dashed border-gray-700 rounded flex flex-col items-center justify-center text-gray-500 hover:border-gray-500 transition-colors"><FaPlus/><span className="text-[9px] mt-1">FOTO</span></button>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileChange} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Categoria</label>
                                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm">{categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Criticidade</label>
                                <select value={formData.impact_criticality} onChange={e => setFormData({...formData, impact_criticality: e.target.value})} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm">{Object.values(CriticalityLevel).map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}</select>
                            </div>
                        </div>

                        {/* SECÇÃO NIS2 COMPLIANCE (PEDIDO 3) */}
                        {isSecurityIncident && (
                            <div className="bg-red-900/10 border border-red-500/30 p-4 rounded-lg space-y-3 animate-fade-in">
                                <h4 className="text-[10px] font-black text-red-400 uppercase tracking-widest flex items-center gap-2"><FaBalanceScale/> Controlo Regulatório NIS2</h4>
                                
                                <div>
                                    <label className="block text-[9px] text-gray-400 uppercase mb-1">Tipo de Incidente</label>
                                    <select value={formData.security_incident_type || ''} onChange={e => setFormData({...formData, security_incident_type: e.target.value})} className="w-full bg-gray-900 border border-red-500/20 rounded p-1.5 text-xs text-white">
                                        <option value="">-- Não Definido --</option>
                                        {securityIncidentTypes?.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[9px] text-gray-400 uppercase mb-1">Estado de Notificação</label>
                                    <select value={formData.regulatory_status} onChange={e => setFormData({...formData, regulatory_status: e.target.value})} className="w-full bg-gray-900 border border-red-500/20 rounded p-1.5 text-xs text-white font-bold">
                                        <option value="NotRequired">Não Requer Notificação</option>
                                        <option value="Awaiting24h">Pendente Alerta Precoce (24h)</option>
                                        <option value="Submitted24h">Alerta 24h Enviado</option>
                                        <option value="Awaiting72h">Pendente Notificação Final (72h)</option>
                                        <option value="Submitted72h">Concluído / Notificado</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-[9px] text-gray-400 uppercase mb-1">Prazo 24h</label>
                                        <input type="datetime-local" value={formData.regulatory_24h_deadline ? new Date(formData.regulatory_24h_deadline).toISOString().slice(0,16) : ''} onChange={e => setFormData({...formData, regulatory_24h_deadline: e.target.value})} className="w-full bg-gray-900 border border-red-500/20 rounded p-1 text-[10px] text-white" />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] text-gray-400 uppercase mb-1">Prazo 72h</label>
                                        <input type="datetime-local" value={formData.regulatory_72h_deadline ? new Date(formData.regulatory_72h_deadline).toISOString().slice(0,16) : ''} onChange={e => setFormData({...formData, regulatory_72h_deadline: e.target.value})} className="w-full bg-gray-900 border border-red-500/20 rounded p-1 text-[10px] text-white" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {canEditAdvanced && (
                            <div className="space-y-4 pt-2 border-t border-gray-700">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Estado</label>
                                        <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full bg-gray-800 border border-gray-600 text-white rounded p-2 text-sm font-bold text-brand-secondary"><option value="Pedido">Pedido</option><option value="Em progresso">Em progresso</option><option value="Finalizado">Finalizado</option><option value="Cancelado">Cancelado</option></select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Equipa</label>
                                        <select value={formData.team_id || ''} onChange={e => setFormData({...formData, team_id: e.target.value})} className="w-full bg-gray-800 border border-gray-600 text-white rounded p-2 text-sm"><option value="">-- Selecione --</option>{teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Técnico</label>
                                    <select value={formData.technician_id || ''} onChange={e => setFormData({...formData, technician_id: e.target.value})} className={`w-full bg-gray-800 border ${technicianVacationAlert ? 'border-orange-500' : 'border-gray-600'} text-white rounded p-2 text-sm`}>
                                        <option value="">-- Não Atribuído --</option>
                                        {collaborators.filter(c => !formData.team_id || teamMembers.some(tm => tm.team_id === formData.team_id && tm.collaborator_id === c.id)).map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                                    </select>
                                    {technicianVacationAlert && <p className="text-[10px] text-orange-400 mt-1 font-bold italic">{technicianVacationAlert}</p>}
                                </div>
                            </div>
                        )}

                        <div className="bg-blue-900/10 border border-blue-500/20 rounded-lg p-3">
                            <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Vínculo a Ativo</h4>
                            <select value={formData.equipment_id || ''} onChange={e => setFormData({...formData, equipment_id: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded p-1.5 text-xs text-white">
                                <option value="">-- Nenhum Equipamento --</option>
                                {requesterAssets.equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.description} ({eq.serial_number})</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                    <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-600 text-white rounded font-bold text-sm hover:bg-gray-500">Cancelar</button>
                    <button type="submit" disabled={isSaving} className="px-8 py-2 bg-brand-primary text-white rounded text-sm font-black uppercase tracking-widest hover:bg-brand-secondary flex items-center gap-2 shadow-lg">
                        {isSaving ? <FaSpinner className="animate-spin" /> : null} {isEditMode ? 'Guardar Alterações' : 'Submeter Ticket'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
