








import React, { useState, useEffect, useRef } from 'react';
import Modal from './common/Modal';
import { Supplier, CriticalityLevel } from '../types';
import { FaShieldAlt, FaGlobe, FaFileContract, FaDownload, FaCopy } from 'react-icons/fa';
import { SearchIcon, SpinnerIcon, DeleteIcon } from './common/Icons';

interface AddSupplierModalProps {
    onClose: () => void;
    onSave: (supplier: Omit<Supplier, 'id'> | Supplier) => Promise<any>;
    supplierToEdit?: Supplier | null;
}

const MAX_FILES = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const AddSupplierModal: React.FC<AddSupplierModalProps> = ({ onClose, onSave, supplierToEdit }) => {
    const [formData, setFormData] = useState<Partial<Supplier>>({
        name: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        nif: '',
        website: '',
        address: '',
        notes: '',
        is_iso27001_certified: false,
        iso_certificate_expiry: '',
        security_contact_email: '',
        risk_level: CriticalityLevel.Low,
        attachments: []
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isFetchingVies, setIsFetchingVies] = useState(false);
    const [attachments, setAttachments] = useState<{ name: string; dataUrl: string; size: number }[]>([]);
    const [showLetter, setShowLetter] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (supplierToEdit) {
            setFormData({ 
                ...supplierToEdit, 
                iso_certificate_expiry: supplierToEdit.iso_certificate_expiry || '',
                address: supplierToEdit.address || '',
            });
            if (supplierToEdit.attachments) {
                setAttachments(supplierToEdit.attachments.map(a => ({ ...a, size: 0 })));
            }
        }
    }, [supplierToEdit]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name?.trim()) newErrors.name = "O nome do fornecedor é obrigatório.";
        if (!formData.nif?.trim()) newErrors.nif = "O NIF é obrigatório.";
        if (formData.contact_email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
            newErrors.contact_email = "Email inválido.";
        }
        if (formData.is_iso27001_certified && !formData.iso_certificate_expiry) {
            newErrors.iso_certificate_expiry = "Se tem certificação, a data de validade é obrigatória.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value 
        }));
        
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleFetchVies = async () => {
        if (!formData.nif?.trim()) {
            setErrors(prev => ({ ...prev, nif: "Insira um NIF para pesquisar." }));
            return;
        }

        setIsFetchingVies(true);
        setErrors(prev => {
            const newErr = { ...prev };
            delete newErr.nif;
            return newErr;
        });

        try {
            let input = formData.nif.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
            let countryCode = 'PT'; 
            let vatNumber = input;

            const countryMatch = input.match(/^([A-Z]{2})(.+)$/);
            if (countryMatch) {
                countryCode = countryMatch[1];
                vatNumber = countryMatch[2];
            }

            if (vatNumber.length < 2) {
                setErrors(prev => ({ ...prev, nif: "Formato de NIF inválido." }));
                setIsFetchingVies(false);
                return;
            }

            let success = false;
            let resultData: any = null;

            // Proxy 1
            try {
                const response = await fetch(`https://corsproxy.io/?https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number/${countryCode}/${vatNumber}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data && (data.isValid || data.valid)) {
                        resultData = {
                            name: data.name,
                            address: data.address
                        };
                        success = true;
                    }
                }
            } catch (e) {
                console.warn("Proxy VIES 1 falhou", e);
            }

            if (success && resultData) {
                setFormData(prev => ({
                    ...prev,
                    name: resultData.name || prev.name,
                    nif: input,
                    address: resultData.address || prev.address // Map directly to address field
                }));
                setErrors(prev => {
                    const newErr = { ...prev };
                    delete newErr.nif;
                    return newErr;
                });
            } else {
                // If silent fail or invalid, just let user type
                setErrors(prev => ({ ...prev, nif: "Não foi possível validar ou obter dados automaticamente. Preencha manualmente." }));
            }

        } catch (e) {
            console.error("Erro VIES:", e);
            setErrors(prev => ({ ...prev, nif: "Erro na consulta VIES." }));
        } finally {
            setIsFetchingVies(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        if (attachments.length + files.length > MAX_FILES) {
            alert(`Não pode anexar mais de ${MAX_FILES} ficheiros.`);
            return;
        }
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.size > MAX_FILE_SIZE) {
                alert(`O ficheiro "${file.name}" é demasiado grande. O limite é de 5MB.`);
                continue;
            }

            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                const dataUrl = loadEvent.target?.result as string;
                setAttachments(prev => [...prev, { name: file.name, dataUrl, size: file.size }]);
            };
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    };
    
    const handleRemoveAttachment = (indexToRemove: number) => {
        setAttachments(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const generateComplianceLetter = () => {
        const today = new Date().toLocaleDateString('pt-PT');
        return `
ASSUNTO: SOLICITAÇÃO DE EVIDÊNCIAS DE CONFORMIDADE (DIRETIVA NIS2)

Exmos. Srs. ${formData.name || '(Nome do Fornecedor)'},

No âmbito da conformidade com a Diretiva NIS2 (Segurança das Redes e Sistemas de Informação) e da nossa política de gestão de riscos na cadeia de abastecimento, vimos por este meio solicitar evidências das vossas práticas de cibersegurança.

Solicitamos o envio, no prazo de 15 dias úteis, dos seguintes elementos:

1. Certificado ISO/IEC 27001 (se aplicável) ou declaração equivalente de conformidade.
2. Identificação do Ponto de Contacto de Segurança (Email/Telefone) para resposta a incidentes.
3. Política de resposta a incidentes e tempos de resposta (SLA) garantidos.

Agradecemos a vossa colaboração para garantir a segurança dos serviços prestados.

Com os melhores cumprimentos,

Departamento de TI / Segurança
(A Sua Empresa)
Data: ${today}
        `.trim();
    };

    const handleCopyLetter = () => {
        navigator.clipboard.writeText(generateComplianceLetter());
        alert("Texto copiado para a área de transferência!");
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        
        const dataToSave: any = { 
            ...formData,
            attachments: attachments.map(({ name, dataUrl }) => ({ name, dataUrl }))
        };
        if (!dataToSave.iso_certificate_expiry) delete dataToSave.iso_certificate_expiry;

        if (supplierToEdit) {
            onSave({ ...supplierToEdit, ...dataToSave });
        } else {
            onSave(dataToSave);
        }
        onClose();
    };
    
    const modalTitle = supplierToEdit ? "Editar Fornecedor" : "Novo Fornecedor";

    return (
        <Modal title={modalTitle} onClose={onClose} maxWidth="max-w-4xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="nif" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">NIF / VAT Number <span className="text-red-400">*</span></label>
                        <div className="flex">
                            <input 
                                type="text" 
                                name="nif" 
                                id="nif" 
                                value={formData.nif} 
                                onChange={handleChange} 
                                placeholder="Ex: 501234567"
                                className={`flex-grow bg-gray-700 border text-white rounded-l-md p-2 ${errors.nif ? 'border-red-500' : 'border-gray-600'}`}
                            />
                            <button 
                                type="button" 
                                onClick={handleFetchVies}
                                disabled={isFetchingVies || !formData.nif}
                                className="bg-gray-600 px-3 rounded-r-md hover:bg-gray-500 text-white transition-colors border-t border-b border-r border-gray-600 flex items-center justify-center min-w-[3rem]"
                                title="Pesquisar no VIES (Europa)"
                            >
                                {isFetchingVies ? <SpinnerIcon /> : <SearchIcon />}
                            </button>
                        </div>
                        {errors.nif && <p className="text-red-400 text-xs italic mt-1">{errors.nif}</p>}
                        <p className="text-[10px] text-gray-500 mt-1">Clique na lupa para preencher Nome e Morada automaticamente.</p>
                    </div>
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Nome da Empresa <span className="text-red-400">*</span></label>
                        <input 
                            type="text" 
                            name="name" 
                            id="name" 
                            value={formData.name} 
                            onChange={handleChange} 
                            className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.name ? 'border-red-500' : 'border-gray-600'}`}
                        />
                        {errors.name && <p className="text-red-400 text-xs italic mt-1">{errors.name}</p>}
                    </div>
                </div>

                {/* Address Field - New */}
                <div>
                    <label htmlFor="address" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Morada Completa</label>
                    <textarea 
                        name="address" 
                        id="address" 
                        value={formData.address} 
                        onChange={handleChange} 
                        rows={2} 
                        placeholder="Rua, Código Postal, Cidade..."
                        className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"
                    ></textarea>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="contact_name" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Pessoa de Contacto</label>
                        <input type="text" name="contact_name" value={formData.contact_name} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"/>
                    </div>
                    <div>
                        <label htmlFor="contact_email" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Email Geral</label>
                        <input type="email" name="contact_email" value={formData.contact_email} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.contact_email ? 'border-red-500' : 'border-gray-600'}`}/>
                        {errors.contact_email && <p className="text-red-400 text-xs italic mt-1">{errors.contact_email}</p>}
                    </div>
                    <div>
                        <label htmlFor="contact_phone" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Telefone</label>
                        <input type="text" name="contact_phone" value={formData.contact_phone} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"/>
                    </div>
                </div>
                
                <div>
                    <label htmlFor="website" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Website</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FaGlobe className="text-gray-400"/></div>
                        <input type="text" name="website" value={formData.website} onChange={handleChange} placeholder="https://..." className="w-full bg-gray-700 border border-gray-600 text-white rounded-md pl-10 p-2"/>
                    </div>
                </div>

                {/* Security & Risk Section */}
                <div className="border border-gray-700 bg-gray-800/30 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-3 border-b border-gray-700 pb-2">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <FaShieldAlt className="text-brand-secondary"/>
                            Avaliação de Risco (NIS2)
                        </h3>
                        <button type="button" onClick={() => setShowLetter(true)} className="text-xs bg-brand-primary hover:bg-brand-secondary text-white px-3 py-1 rounded flex items-center gap-2">
                            <FaFileContract /> Gerar Carta de Conformidade
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="risk_level" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Nível de Risco</label>
                            <select name="risk_level" id="risk_level" value={formData.risk_level} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2">
                                {Object.values(CriticalityLevel).map(level => (
                                    <option key={level} value={level}>{level}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="security_contact_email" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Email de Notificação de Segurança</label>
                            <input 
                                type="email" 
                                name="security_contact_email" 
                                value={formData.security_contact_email} 
                                onChange={handleChange} 
                                placeholder="security@vendor.com"
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 font-mono text-sm"
                            />
                        </div>
                        
                        {/* ISO Certification Check */}
                        <div className="md:col-span-2 flex flex-col gap-3 bg-gray-900/50 p-3 rounded border border-gray-600">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="is_iso27001_certified"
                                    id="is_iso27001_certified"
                                    checked={formData.is_iso27001_certified}
                                    onChange={handleChange}
                                    className="h-5 w-5 rounded border-gray-300 bg-gray-700 text-brand-primary focus:ring-brand-secondary"
                                />
                                <label htmlFor="is_iso27001_certified" className="ml-3 block text-sm font-bold text-white">
                                    Possui Certificação ISO 27001 (Segurança da Informação)?
                                </label>
                            </div>
                            
                            {formData.is_iso27001_certified && (
                                <div className="ml-8 animate-fade-in">
                                    <label htmlFor="iso_certificate_expiry" className="block text-xs font-medium text-on-surface-dark-secondary mb-1">Data de Validade do Certificado <span className="text-red-400">*</span></label>
                                    <input 
                                        type="date" 
                                        name="iso_certificate_expiry" 
                                        id="iso_certificate_expiry" 
                                        value={formData.iso_certificate_expiry} 
                                        onChange={handleChange} 
                                        className={`w-full sm:w-48 bg-gray-700 border text-white rounded-md p-2 text-sm ${errors.iso_certificate_expiry ? 'border-red-500' : 'border-gray-600'}`}
                                    />
                                    {errors.iso_certificate_expiry && <p className="text-red-400 text-xs italic mt-1">{errors.iso_certificate_expiry}</p>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Attachments Section - New */}
                <div>
                    <label className="block text-sm font-medium text-on-surface-dark-secondary mb-2">Anexos (Contratos, Certificados, NDAs)</label>
                    <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700">
                        {attachments.length > 0 && (
                            <ul className="space-y-2 mb-3">
                                {attachments.map((file, index) => (
                                    <li key={index} className="flex justify-between items-center text-sm p-2 bg-surface-dark rounded-md">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <FaFileContract className="text-gray-400 flex-shrink-0" />
                                            <span className="truncate text-on-surface-dark-secondary">
                                                {file.name}
                                                {file.size > 0 && <span className="text-xs ml-2 text-gray-400">({formatFileSize(file.size)})</span>}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {file.dataUrl && (
                                                <a href={file.dataUrl} download={file.name} className="text-blue-400 hover:text-blue-300 p-1" title="Download">
                                                    <FaDownload />
                                                </a>
                                            )}
                                            <button type="button" onClick={() => handleRemoveAttachment(index)} className="text-red-400 hover:text-red-300 ml-2 p-1" title="Remover">
                                                <DeleteIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                        <input
                            type="file"
                            multiple
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            className="hidden"
                            accept="image/*,application/pdf,.doc,.docx"
                        />
                         <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={attachments.length >= MAX_FILES}
                            className="w-full px-4 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dashed border border-gray-500"
                        >
                            {`+ Adicionar Ficheiros (${attachments.length}/${MAX_FILES})`}
                        </button>
                    </div>
                </div>

                <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Notas Adicionais</label>
                    <textarea name="notes" value={formData.notes} onChange={handleChange} rows={2} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"></textarea>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-gray-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary">Salvar</button>
                </div>
            </form>

            {/* Letter Generator Modal Overlay */}
            {showLetter && (
                <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60] p-4">
                    <div className="bg-surface-dark p-6 rounded-lg max-w-2xl w-full border border-gray-600">
                        <h3 className="text-xl font-bold text-white mb-4">Carta Tipo - Solicitação NIS2</h3>
                        <textarea 
                            readOnly 
                            value={generateComplianceLetter()} 
                            className="w-full h-64 bg-gray-800 text-white p-4 rounded font-mono text-sm border border-gray-600"
                        ></textarea>
                        <div className="flex justify-end gap-4 mt-4">
                            <button onClick={() => setShowLetter(false)} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500">Fechar</button>
                            <button onClick={handleCopyLetter} className="px-4 py-2 bg-brand-primary text-white rounded hover:bg-brand-secondary flex items-center gap-2">
                                <FaCopy /> Copiar Texto
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default AddSupplierModal;