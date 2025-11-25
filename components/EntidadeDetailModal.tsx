
import React, { useState } from 'react';
import Modal from './common/Modal';
import { Entidade, Instituicao, Collaborator, Assignment } from '../types';
import { OfficeBuildingIcon, FaPhone, FaEnvelope, FaUserTag, FaMapMarkerAlt, FaPlus, FaUsers, FaLaptop, FaPrint, FaUserTie } from './common/Icons';

interface EntidadeDetailModalProps {
    entidade: Entidade;
    instituicao?: Instituicao;
    collaborators: Collaborator[];
    assignments?: Assignment[];
    onClose: () => void;
    onEdit: () => void;
    onAddCollaborator?: (entidadeId: string) => void;
    onAssignEquipment?: (entidadeId: string) => void;
}

const EntidadeDetailModal: React.FC<EntidadeDetailModalProps> = ({ entidade, instituicao, collaborators, assignments = [], onClose, onEdit, onAddCollaborator, onAssignEquipment }) => {
    const [activeTab, setActiveTab] = useState<'info' | 'contacts_extra' | 'collaborators' | 'equipment'>('info');
    
    const activeCollaborators = collaborators.filter(c => c.entidadeId === entidade.id);
    const associatedEquipmentCount = assignments.filter(a => a.entidadeId === entidade.id && !a.returnDate).length;

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const contactsRows = (entidade.contacts || []).map(c => `
            <tr>
                <td>${c.name}</td>
                <td>${c.role || '-'}</td>
                <td>${c.email || '-'}</td>
                <td>${c.phone || '-'}</td>
            </tr>
        `).join('');

        printWindow.document.write(`
            <html>
            <head>
                <title>Ficha da Entidade - ${entidade.name}</title>
                <style>
                    body { font-family: sans-serif; padding: 20px; color: #333; }
                    h1 { border-bottom: 2px solid #0D47A1; padding-bottom: 10px; color: #0D47A1; }
                    .section { margin-bottom: 20px; }
                    .label { font-weight: bold; color: #666; font-size: 12px; text-transform: uppercase; }
                    .value { font-size: 16px; margin-bottom: 5px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                </style>
            </head>
            <body>
                <h1>${entidade.name}</h1>
                <div class="section">
                    <div class="label">Instituição</div>
                    <div class="value">${instituicao?.name || 'N/A'}</div>
                    <div class="label">Código</div>
                    <div class="value">${entidade.codigo}</div>
                </div>
                <div class="section">
                    <h3>Contactos Principais</h3>
                    <div class="label">Responsável</div>
                    <div class="value">${entidade.responsavel || '-'}</div>
                    <div class="label">Email</div>
                    <div class="value">${entidade.email}</div>
                    <div class="label">Telefone</div>
                    <div class="value">${entidade.telefone || '-'}</div>
                </div>
                <div class="section">
                    <h3>Morada</h3>
                    <div class="value">${entidade.address_line || ''}</div>
                    <div class="value">${entidade.postal_code || ''} ${entidade.locality || ''}</div>
                    <div class="value">${entidade.city || ''}</div>
                </div>
                
                ${(entidade.contacts && entidade.contacts.length > 0) ? `
                <div class="section">
                    <h3>Contactos Adicionais (Externos)</h3>
                    <table>
                        <thead>
                            <tr><th>Nome</th><th>Função</th><th>Email</th><th>Telefone</th></tr>
                        </thead>
                        <tbody>
                            ${contactsRows}
                        </tbody>
                    </table>
                </div>` : ''}

                <div class="section">
                    <h3>Resumo</h3>
                    <div class="value">Colaboradores Internos: ${activeCollaborators.length}</div>
                    <div class="value">Equipamentos: ${associatedEquipmentCount}</div>
                </div>
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
                        <p className="text-sm text-brand-secondary mt-1">{instituicao?.name || 'Instituição não definida'}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className="flex gap-2">
                            <button 
                                onClick={handlePrint} 
                                className="px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors flex items-center gap-2"
                            >
                                <FaPrint /> Imprimir
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
                        onClick={() => setActiveTab('contacts_extra')} 
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'contacts_extra' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        Contactos Extra <span className="bg-gray-700 px-1.5 py-0.5 rounded text-xs">{(entidade.contacts?.length || 0)}</span>
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
                        Equipamentos <span className="bg-gray-700 px-1.5 py-0.5 rounded text-xs">{associatedEquipmentCount}</span>
                    </button>
                </div>

                {/* Content */}
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
                                        <FaMapMarkerAlt className="text-gray-500 mt-1" />
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

                    {activeTab === 'contacts_extra' && (
                        <div>
                            <h3 className="text-sm font-semibold text-white uppercase tracking-wider border-b border-gray-700 pb-2 mb-4">Contactos Adicionais (Secretaria, Receção, etc.)</h3>
                            {entidade.contacts && entidade.contacts.length > 0 ? (
                                <div className="space-y-2">
                                    {entidade.contacts.map((contact, idx) => {
                                        const isActive = contact.is_active !== false;
                                        return (
                                            <div key={idx} className={`p-3 rounded border flex justify-between items-center ${isActive ? 'bg-gray-800 border-gray-700' : 'bg-gray-800/50 border-gray-700 opacity-70'}`}>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className={`font-bold text-sm flex items-center gap-2 ${isActive ? 'text-white' : 'text-gray-400'}`}>
                                                            <FaUserTie className={isActive ? "text-gray-400" : "text-gray-600"}/> 
                                                            {contact.title && <span className="font-normal">{contact.title}</span>}
                                                            {contact.name} 
                                                        </p>
                                                        <span className="text-xs font-normal bg-gray-700 px-2 rounded text-gray-300">{contact.role}</span>
                                                        {!isActive && <span className="text-[10px] uppercase bg-red-900/50 text-red-300 px-1 rounded">Inativo</span>}
                                                    </div>
                                                    <div className="text-xs text-gray-400 flex gap-3 mt-1">
                                                        {contact.email && <span className="flex items-center gap-1"><FaEnvelope className="h-3 w-3"/> {contact.email}</span>}
                                                        {contact.phone && <span className="flex items-center gap-1"><FaPhone className="h-3 w-3"/> {contact.phone}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-center text-gray-500 py-8 bg-gray-900/20 rounded border border-dashed border-gray-700">
                                    Nenhum contacto adicional registado.
                                </p>
                            )}
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
                                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Equipamentos Associados</h3>
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
                                <p>Para associar equipamentos já existentes em stock, utilize o menu "Inventário" e selecione a opção "Atribuir".</p>
                            </div>
                            
                            <div className="text-center text-gray-500 py-4">
                                <FaLaptop className="mx-auto text-2xl mb-2 opacity-50"/>
                                <p>{associatedEquipmentCount} equipamentos ativos nesta entidade.</p>
                                <p className="text-xs mt-1">(Consulte o relatório da entidade para detalhes completos)</p>
                            </div>
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
