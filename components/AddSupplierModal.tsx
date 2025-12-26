
import React, { useState, useEffect, useRef } from 'react';
import Modal from './common/Modal';
import { Supplier, CriticalityLevel, Team, Ticket, TicketStatus, SupplierContract, BusinessService, ResourceContact } from '../types';
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
const NIF_API_KEY = '9393091ec69bd1564657157b9624809e';

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
            const targetUrl = `https://www.nif.pt/?json=1&q=${nif}&key=${NIF_API_KEY}`;
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setIsSaving(true);
        const dataToSave: any = { ...formData, attachments: attachments.map(({ name, dataUrl }) => ({ name, dataUrl })) };
        try {
            await onSave(dataToSave);
            setSuccessMessage('Fornecedor gravado com sucesso! A monitorização hands-free está ativa.');
            setTimeout(() => setSuccessMessage(''), 3000);
        } finally { setIsSaving(false); }
    };

    return (
        <Modal title={supplierToEdit ? "Editar Fornecedor" : "Adicionar Fornecedor"} onClose={onClose} maxWidth="max-w-5xl">
            <div className="flex flex-col">
                <div className="flex border-b border-gray-700 mb-6 overflow-x-auto whitespace-nowrap">
                    <button type="button" onClick={() => setActiveTab('details')} className={`px-6 py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'details' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}>Detalhes Gerais</button>
                    <button type="button" onClick={() => setActiveTab('contacts')} className={`px-6 py-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'contacts' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}>Pessoas de Contacto</button>
                    <button type="button" onClick={() => setActiveTab('contracts')} className={`px-6 py-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'contracts' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}>Contratos & DORA</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {activeTab === 'details' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">NIF</label>
                                <div className="flex">
                                    <input type="text" name="nif" value={formData.nif} onChange={handleChange} className={`flex-grow bg-gray-700 border text-white rounded-l p-2 text-sm focus:border-brand-primary outline-none ${errors.nif ? 'border-red-500' : 'border-gray-600'}`} />
                                    <button type="button" onClick={handleFetchNifData} className="bg-gray-600 px-3 rounded-r border-gray-600 hover:bg-gray-500 text-white transition-colors">{isFetchingNif ? <SpinnerIcon /> : <SearchIcon />}</button>
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Nome Comercial</label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded p-2 text-sm focus:border-brand-primary outline-none ${errors.name ? 'border-red-500' : 'border-gray-600'}`} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Website</label>
                                <input type="text" name="website" value={formData.website} onChange={handleChange} placeholder="www.fornecedor.com" className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Nível de Risco (Supply Chain)</label>
                                <select name="risk_level" value={formData.risk_level} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm">
                                    {Object.values(CriticalityLevel).map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                            <h4 className="text-[10px] font-black text-brand-secondary uppercase mb-3 tracking-widest flex items-center gap-2"><FaShieldAlt/> Segurança & ISO</h4>
                            <div className="flex items-center mb-4">
                                <input type="checkbox" name="is_iso27001_certified" id="iso" checked={formData.is_iso27001_certified} onChange={handleChange} className="h-4 w-4 rounded bg-gray-700 text-brand-primary border-gray-600" />
                                <label htmlFor="iso" className="ml-2 block text-sm font-bold text-white">Certificado ISO 27001 Ativo</label>
                            </div>
                            {formData.is_iso27001_certified && (
                                <div className="ml-6 space-y-3 animate-fade-in">
                                    <div>
                                        <label className="block text-[10px] text-gray-400 uppercase mb-1">Data de Validade do Certificado</label>
                                        <input type="date" name="iso_certificate_expiry" value={formData.iso_certificate_expiry} onChange={handleChange} className={`bg-gray-700 border text-white rounded p-2 text-sm ${errors.iso_certificate_expiry ? 'border-red-500' : 'border-gray-600'}`} />
                                    </div>
                                    <div className="bg-blue-900/10 p-3 rounded border border-blue-500/30 flex items-start gap-3">
                                        <FaRobot className="text-brand-secondary mt-1 flex-shrink-0" />
                                        <p className="text-[11px] text-blue-200">
                                            <strong>Monitorização Hands-Free Ativa:</strong> O servidor criará automaticamente um ticket para a equipa de <strong>Triagem</strong> 30 dias antes da expiração deste certificado para solicitar as novas evidências.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Morada e Localização</label>
                            <input type="text" name="address_line" value={formData.address_line} onChange={handleChange} placeholder="Rua, Edifício, Piso..." className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm" />
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <input type="text" name="postal_code" value={formData.postal_code} onChange={handlePostalCodeChange} placeholder="CP 0000-000" className="bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm" />
                                <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="Cidade" className="bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm" />
                                <input type="text" name="locality" value={formData.locality} onChange={handleChange} placeholder="Localidade" className="bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 tracking-widest">Documentos e Certificados (PDF/JPG)</label>
                            <div className="bg-gray-900/50 p-4 rounded border border-gray-700 border-dashed text-center">
                                {attachments.length > 0 && (
                                    <ul className="space-y-2 mb-4 text-left">
                                        {attachments.map((file, index) => (
                                            <li key={index} className="flex justify-between items-center text-xs p-2 bg-gray-800 rounded">
                                                <span className="truncate text-gray-300">{file.name}</span>
                                                <button type="button" onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))} className="text-red-400 p-1 hover:bg-red-900/20 rounded"><DeleteIcon className="h-4 w-4" /></button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                <input type="file" multiple ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,application/pdf" />
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="px-6 py-2 text-xs font-bold bg-gray-700 hover:bg-gray-600 text-white rounded border border-gray-600 transition-all">+ Adicionar Ficheiros</button>
                            </div>
                        </div>
                    </div>
                    )}

                    {activeTab === 'contacts' && (
                        <div className="animate-fade-in min-h-[400px]">
                            <ContactList contacts={formData.contacts || []} onChange={(c) => setFormData({...formData, contacts: c})} resourceType="supplier" />
                        </div>
                    )}

                    {activeTab === 'contracts' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 space-y-4">
                                <h4 className="font-black text-white text-[10px] uppercase border-b border-gray-700 pb-2">Registar Novo Contrato (NIS2/DORA)</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input type="text" value={newContract.ref_number} onChange={e => setNewContract({...newContract, ref_number: e.target.value})} className="bg-gray-700 border border-gray-600 rounded p-2 text-white text-sm" placeholder="Ref. Contrato" />
                                    <input type="text" value={newContract.description} onChange={e => setNewContract({...newContract, description: e.target.value})} className="bg-gray-700 border border-gray-600 rounded p-2 text-white text-sm" placeholder="Descrição (ex: Cloud Office)" />
                                    <div>
                                        <label className="block text-[10px] text-gray-500 mb-1">Data de Fim</label>
                                        <input type="date" value={newContract.end_date} onChange={e => setNewContract({...newContract, end_date: e.target.value})} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-500 mb-1">Pré-Aviso (Dias)</label>
                                        <input type="number" value={newContract.notice_period_days} onChange={e => setNewContract({...newContract, notice_period_days: parseInt(e.target.value)})} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white text-sm" />
                                    </div>
                                </div>
                                <button type="button" onClick={handleAddContract} className="w-full bg-green-600 hover:bg-green-500 text-white py-2 rounded-md font-bold text-xs flex items-center justify-center gap-2"><FaPlus /> Adicionar Contrato à Ficha</button>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-bold text-gray-400 text-xs uppercase">Contratos Registados ({(formData.contracts || []).length})</h4>
                                {(formData.contracts || []).map((contract: any, idx: number) => (
                                    <div key={idx} className="bg-gray-800 p-3 rounded border border-gray-700 flex justify-between items-center group">
                                        <div>
                                            <p className="font-bold text-brand-secondary text-sm">{contract.ref_number}</p>
                                            <p className="text-xs text-white">{contract.description}</p>
                                            <p className="text-[10px] text-gray-500 mt-1">Expira em: {contract.end_date}</p>
                                        </div>
                                        <button type="button" onClick={() => setFormData(prev => ({...prev, contracts: prev.contracts?.filter((_, i) => i !== idx)}))} className="text-red-400 opacity-0 group-hover:opacity-100 p-2 hover:bg-red-900/20 rounded transition-all"><DeleteIcon/></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {successMessage && <div className="p-3 bg-green-500/20 text-green-300 rounded border border-green-500/50 text-center font-bold text-xs animate-fade-in">{successMessage}</div>}

                    <div className="flex justify-end gap-4 pt-6 border-t border-gray-700">
                        <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-600 text-white rounded font-bold text-sm hover:bg-gray-500 transition-colors">Cancelar</button>
                        <button type="submit" disabled={isSaving} className="px-8 py-2 bg-brand-primary text-white rounded font-black uppercase tracking-widest hover:bg-brand-secondary shadow-xl flex items-center gap-2 disabled:opacity-50">
                            {isSaving ? <SpinnerIcon /> : <FaSave />} {isSaving ? 'A Gravar...' : 'Salvar Fornecedor'}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default AddSupplierModal;
