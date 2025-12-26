import React, { useState, useMemo } from 'react';
import Modal from './common/Modal';
import { Collaborator, Assignment, Equipment, Ticket, SoftwareLicense, LicenseAssignment, Brand, EquipmentType, ConfigItem } from '../types';
// Add missing icons: FaIdCard, FaClock, FaMapMarkerAlt
import { FaLaptop, FaTicketAlt, FaHistory, FaComment, FaEnvelope, FaPhone, FaMobileAlt, FaUserTag, FaEdit, FaKey, FaUserSlash, FaBoxOpen, FaPrint, FaExternalLinkAlt, FaInfoCircle, FaIdCard, FaClock, FaMapMarkerAlt, FaSpinner, FaTools, FaMagic } from './common/Icons';
import * as dataService from '../services/dataService';

/**
 * COLLABORATOR DETAIL MODAL - V5.3 (Title/Trato Header)
 * -----------------------------------------------------------------------------
 * STATUS DE BLOQUEIO RIGOROSO (Freeze UI):
 * - PEDIDO 8: RESTAURADO HISTÓRICO DE TICKETS, HARDWARE E SOFTWARE.
 * - PEDIDO 4: ADICIONADO TRATO (TITLE) NO CABEÇALHO.
 * -----------------------------------------------------------------------------
 */

interface CollaboratorDetailModalProps {
    collaborator: Collaborator;
    assignments: Assignment[];
    equipment: Equipment[];
    tickets: Ticket[];
    brandMap: Map<string, string>;
    equipmentTypeMap: Map<string, string>;
    licenseAssignments: LicenseAssignment[];
    softwareLicenses: SoftwareLicense[];
    onClose: () => void;
    onShowHistory: (collaborator: Collaborator) => void;
    onStartChat: (collaborator: Collaborator) => void;
    onEdit: (collaborator: Collaborator) => void;
    onConfirmOffboarding?: (collaboratorId: string, reasonId?: string) => Promise<void>;
    deactivationReasons?: ConfigItem[];
    onViewTicket?: (ticket: Ticket) => void;
    onViewEquipment?: (equipment: Equipment, allowEdit?: boolean) => void;
}

