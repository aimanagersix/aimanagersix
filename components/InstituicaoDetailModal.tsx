
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
    assignments?: Assignment[];
    equipment?: Equipment[];
    brands?: Brand[];
    equipmentTypes?: EquipmentType[];
}

const InstituicaoDetailModal: React.FC<InstituicaoDetailModalProps> = ({ instituicao, entidades, collaborators = [], onClose, onEdit, onAddEntity, onCreateCollaborator, onOpenEntity, assignments = [], equipment = [], brands = [], equipmentTypes = [] }) => {
    const [activeTab, setActiveTab] = useState<'info' | 'collabs' | 'equipment'>('info');
    
    // Filter and Deduplicate Entities
    const relatedEntidades = useMemo(() => {
        const filtered = entidades.filter(e => e.instituicaoId === instituicao.id);
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

    // Filter collaborators belonging to entities of this institution
    const relatedCollaborators = useMemo(() => {
        return collaborators.filter(c => c.entidadeId && relatedEntityIds.has(c.entidadeId));
    }, [collaborators, relatedEntityIds]);

    // Filter equipment belonging to any entity in this institution
    const relatedEquipment = useMemo(() => {
        const brandMap = new Map(brands.map(b => [b.id, b.name]));
        const typeMap = new Map(equipmentTypes.map(t => [t.id, t.name]));
        const entMap = new Map(entidades.map(e => [e.id, e.name]));
        const collabMap = new Map(collaborators.map(c => [c.id, c.fullName]));

        return assignments
            .filter(a => a.entidadeId && relatedEntityIds.has(a.entidadeId) && !a.returnDate)
            .map(a => {
                const eq = equipment.find(e => e.id === a.equipmentId);
                return {
                    ...eq,
                    assignmentDate: a.assignedDate,
                    assignedToName: a.collaboratorId ? collabMap.get(a.collaboratorId) : 'Atribuído à Localização',
                    entityName: entMap.get(a.entidadeId || '')
                };
            })
            .filter(item => item.id)
            .sort((a,b) => (a.description || '').localeCompare(b.description || ''));
    }, [assignments, relatedEntityIds, equipment, brands, equipmentTypes, entidades, collaborators]);

    // Calculate Total Asset Value for display
    const totalAssetValue = useMemo(() => {
        return relatedEquipment.reduce((sum, eq) => sum + (eq.acquisitionCost || 0), 0);
    }, [relatedEquipment]);

    const handlePrint = async () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        // 1. Fetch Logo & Settings
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

        // 3. Generate Tables
        const collaboratorRows = relatedCollaborators.map(col => {
            const entName = entidades.find(e => e.id === col.entidadeId)?.name || 'N/A';
            const phone = col.telemovel || col.telefoneInterno || '-';
            const name = (col.title ? col.title + ' ' : '') + col.fullName;
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
                <td>${eq.serialNumber}</td>
                <td>${eq.assignedToName}</td>
                <td style="text-align: right;">€ ${(eq.acquisitionCost || 0).toLocaleString('pt-PT', {minimumFractionDigits: 2})}</td>
            </tr>
        `).join('');

        // 4. Print Template
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
                    
                    /* Summary Box */
                    .summary-box { background-color: #f8f9fa; border: 1px solid #e9ecef; padding: 15px; border-radius: 5px; display: flex; justify-content: space-around; margin-bottom: 30px; }
                    .kpi { text-align: center; }
                    .kpi-val { font-size: 20px; font-weight: bold; color: #0D47A1; display: block; }
                    .kpi-lbl { font-size: 11px; text-transform: uppercase; color: #666; }

                    /* Data Grid */
                    .grid-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
                    .info-item { margin-bottom: 8px; }
                    .label { font-weight: bold; color: #555; font-size: 11px; text-transform: uppercase; }
                    .value { font-size: 14px; }

                    /* Tables */
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
                    th, td { border-bottom: 1px solid #eee; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; font-weight: bold; border-bottom: 2px solid #ddd; }
                    tr:nth-child(even) { background-color: #fbfbfb; }

                    .footer { position: fixed; bottom: 10px; width: 100%; text-align: center; font-size: 9pt; color: #999; border-top: 1px solid #eee; padding-top: 10px; background:white;}
                    @media print { body { padding: 0; } .footer { bottom: 0; } }
                </style>
            </head>
            <body>
                <div class="header-container">
                    <div>
                        ${logoBase64 ? `<img src="${logoBase64}" class="logo" />` : '<h2>AIManager</h2>'}
                    </div>
                    <div class="report-title">
                        <h1>Ficha da Instituição</h1>
                        <div class="subtitle">Relatório Consolidado</div>
                    </div>
                </div>

                <div class="summary-box">
                    <div class="kpi">
                        <span class="kpi-val">${relatedEntidades.length}</span>
                        <span class="kpi-lbl">Entidades</span>
                    </div>
                    <div class="kpi">
                        <span class="kpi-val">${relatedCollaborators.length}</span>
                        <span class="kpi-lbl">Colaboradores</span>
                    </div>
                    <div class="kpi">
                        <span class="kpi-val">${relatedEquipment.length}</span>
                        <span class="kpi-lbl">Total Equipamentos</span>
                    </div>
                    <div class="kpi">
                        <span class="kpi-val">€ ${totalAssetValue.toLocaleString('pt-PT', {minimumFractionDigits: 2})}</span>
                        <span class="kpi-lbl">Valor Patrimonial</span>
                    </div>
                </div>

                <div class="section">
                    <h3>Identificação</h3>
                    <div class="grid-info">
                        <div>
                            <div class="info-item"><span class="label">Nome</span><div class="value">${instituicao.name}</div></div>
                            <div class="info-item"><span class="label">Código</span><div class="value">${instituicao.codigo}</div></div>
                            <div class="info-item"><span class="label">NIF</span><div class="value">${instituicao.nif || 'N/A'}</div></div>
                        </div>
                        <div>
                            <div class="info-item"><span class="label">Email</span><div class="value">${instituicao.email}</div></div>
                            <div class="info-item"><span class="label">Telefone</span><div class="value">${instituicao.telefone}</div></div>
                            <div class="info-item"><span class="label">Website</span><div class="value">${instituicao.website || '-'}</div></div>
                        </div>
                    </div>
                    <div class="info-item"><span class="label">Morada</span><div class="value">${[instituicao.address_line, instituicao.postal_code, instituicao.city].filter(Boolean).join(', ')}</div></div>
                </div>
                
                <div class="section">
                    <h3>Entidades / Departamentos</h3>
                    <ul>
                        ${relatedEntidades.map(e => `<li>${e.name} (${e.codigo})</li>`).join('')}
                    </ul>
                </div>
                
                ${relatedCollaborators.length > 0 ? `
                <div class="section">
                    <h3>Colaboradores (${relatedCollaborators.length})</h3>
                    <table>
                        <thead>
                            <tr><th>Nome</th><th>Função</th><th>Email</th><th>Telefone</th><th>Entidade</th></tr>
                        </thead>
                        <tbody>${collaboratorRows}</tbody>
                    </table>
                </div>` : ''}

                ${relatedEquipment.length > 0 ? `
                <div class="section">
                    <h3>Inventário Consolidado (${relatedEquipment.length})</h3>
                    <table>
                        <thead>
                            <tr><th>Descrição</th><th>Entidade</th><th>S/N</th><th>Atribuído a</th><th style="text-align: right;">Custo</th></tr>
                        </thead>
                        <tbody>${equipmentRows}</tbody>
                         <tfoot>
                             <tr>
                                <td colspan="4" style="text-align: right; font-weight: bold;">TOTAL:</td>
                                <td style="text-align: right; font-weight: bold;">€ ${totalAssetValue.toLocaleString('pt-PT', {minimumFractionDigits: 2})}</td>
                             </tr>
                        </tfoot>
                    </table>
                </div>` : ''}

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
                {/* Header */}
                <div className="flex-shrink-0 flex items-start gap-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700 relative mb-4">
                    <div className="p-3 bg-brand-primary/20 rounded-full text-brand-secondary">
                        <FaSitemap className="h-8 w-8" />
                    </div>
                    <div className="flex-grow">
                        <h2 className="text-xl font-bold text-white">{instituicao.name}</h2>
                        <p className="text-sm text-on-surface-dark-secondary">Código: <span className="font-mono text-white">{instituicao.codigo}</span></p>
                        {instituicao.nif && <p className="text-sm text-gray-400">NIF: {instituicao.nif}</p>}
                        {instituicao.website && (
                            <a href={instituicao.website.startsWith('http') ? instituicao.website : `https://${instituicao.website}`} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-secondary hover:underline flex items-center gap-1 mt-1">
                                <FaGlobe className="h-3 w-3"/> {instituicao.website}
                            </a>
                        )}
                    </div>
                    <div className="flex flex-col gap-2">
                        <button 
                            onClick={handlePrint} 
                            className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors shadow-lg flex items-center gap-2"
                        >
                            <FaPrint /> Imprimir Relatório
                        </button>
                        <button 
                            onClick={() => { onClose(); onEdit(); }} 
                            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors shadow-lg"
                        >
                            Editar Dados
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-700 mb-4 flex-shrink-0">
                    <button 
                        onClick={() => setActiveTab('info')} 
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'info' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        Informação Geral
                    </button>
                    <button 
                        onClick={() => setActiveTab('collabs')} 
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'collabs' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        Colaboradores <span className="bg-gray-700 px-1.5 py-0.5 rounded text-xs">{relatedCollaborators.length}</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('equipment')} 
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'equipment' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        Equipamentos <span className="bg-gray-700 px-1.5 py-0.5 rounded text-xs">{relatedEquipment.length}</span>
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                    
                    {activeTab === 'info' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider border-b border-gray-700 pb-2">Contactos Gerais</h3>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex items-center gap-3 text-gray-300">
                                            <div className="bg-gray-800 p-2 rounded-full"><FaEnvelope className="text-gray-400" /></div>
                                            <a href={`mailto:${instituicao.email}`} className="hover:text-brand-secondary transition-colors">{instituicao.email}</a>
                                        </div>
                                        <div className="flex items-center gap-3 text-gray-300">
                                            <div className="bg-gray-800 p-2 rounded-full"><FaPhone className="text-gray-400" /></div>
                                            <span>{instituicao.telefone}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider border-b border-gray-700 pb-2">Localização</h3>
                                    <div className="flex items-start gap-3 text-sm text-gray-300">
                                        <div className="bg-gray-800 p-2 rounded-full mt-1"><FaMapMarkerAlt className="text-gray-400" /></div>
                                        <div>
                                            <p>{instituicao.address_line || 'Endereço não definido'}</p>
                                            <p>{instituicao.postal_code} {instituicao.locality}</p>
                                            <p>{instituicao.city}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Org Structure */}
                            <div className="mt-6">
                                <div className="flex justify-between items-center border-b border-gray-700 pb-2 mb-3">
                                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Estrutura Organizacional</h3>
                                    {onAddEntity && (
                                        <button 
                                            onClick={() => { onClose(); onAddEntity(instituicao.id); }}
                                            className="flex items-center gap-2 px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-xs rounded transition-colors"
                                        >
                                            <FaPlus /> Nova Entidade
                                        </button>
                                    )}
                                </div>
                                
                                <div className="bg-surface-dark p-4 rounded border border-gray-700">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-gray-400">Entidades Associadas:</span>
                                        <span className="text-xl font-bold text-white">{relatedEntidades.length}</span>
                                    </div>
                                    {relatedEntidades.length > 0 && (
                                        <ul className="mt-2 space-y-1 text-sm text-gray-300 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                                            {relatedEntidades.map(e => (
                                                <li 
                                                    key={e.id} 
                                                    className="flex justify-between items-center border-b border-gray-800 py-2 last:border-0 hover:bg-gray-800 px-2 rounded cursor-pointer transition-colors"
                                                    onClick={() => onOpenEntity && onOpenEntity(e)}
                                                >
                                                    <span className="font-medium text-brand-secondary flex items-center gap-2">
                                                        {e.name} <FaExternalLinkAlt className="h-3 w-3 opacity-50"/>
                                                    </span>
                                                    <span className="text-xs text-gray-500 bg-gray-900 px-1 rounded">{e.codigo}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'collabs' && (
                        <div>
                            <div className="flex justify-between items-center border-b border-gray-700 pb-2 mb-4">
                                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                                    Todos os Colaboradores ({relatedCollaborators.length})
                                </h3>
                                {onCreateCollaborator && (
                                    <button 
                                        onClick={() => { onClose(); onCreateCollaborator(); }}
                                        className="flex items-center gap-2 px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-xs rounded transition-colors"
                                    >
                                        <FaPlus /> Novo Colaborador
                                    </button>
                                )}
                            </div>
                            {relatedCollaborators.length > 0 ? (
                                <div className="space-y-2">
                                    {relatedCollaborators.map(col => {
                                        const entName = relatedEntidades.find(e => e.id === col.entidadeId)?.name || 'N/A';
                                        return (
                                            <div key={col.id} className="flex justify-between items-center bg-gray-800/50 p-3 rounded border border-gray-700">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-gray-700 p-2 rounded-full">
                                                        <FaUsers className="text-gray-400"/>
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-white">{col.fullName}</p>
                                                        <p className="text-xs text-gray-400">{col.email}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="block text-xs bg-gray-700 px-2 py-1 rounded text-gray-300 mb-1">{col.role}</span>
                                                    <span className="text-xs text-gray-500">{entName}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-center text-gray-500 py-8 bg-gray-900/20 rounded border border-dashed border-gray-700">
                                    Nenhum colaborador encontrado nas entidades desta instituição.
                                </p>
                            )}
                        </div>
                    )}

                    {activeTab === 'equipment' && (
                        <div>
                            <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
                                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Inventário Consolidado</h3>
                            </div>
                            <div className="bg-blue-900/20 border border-blue-500/30 p-3 rounded text-xs text-blue-200 mb-4">
                                <p>Lista de todos os equipamentos associados a qualquer entidade desta instituição.</p>
                            </div>
                            
                            {relatedEquipment.length > 0 ? (
                                <div className="overflow-x-auto border border-gray-700 rounded">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-800 text-xs uppercase text-gray-400">
                                            <tr>
                                                <th className="px-4 py-3">Descrição</th>
                                                <th className="px-4 py-3">Entidade</th>
                                                <th className="px-4 py-3">S/N</th>
                                                <th className="px-4 py-3">Atribuído a</th>
                                                <th className="px-4 py-3 text-right">Custo</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-700">
                                            {relatedEquipment.map(eq => (
                                                <tr key={eq.id || Math.random()} className="bg-surface-dark hover:bg-gray-700/50">
                                                    <td className="px-4 py-2 text-white font-medium">{eq.description}</td>
                                                    <td className="px-4 py-2 text-gray-300 text-xs">{eq.entityName}</td>
                                                    <td className="px-4 py-2 font-mono text-xs text-gray-400">{eq.serialNumber}</td>
                                                    <td className="px-4 py-2 text-gray-300">{eq.assignedToName}</td>
                                                    <td className="px-4 py-2 text-gray-400 text-xs text-right">€ {(eq.acquisitionCost || 0).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-gray-800/50">
                                             <tr>
                                                <td colSpan={4} className="px-4 py-2 text-right font-bold text-white">TOTAL:</td>
                                                <td className="px-4 py-2 text-right font-bold text-green-400">€ {totalAssetValue.toLocaleString('pt-PT', {minimumFractionDigits: 2})}</td>
                                             </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center text-gray-500 py-12 bg-gray-900/20 rounded border border-dashed border-gray-700">
                                    <FaLaptop className="mx-auto text-2xl mb-2 opacity-50"/>
                                    <p>Nenhum equipamento ativo nesta instituição.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-700 mt-auto">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">
                        Fechar
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default InstituicaoDetailModal;
