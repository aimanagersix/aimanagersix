import React, { useState, useMemo } from 'react';
import Modal from './common/Modal';
import { Instituicao, Entidade, Collaborator, Assignment, Equipment, Brand, EquipmentType } from '../types';
import { FaSitemap, FaPhone, FaEnvelope, FaMapMarkerAlt, FaPlus, FaPrint, FaUsers, FaExternalLinkAlt, FaLaptop, FaGlobe } from './common/Icons';
import * as dataService from '../services/dataService';

interface InstituicaoDetailModalProps {
    instituicao: Instituicao;
    entidades: Entidade[];
    collaborators?: Collaborator[]; 
    onClose: () => void;
    onEdit: () => void;
    onAddEntity?: (instituicaoId: string) => void;
    onCreateCollaborator?: () => void; 
    onOpenEntity?: (entidade: Entidade) => void;
    onOpenCollaborator?: (collaborator: Collaborator) => void;
    onOpenEquipment?: (equipment: Equipment) => void;
    assignments?: Assignment[];
    equipment?: Equipment[];
    brands?: Brand[];
    equipmentTypes?: EquipmentType[];
}

const InstituicaoDetailModal: React.FC<InstituicaoDetailModalProps> = ({ 
    instituicao, entidades, collaborators = [], onClose, onEdit, 
    onAddEntity, onCreateCollaborator, onOpenEntity, onOpenCollaborator, onOpenEquipment,
    assignments = [], equipment = [], brands = [], equipmentTypes = [] 
}) => {
    const [activeTab, setActiveTab] = useState<'info' | 'collabs' | 'equipment'>('info');
    
    const relatedEntidades = useMemo(() => {
        const filtered = entidades.filter(e => e.instituicao_id === instituicao.id);
        const uniqueMap = new Map();
        filtered.forEach(e => {
            if (e.codigo) {
                uniqueMap.set(String(e.codigo).trim(), e);
            } else {
                uniqueMap.set(String(e.id), e);
            }
        });
        return Array.from(uniqueMap.values());
    }, [entidades, instituicao.id]);
    
    const relatedEntityIds = useMemo(() => new Set(relatedEntidades.map(e => e.id)), [relatedEntidades]);

    const relatedCollaborators = useMemo(() => {
        return collaborators.filter(c => c.entidade_id && relatedEntityIds.has(c.entidade_id));
    }, [collaborators, relatedEntityIds]);

    const relatedEquipment = useMemo(() => {
        const entMap = new Map(entidades.map(e => [e.id, e.name]));
        const collabMap = new Map(collaborators.map(c => [c.id, c.full_name]));

        return assignments
            .filter(a => a.entidade_id && relatedEntityIds.has(a.entidade_id) && !a.return_date)
            .map(a => {
                const eq = equipment.find(e => e.id === a.equipment_id);
                return {
                    ...eq,
                    assignmentDate: a.assigned_date,
                    assignedToName: a.collaborator_id ? collabMap.get(a.collaborator_id) : 'Atribuído à Localização',
                    entityName: entMap.get(a.entidade_id || '')
                };
            })
            .filter(item => item.id)
            .sort((a,b) => (b.assignmentDate || '').localeCompare(a.assignmentDate || ''));
    }, [assignments, relatedEntityIds, equipment, entidades, collaborators]);

    const totalAssetValue = useMemo(() => {
        return relatedEquipment.reduce((sum, eq) => sum + (eq.acquisition_cost || 0), 0);
    }, [relatedEquipment]);

    const handlePrint = async () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const [logoBase64, sizeStr, align, footerId] = await Promise.all([
            dataService.getGlobalSetting('app_logo_base64'),
            dataService.getGlobalSetting('app_logo_size'),
            dataService.getGlobalSetting('app_logo_alignment'),
            dataService.getGlobalSetting('report_footer_institution_id')
        ]);
        const logoSize = sizeStr ? parseInt(sizeStr) : 80;

        let footerHtml = '';
        if (footerId) {
            const allData = await dataService.fetchAllData();
            const inst = allData.instituicoes.find((i: any) => i.id === footerId);
            if (inst) {
                footerHtml = `<div class="footer"><p><strong>${inst.name}</strong> | ${[inst.address_line, inst.postal_code, inst.city].filter(Boolean).join(', ')} | NIF: ${inst.nif}</p></div>`;
            }
        }

        const collaboratorRows = relatedCollaborators.map(col => {
            const entName = entidades.find(e => e.id === col.entidade_id)?.name || 'N/A';
            const phone = col.telemovel || col.telefone_interno || '-';
            const name = (col.title ? col.title + ' ' : '') + col.full_name;
            return `
                <tr>
                    <td>${name}</td>
                    <td>${col.role}</td>
                    <td>${col.email}</td>
                    <td>${phone}</td>
                    <td>${entName}</td>
                </tr>
            `;
        }).join('');

        const equipmentRows = relatedEquipment.map(eq => `
            <tr>
                <td>${eq.description}</td>
                <td>${eq.entityName}</td>
                <td>${eq.serial_number}</td>
                <td>${eq.assignedToName}</td>
                <td style="text-align: right;">€ ${(eq.acquisition_cost || 0).toLocaleString('pt-PT', {minimumFractionDigits: 2})}</td>
            </tr>
        `).join('');

        printWindow.document.write(`
            <html>
            <head>
                <title>Ficha da Instituição - ${instituicao.name}</title>
                <style>
                    body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #333; max-width: 210mm; margin: 0 auto; }
                    .header-container { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #0D47A1; padding-bottom: 20px; margin-bottom: 30px; }
                    .logo { max-height: ${logoSize}px; max-width: 250px; }
                    .report-title { text-align: right; }
                    h1 { margin: 0; color: #0D47A1; font-size: 24px; }
                    .subtitle { font-size: 14px; color: #666; margin-top: 5px; }
                    .section { margin-bottom: 30px; page-break-inside: avoid; }
                    h3 { color: #333; font-size: 16px; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 0; text-transform: uppercase; }
                    .summary-box { background-color: #f8f9fa; border: 1px solid #e9ecef; padding: 20px; border-radius: 5px; display: flex; justify-content: space-around; margin-bottom: 30px; }
                    .kpi { text-align: center; }
                    .kpi-val { font-size: 20px; font-weight: bold; color: #0D47A1; display: block; }
                    .kpi-lbl { font-size: 11px; text-transform: uppercase; color: #666; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
                    th, td { border-bottom: 1px solid #eee; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; font-weight: bold; border-bottom: 2px solid #ddd; }
                    .footer { position: fixed; bottom: 10px; width: 100%; text-align: center; font-size: 9pt; color: #999; border-top: 1px solid #eee; padding-top: 10px; background:white;}
                </style>
            </head>
            <body>
                <div class="header-container">
                    <div>${logoBase64 ? `<img src="${logoBase64}" class="logo" />` : '<h2>AIManager</h2>'}</div>
                    <div class="report-title"><h1>Ficha da Instituição</h1><div class="subtitle">Relatório Consolidado</div></div>
                </div>
                <div class="summary-box">
                    <div class="kpi"><span class="kpi-val">${relatedEntidades.length}</span><span class="kpi-lbl">Entidades</span></div>
                    <div class="kpi"><span class="kpi-val">${relatedCollaborators.length}</span><span class="kpi-lbl">Colaboradores</span></div>
                    <div class="kpi"><span class="kpi-val">${relatedEquipment.length}</span><span class="kpi-lbl">Equipamentos</span></div>
                    <div class="kpi"><span class="kpi-val">€ ${totalAssetValue.toLocaleString('pt-PT', {minimumFractionDigits: 2})}</span><span class="kpi-lbl">Valor</span></div>
                </div>
                <div class="section"><h3>Identificação</h3><p>${instituicao.name} (${instituicao.codigo})</p><p>${[instituicao.address_line, instituicao.postal_code, instituicao.city].filter(Boolean).join(', ')}</p></div>
                <div class="section"><h3>Entidades</h3><ul>${relatedEntidades.map(e => `<li>${e.name} (${e.codigo})</li>`).join('')}</ul></div>
                ${relatedCollaborators.length > 0 ? `<div class="section"><h3>Colaboradores</h3><table><thead><tr><th>Nome</th><th>Função</th><th>Email</th><th>Entidade</th></tr></thead><tbody>${collaboratorRows}</tbody></table></div>` : ''}
                ${relatedEquipment.length > 0 ? `<div class="section"><h3>Inventário</h3><table><thead><tr><th>Descrição</th><th>Entidade</th><th>S/N</th><th>Detentor</th><th style="text-align: right;">Custo</th></tr></thead><tbody>${equipmentRows}</tbody></table></div>` : ''}
                ${footerHtml}
                <script>window.onload = function() { window.print(); }</script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <Modal title={`Detalhes: ${instituicao.name}`} onClose={onClose} maxWidth="max-w-4xl">
            <div className="flex flex-col h-[80vh]">
                <div className="flex-shrink-0 flex items-start gap-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700 relative mb-4">
                    <div className="p-3 bg-brand-primary/20 rounded-full text-brand-secondary"><FaSitemap className="h-8 w-8" /></div>
                    <div className="flex-grow">
                        <h2 className="text-xl font-bold text-white">{instituicao.name}</h2>
                        <p className="text-sm text-on-surface-dark-secondary font-mono">Cód: {instituicao.codigo} {instituicao.nif && `| NIF: ${instituicao.nif}`}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <button onClick={handlePrint} className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded flex items-center gap-2 transition-all"><FaPrint /> Imprimir</button>
                        <button onClick={() => { onClose(); onEdit(); }} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded">Editar</button>
                    </div>
                </div>

                <div className="flex border-b border-gray-700 mb-4 flex-shrink-0">
                    <button onClick={() => setActiveTab('info')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'info' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400'}`}>Geral</button>
                    <button onClick={() => setActiveTab('collabs')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'collabs' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400'}`}>Colaboradores <span className="bg-gray-700 px-1.5 py-0.5 rounded text-[10px]">{relatedCollaborators.length}</span></button>
                    <button onClick={() => setActiveTab('equipment')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'equipment' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400'}`}>Equipamentos <span className="bg-gray-700 px-1.5 py-0.5 rounded text-[10px]">{relatedEquipment.length}</span></button>
                </div>

                <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                    {activeTab === 'info' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-800 pb-1">Contactos</h4>
                                    <p className="text-sm text-gray-300 flex items-center gap-2"><FaEnvelope className="text-gray-500"/>{instituicao.email}</p>
                                    <p className="text-sm text-gray-300 flex items-center gap-2"><FaPhone className="text-gray-500"/>{instituicao.telefone}</p>
                                    {instituicao.website && <p className="text-sm text-brand-secondary flex items-center gap-2"><FaGlobe className="text-gray-500"/>{instituicao.website}</p>}
                                </div>
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-800 pb-1">Sede / Morada</h4>
                                    <p className="text-sm text-gray-300 flex items-start gap-2"><FaMapMarkerAlt className="mt-1 text-gray-500"/>{instituicao.address_line}</p>
                                    <p className="text-sm text-gray-300 ml-6">{instituicao.postal_code} {instituicao.locality}</p>
                                    <p className="text-sm text-gray-300 ml-6">{instituicao.city}</p>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-800 pb-1 mb-3">Estrutura (Entidades)</h4>
                                <div className="max-h-[220px] overflow-y-auto pr-2 custom-scrollbar space-y-1">
                                    {relatedEntidades.map(e => (
                                        <div key={e.id} className="p-2 bg-gray-800/40 rounded border border-gray-700 flex justify-between items-center hover:bg-gray-800 transition-colors cursor-pointer group" onClick={() => onOpenEntity?.(e)}>
                                            <span className="text-sm text-white group-hover:text-brand-secondary">{e.name}</span>
                                            <span className="text-[10px] text-gray-500 font-mono">{e.codigo}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'collabs' && (
                        <div className="max-h-[450px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                            {relatedCollaborators.map(col => (
                                <div key={col.id} className="flex justify-between items-center bg-gray-800/50 p-3 rounded border border-gray-700 hover:bg-gray-700 transition-colors cursor-pointer group" onClick={() => onOpenCollaborator?.(col)}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-brand-secondary flex items-center justify-center font-bold text-white text-xs">{col.full_name.charAt(0)}</div>
                                        <div><p className="font-bold text-white text-sm group-hover:text-brand-secondary">{col.full_name}</p><p className="text-xs text-gray-500">{col.email}</p></div>
                                    </div>
                                    <span className="text-[10px] bg-gray-700 px-2 py-1 rounded text-gray-400">{col.role}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'equipment' && (
                        <div className="max-h-[450px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                            {relatedEquipment.map(eq => (
                                <div key={eq.id} className="flex justify-between items-center bg-gray-800/50 p-3 rounded border border-gray-700 hover:bg-gray-700 transition-colors cursor-pointer group" onClick={() => onOpenEquipment?.(eq as any)}>
                                    <div className="flex items-center gap-3">
                                        <FaLaptop className="text-gray-400 group-hover:text-blue-400 transition-colors"/>
                                        <div>
                                            <p className="font-bold text-white text-sm group-hover:text-brand-secondary">{eq.description}</p>
                                            <p className="text-[10px] text-gray-500">S/N: {eq.serial_number} | {eq.entityName}</p>
                                        </div>
                                    </div>
                                    <div className="text-right"><p className="text-[10px] text-brand-secondary font-bold">{eq.assignedToName}</p><p className="text-[9px] text-gray-500 italic">{eq.assignmentDate}</p></div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default InstituicaoDetailModal;