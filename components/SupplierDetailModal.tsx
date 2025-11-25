





import React from 'react';
import Modal from './common/Modal';
import { Supplier, CriticalityLevel } from '../types';
import { FaShieldAlt, FaPhone, FaEnvelope, FaGlobe, FaCheckCircle, FaTimesCircle, FaMapMarkerAlt, FaCertificate, FaDownload, FaFileContract, FaDoorOpen, FaPrint, FaUserTie } from './common/Icons';

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
    
    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

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
                <td>${c.name} (${c.title || '-'})</td>
                <td>${c.role || '-'}</td>
                <td>${c.email || '-'}</td>
                <td>${c.phone || '-'}</td>
            </tr>
        `).join('');

        printWindow.document.write(`
            <html>
            <head>
                <title>Ficha do Fornecedor - ${supplier.name}</title>
                <style>
                    body { font-family: sans-serif; padding: 20px; color: #333; }
                    h1 { border-bottom: 2px solid #0D47A1; padding-bottom: 10px; color: #0D47A1; }
                    .section { margin-bottom: 20px; }
                    .label { font-weight: bold; color: #666; font-size: 12px; text-transform: uppercase; }
                    .value { font-size: 16px; margin-bottom: 5px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
                    th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
                    th { background-color: #f2f2f2; }
                </style>
            </head>
            <body>
                <h1>${supplier.name}</h1>
                <div class="section">
                    <div class="label">NIF</div>
                    <div class="value">${supplier.nif || 'N/A'}</div>
                    <div class="label">Website</div>
                    <div class="value">${supplier.website || '-'}</div>
                </div>
                <div class="section">
                    <h3>Contactos Gerais</h3>
                    <div class="label">Nome</div>
                    <div class="value">${supplier.contact_name || '-'}</div>
                    <div class="label">Email</div>
                    <div class="value">${supplier.contact_email || '-'}</div>
                    <div class="label">Telefone</div>
                    <div class="value">${supplier.contact_phone || '-'}</div>
                </div>
                
                ${(supplier.contacts && supplier.contacts.length > 0) ? `
                <div class="section">
                    <h3>Pessoas de Contacto</h3>
                    <table>
                        <thead>
                            <tr><th>Nome</th><th>Função</th><th>Email</th><th>Telefone</th></tr>
                        </thead>
                        <tbody>
                            ${extraContactsRows}
                        </tbody>
                    </table>
                </div>` : ''}

                <div class="section">
                    <h3>Compliance & Risco</h3>
                    <div class="value">Nível de Risco: ${supplier.risk_level}</div>
                    <div class="value">ISO 27001: ${supplier.is_iso27001_certified ? 'Sim' : 'Não'}</div>
                </div>
                
                ${(supplier.contracts && supplier.contracts.length > 0) ? `
                <div class="section">
                    <h3>Contratos</h3>
                    <table>
                        <thead>
                            <tr><th>Ref</th><th>Descrição</th><th>Fim</th><th>Estado</th></tr>
                        </thead>
                        <tbody>
                            ${contractsRows}
                        </tbody>
                    </table>
                </div>` : ''}

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
                            <button 
                                onClick={handlePrint}
                                className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors shadow-lg flex items-center gap-2"
                            >
                                <FaPrint /> Imprimir
                            </button>
                            <button 
                                onClick={() => { onClose(); onEdit(); }} 
                                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors shadow-lg"
                            >
                                Editar Dados
                            </button>
                        </div>
                        <span className={`px-3 py-1 text-xs rounded border font-bold ${getRiskClass(supplier.risk_level)}`}>
                            Risco: {supplier.risk_level}
                        </span>
                    </div>
                </div>

                {/* Compliance & Certifications */}
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
                
                {/* Additional Contacts List */}
                {supplier.contacts && supplier.contacts.length > 0 && (
                    <div className="bg-surface-dark border border-gray-700 p-4 rounded-lg">
                        <h3 className="text-sm font-semibold text-white uppercase tracking-wider border-b border-gray-700 pb-2 mb-3 flex items-center gap-2">
                            <FaUserTie /> Pessoas de Contacto ({supplier.contacts.length})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                            {supplier.contacts.map(contact => (
                                <div key={contact.id} className="bg-gray-800 p-3 rounded border border-gray-700 flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-white text-sm">
                                            {contact.title ? `${contact.title} ` : ''}{contact.name}
                                        </p>
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

                {/* Contracts Section (DORA) */}
                {supplier.contracts && supplier.contracts.length > 0 && (
                    <div className="bg-gray-900/20 border border-blue-900/50 p-4 rounded-lg">
                        <h3 className="text-sm font-bold text-blue-200 uppercase tracking-wider border-b border-blue-900/50 pb-2 mb-3 flex items-center gap-2">
                            <FaFileContract /> Registo de Contratos (DORA Art. 28º)
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                            {supplier.contracts.map((contract, idx) => (
                                <div key={idx} className="bg-surface-dark p-3 rounded border border-gray-700 relative group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className="text-brand-secondary font-bold text-sm">{contract.ref_number}</span>
                                            <span className="text-gray-400 text-xs ml-2">- {contract.description}</span>
                                        </div>
                                        <span className={`text-[10px] px-2 py-0.5 rounded ${contract.is_active ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
                                            {contract.is_active ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-400 mb-2">
                                        <div><span className="block text-[10px] uppercase">Início</span> {contract.start_date}</div>
                                        <div><span className="block text-[10px] uppercase">Fim</span> {contract.end_date}</div>
                                        <div><span className="block text-[10px] uppercase">Pré-Aviso</span> {contract.notice_period_days} dias</div>
                                        <div><span className="block text-[10px] uppercase">Serviços</span> {contract.supported_service_ids?.length || 0}</div>
                                    </div>
                                    {contract.exit_strategy && (
                                        <div className="text-xs bg-gray-900 p-2 rounded text-gray-300 italic border-l-2 border-red-500">
                                            <div className="flex items-center gap-1 font-bold text-red-400 mb-1">
                                                <FaDoorOpen /> Estratégia de Saída:
                                            </div>
                                            {contract.exit_strategy}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Other Certifications & Files */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(supplier.other_certifications && supplier.other_certifications.length > 0) && (
                        <div>
                            <h3 className="text-sm font-semibold text-white uppercase tracking-wider border-b border-gray-700 pb-2 mb-3">Outras Certificações</h3>
                            <ul className="space-y-2">
                                {supplier.other_certifications.map((cert, idx) => (
                                    <li key={idx} className="flex items-center gap-2 bg-gray-800 p-2 rounded border border-gray-600">
                                        <FaCertificate className="text-yellow-500 h-4 w-4" />
                                        <span className="text-sm text-white">{cert.name}</span>
                                        {cert.expiryDate && <span className="text-xs text-gray-400 ml-auto">({cert.expiryDate})</span>}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {(supplier.attachments && supplier.attachments.length > 0) && (
                        <div>
                            <h3 className="text-sm font-semibold text-white uppercase tracking-wider border-b border-gray-700 pb-2 mb-3">Anexos</h3>
                            <ul className="space-y-2">
                                {supplier.attachments.map((file, idx) => (
                                    <li key={idx} className="flex items-center justify-between bg-gray-800 p-2 rounded border border-gray-600">
                                        <span className="text-sm text-gray-300 truncate pr-2">{file.name}</span>
                                        <a href={file.dataUrl} download={file.name} className="text-brand-secondary hover:text-white" title="Download">
                                            <FaDownload />
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {supplier.notes && (
                    <div className="bg-gray-900/30 p-4 rounded border border-gray-700">
                        <h3 className="text-xs font-bold text-gray-500 mb-1">NOTAS INTERNAS</h3>
                        <p className="text-sm text-gray-300 whitespace-pre-wrap">{supplier.notes}</p>
                    </div>
                )}

                <div className="flex justify-end pt-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">
                        Fechar
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default SupplierDetailModal;