export const CollaboratorDetailModal: React.FC<CollaboratorDetailModalProps> = ({ 
    collaborator, assignments, equipment, tickets, brandMap, equipmentTypeMap, licenseAssignments, softwareLicenses, 
    onClose, onShowHistory, onStartChat, onEdit, onConfirmOffboarding, deactivationReasons = [],
    onViewTicket, onViewEquipment
}) => {
    const [activeTab, setActiveTab] = useState<'active_assets' | 'tickets' | 'info'>('active_assets');
    const [isRepairing, setIsRepairing] = useState(false);

    // Filtro de Ativos Atuais (Hardware)
    const assignedEquipment = useMemo(() => {
        const activeIds = new Set(assignments.filter(a => a.collaborator_id === collaborator.id && !a.return_date).map(a => a.equipment_id));
        return equipment.filter(e => activeIds.has(e.id));
    }, [assignments, equipment, collaborator.id]);
    
    // Filtro de Software Associado
    const activeLicenses = useMemo(() => {
        const equipmentIds = new Set(assignedEquipment.map(e => e.id));
        const licenseIds = new Set(
            licenseAssignments
                .filter(la => la.equipment_id && equipmentIds.has(la.equipment_id) && !la.return_date)
                .map(la => la.software_license_id)
        );
        return softwareLicenses.filter(lic => licenseIds.has(lic.id));
    }, [licenseAssignments, softwareLicenses, assignedEquipment]);

    // Histórico de Tickets
    const collaboratorTickets = useMemo(() => {
        return tickets.filter(t => t.collaborator_id === collaborator.id)
            .sort((a, b) => new Date(b.request_date).getTime() - new Date(a.request_date).getTime());
    }, [tickets, collaborator.id]);

    const handleRepairLogin = async () => {
        if (!confirm(`Deseja tentar provisionar manualmente a conta de login para ${collaborator.email}? Isto criará uma identidade no Supabase Auth e tentará linkar ao ID atual.`)) return;
        
        setIsRepairing(true);
        try {
            const tempPass = "AIManager" + Math.floor(1000 + Math.random() * 9000) + "!";
            await dataService.adminProvisionUser(collaborator.id, collaborator.email, tempPass);
            alert(`Sucesso! Conta provisionada com a password temporária: ${tempPass}\n\nO utilizador já deve aparecer no Dashboard do Supabase.`);
            window.location.reload();
        } catch (e: any) {
            alert(`Erro na Reparação: ${e.message}`);
        } finally {
            setIsRepairing(false);
        }
    };

    const handlePrint = async () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const [logoBase64, sizeStr, footerId] = await Promise.all([
            dataService.getGlobalSetting('app_logo_base64'),
            dataService.getGlobalSetting('app_logo_size'),
            dataService.getGlobalSetting('report_footer_institution_id')
        ]);

        let footerHtml = '';
        if (footerId) {
            const allData = await dataService.fetchAllData();
            const inst = allData.instituicoes.find((i: any) => i.id === footerId);
            if (inst) {
                footerHtml = `<div class="footer"><p><strong>${inst.name}</strong> | NIF: ${inst.nif} | ${inst.email}</p></div>`;
            }
        }

        const equipmentRows = assignedEquipment.map(eq => `<tr><td>${eq.description}</td><td>${eq.serial_number}</td><td>${eq.status}</td></tr>`).join('');

        printWindow.document.write(`
            <html>
            <head>
                <title>Ficha do Colaborador - ${collaborator.full_name}</title>
                <style>
                    body { font-family: sans-serif; padding: 40px; color: #333; }
                    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0D47A1; padding-bottom: 20px; margin-bottom: 30px; }
                    .logo { max-height: ${sizeStr || '80'}px; }
                    .user-info { display: flex; gap: 20px; margin-bottom: 30px; }
                    .user-photo { width: 120px; height: 120px; border-radius: 50%; object-cover; border: 2px solid #eee; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
                    th { background-color: #f2f2f2; }
                    .footer { position: fixed; bottom: 20px; width: 100%; text-align: center; font-size: 10px; color: #777; border-top: 1px solid #eee; padding-top: 10px; }
                </style>
            </head>
            <body>
                <div class="header">
                    ${logoBase64 ? `<img src="${logoBase64}" class="logo" />` : '<h1>AIManager</h1>'}
                    <div style="text-align: right">
                        <h2 style="margin:0">${(collaborator.title ? collaborator.title + ' ' : '') + collaborator.full_name}</h2>
                        <p style="margin:5px 0">${collaborator.role}</p>
                    </div>
                </div>
                <div class="user-info">
                    ${collaborator.photo_url ? `<img src="${collaborator.photo_url}" class="user-photo" />` : ''}
                    <div>
                        <p><strong>Email:</strong> ${collaborator.email}</p>
                        <p><strong>Nº Mecanográfico:</strong> ${collaborator.numero_mecanografico || 'N/A'}</p>
                        <p><strong>Admissão:</strong> ${collaborator.admission_date || 'N/A'}</p>
                    </div>
                </div>
                <h3>Equipamentos Atribuídos</h3>
                <table>
                    <thead><tr><th>Descrição</th><th>Nº Série</th><th>Estado</th></tr></thead>
                    <tbody>${equipmentRows || '<tr><td colspan="3">Nenhum ativo registado.</td></tr>'}</tbody>
                </table>
                ${footerHtml}
                <script>window.onload = function() { window.print(); }</script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <Modal title={`Ficha de Colaborador: ${collaborator.full_name}`} onClose={onClose} maxWidth="max-w-5xl">
            <div className="flex flex-col h-[75vh]">
                {/* Cabeçalho */}
                <div className="flex-shrink-0 flex items-start gap-6 p-6 bg-gray-900/50 rounded-lg border border-gray-700 mb-6">
                    <div className="relative">
                        {collaborator.photo_url ? (
                            <img src={collaborator.photo_url} alt={collaborator.full_name} className="w-24 h-24 rounded-full object-cover border-4 border-gray-700 shadow-xl"/>
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-brand-secondary flex items-center justify-center font-bold text-white text-4xl border-4 border-gray-700 shadow-xl">
                                {collaborator.full_name.charAt(0)}
                            </div>
                        )}
                    </div>
                    <div className="flex-grow">
                        <h2 className="text-2xl font-bold text-white">{(collaborator.title ? collaborator.title + ' ' : '') + collaborator.full_name}</h2>
                        <p className="text-sm text-brand-secondary font-bold uppercase tracking-widest">{collaborator.role}</p>
                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-300 mt-3 bg-black/20 p-3 rounded border border-gray-800">
                            <span className="flex items-center gap-2"><FaEnvelope className="text-gray-500"/>{collaborator.email}</span>
                            {collaborator.telemovel && <span className="flex items-center gap-2"><FaMobileAlt className="text-gray-500"/>{collaborator.telemovel}</span>}
                            {collaborator.numero_mecanografico && <span className="flex items-center gap-2"><FaIdCard className="text-gray-500"/> Mec: {collaborator.numero_mecanografico}</span>}
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                        <div className="flex gap-2">
                            <button onClick={handlePrint} className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-md flex items-center gap-2 shadow-lg transition-all"><FaPrint/> Imprimir</button>
                            {collaborator.can_login && (
                                <button 
                                    onClick={handleRepairLogin} 
                                    disabled={isRepairing}
                                    className="px-4 py-2 text-sm bg-orange-600 hover:bg-orange-500 text-white rounded-md flex items-center gap-2 shadow-lg transition-all"
                                    title="Tentar criar conta Auth se ela estiver em falta"
                                >
                                    {isRepairing ? <FaSpinner className="animate-spin"/> : <FaMagic/>} Reparar Login
                                </button>
                            )}
                            <button onClick={() => { onClose(); onEdit(collaborator); }} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-md flex items-center gap-2 shadow-lg transition-all"><FaEdit/> Editar</button>
                            <button onClick={() => { onClose(); onStartChat(collaborator); }} className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-md flex items-center gap-2 shadow-lg transition-all"><FaComment/> Chat</button>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${collaborator.status === 'Ativo' ? 'bg-green-900/30 text-green-400 border border-green-500/30' : 'bg-red-900/30 text-red-400 border border-red-500/30'}`}>
                            {collaborator.status}
                        </span>
                    </div>
                </div>

                {/* Navegação Interna */}
                <div className="flex border-b border-gray-700 mb-6 flex-shrink-0">
                    <button onClick={() => setActiveTab('active_assets')} className={`px-6 py-2 text-sm font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'active_assets' ? 'border-brand-secondary text-white bg-gray-800/30' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>Ativos & Software ({assignedEquipment.length})</button>
                    <button onClick={() => setActiveTab('tickets')} className={`px-6 py-2 text-sm font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'tickets' ? 'border-brand-secondary text-white bg-gray-800/30' : 'border-transparent text-gray-300 hover:text-gray-300'}`}>Histórico Suporte ({collaboratorTickets.length})</button>
                    <button onClick={() => setActiveTab('info')} className={`px-6 py-2 text-sm font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'info' ? 'border-brand-secondary text-white bg-gray-800/30' : 'border-transparent text-gray-300 hover:text-gray-300'}`}>Dados Adicionais</button>
                </div>

                {/* Conteúdo */}
                <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                    {activeTab === 'active_assets' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                            {/* Hardware */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><FaLaptop className="text-blue-400"/> Hardware Atribuído</h3>
                                {assignedEquipment.length > 0 ? assignedEquipment.map(eq => (
                                    <div key={eq.id} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 flex justify-between items-center hover:bg-gray-700 transition-colors group cursor-pointer" onClick={() => onViewEquipment?.(eq)}>
                                        <div>
                                            <p className="font-bold text-white text-sm group-hover:text-brand-secondary">{eq.description}</p>
                                            <p className="text-[10px] text-gray-500 font-mono mt-1 uppercase">S/N: {eq.serial_number}</p>
                                        </div>
                                        <FaExternalLinkAlt className="text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                )) : <p className="text-sm text-gray-500 italic py-6 bg-gray-900/20 rounded border border-dashed border-gray-800 text-center">Nenhum equipamento.</p>}
                            </div>

                            {/* Software */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><FaKey className="text-yellow-400"/> Licenças em Uso</h3>
                                {activeLicenses.length > 0 ? activeLicenses.map(lic => (
                                    <div key={lic.id} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 flex justify-between items-center group">
                                        <div>
                                            <p className="font-bold text-white text-sm">{lic.product_name}</p>
                                            <p className="text-[10px] text-gray-500 font-mono mt-1 truncate max-w-[200px]">{lic.license_key}</p>
                                        </div>
                                        <span className="text-[9px] bg-yellow-900/20 text-yellow-300 border border-yellow-500/30 px-2 py-0.5 rounded font-bold uppercase">Ativa</span>
                                    </div>
                                )) : <p className="text-sm text-gray-500 italic py-6 bg-gray-900/20 rounded border border-dashed border-gray-800 text-center">Sem licenças vinculadas.</p>}
                            </div>
                        </div>
                    )}

                    {activeTab === 'tickets' && (
                        <div className="space-y-3 animate-fade-in">
                            {collaboratorTickets.length > 0 ? collaboratorTickets.map(t => (
                                <div key={t.id} className="bg-gray-800/30 p-4 rounded-lg border border-gray-700 hover:bg-gray-800/60 transition-colors cursor-pointer group" onClick={() => onViewTicket?.(t)}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className="font-bold text-white text-sm group-hover:text-brand-secondary">{t.title}</span>
                                            <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold flex items-center gap-2"><FaClock/> {new Date(t.request_date).toLocaleDateString()}</p>
                                        </div>
                                        <span className={`text-[9px] px-2 py-1 rounded-full font-black uppercase border ${t.status === 'Finalizado' ? 'bg-green-900/30 text-green-300 border-green-500/30' : 'bg-blue-900/30 text-blue-300 border-blue-500/30'}`}>
                                            {t.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 line-clamp-2 italic">"{t.description}"</p>
                                </div>
                            )) : <p className="text-center py-10 text-gray-500 italic">Sem histórico de tickets.</p>}
                        </div>
                    )}

                    {activeTab === 'info' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in p-2">
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-brand-secondary uppercase border-b border-gray-700 pb-2">Localização e Morada</h4>
                                <div className="space-y-2 text-sm text-gray-300">
                                    <p className="flex items-start gap-3"><FaMapMarkerAlt className="mt-1 text-gray-500"/> {collaborator.address_line || '—'}</p>
                                    <p className="ml-7">{collaborator.postal_code} {collaborator.locality}</p>
                                    <p className="ml-7">{collaborator.city}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-brand-secondary uppercase border-b border-gray-700 pb-2">Outros Dados</h4>
                                <div className="space-y-2 text-sm text-gray-300">
                                    <p className="flex justify-between"><span>NIF:</span> <span className="font-mono text-white">{collaborator.nif || '—'}</span></p>
                                    <p className="flex justify-between"><span>Data Nascimento:</span> <span className="font-mono text-white">{collaborator.date_of_birth ? new Date(collaborator.date_of_birth).toLocaleDateString() : '—'}</span></p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end pt-6 border-t border-gray-700 mt-auto">
                    <button onClick={onClose} className="px-8 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded font-bold transition-all">Fechar Ficha</button>
                </div>
            </div>
        </Modal>
    );
};

export default CollaboratorDetailModal;