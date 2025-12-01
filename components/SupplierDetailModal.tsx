import React, { useState } from 'react';
import Modal from './common/Modal';
import { Supplier, CriticalityLevel } from '../types';
// FIX: Import FaCheck icon
import { FaShieldAlt, FaPhone, FaEnvelope, FaGlobe, FaCheckCircle, FaTimesCircle, FaMapMarkerAlt, FaCertificate, FaDownload, FaFileContract, FaDoorOpen, FaPrint, FaUserTie, FaCopy, FaPaperPlane, FaCheck } from './common/Icons';
import * as dataService from '../services/dataService';

interface SupplierDetailModalProps {
    supplier: Supplier;
    onClose: () => void;
    onEdit: () => void;
}

const getRiskClass = (level: CriticalityLevel) => {
    switch (level) {
        case CriticalityLevel.Critical: return 'bg-red-600 text-white';
        case CriticalityLevel.High: return 'bg-orange-600 text-white';
        case CriticalityLevel.Medium: return 'bg-yellow-600 text-white';
        case CriticalityLevel.Low: return 'bg-green-600 text-white';
        default: return 'bg-gray-700 text-gray-300';
    }
};

const SupplierDetailModal: React.FC<SupplierDetailModalProps> = ({ supplier, onClose, onEdit }) => {
    
    const [copied, setCopied] = useState(false);

    const handleCopyEmailTemplate = () => {
        const body = `Exmos. Senhores,\n\nPara mantermos os nossos registos atualizados, solicitamos o preenchimento do formulário em anexo com os vossos dados de contacto e informação relevante.\n\nAtenciosamente,\n[A Sua Empresa]`;
        navigator.clipboard.writeText(body);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handlePrint = async (formMode: boolean = false) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const [logoBase64, sizeStr] = await Promise.all([
            dataService.getGlobalSetting('app_logo_base64'),
            dataService.getGlobalSetting('app_logo_size')
        ]);
        const logoSize = sizeStr ? parseInt(sizeStr) : 80;
        const logoHtml = logoBase64 ? `<div style="text-align: center; margin-bottom: 20px;"><img src="${logoBase64}" alt="Logótipo" style="max-height: ${logoSize}px; display: inline-block;" /></div>` : '';
        
        const title = formMode ? `Formulário de Atualização de Dados: ${supplier.name}` : `Ficha do Fornecedor - ${supplier.name}`;

        const contractsRows = (supplier.contracts || []).map(c => `
            <tr>
                <td>${c.ref_number}</td>
                <td>${c.description}</td>
                <td>${c.end_date}</td>
                <td>${c.is_active ? 'Ativo' : 'Inativo'}</td>
            </tr>
        `).join('');

        const extraContactsRows = (supplier.contacts || []).map(c => `
            <tr>
                <td>${formMode ? '' : `${c.name} (${c.title || '-'})`}</td>
                <td>${formMode ? '' : c.role || '-'}</td>
                <td>${formMode ? '' : c.email || '-'}</td>
                <td>${formMode ? '' : c.phone || '-'}</td>
            </tr>
        `).join('');
        
        // Add blank rows for form mode
        const blankContactRows = formMode ? Array(3).fill('<tr><td>&nbsp;</td><td></td><td></td><td></td></tr>').join('') : '';

        printWindow.document.write(`
            <html>
            <head>
                <title>${title}</title>
                <style>
                    body { font-family: sans-serif; padding: 20px; color: #333; }
                    h1 { border-bottom: 2px solid #0D47A1; padding-bottom: 10px; color: #0D47A1; }
                    .section { margin-bottom: 20px; page-break-inside: avoid; }
                    .label { font-weight: bold; color: #666; font-size: 12px; text-transform: uppercase; }
                    .value { font-size: 16px; margin-bottom: 15px; border-bottom: 1px dotted #ccc; min-height: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; min-height: 24px; }
                    th { background-color: #f2f2f2; }
                    h3 { margin-top: 0; color: #444; font-size: 16px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
                </style>
            </head>
            <body>
                ${logoHtml}
                <h1>${title}</h1>
                <div class="section">
                    <div class="label">NIF</div>
                    <div class="value">${formMode ? '' : supplier.nif || 'N/A'}</div>
                    <div class="label">Website</div>
                    <div class="value">${formMode ? '' : supplier.website || '-'}</div>
                </div>
                <div class="section">
                    <h3>Contactos Gerais</h3>
                    <div class="label">Nome</div>
                    <div class="value">${formMode ? '' : supplier.contact_name || '-'}</div>
                    <div class="label">Email</div>
                    <div class="value">${formMode ? '' : supplier.contact_email || '-'}</div>
                    <div class="label">Telefone</div>
                    <div class="value">${formMode ? '' : supplier.contact_phone || '-'}</div>
                </div>
                
                <div class="section">
                    <h3>Pessoas de Contacto</h3>
                    <table>
                        <thead><tr><th>Nome (Trato)</th><th>Função</th><th>Email</th><th>Telefone</th></tr></thead>
                        <tbody>${extraContactsRows}${blankContactRows}</tbody>
                    </table>
                </div>
                
                <p style="font-size: 10px; color: #888; text-align: center; margin-top: 30px;">Por favor, devolva este formulário preenchido para o nosso departamento de compras.</p>
                <script>window.onload = function() { window.print(); }</script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };


    return (
        <Modal title={`Detalhes do Fornecedor: ${supplier.name}`} onClose={onClose} maxWidth="max-w-4xl">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start gap-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                    <div className="p-3 bg-brand-primary/20 rounded-full text-brand-secondary">
                        <FaShieldAlt className="h-8 w-8" />
                    </div>
                    <div className="flex-grow">
                        <h2 className="text-xl font-bold text-white">{supplier.name}</h2>
                        {supplier.nif && <p className="text-sm text-gray-400">NIF: <span className="font-mono text-white">{supplier.nif}</span></p>}
                        {supplier.website && (
                            <a href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-secondary hover:underline flex items-center gap-1 mt-1">
                                <FaGlobe className="h-3 w-3"/> {supplier.website}
                            </a>
                        )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className="flex gap-2">
                             <div className="flex bg-gray-700 rounded-md">
                                <button onClick={() => handlePrint(true)} className="px-3 py-2 text-sm hover:bg-gray-600 text-white rounded-l-md transition-colors flex items-center gap-2" title="Gerar Formulário em Branco"><FaPaperPlane /> Solicitar</button>
                                <button onClick={handleCopyEmailTemplate} className="px-3 py-2 text-sm hover:bg-gray-600 text-white border-l border-gray-500 rounded-r-md" title="Copiar Modelo de Email">{copied ? <FaCheck className="text-green-400" /> : <FaCopy />}</button>
                            </div>
                            <button onClick={() => handlePrint(false)} className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors shadow-lg flex items-center gap-2"><FaPrint /> Imprimir</button>
                            <button onClick={() => { onClose(); onEdit(); }} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors shadow-lg">Editar Dados</button>
                        </div>
                        <span className={`px-3 py-1 text-xs rounded border font-bold ${getRiskClass(supplier.risk_level)}`}>
                            Risco: {supplier.risk_level}
                        </span>
                    </div>
                </div>
                {/* ... Rest of the modal content remains unchanged ... */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-surface-dark border border-gray-700 p-4 rounded-lg">
                        <h3 className="text-sm font-semibold text-white uppercase tracking-wider border-b border-gray-700 pb-2 mb-3">Conformidade NIS2</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 text-sm">Certificado ISO 27001:</span>
                                {supplier.is_iso27001_certified ? (
                                    <span className="flex items-center gap-1 text-green-400 text-sm font-bold"><FaCheckCircle/> Sim</span>
                                ) : (
                                    <span className="flex items-center gap-1 text-gray-500 text-sm"><FaTimesCircle/> Não</span>
                                )}
                            </div>
                            {supplier.is_iso27001_certified && supplier.iso_certificate_expiry && (
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400 text-sm">Validade ISO:</span>
                                    <span className="text-white text-sm font-mono">{supplier.iso_certificate_expiry}</span>
                                </div>
                            )}
                            <div className="mt-2">
                                <p className="text-xs text-gray-500 uppercase mb-1">Contacto de Segurança (PSIRT)</p>
                                <p className="text-sm text-white font-mono bg-gray-800 p-2 rounded truncate">
                                    {supplier.security_contact_email || 'Não definido'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-surface-dark border border-gray-700 p-4 rounded-lg">
                        <h3 className="text-sm font-semibold text-white uppercase tracking-wider border-b border-gray-700 pb-2 mb-3">Contactos Gerais</h3>
                        <div className="space-y-2 text-sm">
                            <p className="text-white font-semibold">{supplier.contact_name || 'Geral'}</p>
                            <div className="flex items-center gap-2 text-gray-300">
                                <FaEnvelope className="text-gray-500" />
                                <a href={`mailto:${supplier.contact_email}`} className="hover:text-brand-secondary">{supplier.contact_email || '—'}</a>
                            </div>
                            <div className="flex items-center gap-2 text-gray-300">
                                <FaPhone className="text-gray-500" />
                                <span>{supplier.contact_phone || '—'}</span>
                            </div>
                            <div className="flex items-start gap-2 text-gray-300 mt-2 pt-2 border-t border-gray-700">
                                <FaMapMarkerAlt className="text-gray-500 mt-1" />
                                <div>
                                    <p>{supplier.address_line}</p>
                                    <p>{supplier.postal_code} {supplier.locality}</p>
                                    <p>{supplier.city}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                {supplier.contacts && supplier.contacts.length > 0 && (
                    <div className="bg-surface-dark border border-gray-700 p-4 rounded-lg">
                        <h3 className="text-sm font-semibold text-white uppercase tracking-wider border-b border-gray-700 pb-2 mb-3 flex items-center gap-2"><FaUserTie /> Pessoas de Contacto ({supplier.contacts.length})</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                            {supplier.contacts.map(contact => (
                                <div key={contact.id} className="bg-gray-800 p-3 rounded border border-gray-700 flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-white text-sm">{contact.title ? `${contact.title} ` : ''}{contact.name}</p>
                                        <p className="text-xs text-brand-secondary mb-1">{contact.role}</p>
                                        <div className="text-xs text-gray-400 space-y-0.5">
                                            {contact.email && <div className="flex items-center gap-1"><FaEnvelope className="h-3 w-3"/> {contact.email}</div>}
                                            {contact.phone && <div className="flex items-center gap-1"><FaPhone className="h-3 w-3"/> {contact.phone}</div>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {supplier.contracts && supplier.contracts.length > 0 && (
                    <div className="bg-gray-900/20 border border-blue-900/50 p-4 rounded-lg">
                        <h3 className="text-sm font-bold text-blue-200 uppercase tracking-wider border-b border-blue-900/50 pb-2 mb-3 flex items-center gap-2"><FaFileContract /> Registo de Contratos (DORA Art. 28º)</h3>
                        <div className="grid grid-cols-1 gap-3">
                            {supplier.contracts.map((contract, idx) => (
                                <div key={idx} className="bg-surface-dark p-3 rounded border border-gray-700 relative group">
                                    <div className="flex justify-between items-start mb-2"><p className="text-brand-secondary font-bold text-sm">{contract.ref_number}</p><span className={`text-[10px] px-2 py-0.5 rounded ${contract.is_active ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'}`}>{contract.is_active ? 'Ativo' : 'Inativo'}</span></div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-400 mb-2">
                                        <div><span className="block text-[10px] uppercase">Início</span> {contract.start_date}</div>
                                        <div><span className="block text-[10px] uppercase">Fim</span> {contract.end_date}</div>
                                        <div><span className="block text-[10px] uppercase">Pré-Aviso</span> {contract.notice_period_days} dias</div>
                                        <div><span className="block text-[10px] uppercase">Serviços</span> {contract.supported_service_ids?.length || 0}</div>
                                    </div>
                                    {contract.exit_strategy && (<div className="text-xs bg-gray-900 p-2 rounded text-gray-300 italic border-l-2 border-red-500"><div className="flex items-center gap-1 font-bold text-red-400 mb-1"><FaDoorOpen /> Estratégia de Saída:</div>{contract.exit_strategy}</div>)}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex justify-end pt-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Fechar</button>
                </div>
            </div>
        </Modal>
    );
};

export default SupplierDetailModal;