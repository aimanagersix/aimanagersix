


import React, { useState, useMemo } from 'react';
import Modal from './common/Modal';
import { Instituicao, Entidade, Collaborator } from '../types';
import { FaSitemap, FaPhone, FaEnvelope, FaMapMarkerAlt, FaPlus, FaPrint, FaUserTie, FaUsers } from './common/Icons';

interface InstituicaoDetailModalProps {
    instituicao: Instituicao;
    entidades: Entidade[];
    collaborators?: Collaborator[]; // New prop
    onClose: () => void;
    onEdit: () => void;
    onAddEntity?: (instituicaoId: string) => void;
}

const InstituicaoDetailModal: React.FC<InstituicaoDetailModalProps> = ({ instituicao, entidades, collaborators = [], onClose, onEdit, onAddEntity }) => {
    const [activeTab, setActiveTab] = useState<'info' | 'contacts' | 'collabs'>('info');
    const relatedEntidades = entidades.filter(e => e.instituicaoId === instituicao.id);
    
    // Filter collaborators belonging to entities of this institution
    const relatedCollaborators = useMemo(() => {
        const entityIds = new Set(relatedEntidades.map(e => e.id));
        return collaborators.filter(c => entityIds.has(c.entidadeId));
    }, [collaborators, relatedEntidades]);

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const contactsRows = (instituicao.contacts || []).map(c => `
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
                <title>Ficha da Instituição - ${instituicao.name}</title>
                <style>
                    body { font-family: sans-serif; padding: 20px; color: #333; }
                    h1 { border-bottom: 2px solid #0D47A1; padding-bottom: 10px; color: #0D47A1; }
                    .section { margin-bottom: 20px; }
                    .label { font-weight: bold; color: #666; font-size: 12px; text-transform: uppercase; }
                    .value { font-size: 16px; margin-bottom: 5px; }
                    ul { list-style-type: none; padding: 0; }
                    li { padding: 5px 0; border-bottom: 1px solid #eee; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                </style>
            </head>
            <body>
                <h1>${instituicao.name}</h1>
                <div class="section">
                    <div class="label">Código</div>
                    <div class="value">${instituicao.codigo}</div>
                    <div class="label">NIF</div>
                    <div class="value">${instituicao.nif || 'N/A'}</div>
                </div>
                <div class="section">
                    <h3>Contactos Gerais</h3>
                    <div class="label">Email</div>
                    <div class="value">${instituicao.email}</div>
                    <div class="label">Telefone</div>
                    <div class="value">${instituicao.telefone}</div>
                </div>
                <div class="section">
                    <h3>Morada</h3>
                    <div class="value">${instituicao.address_line || ''}</div>
                    <div class="value">${instituicao.postal_code || ''} ${instituicao.locality || ''}</div>
                    <div class="value">${instituicao.city || ''}</div>
                </div>
                
                ${(instituicao.contacts && instituicao.contacts.length > 0) ? `
                <div class="section">
                    <h3>Contactos Adicionais</h3>
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
                    <h3>Entidades Associadas (${relatedEntidades.length})</h3>
                    <ul>
                        ${relatedEntidades.map(e => `<li>${e.name} (${e.codigo})</li>`).join('')}
                    </ul>
                </div>
                
                <div class="section">
                    <h3>Total de Colaboradores: ${relatedCollaborators.length}</h3>
                </div>
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
                    </div>
                    <div className="flex flex-col gap-2">
                        <button 
                            onClick={handlePrint} 
                            className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors shadow-lg flex items-center gap-2"
                        >
                            <FaPrint /> Imprimir Ficha
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
                        onClick={() => setActiveTab('contacts')} 
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'contacts' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        Contactos Adicionais <span className="bg-gray-700 px-1.5 py-0.5 rounded text-xs">{(instituicao.contacts?.length || 0)}</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('collabs')} 
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'collabs' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        Colaboradores <span className="bg-gray-700 px-1.5 py-0.5 rounded text-xs">{relatedCollaborators.length}</span>
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
                                                <li key={e.id} className="flex justify-between border-b border-gray-800 py-1 last:border-0">
                                                    <span>{e.name}</span>
                                                    <span className="text-xs text-gray-500 bg-gray-900 px-1 rounded">{e.codigo}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'contacts' && (
                        <div>
                            <h3 className="text-sm font-semibold text-white uppercase tracking-wider border-b border-gray-700 pb-2 mb-4">Contactos Adicionais</h3>
                            {instituicao.contacts && instituicao.contacts.length > 0 ? (
                                <div className="space-y-2">
                                    {instituicao.contacts.map((contact, idx) => {
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
                                    Nenhum contacto adicional registado. Clique em "Editar Dados" para adicionar.
                                </p>
                            )}
                        </div>
                    )}

                    {activeTab === 'collabs' && (
                        <div>
                            <h3 className="text-sm font-semibold text-white uppercase tracking-wider border-b border-gray-700 pb-2 mb-4">
                                Todos os Colaboradores ({relatedCollaborators.length})
                            </h3>
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
