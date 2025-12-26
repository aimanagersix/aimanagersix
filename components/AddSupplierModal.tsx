import React, { useState, useEffect, useRef } from 'react';
import Modal from './common/Modal';
import { Supplier, CriticalityLevel, Team, Ticket, TicketStatus, SupplierContract, BusinessService, ResourceContact } from '../types';
// Added FaRobot to imports
import { FaShieldAlt, FaGlobe, FaFileContract, FaDownload, FaCopy, FaTicketAlt, FaCertificate, FaCalendarAlt, FaPlus, FaFileSignature, FaDoorOpen, FaUsers, FaUserTie, FaPhone, FaEnvelope, FaMagic, FaSave, FaInfoCircle, FaRobot } from 'react-icons/fa';
import { SearchIcon, SpinnerIcon, FaTrash as DeleteIcon, PlusIcon, CheckIcon } from './common/Icons';
import { ContactList } from './common/ContactList'; 
import * as dataService from '../services/dataService';

interface AddSupplierModalProps {
    onClose: () => void;
    onSave: (supplier: Omit<Supplier, 'id'> | Supplier) => Promise<any>;
    supplierToEdit?: Supplier | null;
    teams?: Team[]; 
    onCreateTicket?: (ticket: Partial<Ticket>) => Promise<void> | void; 
    businessServices?: BusinessService[];
}

const MAX_FILES = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024; 

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const extractDomain = (url: string): string => {
    try {
        let domain = url.trim();
        if (!domain) return '';
        if (!domain.startsWith('http')) domain = 'https://' + domain;
        const hostname = new URL(domain).hostname;
        return hostname.replace(/^www\./, '');
    } catch { return ''; }
};

