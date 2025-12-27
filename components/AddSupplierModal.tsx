import React, { useState, useEffect, useRef } from 'react';
import Modal from './common/Modal';
import { Supplier, CriticalityLevel, Team, Ticket, TicketStatus, SupplierContract, BusinessService, ResourceContact } from '../types';
import { FaShieldAlt, FaGlobe, FaFileContract, FaDownload, FaCopy, FaTicketAlt, FaCertificate, FaCalendarAlt, FaPlus, FaFileSignature, FaDoorOpen, FaUsers, FaUserTie, FaPhone, FaEnvelope, FaMagic, FaSave, FaInfoCircle, FaRobot, FaTimes, FaLandmark, FaAddressCard, FaSearchLocation } from 'react-icons/fa';
import { SearchIcon, SpinnerIcon, FaTrash as DeleteIcon, PlusIcon, CheckIcon } from './common/Icons';
import { ContactList } from './common/ContactList'; 
import * as dataService from '../services/dataService';

/**
 * ADD SUPPLIER MODAL - V12.0 (Legacy Full Restoration)
 * -----------------------------------------------------------------------------
 * Organização em Cards (Contextos) para reduzir carga cognitiva.
 * Abas Fixas no topo com formulário scrollable independente.
 * -----------------------------------------------------------------------------
 */

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
const NIF_API_KEY = '9393091ec69bd1564657157b9624809e';

const extractDomain = (url: string): string => {
    try {
        let domain = url.trim();
        if (!domain) return '';
        if (!domain.startsWith('http')) domain = 'https://' + domain;
        const hostname = new URL(domain).hostname;
        return hostname.replace(/^www\./, '');
    } catch { return ''; }
};

