
import React, { useState, useMemo } from 'react';
import Modal from './common/Modal';
import { Entidade, Instituicao, Collaborator, Assignment, Equipment, Brand, EquipmentType } from '../types';
import { FaBuilding as OfficeBuildingIcon, FaPhone, FaEnvelope, FaUserTag, FaMapMarkerAlt, FaPlus, FaUsers, FaLaptop, FaPrint, FaGlobe } from './common/Icons';
import * as dataService from '../services/dataService';

interface EntidadeDetailModalProps {
    entidade: Entidade;
    instituicao?: Instituicao;
    collaborators: Collaborator[];
    assignments?: Assignment[];
    onClose: () => void;
    onEdit: () => void;
    onAddCollaborator?: (entidadeId: string) => void;
    onAssignEquipment?: (entidadeId: string) => void;
    onOpenInstitution?: (instituicao: Instituicao) => void;
    equipment?: Equipment[];
    brands?: Brand[];
    equipmentTypes?: EquipmentType[];
}

const EntidadeDetailModal: React.FC<EntidadeDetailModalProps> = ({ entidade, instituicao, collaborators, assignments = [], onClose, onEdit, onAddCollaborator, onAssignEquipment, onOpenInstitution, equipment = [], brands = [], equipmentTypes = [] }) => {
    const [activeTab, setActiveTab] = useState<'info' | 'collaborators' | 'equipment'>('info');
    
    const activeCollaborators = collaborators.filter(c => c.entidadeId === entidade.id);
    
    // Maps for quick lookup
    const brandMap = useMemo(() => new Map(brands.map(b => [b.id, b.name])), [brands]);
    const typeMap = useMemo(() => new Map(equipmentTypes.map(t => [t.id, t.name])), [equipmentTypes]);
    const collabMap = useMemo(() => new Map(collaborators.map(c => [c.id, c.fullName])), [collaborators]);

    const associatedEquipment = useMemo(() => {
        return assignments
            .filter(a => a.entidadeId === entidade.id && !a.returnDate)
            .map(a => {
                const eq = equipment.find(e => e.id === a.equipmentId);
                return {
                    ...eq,
                    assignmentDate: a.assignedDate,
                    assignedToName: a.collaboratorId ? collabMap.get(a.collaboratorId) : 'Atribuído à Localização'
                };
            })
            .filter(item => item.id) // Filter out undefined if equipment deleted
            .sort((a,b) => (a.description || '').localeCompare(b.description || ''));
    }, [assignments, entidade.id, equipment, collabMap]);

    const handlePrint = async () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        // 1. Fetch Branding & Settings
        const [logoBase64, sizeStr, align, footerId] = await Promise.all([
            dataService.getGlobalSetting('app_logo_base64'),
            dataService.getGlobalSetting('app_logo_size'),
            dataService.getGlobalSetting('app_logo_alignment'),
            dataService.getGlobalSetting('report_footer_institution_id')
        ]);
        const logoSize = sizeStr ? parseInt(sizeStr) : 80;
        
        // 2. Prepare Footer Data
        let footerHtml = '';
        if (footerId) {
            const allData = await dataService.fetchAllData();
            const inst = allData.instituicoes.find((i: any) => i.id === footerId);
            if (inst) {
                footerHtml = `<div class="footer"><p><strong>${inst.name}</strong> | ${[inst.address_line, inst.postal_code, inst.city].filter(Boolean).join(', ')} | NIF: ${inst.nif}</p></div>`;
            }
        }

        // 3. Calculate Financials
        const totalAssetValue = associatedEquipment.reduce((sum, eq) => sum + (eq.acquisitionCost || 0), 0);

        // 4. Generate Rows
        const collaboratorRows = activeCollaborators.map(col => {
            const phone = col.telemovel || col.telefoneInterno || '-';
            const name = (col.title ? col.title + ' ' : '') + col.fullName;
            return `
                <tr>
                    <td>${name}</td>
                    <td>${col.role}</td>
                    <td>${col.email}</td>
                    <td>${phone}</td>
                </tr>
            `;
        }).join('');

        const equipmentRows = associatedEquipment.map(eq => `
            <tr>
                <td>${eq.description}</td>
                <td>${brandMap.get(eq.brandId || '')} ${typeMap.get(eq.typeId || '')}</td>
                <td>${eq.serialNumber}</td>
                <td>${eq.assignedToName}</td>
                <td style="text-align: right;">€ ${(eq.acquisitionCost || 0).toLocaleString('pt-PT', {minimumFractionDigits: 2})}</td>
            </tr>
        `).join('');

        // 5. Construct HTML
        printWindow.document.write(`
            <html>
            <head>
                <title>Ficha da Entidade - ${entidade.name}</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; max-width: 210mm; margin: 0 auto; }
                    
                    /* Header & Logo */
                    .header-container { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #0D47A1; padding-bottom: 20px; margin-bottom: 30px; }
                    .logo { max-height: ${logoSize}px; max-width: 250px; }
                    .report-title { text-align: right; }
                    h1 { margin: 0; color: #0D47A1; font-size: 24px; }
                    .subtitle { font-size: 14px; color: #666; margin-top: 5px; }

                    /* Sections */
                    .section { margin-bottom: 30px; page-break-inside: avoid; }
                    h3 { color: #333; font-size: 16px; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 0; text-transform: uppercase; letter-spacing: 1px; }
                    
                    /* Key-Value Grids */
                    .grid-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
                    .info-item { margin-bottom: 8px; }
                    .label { font-weight: bold; color: #555; font-size: 11px; text-transform: uppercase; }
                    .value { font-size: 14px; }

                    /* Summary Box */
                    .summary-box { background-color: #f8f9fa; border: 1px solid #e9ecef; padding: 15px; border-radius: 5px; display: flex; justify-content: space-around; margin-bottom: 30px; }
                    .kpi { text-align: center; }
                    .kpi-val { font-size: 20px; font-weight: bold; color: #0D47A1; display: block; }
                    .kpi-lbl { font-size: 11px; text-transform: uppercase; color: #666; }

                    /* Tables */
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
                    th, td { border-bottom: 1px solid #eee; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; font-weight: bold; color: #444; border-bottom: 2px solid #ddd; }
                    tr:nth-child(even) { background-color: #fbfbfb; }

                    /* Footer */
                    .footer { position: fixed; bottom: 10px; left: 0; width: 100%; text-align: center; font-size: 9pt; color: #999; border-top: 1px solid #eee; padding-top: 10px; background: white; }
                    
                    @media print {
                        body { padding: 0; }
                        .footer { position: fixed; bottom: 0; }
                    }
                </style>
            </head>
            <body>
                
                <div class="header-container">
                    <div>
                        ${logoBase64 ? `<img src="${logoBase64}" class="logo" />` : '<h2>AIManager</h2>'}
                    </div>
                    <div class="report-title">
                        <h1>Ficha da Entidade</h1>
                        <div class="subtitle">Relatório de Inventário e RH</div>
                    </div>
                </div>

                <div class="summary-box">
                    <div class="kpi">
                        <span class="kpi-val">${activeCollaborators.length}</span>
                        <span class="kpi-lbl">Colaboradores</span>
                    </div>
                    <div class="kpi">
                        <span class="kpi-val">${associatedEquipment.length}</span>
                        <span class="kpi-lbl">Equipamentos</span>
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
                            <div class="info-item"><span class="label">Nome da Entidade</span><div class="value">${entidade.name}</div></div>
                            <div class="info-item"><span class="label">Código</span><div class="value">${entidade.codigo}</div></div>
                            <div class="info-item"><span class="label">Instituição Mãe</span><div class="value">${instituicao?.name || 'N/A'}</div></div>
                        </div>
                        <div>
                            <div class="info-item"><span class="label">Responsável</span><div class="value">${entidade.responsavel || '-'}</div></div>
                            <div class="info-item"><span class="label">Email</span><div class="value">${entidade.email}</div></div>
                            <div class="info-item"><span class="label">Telefone</span><div class="value">${entidade.telefone || '-'}</div></div>
                        </div>
                    </div>
                </div>
                
                ${activeCollaborators.length > 0 ? `
                <div class="section">
                    <h3>Recursos Humanos (${activeCollaborators.length})</h3>
                    <table>
                        <thead>
                            <tr><th>Nome</th><th>Função</th><th>Email</th><th>Telefone</th></tr>
                        </thead>
                        <tbody>
                            ${collaboratorRows}
                        </tbody>
                    </table>
                </div>` : ''}

                ${associatedEquipment.length > 0 ? `
                <div class="section">
                    <h3>Inventário de Ativos (${associatedEquipment.length})</h3>
                    <table>
                        <thead>
                            <tr><th>Descrição</th><th>Marca/Tipo</th><th>Nº Série</th><th>Atribuído a</th><th style="text-align: right;">Custo</th></tr>
                        </thead>
                        <tbody>
                            ${equipmentRows}
                        </tbody>
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
        <Modal title={`Detalhes: ${entidade.name}`} onClose={onClose} maxWidth="max-w-4xl">
            <div className="flex flex-col h-[80vh]">
                {/* Header */}
                <div className="flex-shrink-0 flex items-start gap-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700 mb-4">
                    <div className="p-3 bg-brand-primary/20 rounded-full text-brand-secondary">
                        <OfficeBuildingIcon className="h-8 w-8" />
                    </div>
                    <div className="flex-grow">
                        <h2 className="text-xl font-bold text-white">{entidade.name}</h2>
                        <p className="text-sm text-on-surface-dark-secondary">Código: <span className="font-mono text-white">{entidade.codigo}</span></p>
                        {instituicao && (
                            <p 
                                className={`text-sm mt-1 ${onOpenInstitution ? 'text-brand-secondary hover:text-white hover:underline cursor-pointer' : 'text-gray-400'}`}
                                onClick={() => onOpenInstitution && onOpenInstitution(instituicao)}
                                title={onOpenInstitution ? "Ver detalhes da instituição" : undefined}
                            >
                                {instituicao.name}
                            </p>
                        )}
                        {!instituicao && <p className="text-sm text-gray-500 mt-1">Instituição não definida</p>}
                        {entidade.website && (
                            <a href={entidade.website.startsWith('http') ? entidade.website : `https://${entidade.website}`} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-secondary hover:underline flex items-center gap-1 mt-1">
                                <FaGlobe className="h-3 w-3"/> {entidade.website}
                            </a>
                        )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className="flex gap-2">
                            <button 
                                onClick={handlePrint} 
                                className="px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors flex items-center gap-2"
                            >
                                <FaPrint /> Imprimir Relatório
                            </button>
                            <button 
                                onClick={() => { onClose(); onEdit(); }} 
                                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors"
                            >
                                Editar Dados
                            </button>
                        </div>
                        <span className={`block text-xs font-bold px-2 py-1 rounded ${entidade.status === 'Ativo' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                            {entidade.status}
                        </span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-700 mb-4 flex-shrink-0">
                    <button 
                        onClick={() => setActiveTab('info')} 
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'info' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        Geral
                    </button>
                    <button 
                        onClick={() => setActiveTab('collaborators')} 
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'collaborators' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        Colaboradores <span className="bg-gray-700 px-1.5 py-0.5 rounded text-xs">{activeCollaborators.length}</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('equipment')} 
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'equipment' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        Equipamentos <span className="bg-gray-700 px-1.5 py-0.5 rounded text-xs">{associatedEquipment.length}</span>
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                    {activeTab === 'info' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-white uppercase tracking-wider border-b border-gray-700 pb-2">Contactos Principais</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2 text-gray-300">
                                        <FaUserTag className="text-gray-500" />
                                        <span className="text-gray-500 w-24">Responsável:</span>
                                        <span>{entidade.responsavel || '—'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-300">
                                        <FaEnvelope className="text-gray-500" />
                                        <span className="text-gray-500 w-24">Email:</span>
                                        <a href={`mailto:${entidade.email}`} className="hover:text-brand-secondary transition-colors">{entidade.email}</a>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-300">
                                        <FaPhone className="text-gray-500" />
                                        <span className="text-gray-500 w-24">Telefone:</span>
                                        <span>{entidade.telefone || '—'}</span>
                                    </div>
                                     <div className="flex items-center gap-2 text-gray-300">
                                        <span className="text-gray-500 w-8"></span>
                                        <span className="text-gray-500 w-24">Telemóvel:</span>
                                        <span>{entidade.telemovel || '—'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-white uppercase tracking-wider border-b border-gray-700 pb-2">Localização & Notas</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-start gap-2 text-gray-300">
                                        <div className="bg-gray-800 p-2 rounded-full mt-1"><FaMapMarkerAlt className="text-gray-400" /></div>
                                        <div>
                                            <p>{entidade.address_line || 'Endereço não definido'}</p>
                                            <p>{entidade.postal_code} {entidade.locality}</p>
                                            <p>{entidade.city}</p>
                                        </div>
                                    </div>
                                </div>
                                {entidade.description && (
                                    <div className="bg-gray-900/30 p-3 rounded border border-gray-700 text-sm text-gray-400 mt-4">
                                        {entidade.description}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'collaborators' && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Colaboradores Internos</h3>
                                {onAddCollaborator && (
                                    <button 
                                        onClick={() => { onClose(); onAddCollaborator(entidade.id); }}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-sm rounded transition-colors"
                                    >
                                        <FaPlus /> Novo Colaborador
                                    </button>
                                )}
                            </div>
                            {activeCollaborators.length > 0 ? (
                                <div className="space-y-2">
                                    {activeCollaborators.map(col => (
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
                                            <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">{col.role}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-gray-500 py-8 bg-gray-900/20 rounded border border-dashed border-gray-700">Nenhum colaborador associado.</p>
                            )}
                        </div>
                    )}

                    {activeTab === 'equipment' && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Inventário de Equipamentos</h3>
                                {onAssignEquipment && (
                                    <button 
                                        onClick={() => { onClose(); onAssignEquipment(entidade.id); }}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded transition-colors"
                                    >
                                        <FaPlus /> Adicionar Equipamento (Novo)
                                    </button>
                                )}
                            </div>
                            <div className="bg-blue-900/20 border border-blue-500/30 p-3 rounded text-xs text-blue-200 mb-4">
                                <p>Esta lista inclui equipamentos atribuídos à entidade (localização) e aos seus colaboradores.</p>
                            </div>
                            
                            {associatedEquipment.length > 0 ? (
                                <div className="overflow-x-auto border border-gray-700 rounded">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-800 text-xs uppercase text-gray-400">
                                            <tr>
                                                <th className="px-4 py-3">Descrição</th>
                                                <th className="px-4 py-3">Marca / Tipo</th>
                                                <th className="px-4 py-3">Nº Série</th>
                                                <th className="px-4 py-3">Atribuído a</th>
                                                <th className="px-4 py-3 text-right">Custo</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-700">
                                            {associatedEquipment.map(eq => (
                                                <tr key={eq.id || Math.random()} className="bg-surface-dark hover:bg-gray-700/50">
                                                    <td className="px-4 py-2 text-white font-medium">{eq.description}</td>
                                                    <td className="px-4 py-2 text-gray-300 text-xs">
                                                        {brandMap.get(eq.brandId || '')} {typeMap.get(eq.typeId || '')}
                                                    </td>
                                                    <td className="px-4 py-2 font-mono text-xs text-gray-400">{eq.serialNumber}</td>
                                                    <td className="px-4 py-2 text-gray-300">{eq.assignedToName}</td>
                                                    <td className="px-4 py-2 text-gray-400 text-xs text-right">
                                                        € {(eq.acquisitionCost || 0).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-gray-800/50">
                                            <tr>
                                                <td colSpan={4} className="px-4 py-2 text-right font-bold text-white">TOTAL:</td>
                                                <td className="px-4 py-2 text-right font-bold text-green-400">
                                                    € {associatedEquipment.reduce((sum, e) => sum + (e.acquisitionCost||0), 0).toLocaleString()}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center text-gray-500 py-12 bg-gray-900/20 rounded border border-dashed border-gray-700">
                                    <FaLaptop className="mx-auto text-2xl mb-2 opacity-50"/>
                                    <p>Nenhum equipamento ativo nesta entidade.</p>
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

export default EntidadeDetailModal;