const AddSupplierModal: React.FC<AddSupplierModalProps> = ({ onClose, onSave, supplierToEdit, teams = [], businessServices = [] }) => {
    const [activeTab, setActiveTab] = useState<'details' | 'contacts' | 'contracts'>('details');
    
    const [formData, setFormData] = useState<Partial<Supplier>>({
        name: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        nif: '',
        website: '',
        address_line: '',
        postal_code: '',
        city: '',
        locality: '',
        notes: '',
        is_iso27001_certified: false,
        iso_certificate_expiry: '',
        security_contact_email: '',
        risk_level: CriticalityLevel.Low,
        attachments: [],
        other_certifications: [],
        contracts: [],
        contacts: []
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isFetchingNif, setIsFetchingNif] = useState(false);
    const [isFetchingCP, setIsFetchingCP] = useState(false);
    const [attachments, setAttachments] = useState<{ name: string; dataUrl: string; size: number }[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [emailSuggestion, setEmailSuggestion] = useState('');
    const [newCertName, setNewCertName] = useState('');
    const [newCertDate, setNewCertDate] = useState('');

    const [newContract, setNewContract] = useState<Partial<SupplierContract>>({
        ref_number: '',
        description: '',
        start_date: '',
        end_date: '',
        notice_period_days: 90,
        exit_strategy: '',
        supported_service_ids: [],
        is_active: true
    });

    useEffect(() => {
        if (supplierToEdit) {
            setFormData({ 
                ...supplierToEdit, 
                iso_certificate_expiry: supplierToEdit.iso_certificate_expiry || '',
                address_line: supplierToEdit.address_line || (supplierToEdit as any).address || '',
                postal_code: supplierToEdit.postal_code || '',
                city: supplierToEdit.city || '',
                locality: supplierToEdit.locality || '',
                other_certifications: supplierToEdit.other_certifications || [],
                contracts: supplierToEdit.contracts || [],
                contacts: supplierToEdit.contacts || []
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
        if (name === 'contact_email') {
            setEmailSuggestion('');
            if (value.endsWith('@') && formData.website) {
                const domain = extractDomain(formData.website);
                if (domain) setEmailSuggestion(domain);
            }
        }
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };
    
    const applyEmailSuggestion = () => {
        if (emailSuggestion) {
            setFormData((prev: any) => ({ ...prev, contact_email: (prev.contact_email || '') + emailSuggestion }));
            setEmailSuggestion('');
        }
    };

    const handlePostalCodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/[^0-9-]/g, ''); 
        if (val.length > 4 && val.indexOf('-') === -1) val = val.slice(0, 4) + '-' + val.slice(4);
        if (val.length > 8) val = val.slice(0, 8);
        setFormData((prev: any) => ({ ...prev, postal_code: val }));
        if (/^\d{4}-\d{3}$/.test(val)) {
            setIsFetchingCP(true);
            try {
                const res = await fetch(`https://json.geoapi.pt/cp/${val}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.Concelho) {
                        setFormData((prev: any) => ({ ...prev, city: data.Concelho, locality: data.Freguesia || (data.part && data.part[0]) || '' }));
                    }
                }
            } finally { setIsFetchingCP(false); }
        }
    };

    const handleFetchNifData = async () => {
        if (!formData.nif?.trim()) return;
        const nif = formData.nif.trim().replace(/[^0-9]/g, '');
        if (nif.length !== 9) return;
        setIsFetchingNif(true);
        try {
            const targetUrl = `https://www.nif.pt/?json=1&q=${nif}&key=9393091ec69bd1564657157b9624809e`;
            const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
            const response = await fetch(proxyUrl);
            if (response.ok) {
                const data = await response.json();
                if (data.result === 'success' && data.records && data.records[nif]) {
                    const record = data.records[nif];
                    setFormData(prev => ({
                        ...prev,
                        name: prev.name || record.title,
                        address_line: record.address,
                        postal_code: record.pc4 && record.pc3 ? `${record.pc4}-${record.pc3}` : prev.postal_code,
                        city: record.city,
                        locality: record.city,
                        contact_email: record.contacts?.email || prev.contact_email,
                        contact_phone: record.contacts?.phone || prev.contact_phone,
                        website: record.website || prev.website
                    }));
                }
            }
        } finally { setIsFetchingNif(false); }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                const dataUrl = loadEvent.target?.result as string;
                setAttachments(prev => [...prev, { name: file.name, dataUrl, size: file.size }]);
            };
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setIsSaving(true);
        const dataToSave: any = { ...formData, attachments: attachments.map(({ name, dataUrl }) => ({ name, dataUrl })) };
        try {
            await onSave(dataToSave);
            setSuccessMessage('Fornecedor gravado com sucesso! A monitorização diária está ativa.');
            setTimeout(() => setSuccessMessage(''), 3000);
        } finally { setIsSaving(false); }
    };

    return (
        <Modal title={supplierToEdit ? "Editar Fornecedor" : "Adicionar Fornecedor"} onClose={onClose} maxWidth="max-w-5xl">
            <div className="flex flex-col h-[80vh]">
                <div className="flex border-b border-gray-700 mb-4">
                    <button type="button" onClick={() => setActiveTab('details')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'details' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}>Detalhes Gerais</button>
                    <button type="button" onClick={() => setActiveTab('contacts')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'contacts' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}>Pessoas de Contacto</button>
                    <button type="button" onClick={() => setActiveTab('contracts')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'contracts' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}>Contratos & DORA</button>
                </div>

                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto custom-scrollbar pr-2">
                    {activeTab === 'details' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1">NIF</label>
                                <div className="flex">
                                    <input type="text" name="nif" value={formData.nif} onChange={handleChange} className={`flex-grow bg-gray-700 border text-white rounded-l p-2 ${errors.nif ? 'border-red-500' : 'border-gray-600'}`} />
                                    <button type="button" onClick={handleFetchNifData} className="bg-gray-600 px-3 rounded-r border-gray-600">{isFetchingNif ? <SpinnerIcon /> : <SearchIcon />}</button>
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-400 mb-1">Nome do Fornecedor</label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded p-2 ${errors.name ? 'border-red-500' : 'border-gray-600'}`} />
                            </div>
                        </div>

                        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-600">
                            <div className="flex items-center mb-2">
                                <input type="checkbox" name="is_iso27001_certified" id="iso" checked={formData.is_iso27001_certified} onChange={handleChange} className="h-4 w-4 rounded bg-gray-700 text-brand-primary" />
                                <label htmlFor="iso" className="ml-2 block text-sm font-bold text-white">Certificado ISO 27001</label>
                            </div>
                            {formData.is_iso27001_certified && (
                                <div className="ml-6 mt-2 space-y-3 animate-fade-in">
                                    <input type="date" name="iso_certificate_expiry" value={formData.iso_certificate_expiry} onChange={handleChange} className={`bg-gray-700 border text-white rounded p-2 text-sm ${errors.iso_certificate_expiry ? 'border-red-500' : 'border-gray-600'}`} />
                                    <div className="bg-blue-900/10 p-3 rounded border border-blue-500/30 flex items-start gap-3">
                                        <FaRobot className="text-brand-secondary mt-1" />
                                        <p className="text-[11px] text-blue-200">
                                            <strong>Monitorização Hands-Free:</strong> O servidor criará um ticket de renovação automaticamente 30 dias antes da expiração.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-gray-900/30 p-3 rounded-lg border border-gray-700">
                            <label className="block text-sm font-medium text-white mb-2">Anexos (PDF, Imagens)</label>
                            <div className="bg-gray-800 p-3 rounded border border-gray-600">
                                {attachments.length > 0 && (
                                    <ul className="space-y-2 mb-3">
                                        {attachments.map((file, index) => (
                                            <li key={index} className="flex justify-between items-center text-xs p-2 bg-surface-dark rounded">
                                                <span className="truncate text-gray-300">{file.name}</span>
                                                <button type="button" onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))} className="text-red-400 p-1"><DeleteIcon className="h-4 w-4" /></button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                <input type="file" multiple ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,application/pdf" />
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full px-4 py-2 text-xs bg-gray-600 text-white rounded border border-dashed border-gray-500">+ Adicionar Documento</button>
                            </div>
                        </div>
                    </div>
                    )}
                    {activeTab === 'contacts' && <div className="h-full"><ContactList contacts={formData.contacts || []} onChange={(c) => setFormData({...formData, contacts: c})} resourceType="supplier" /></div>}
                </form>

                {successMessage && <div className="p-3 bg-green-500/20 text-green-300 rounded border border-green-500/50 text-center font-medium mt-4">{successMessage}</div>}

                <div className="flex justify-end gap-4 pt-4 border-t border-gray-700 mt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500">Cancelar</button>
                    <button type="submit" onClick={handleSubmit} disabled={isSaving} className="px-6 py-2 bg-brand-primary text-white rounded flex items-center gap-2 shadow-lg">
                        {isSaving ? <SpinnerIcon /> : <FaSave />} {isSaving ? 'A Gravar...' : 'Salvar Fornecedor'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default AddSupplierModal;