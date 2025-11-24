


import React from 'react';
import Modal from './common/Modal';
import { Instituicao, Entidade } from '../types';
import { FaSitemap, FaPhone, FaEnvelope, FaMapMarkerAlt, FaPlus, FaPrint } from './common/Icons';

interface InstituicaoDetailModalProps {
    instituicao: Instituicao;
    entidades: Entidade[];
    onClose: () => void;
    onEdit: () => void;
    onAddEntity?: (instituicaoId: string) => void;
}

const InstituicaoDetailModal: React.FC<InstituicaoDetailModalProps> = ({ instituicao, entidades, onClose, onEdit, onAddEntity }) => {
    const relatedEntidades = entidades.filter(e => e.instituicaoId === instituicao.id);

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

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
                    <h3>Contactos</h3>
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
                <div class="section">
                    <h3>Entidades Associadas (${relatedEntidades.length})</h3>
                    <ul>
                        ${relatedEntidades.map(e => `<li>${e.name} (${e.codigo})</li>`).join('')}
                    </ul>
                </div>
                <script>window.onload = function() { window.print(); }</script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <Modal title={`Detalhes: ${instituicao.name}`} onClose={onClose} maxWidth="max-w-3xl">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start gap-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700 relative">
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

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-white uppercase tracking-wider border-b border-gray-700 pb-2">Contactos</h3>
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

                {/* Stats */}
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
                            <ul className="mt-2 space-y-1 text-sm text-gray-300 max-h-32 overflow-y-auto custom-scrollbar pr-2">
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

                <div className="flex justify-end pt-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">
                        Fechar
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default InstituicaoDetailModal;