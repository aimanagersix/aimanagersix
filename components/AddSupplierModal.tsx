import React, { useState, useEffect, useRef } from 'react';
import Modal from './common/Modal';
import { Supplier, CriticalityLevel, Team, Ticket, TicketStatus, SupplierContract, BusinessService, ResourceContact } from '../types';
import { FaShieldAlt, FaGlobe, FaFileContract, FaDownload, FaCopy, FaTicketAlt, FaCertificate, FaCalendarAlt, FaPlus, FaFileSignature, FaDoorOpen, FaUsers, FaUserTie, FaPhone, FaEnvelope, FaMagic, FaSave, FaInfoCircle, FaRobot, FaTimes, FaLandmark, FaAddressCard, FaSearchLocation } from 'react-icons/fa';
import { SearchIcon, SpinnerIcon, FaTrash as DeleteIcon, PlusIcon, CheckIcon } from './common/Icons';
import { ContactList } from './common/ContactList'; 
import * as dataService from '../services/dataService';

/**
 * ADD SUPPLIER MODAL - V14.0 (Standardized Scale)
 * -----------------------------------------------------------------------------
 * STATUS DE BLOQUEIO RIGOROSO (Freeze UI):
 * - PEDIDO 2: REDUÇÃO DE maxWidth PARA max-w-4xl PARA ALINHAMENTO ESTÉTICO.
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
        contacts: [],
        is_active: true
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
    const [showExtraCerts, setShowExtraCerts] = useState(false);

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
                contacts: supplierToEdit.contacts || [],
                is_active: supplierToEdit.is_active !== false
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
        <Modal title={supplierToEdit ? "Editar Fornecedor" : "Registar Novo Fornecedor"} onClose={onClose} maxWidth="max-w-4xl">
            <div className="flex flex-col h-[80vh]">
                
                {/* Cabeçalho de Navegação Fixo */}
                <div className="flex-shrink-0">
                    {/* Desktop Tabs */}
                    <div className="flex border-b border-gray-700 mb-6 overflow-x-auto whitespace-nowrap px-1 scrollbar-hide">
                        <button type="button" onClick={() => setActiveTab('details')} className={`px-6 py-2 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex-shrink-0 ${activeTab === 'details' ? 'border-brand-secondary text-white bg-gray-800/40' : 'border-transparent text-gray-500 hover:text-white'}`}>Identificação</button>
                        <button type="button" onClick={() => setActiveTab('contacts')} className={`px-6 py-2 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex-shrink-0 ${activeTab === 'contacts' ? 'border-brand-secondary text-white bg-gray-800/40' : 'border-transparent text-gray-400 hover:text-white'}`}>Contactos</button>
                        <button type="button" onClick={() => setActiveTab('contracts')} className={`px-6 py-2 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex-shrink-0 ${activeTab === 'contracts' ? 'border-brand-secondary text-white bg-gray-800/40' : 'border-transparent text-gray-400 hover:text-white'}`}>Contratos DORA</button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto custom-scrollbar pr-3 space-y-6">
                    {activeTab === 'details' && (
                    <div className="space-y-6 animate-fade-in">
                        
                        <div className="bg-gray-800/40 p-6 rounded-xl border border-gray-700 shadow-md">
                            <h4 className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.2em] mb-4">Identificação Institucional</h4>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="md:col-span-1">
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">NIF</label>
                                    <div className="flex">
                                        <input type="text" name="nif" value={formData.nif} onChange={handleChange} className={`flex-grow bg-gray-900 border-none text-white p-2 text-sm focus:ring-0 font-mono ${errors.nif ? 'border-red-500' : ''}`} placeholder="500..." />
                                        <button type="button" onClick={handleFetchNifData} className="bg-gray-700 px-3 hover:bg-brand-primary text-white transition-all border-l border-gray-600">{isFetchingNif ? <SpinnerIcon /> : <SearchIcon />}</button>
                                    </div>
                                </div>
                                <div className="md:col-span-3">
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Nome Comercial</label>
                                    <input type="text" name="name" value={formData.name} onChange={handleChange} className={`w-full bg-gray-900 border border-gray-700 text-white rounded p-2 text-sm focus:border-brand-primary outline-none ${errors.name ? 'border-red-500' : ''}`} />
                                </div>
                                <div className="md:col-span-4">
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Website</label>
                                    <input type="text" name="website" value={formData.website} onChange={handleChange} placeholder="www.exemplo.pt" className="w-full bg-gray-900 border border-gray-700 text-white rounded p-2 text-sm focus:border-brand-primary outline-none" />
                                </div>
                                <div className="md:col-span-4 flex items-center justify-between bg-black/20 p-3 rounded border border-gray-700">
                                    <span className="text-xs text-gray-400 font-bold uppercase">Estado Operacional</span>
                                    <label className="flex items-center cursor-pointer group">
                                        <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} className="h-5 w-5 rounded bg-gray-900 border-gray-700 text-brand-primary" />
                                        <span className="ml-3 text-xs font-black text-white uppercase tracking-widest">Ativo</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-800/40 p-6 rounded-xl border border-gray-700 shadow-md">
                            <h4 className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.2em] mb-4">Segurança NIS2</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] text-gray-400 uppercase mb-1">Nível de Risco</label>
                                    <select name="risk_level" value={formData.risk_level} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-xs font-bold uppercase">
                                        {Object.values(CriticalityLevel).map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] text-gray-400 uppercase mb-1">Ponto de Contacto Incidentes</label>
                                    <input type="email" name="security_contact_email" value={formData.security_contact_email} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 text-white rounded p-2 text-sm font-mono" />
                                </div>
                            </div>
                        </div>
                    </div>
                    )}

                    {activeTab === 'contacts' && (
                        <div className="animate-fade-in">
                            <ContactList contacts={formData.contacts || []} onChange={(c) => setFormData({...formData, contacts: c})} resourceType="supplier" />
                        </div>
                    )}

                    {activeTab === 'contracts' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 space-y-4">
                                <h4 className="text-white font-bold text-xs uppercase flex items-center gap-2"><FaFileSignature className="text-blue-400"/> Registo de Contratos</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input type="text" value={newContract.ref_number} onChange={e => setNewContract({...newContract, ref_number: e.target.value})} className="bg-gray-700 border border-gray-600 rounded p-2 text-white text-xs" placeholder="Referência Contrato" />
                                    <input type="text" value={newContract.description} onChange={e => setNewContract({...newContract, description: e.target.value})} className="bg-gray-700 border border-gray-600 rounded p-2 text-white text-xs" placeholder="Descrição Objeto" />
                                    <input type="date" value={newContract.end_date} onChange={e => setNewContract({...newContract, end_date: e.target.value})} className="bg-gray-700 border border-gray-600 rounded p-2 text-white text-xs" />
                                    <button type="button" onClick={handleAddContract} className="bg-brand-primary text-white py-2 rounded font-black text-[10px] uppercase tracking-widest"><FaPlus className="inline mr-2"/> Vincular Acordo</button>
                                </div>
                            </div>
                        </div>
                    )}
                </form>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-700 mt-auto flex-shrink-0">
                    <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-700 text-white rounded font-bold text-xs hover:bg-gray-600 transition-all uppercase tracking-widest">Cancelar</button>
                    <button type="submit" onClick={handleSubmit} disabled={isSaving} className="px-8 py-2 bg-brand-primary text-white rounded font-black uppercase tracking-widest hover:bg-brand-secondary shadow-lg flex items-center gap-2 disabled:opacity-50">
                        {isSaving ? <SpinnerIcon /> : <FaSave />} Gravar Fornecedor
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default AddSupplierModal;