const AddSupplierModal: React.FC<AddSupplierModalProps> = ({ onClose, onSave, supplierToEdit, businessServices = [] }) => {
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
    const [emailSuggestion, setEmailSuggestion] = useState('');
    const [newCertName, setNewCertName] = useState('');
    const [newCertDate, setNewCertDate] = useState('');
    const [showExtraCerts, setShowExtraCerts] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

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
            if (supplierToEdit.other_certifications && supplierToEdit.other_certifications.length > 0) {
                setShowExtraCerts(true);
            }
        }
    }, [supplierToEdit]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name?.trim()) newErrors.name = "Obrigatório";
        if (!formData.nif?.trim()) newErrors.nif = "Obrigatório";
        if (formData.is_iso27001_certified && !formData.iso_certificate_expiry) {
            newErrors.iso_certificate_expiry = "Validade necessária";
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
        const nif = formData.nif.trim().replace(/[^0-9/]/g, '');
        if (nif.length !== 9) return;
        setIsFetchingNif(true);
        try {
            const targetUrl = `https://www.nif.pt/?json=1&q=${nif}&key=${NIF_API_KEY}`;
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
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

    const handleAddCertificate = () => {
        if (!newCertName.trim()) return;
        setFormData(prev => ({
            ...prev,
            other_certifications: [...(prev.other_certifications || []), { name: newCertName, expiryDate: newCertDate }]
        }));
        setNewCertName('');
        setNewCertDate('');
    };

    const handleAddContract = () => {
        if (!newContract.ref_number?.trim() || !newContract.end_date) return;
        setFormData(prev => ({
            ...prev,
            contracts: [...(prev.contracts || []), { ...newContract, id: crypto.randomUUID(), is_active: true } as SupplierContract]
        }));
        setNewContract({ ref_number: '', description: '', start_date: '', end_date: '', notice_period_days: 90, exit_strategy: '', supported_service_ids: [], is_active: true });
    };

    const handleServiceToggle = (serviceId: string) => {
        setNewContract(prev => {
            const current = prev.supported_service_ids || [];
            if (current.includes(serviceId)) {
                return { ...prev, supported_service_ids: current.filter(id => id !== serviceId) };
            } else {
                return { ...prev, supported_service_ids: [...current, serviceId] };
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setIsSaving(true);
        const dataToSave: any = { ...formData, attachments: attachments.map(({ name, dataUrl }) => ({ name, dataUrl })) };
        try {
            await onSave(dataToSave);
            setSuccessMessage('Fornecedor gravado com sucesso!');
            setTimeout(() => setSuccessMessage(''), 3000);
            onClose();
        } finally { setIsSaving(false); }
    };

    return (
        <Modal title={supplierToEdit ? "Ficha Estratégica de Fornecedor" : "Registar Novo Fornecedor Crítico"} onClose={onClose} maxWidth="max-w-6xl">
            <div className="flex flex-col h-[85vh]">
                
                {/* Cabeçalho de Navegação Fixo */}
                <div className="flex-shrink-0">
                    {/* Mobile Selector */}
                    <div className="sm:hidden mb-4 px-1">
                        <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 tracking-widest">Secção</label>
                        <select 
                            value={activeTab} 
                            onChange={(e) => setActiveTab(e.target.value as any)}
                            className="w-full bg-gray-700 border border-gray-600 text-white rounded p-3 text-sm font-black focus:border-brand-secondary outline-none shadow-inner"
                        >
                            <option value="details">Identificação e Segurança</option>
                            <option value="contacts">Pessoas de Contacto</option>
                            <option value="contracts">Contratos e DORA</option>
                        </select>
                    </div>

                    {/* Desktop Tabs */}
                    <div className="hidden sm:flex border-b border-gray-700 mb-6 overflow-x-auto whitespace-nowrap px-1">
                        <button type="button" onClick={() => setActiveTab('details')} className={`px-8 py-3 text-sm font-black uppercase tracking-[0.2em] border-b-2 transition-all flex-shrink-0 ${activeTab === 'details' ? 'border-brand-secondary text-white bg-gray-800/40' : 'border-transparent text-gray-400 hover:text-white'}`}>Identificação e Segurança</button>
                        <button type="button" onClick={() => setActiveTab('contacts')} className={`px-8 py-3 text-sm font-black uppercase tracking-[0.2em] border-b-2 transition-all flex-shrink-0 ${activeTab === 'contacts' ? 'border-brand-secondary text-white bg-gray-800/40' : 'border-transparent text-gray-400 hover:text-white'}`}>Pessoas de Contacto</button>
                        <button type="button" onClick={() => setActiveTab('contracts')} className={`px-8 py-3 text-sm font-black uppercase tracking-[0.2em] border-b-2 transition-all flex-shrink-0 ${activeTab === 'contracts' ? 'border-brand-secondary text-white bg-gray-800/40' : 'border-transparent text-gray-400 hover:text-white'}`}>Contratos e DORA</button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto custom-scrollbar pr-3 space-y-10">
                    {activeTab === 'details' && (
                    <div className="space-y-10 animate-fade-in">
                        
                        {/* CARD 1: Identificação Institucional */}
                        <div className="bg-gray-800/40 p-8 rounded-2xl border border-gray-700 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-brand-primary opacity-50"></div>
                            <h4 className="text-[11px] font-black text-brand-secondary uppercase tracking-[0.3em] mb-6 flex items-center gap-3"><FaLandmark className="text-gray-400"/> Identificação Institucional</h4>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                <div className="md:col-span-1">
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 tracking-widest">NIF Corporativo</label>
                                    <div className="flex shadow-inner rounded-lg overflow-hidden">
                                        <input type="text" name="nif" value={formData.nif} onChange={handleChange} className={`flex-grow bg-gray-900 border-none text-white p-3 text-sm focus:ring-0 font-mono ${errors.nif ? 'border-red-500' : ''}`} placeholder="500..." />
                                        <button type="button" onClick={handleFetchNifData} className="bg-gray-700 px-4 hover:bg-brand-primary text-white transition-all border-l border-gray-600">{isFetchingNif ? <SpinnerIcon /> : <SearchIcon />}</button>
                                    </div>
                                </div>
                                <div className="md:col-span-3">
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 tracking-widest">Nome Comercial / Firma</label>
                                    <input type="text" name="name" value={formData.name} onChange={handleChange} className={`w-full bg-gray-900 border border-gray-700 text-white rounded-lg p-3 text-sm focus:border-brand-primary outline-none shadow-inner ${errors.name ? 'border-red-500' : ''}`} placeholder="Nome oficial da entidade..." />
                                </div>
                                <div className="md:col-span-4">
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 tracking-widest">Website Oficial (Auditoria Digital)</label>
                                    <div className="relative">
                                        <FaGlobe className="absolute left-4 top-3.5 text-gray-600" />
                                        <input type="text" name="website" value={formData.website} onChange={handleChange} placeholder="www.exemplo.com" className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg p-3 pl-12 text-sm focus:border-brand-primary outline-none" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CARD 2: Canais de Comunicação */}
                        <div className="bg-gray-800/40 p-8 rounded-2xl border border-gray-700 shadow-2xl">
                            <h4 className="text-[11px] font-black text-brand-secondary uppercase tracking-[0.3em] mb-6 flex items-center gap-3"><FaEnvelope className="text-gray-400"/> Canais de Comunicação</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="relative">
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 tracking-widest">Email Geral de Contacto</label>
                                    <input type="email" name="contact_email" value={formData.contact_email} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg p-3 text-sm focus:border-brand-primary outline-none" placeholder="suporte@fornecedor.pt" />
                                    {emailSuggestion && (
                                        <button type="button" onClick={applyEmailSuggestion} className="absolute top-10 right-2 bg-brand-primary/20 text-brand-secondary text-[9px] px-2 py-1 rounded-full border border-brand-primary/30 animate-pulse uppercase font-black"><FaMagic className="inline mr-1"/> {emailSuggestion}</button>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 tracking-widest">Telefone de Apoio</label>
                                    <div className="relative">
                                        <FaPhone className="absolute left-4 top-3.5 text-gray-600" />
                                        <input type="tel" name="contact_phone" value={formData.contact_phone} onChange={handleChange} placeholder="+351 21..." className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg p-3 pl-12 text-sm focus:border-brand-primary outline-none" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CARD 3: Localização e Sede */}
                        <div className="bg-gray-800/40 p-8 rounded-2xl border border-gray-700 shadow-2xl">
                            <h4 className="text-[11px] font-black text-brand-secondary uppercase tracking-[0.3em] mb-6 flex items-center gap-3"><FaAddressCard className="text-gray-400"/> Localização e Sede Social</h4>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 tracking-widest">Arruamento e Edifício</label>
                                    <input type="text" name="address_line" value={formData.address_line} onChange={handleChange} placeholder="Rua, Bloco, Piso..." className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg p-3 text-sm focus:border-brand-primary outline-none shadow-inner" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="relative">
                                        <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 tracking-widest">Código Postal</label>
                                        <div className="flex">
                                            <input type="text" name="postal_code" value={formData.postal_code} onChange={handlePostalCodeChange} placeholder="0000-000" className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg p-3 text-sm font-mono" />
                                        </div>
                                        {isFetchingCP && <SpinnerIcon className="absolute right-3 top-10 h-4 w-4"/>}
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 tracking-widest">Concelho / Cidade</label>
                                        <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg p-3 text-sm shadow-inner" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 tracking-widest">Freguesia / Localidade</label>
                                        <input type="text" name="locality" value={formData.locality} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg p-3 text-sm shadow-inner" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CARD 4: Segurança & Compliance NIS2 */}
                        <div className="bg-gray-800/40 p-8 rounded-2xl border-l-4 border-l-orange-500 border-gray-700 shadow-2xl">
                            <h4 className="text-[11px] font-black text-orange-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-3"><FaShieldAlt/> Avaliação de Risco NIS2</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Criticidade da Cadeia de Abastecimento</label>
                                    <select name="risk_level" value={formData.risk_level} onChange={handleChange} className={`w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm font-black uppercase ${formData.risk_level === 'Crítica' ? 'text-red-500' : 'text-white'}`}>
                                        {Object.values(CriticalityLevel).map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Ponto de Contacto Incidentes (PSIRT)</label>
                                    <input type="email" name="security_contact_email" value={formData.security_contact_email} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg p-3 text-sm font-mono" placeholder="security@vendor.com" />
                                </div>
                            </div>

                            <div className="bg-black/30 p-6 rounded-xl border border-gray-700 mb-8">
                                <label className="flex items-center cursor-pointer group mb-4">
                                    <input type="checkbox" name="is_iso27001_certified" checked={formData.is_iso27001_certified} onChange={handleChange} className="h-6 w-6 rounded-lg bg-gray-900 border-gray-700 text-brand-primary" />
                                    <span className="ml-4 text-sm font-black text-white uppercase tracking-widest group-hover:text-brand-secondary transition-colors">Certificado ISO 27001 em Vigor</span>
                                </label>
                                {formData.is_iso27001_certified && (
                                    <div className="ml-10 grid grid-cols-1 sm:grid-cols-2 gap-6 animate-fade-in">
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Validade do Certificado</label>
                                            <input type="date" name="iso_certificate_expiry" value={formData.iso_certificate_expiry} onChange={handleChange} className={`w-full bg-gray-900 border border-gray-700 text-white rounded-lg p-3 text-sm shadow-inner ${errors.iso_certificate_expiry ? 'border-red-500' : ''}`} />
                                        </div>
                                        <div className="bg-blue-900/10 p-4 rounded-lg border border-blue-500/20 flex items-start gap-3">
                                            <FaRobot className="text-brand-secondary mt-1 shrink-0" />
                                            <p className="text-[11px] text-blue-200 italic">Automação: O sistema gerará um ticket para revisão do certificado 30 dias antes do fim da validade.</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="bg-black/10 p-6 rounded-xl border border-gray-700">
                                <label className="flex items-center cursor-pointer group">
                                    <input type="checkbox" checked={showExtraCerts} onChange={(e) => setShowExtraCerts(e.target.checked)} className="h-5 w-5 rounded bg-gray-900 border-gray-700 text-brand-primary" />
                                    <span className="ml-4 text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-white transition-colors flex items-center gap-2"><FaCertificate className="text-yellow-500"/> Certificações de Resiliência Adicionais</span>
                                </label>
                                {showExtraCerts && (
                                    <div className="mt-6 animate-fade-in space-y-6">
                                        <div className="flex flex-wrap gap-2">
                                            {(formData.other_certifications || []).map((cert, idx) => (
                                                <div key={idx} className="flex items-center gap-3 bg-gray-900 px-4 py-2 rounded-full text-[10px] border border-gray-700 shadow-lg">
                                                    <span className="text-white font-black">{cert.name}</span>
                                                    <span className="text-gray-500">| {cert.expiryDate || 'N/A'}</span>
                                                    <button type="button" onClick={() => setFormData(prev => ({...prev, other_certifications: prev.other_certifications?.filter((_, i) => i !== idx)}))} className="text-red-500 hover:text-red-300 ml-1"><FaTimes size={12}/></button>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex gap-4 bg-black/40 p-4 rounded-xl border border-gray-800">
                                            <input type="text" value={newCertName} onChange={e => setNewCertName(e.target.value)} placeholder="Nome da Norma (ex: SOC2, PCI-DSS)" className="flex-1 bg-gray-900 border border-gray-700 text-white rounded-lg p-2 text-xs outline-none" />
                                            <input type="date" value={newCertDate} onChange={e => setNewCertDate(e.target.value)} className="bg-gray-900 border border-gray-700 text-white rounded-lg p-2 text-xs outline-none" />
                                            <button type="button" onClick={handleAddCertificate} className="bg-brand-primary text-white px-5 rounded-lg hover:bg-brand-secondary transition-all shadow-xl"><FaPlus size={14}/></button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Observações e Anexos */}
                        <div className="space-y-4">
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Evidências e Ficheiros de Auditoria</label>
                            <div className="bg-gray-950 p-6 rounded-xl border border-gray-700 border-dashed text-center">
                                {attachments.length > 0 && (
                                    <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 text-left">
                                        {attachments.map((file, index) => (
                                            <li key={index} className="flex flex-col gap-1 p-3 bg-gray-800 rounded-lg border border-gray-700 relative group">
                                                <span className="truncate text-white font-bold text-[10px]">{file.name}</span>
                                                <span className="text-[9px] text-gray-500">Snapshot Anexo</span>
                                                <button type="button" onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))} className="absolute -top-2 -right-2 bg-red-600 text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"><FaTimes size={8}/></button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                <input type="file" multiple ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,application/pdf" />
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="px-8 py-3 text-xs font-black uppercase tracking-widest bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-full border border-gray-600 transition-all mb-4 shadow-lg">+ Carregar Documentos ({attachments.length}/{MAX_FILES})</button>
                                <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Insira aqui observações críticas, notas de negociação ou referências contratuais importantes para a governança de TI..." rows={4} className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl p-4 text-sm focus:border-brand-primary outline-none custom-scrollbar shadow-inner"></textarea>
                            </div>
                        </div>
                    </div>
                    )}

                    {activeTab === 'contacts' && (
                        <div className="animate-fade-in min-h-[450px]">
                            <div className="bg-gray-900/30 p-4 rounded-lg border border-gray-700 mb-6 flex items-start gap-3">
                                <FaInfoCircle className="text-brand-secondary mt-1" />
                                <p className="text-xs text-gray-400 leading-relaxed">
                                    Adicione as pessoas de contacto para diversos departamentos (Comercial, Suporte Técnico, DPO). Estes contactos ficarão disponíveis na <strong>Agenda Global</strong> e vinculados a este fornecedor.
                                </p>
                            </div>
                            <ContactList contacts={formData.contacts || []} onChange={(c) => setFormData({...formData, contacts: c})} resourceType="supplier" />
                        </div>
                    )}

                    {activeTab === 'contracts' && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="bg-blue-900/10 border border-blue-500/30 p-6 rounded-2xl shadow-2xl">
                                <h4 className="text-white font-black text-sm uppercase tracking-[0.3em] mb-2 flex items-center gap-3"><FaFileSignature className="text-blue-400"/> Monitorização de Acordos Outsourcing</h4>
                                <p className="text-[11px] text-blue-200/70 italic">Conformidade Art. 28º DORA: Avaliação de dependência tecnológica e saída segura.</p>
                            </div>

                            <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 space-y-8 shadow-inner">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Ref. do Acordo / Contrato</label>
                                        <input type="text" value={newContract.ref_number} onChange={e => setNewContract({...newContract, ref_number: e.target.value})} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white text-sm" placeholder="CTR-2024-..." />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Descrição Resumida do Objeto</label>
                                        <input type="text" value={newContract.description} onChange={e => setNewContract({...newContract, description: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white text-sm" placeholder="Ex: Manutenção de Hardware" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Fim da Vigência / Renovação</label>
                                        <input type="date" value={newContract.end_date} onChange={e => setNewContract({...newContract, end_date: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-500 uppercase mb-2">Aviso Prévio Rescisão (Dias)</label>
                                        <input type="number" value={newContract.notice_period_days} onChange={e => setNewContract({...newContract, notice_period_days: parseInt(e.target.value)})} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white text-sm" />
                                    </div>
                                </div>
                                
                                <div className="border-t border-gray-700 pt-6">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Mapeamento de Impacto (BIA)</label>
                                    <div className="flex flex-wrap gap-2">
                                        {businessServices?.map(svc => (
                                            <button key={svc.id} type="button" onClick={() => handleServiceToggle(svc.id)} className={`px-5 py-2 rounded-full text-[10px] font-black transition-all ${newContract.supported_service_ids?.includes(svc.id) ? 'bg-brand-primary text-white shadow-xl scale-105' : 'bg-gray-900 text-gray-500 hover:text-gray-300'}`}>
                                                {svc.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-red-900/5 p-6 rounded-xl border border-red-500/20">
                                    <label className="block text-[10px] font-black text-red-400 uppercase mb-2 flex items-center gap-3"><FaDoorOpen/> Estratégia de Saída (DORA Critical Requirement)</label>
                                    <textarea value={newContract.exit_strategy} onChange={e => setNewContract({...newContract, exit_strategy: e.target.value})} rows={3} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-white text-xs italic focus:border-red-500 outline-none shadow-inner" placeholder="Descreva o plano caso o contrato seja rescindido. Existem alternativas prontas?"></textarea>
                                </div>

                                <button type="button" onClick={handleAddContract} className="w-full bg-green-600 hover:bg-green-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-4 transition-all shadow-2xl active:scale-95"><FaPlus /> Vincular Acordo à Ficha Técnica</button>
                            </div>

                            <div className="space-y-6">
                                <h4 className="font-black text-gray-500 text-[10px] uppercase tracking-[0.4em] border-b border-gray-700 pb-3">Acordos Ativos ({(formData.contracts || []).length})</h4>
                                <div className="grid grid-cols-1 gap-4">
                                    {(formData.contracts || []).map((contract, idx) => (
                                        <div key={idx} className="bg-gray-800 p-6 rounded-2xl border border-gray-700 flex justify-between items-center group hover:border-brand-primary transition-all shadow-lg">
                                            <div className="flex items-center gap-6">
                                                <div className="p-4 bg-brand-primary/10 text-brand-secondary rounded-2xl"><FaFileContract size={24}/></div>
                                                <div>
                                                    <p className="font-black text-white text-base">{contract.ref_number}</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">{contract.description}</p>
                                                    <div className="flex gap-6 mt-3">
                                                        <p className="text-[10px] text-brand-secondary font-black uppercase tracking-tighter">Expira: {contract.end_date}</p>
                                                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-tighter">BIA: {contract.supported_service_ids?.length || 0} Serviços</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <button type="button" onClick={() => setFormData(prev => ({...prev, contracts: prev.contracts?.filter((_, i) => i !== idx)}))} className="text-red-500 opacity-0 group-hover:opacity-100 p-3 hover:bg-red-900/20 rounded-full transition-all"><DeleteIcon size={20}/></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </form>

                {successMessage && <div className="p-4 bg-green-500/20 text-green-300 rounded-lg border border-green-500/40 text-center font-black text-xs animate-fade-in mt-6 shadow-lg">{successMessage}</div>}

                <div className="flex justify-end gap-6 pt-10 border-t border-gray-700 mt-auto flex-shrink-0">
                    <button type="button" onClick={onClose} className="px-10 py-3 bg-gray-700 text-white rounded-xl font-bold hover:bg-gray-600 transition-all uppercase text-xs tracking-widest shadow-lg">Cancelar</button>
                    <button type="submit" onClick={handleSubmit} disabled={isSaving} className="px-14 py-3 bg-brand-primary text-white rounded-xl font-black uppercase tracking-[0.2em] hover:bg-brand-secondary shadow-2xl flex items-center gap-4 disabled:opacity-50 transition-all active:scale-95">
                        {isSaving ? <SpinnerIcon /> : <FaSave />} {isSaving ? 'A Processar...' : 'Gravar Ficha Fornecedor'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default AddSupplierModal;