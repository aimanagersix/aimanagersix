import React, { useState, useEffect, useRef } from 'react';
import Modal from './common/Modal';
import { Supplier, CriticalityLevel, Team, Ticket, TicketStatus, SupplierContract, BusinessService, SupplierContact } from '../types';
import { FaShieldAlt, FaGlobe, FaFileContract, FaDownload, FaCopy, FaTicketAlt, FaCertificate, FaCalendarAlt, FaPlus, FaFileSignature, FaDoorOpen, FaUsers, FaUserTie, FaPhone, FaEnvelope } from 'react-icons/fa';
import { SearchIcon, SpinnerIcon, DeleteIcon, PlusIcon } from './common/Icons';
import { ContactList } from './common/ContactList'; // Import generic contact list

interface AddSupplierModalProps {
    onClose: () => void;
    onSave: (supplier: Omit<Supplier, 'id'> | Supplier) => Promise<any>;
    supplierToEdit?: Supplier | null;
    teams?: Team[]; // To select team for ticket
    onCreateTicket?: (ticket: Partial<Ticket>) => Promise<void> | void; // Function to create ticket
    businessServices?: BusinessService[];
}

const MAX_FILES = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const NIF_API_KEY = '9393091ec69bd1564657157b9624809e';

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const AddSupplierModal: React.FC<AddSupplierModalProps> = ({ onClose, onSave, supplierToEdit, teams = [], onCreateTicket, businessServices = [] }) => {
    const [activeTab, setActiveTab] = useState<'details' | 'contacts' | 'contracts'>('details');
    
    const [formData, setFormData] = useState<Partial<Supplier>>({
        name: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        nif: '',
        website: '',
        address: '', // Legacy
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

    // Ticket Automation State
    const [createTicket, setCreateTicket] = useState(false);
    const [ticketTeamId, setTicketTeamId] = useState('');
    const [reminderOffset, setReminderOffset] = useState('3'); // '1', '3', 'custom'
    const [customTicketDate, setCustomTicketDate] = useState('');

    // Extra Certificates State
    const [newCertName, setNewCertName] = useState('');
    const [newCertDate, setNewCertDate] = useState('');

    // Contracts State
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
                address_line: supplierToEdit.address_line || supplierToEdit.address || '',
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
        if (formData.contact_email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
            newErrors.contact_email = "Email inválido.";
        }
        if (formData.is_iso27001_certified && !formData.iso_certificate_expiry) {
            newErrors.iso_certificate_expiry = "Se tem certificação, a data de validade é obrigatória.";
        }
        if (createTicket && !ticketTeamId) {
            newErrors.ticketTeamId = "Selecione uma equipa para o ticket.";
        }
        if (createTicket && reminderOffset === 'custom' && !customTicketDate) {
            newErrors.customTicketDate = "Selecione a data para o alerta.";
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

    const handlePostalCodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value;
        val = val.replace(/[^0-9-]/g, ''); 
        if (val.length > 4 && val.indexOf('-') === -1) {
            val = val.slice(0, 4) + '-' + val.slice(4);
        }
        if (val.length > 8) val = val.slice(0, 8);

        setFormData(prev => ({ ...prev, postal_code: val }));

        if (/^\d{4}-\d{3}$/.test(val)) {
            setIsFetchingCP(true);
            try {
                const res = await fetch(`https://json.geoapi.pt/cp/${val}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.Concelho) {
                        let loc = '';
                        if (data.Freguesia) loc = data.Freguesia;
                        else if (data.part && data.part.length > 0) loc = data.part[0];

                        setFormData(prev => ({
                            ...prev,
                            city: data.Concelho,
                            locality: loc
                        }));
                    }
                }
            } catch (err) {
                console.warn("Erro ao obter dados do CP:", err);
            } finally {
                setIsFetchingCP(false);
            }
        }
    };

    const handleFetchNifData = async () => {
        if (!formData.nif?.trim()) {
            setErrors(prev => ({ ...prev, nif: "Insira um NIF para pesquisar." }));
            return;
        }

        const nif = formData.nif.trim().replace(/[^0-9]/g, '');
        
        if (nif.length !== 9) {
             setErrors(prev => ({ ...prev, nif: "O NIF deve ter 9 dígitos." }));
             return;
        }

        setIsFetchingNif(true);
        setErrors(prev => {
            const newErr = { ...prev };
            delete newErr.nif;
            return newErr;
        });

        try {
            const response = await fetch(`https://corsproxy.io/?https://www.nif.pt/?json=1&q=${nif}&key=${NIF_API_KEY}`);
            if (response.ok) {
                const data = await response.json();
                if (data.result === 'success' && data.records && data.records[nif]) {
                    const record = data.records[nif];
                    setFormData(prev => ({
                        ...prev,
                        name: prev.name || record.title,
                        nif: nif,
                        address_line: record.address,
                        postal_code: record.pc4 && record.pc3 ? `${record.pc4}-${record.pc3}` : prev.postal_code,
                        city: record.city,
                        locality: record.city,
                        contact_email: record.contacts?.email || prev.contact_email,
                        contact_phone: record.contacts?.phone || prev.contact_phone,
                    }));
                } else {
                     setErrors(prev => ({ ...prev, nif: "NIF não encontrado ou inválido." }));
                }
            } else {
                 setErrors(prev => ({ ...prev, nif: "Erro ao comunicar com o serviço de validação." }));
            }
        } catch (e) {
            console.error("Erro NIF.pt:", e);
            setErrors(prev => ({ ...prev, nif: "Erro na consulta do NIF." }));
        } finally {
            setIsFetchingNif(false);
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

    const handleAddCertificate = () => {
        if (!newCertName.trim()) return;
        const newCert = { name: newCertName, expiryDate: newCertDate };
        setFormData(prev => ({
            ...prev,
            other_certifications: [...(prev.other_certifications || []), newCert]
        }));
        setNewCertName('');
        setNewCertDate('');
    };

    const handleRemoveCertificate = (index: number) => {
        setFormData(prev => ({
            ...prev,
            other_certifications: (prev.other_certifications || []).filter((_, i) => i !== index)
        }));
    };

    const handleContactsChange = (contacts: SupplierContact[]) => {
        setFormData(prev => ({ ...prev, contacts }));
    };

    // Contract Handlers
    const handleAddContract = () => {
        if (!newContract.ref_number?.trim() || !newContract.end_date) {
            alert("Preencha pelo menos a Referência e a Data de Fim.");
            return;
        }
        
        const contract: SupplierContract = {
            id: crypto.randomUUID(),
            ref_number: newContract.ref_number || '',
            description: newContract.description || '',
            start_date: newContract.start_date || '',
            end_date: newContract.end_date || '',
            notice_period_days: newContract.notice_period_days || 90,
            exit_strategy: newContract.exit_strategy || '',
            supported_service_ids: newContract.supported_service_ids || [],
            is_active: true
        };

        setFormData(prev => ({
            ...prev,
            contracts: [...(prev.contracts || []), contract]
        }));

        setNewContract({
            ref_number: '',
            description: '',
            start_date: '',
            end_date: '',
            notice_period_days: 90,
            exit_strategy: '',
            supported_service_ids: [],
            is_active: true
        });
    };

    const handleRemoveContract = (id: string) => {
        setFormData(prev => ({
            ...prev,
            contracts: (prev.contracts || []).filter(c => c.id !== id)
        }));
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
        
        const address = [formData.address_line, formData.postal_code, formData.city].filter(Boolean).join(', ');
        const dataToSave: any = {
            ...formData,
            address,
            attachments: attachments.map(({ name, dataUrl }) => ({ name, dataUrl }))
        };

        try {
            if (supplierToEdit) {
                await onSave({ ...supplierToEdit, ...dataToSave });
            } else {
                await onSave(dataToSave);
            }

            // Ticket Creation Logic
            if (createTicket && onCreateTicket && formData.is_iso27001_certified && formData.iso_certificate_expiry) {
                let requestDate = customTicketDate;
                if (reminderOffset !== 'custom') {
                    const expiry = new Date(formData.iso_certificate_expiry);
                    expiry.setMonth(expiry.getMonth() - parseInt(reminderOffset));
                    requestDate = expiry.toISOString().split('T')[0];
                }

                const ticketPayload: Partial<Ticket> = {
                    title: `Renovação Certificado ISO 27001: ${formData.name}`,
                    description: `O certificado ISO 27001 do fornecedor ${formData.name} expira em ${formData.iso_certificate_expiry}. Por favor iniciar processo de renovação ou solicitar novo certificado.`,
                    requestDate: requestDate,
                    status: TicketStatus.Requested,
                    team_id: ticketTeamId,
                    category: 'Manutenção'
                };
                await onCreateTicket(ticketPayload);
            }
            onClose();
        } catch (error) {
            console.error("Erro ao salvar fornecedor ou ticket:", error);
            // Optionally handle error feedback here
        }
    };
    
    const modalTitle = supplierToEdit ? "Editar Fornecedor" : "Adicionar Novo Fornecedor";

    // Email Template Generator
    const generateEmailTemplate = () => {
        const subject = `Solicitação de Evidências de Segurança (NIS2) - ${formData.name}`;
        const body = `Exmos. Senhores,\n\n` +
            `No âmbito da nossa conformidade com a diretiva NIS2 e gestão de risco da cadeia de abastecimento, vimos por este meio solicitar o envio das vossas evidências de segurança atualizadas, nomeadamente:\n\n` +
            `1. Certificado ISO 27001 (se aplicável)\n` +
            `2. Relatório de auditoria de segurança recente ou SOC2\n` +
            `3. Contacto do vosso Encarregado de Proteção de Dados (DPO) ou responsável de segurança (CISO)\n\n` +
            `Agradecemos a vossa colaboração.\n\n` +
            `Atenciosamente,\n\n[A Vossa Empresa]`;
            
        navigator.clipboard.writeText(`Assunto: ${subject}\n\n${body}`);
        alert("Modelo de email copiado para a área de transferência!");
    };

    return (
        <Modal title={modalTitle} onClose={onClose} maxWidth="max-w-5xl">
            <div className="flex flex-col h-[80vh]">
                <div className="flex border-b border-gray-700 mb-4">
                    <button 
                        onClick={() => setActiveTab('details')} 
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'details' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        Detalhes Gerais
                    </button>
                    <button 
                        onClick={() => setActiveTab('contacts')} 
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'contacts' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        Pessoas de Contacto
                    </button>
                    <button 
                        onClick={() => setActiveTab('contracts')} 
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'contracts' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        Contratos & DORA
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto custom-scrollbar pr-2">
                    {activeTab === 'details' && (
                    <div className="space-y-4">
                        {/* Header Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label htmlFor="nif" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">NIF</label>
                                <div className="flex">
                                    <input 
                                        type="text" 
                                        name="nif" 
                                        id="nif" 
                                        value={formData.nif} 
                                        onChange={handleChange} 
                                        placeholder="NIF para pesquisa automática"
                                        className={`flex-grow bg-gray-700 border text-white rounded-l-md p-2 ${errors.nif ? 'border-red-500' : 'border-gray-600'}`}
                                    />
                                    <button 
                                        type="button" 
                                        onClick={handleFetchNifData}
                                        disabled={isFetchingNif || !formData.nif}
                                        className="bg-gray-600 px-3 rounded-r-md hover:bg-gray-500 text-white transition-colors border-t border-b border-r border-gray-600 flex items-center justify-center min-w-[3rem]"
                                        title="Preencher dados via NIF"
                                    >
                                        {isFetchingNif ? <SpinnerIcon /> : <SearchIcon />}
                                    </button>
                                </div>
                                {errors.nif && <p className="text-red-400 text-xs italic mt-1">{errors.nif}</p>}
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="name" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Nome do Fornecedor</label>
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

                        {/* Contact Info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label htmlFor="contact_name" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Nome de Contacto (Geral)</label>
                                <input type="text" name="contact_name" id="contact_name" value={formData.contact_name} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" />
                            </div>
                            <div>
                                <label htmlFor="contact_email" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Email Geral</label>
                                <input type="email" name="contact_email" id="contact_email" value={formData.contact_email} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.contact_email ? 'border-red-500' : 'border-gray-600'}`} />
                                {errors.contact_email && <p className="text-red-400 text-xs italic mt-1">{errors.contact_email}</p>}
                            </div>
                            <div>
                                <label htmlFor="contact_phone" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Telefone Geral</label>
                                <input type="text" name="contact_phone" id="contact_phone" value={formData.contact_phone} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="website" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Website</label>
                            <div className="flex items-center">
                                <FaGlobe className="text-gray-400 mr-2" />
                                <input type="text" name="website" id="website" value={formData.website} onChange={handleChange} placeholder="ex: www.fornecedor.com" className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" />
                            </div>
                        </div>

                        {/* Address Section */}
                        <div className="bg-gray-900/30 p-3 rounded-lg border border-gray-700">
                            <h4 className="text-sm font-semibold text-white mb-2">Morada</h4>
                            <div className="space-y-3">
                                <div>
                                    <label htmlFor="address_line" className="block text-xs font-medium text-on-surface-dark-secondary mb-1">Endereço</label>
                                    <input type="text" name="address_line" value={formData.address_line} onChange={handleChange} placeholder="Rua..." className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm"/>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <label htmlFor="postal_code" className="block text-xs font-medium text-on-surface-dark-secondary mb-1">Código Postal</label>
                                        <div className="relative">
                                            <input type="text" name="postal_code" value={formData.postal_code} onChange={handlePostalCodeChange} placeholder="0000-000" className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm"/>
                                            {isFetchingCP && <div className="absolute right-2 top-2"><SpinnerIcon className="h-4 w-4"/></div>}
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="city" className="block text-xs font-medium text-on-surface-dark-secondary mb-1">Cidade</label>
                                        <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm"/>
                                    </div>
                                    <div>
                                        <label htmlFor="locality" className="block text-xs font-medium text-on-surface-dark-secondary mb-1">Localidade</label>
                                        <input type="text" name="locality" value={formData.locality} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm"/>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Risk & Security Section */}
                        <div className="border-t border-gray-700 pt-4 mt-2">
                            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                                <FaShieldAlt className="text-brand-secondary" />
                                Gestão de Risco & Conformidade (NIS2)
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label htmlFor="risk_level" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Nível de Risco (Supply Chain)</label>
                                    <select name="risk_level" id="risk_level" value={formData.risk_level} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2">
                                        {Object.values(CriticalityLevel).map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="security_contact_email" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Email de Segurança (PSIRT)</label>
                                    <input type="email" name="security_contact_email" value={formData.security_contact_email} onChange={handleChange} placeholder="security@vendor.com" className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" />
                                </div>
                            </div>

                            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-600 mb-4">
                                <div className="flex items-center mb-2">
                                    <input
                                        type="checkbox"
                                        name="is_iso27001_certified"
                                        id="is_iso27001_certified"
                                        checked={formData.is_iso27001_certified}
                                        onChange={handleChange}
                                        className="h-4 w-4 rounded border-gray-300 bg-gray-700 text-brand-primary focus:ring-brand-secondary"
                                    />
                                    <label htmlFor="is_iso27001_certified" className="ml-2 block text-sm font-bold text-white">
                                        Certificado ISO 27001
                                    </label>
                                </div>
                                
                                {formData.is_iso27001_certified && (
                                    <div className="ml-6 mt-2 space-y-3 animate-fade-in">
                                        <div>
                                            <label htmlFor="iso_certificate_expiry" className="block text-xs font-medium text-on-surface-dark-secondary mb-1">Data de Validade do Certificado</label>
                                            <input 
                                                type="date" 
                                                name="iso_certificate_expiry" 
                                                id="iso_certificate_expiry" 
                                                value={formData.iso_certificate_expiry} 
                                                onChange={handleChange} 
                                                className={`bg-gray-700 border text-white rounded-md p-2 text-sm ${errors.iso_certificate_expiry ? 'border-red-500' : 'border-gray-600'}`}
                                            />
                                            {errors.iso_certificate_expiry && <p className="text-red-400 text-xs italic mt-1">{errors.iso_certificate_expiry}</p>}
                                        </div>

                                        {/* Ticket Automation */}
                                        <div className="bg-brand-primary/10 p-3 rounded border border-brand-primary/30">
                                            <div className="flex items-center mb-2">
                                                <input 
                                                    type="checkbox" 
                                                    id="createTicket" 
                                                    checked={createTicket} 
                                                    onChange={(e) => setCreateTicket(e.target.checked)} 
                                                    disabled={!onCreateTicket}
                                                    className="h-4 w-4 rounded border-gray-300 bg-gray-700 text-brand-primary"
                                                />
                                                <label htmlFor="createTicket" className="ml-2 text-sm font-bold text-brand-secondary flex items-center gap-2">
                                                    <FaTicketAlt /> Criar alerta de renovação (Ticket)
                                                </label>
                                            </div>
                                            
                                            {createTicket && (
                                                <div className="ml-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs text-gray-400 mb-1">Equipa Responsável</label>
                                                        <select 
                                                            value={ticketTeamId} 
                                                            onChange={(e) => setTicketTeamId(e.target.value)} 
                                                            className={`w-full bg-gray-800 border border-gray-600 text-white rounded p-1 text-xs ${errors.ticketTeamId ? 'border-red-500' : ''}`}
                                                        >
                                                            <option value="">-- Selecione --</option>
                                                            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-gray-400 mb-1">Antecedência do Alerta</label>
                                                        <select 
                                                            value={reminderOffset} 
                                                            onChange={(e) => setReminderOffset(e.target.value)} 
                                                            className="w-full bg-gray-800 border border-gray-600 text-white rounded p-1 text-xs"
                                                        >
                                                            <option value="1">1 Mês Antes</option>
                                                            <option value="3">3 Meses Antes</option>
                                                            <option value="custom">Data Personalizada</option>
                                                        </select>
                                                    </div>
                                                    {reminderOffset === 'custom' && (
                                                        <div className="md:col-span-2">
                                                            <label className="block text-xs text-gray-400 mb-1">Data do Alerta</label>
                                                            <input 
                                                                type="date" 
                                                                value={customTicketDate} 
                                                                onChange={(e) => setCustomTicketDate(e.target.value)} 
                                                                className={`bg-gray-800 border border-gray-600 text-white rounded p-1 text-xs ${errors.customTicketDate ? 'border-red-500' : ''}`}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Other Certifications */}
                            <div className="bg-gray-900/30 p-3 rounded-lg border border-gray-700 mb-4">
                                <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                                    <FaCertificate className="text-yellow-500"/> Outras Certificações
                                </h4>
                                
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {(formData.other_certifications || []).map((cert, idx) => (
                                        <div key={idx} className="flex items-center gap-2 bg-gray-800 px-2 py-1 rounded text-xs border border-gray-600">
                                            <span className="text-white font-medium">{cert.name}</span>
                                            {cert.expiryDate && <span className="text-gray-400">({cert.expiryDate})</span>}
                                            <button 
                                                type="button" 
                                                onClick={() => handleRemoveCertificate(idx)}
                                                className="text-red-400 hover:text-red-300"
                                            >
                                                <DeleteIcon className="h-3 w-3"/>
                                            </button>
                                        </div>
                                    ))}
                                    {(formData.other_certifications || []).length === 0 && (
                                        <span className="text-xs text-gray-500 italic">Nenhuma certificação extra adicionada.</span>
                                    )}
                                </div>

                                <div className="flex gap-2 items-end bg-gray-800/50 p-2 rounded">
                                    <div className="flex-grow">
                                        <label className="block text-[10px] text-gray-400 uppercase mb-1">Nome do Certificado</label>
                                        <input 
                                            type="text" 
                                            value={newCertName} 
                                            onChange={(e) => setNewCertName(e.target.value)} 
                                            placeholder="Ex: SOC2 Type II" 
                                            className="w-full bg-gray-700 border border-gray-600 text-white rounded p-1 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-400 uppercase mb-1">Validade</label>
                                        <input 
                                            type="date" 
                                            value={newCertDate} 
                                            onChange={(e) => setNewCertDate(e.target.value)} 
                                            className="bg-gray-700 border border-gray-600 text-white rounded p-1 text-sm"
                                        />
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={handleAddCertificate} 
                                        disabled={!newCertName}
                                        className="bg-green-600 text-white p-1.5 rounded hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <PlusIcon className="h-4 w-4"/>
                                    </button>
                                </div>
                            </div>

                            <button 
                                type="button" 
                                onClick={generateEmailTemplate} 
                                className="text-xs flex items-center gap-2 text-brand-secondary hover:text-white transition-colors mb-4"
                            >
                                <FaCopy /> Copiar Modelo de Email para Pedido de Evidências
                            </button>
                        </div>

                        {/* Attachments */}
                        <div>
                            <label className="block text-sm font-medium text-on-surface-dark-secondary mb-2">Anexos (Certificados, Relatórios)</label>
                            <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700">
                                {attachments.length > 0 && (
                                    <ul className="space-y-2 mb-3">
                                        {attachments.map((file, index) => (
                                            <li key={index} className="flex justify-between items-center text-sm p-2 bg-surface-dark rounded-md">
                                                <span className="truncate text-on-surface-dark-secondary">
                                                    {file.name}
                                                    {file.size > 0 && <span className="text-xs ml-2 text-gray-400">({formatFileSize(file.size)})</span>}
                                                </span>
                                                <div className="flex gap-2">
                                                    {file.size === 0 && ( // Existing file from DB
                                                        <a href={file.dataUrl} download={file.name} className="text-brand-secondary hover:text-white" title="Download">
                                                            <FaDownload />
                                                        </a>
                                                    )}
                                                    <button type="button" onClick={() => handleRemoveAttachment(index)} className="text-red-400 hover:text-red-300 ml-2">
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
                                    accept="application/pdf,image/*"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={attachments.length >= MAX_FILES}
                                    className="w-full px-4 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <FaFileContract />
                                    {`Anexar Documentos (${attachments.length}/${MAX_FILES})`}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="notes" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Notas Internas</label>
                            <textarea name="notes" id="notes" value={formData.notes} onChange={handleChange} rows={3} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"></textarea>
                        </div>
                    </div>
                    )}

                    {activeTab === 'contacts' && (
                        <ContactList 
                            contacts={formData.contacts || []} 
                            onChange={handleContactsChange} 
                            resourceType="supplier"
                        />
                    )}

                    {activeTab === 'contracts' && (
                        <div className="space-y-6 p-1">
                            <div className="bg-blue-900/20 border border-blue-900/50 p-4 rounded-lg text-sm text-blue-200">
                                <h3 className="font-bold flex items-center gap-2 mb-2"><FaFileContract /> Artigo 28º do DORA - Gestão de Risco de Terceiros</h3>
                                <p className="text-xs text-gray-300">
                                    É obrigatório manter um registo de informação sobre todos os acordos contratuais. Para funções críticas ou importantes, deve definir explicitamente a estratégia de saída e períodos de pré-aviso.
                                </p>
                            </div>

                            {/* Add New Contract Form */}
                            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                                <h4 className="text-white font-bold mb-4 flex items-center gap-2"><FaPlus /> Adicionar Contrato</h4>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Ref. Contrato</label>
                                        <input 
                                            type="text" 
                                            value={newContract.ref_number}
                                            onChange={(e) => setNewContract({...newContract, ref_number: e.target.value})}
                                            className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm"
                                            placeholder="Ex: CTR-2024-001"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Descrição</label>
                                        <input 
                                            type="text" 
                                            value={newContract.description}
                                            onChange={(e) => setNewContract({...newContract, description: e.target.value})}
                                            className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm"
                                            placeholder="Ex: Alojamento Cloud SLA Gold"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Início</label>
                                        <input 
                                            type="date" 
                                            value={newContract.start_date}
                                            onChange={(e) => setNewContract({...newContract, start_date: e.target.value})}
                                            className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Fim / Renovação</label>
                                        <input 
                                            type="date" 
                                            value={newContract.end_date}
                                            onChange={(e) => setNewContract({...newContract, end_date: e.target.value})}
                                            className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Pré-Aviso (Dias)</label>
                                        <input 
                                            type="number" 
                                            value={newContract.notice_period_days}
                                            onChange={(e) => setNewContract({...newContract, notice_period_days: parseInt(e.target.value)})}
                                            className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-xs font-bold text-red-400 mb-1 flex items-center gap-2">
                                        <FaDoorOpen /> Estratégia de Saída (Obrigatório para Funções Críticas)
                                    </label>
                                    <textarea 
                                        value={newContract.exit_strategy}
                                        onChange={(e) => setNewContract({...newContract, exit_strategy: e.target.value})}
                                        rows={2}
                                        className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm"
                                        placeholder="Descreva como migrar o serviço em caso de falha do fornecedor (ex: Backup offline, fornecedor alternativo pré-aprovado...)"
                                    ></textarea>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-xs text-gray-400 mb-2">Funções Críticas Suportadas (Business Services)</label>
                                    <div className="max-h-32 overflow-y-auto border border-gray-600 rounded bg-gray-900 p-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {businessServices.map(service => (
                                            <label key={service.id} className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer hover:bg-gray-800 p-1 rounded">
                                                <input 
                                                    type="checkbox" 
                                                    checked={(newContract.supported_service_ids || []).includes(service.id)}
                                                    onChange={() => handleServiceToggle(service.id)}
                                                    className="rounded border-gray-500 bg-gray-700 text-brand-primary focus:ring-brand-secondary"
                                                />
                                                <span className={service.criticality === CriticalityLevel.Critical ? 'text-red-400 font-bold' : ''}>
                                                    {service.name}
                                                </span>
                                            </label>
                                        ))}
                                        {businessServices.length === 0 && <span className="text-gray-500 italic text-xs p-1">Nenhum serviço registado.</span>}
                                    </div>
                                </div>

                                <button 
                                    type="button" 
                                    onClick={handleAddContract}
                                    className="w-full bg-brand-primary hover:bg-brand-secondary text-white py-2 rounded flex items-center justify-center gap-2 transition-colors"
                                >
                                    <FaFileSignature /> Registar Contrato
                                </button>
                            </div>

                            {/* Existing Contracts List */}
                            <div>
                                <h4 className="text-white font-bold mb-3 border-b border-gray-700 pb-1">Contratos Registados ({formData.contracts?.length || 0})</h4>
                                <div className="space-y-3">
                                    {(formData.contracts || []).map((contract, idx) => (
                                        <div key={contract.id || idx} className="bg-gray-800 p-3 rounded border border-gray-700 relative group">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <span className="text-brand-secondary font-bold text-sm">{contract.ref_number}</span>
                                                    <span className="text-gray-400 text-xs ml-2">| {contract.description}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] px-2 py-0.5 rounded ${contract.is_active ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                                                        {contract.is_active ? 'Ativo' : 'Inativo'}
                                                    </span>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => handleRemoveContract(contract.id)}
                                                        className="text-red-400 hover:text-red-300 p-1"
                                                    >
                                                        <DeleteIcon className="h-4 w-4"/>
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 mb-2">
                                                <div>Início: {contract.start_date}</div>
                                                <div>Fim: {contract.end_date}</div>
                                                <div>Pré-Aviso: {contract.notice_period_days} dias</div>
                                                <div>Funções: {contract.supported_service_ids?.length || 0}</div>
                                            </div>
                                            {contract.exit_strategy && (
                                                <div className="text-xs bg-gray-900 p-2 rounded text-gray-300 italic border-l-2 border-red-500">
                                                    <span className="font-bold not-italic text-red-400">Exit Strategy: </span>
                                                    {contract.exit_strategy}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {(formData.contracts || []).length === 0 && (
                                        <p className="text-center text-gray-500 text-sm py-4 italic">Nenhum contrato registado.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </form>

                <div className="flex justify-end gap-4 pt-4 border-t border-gray-700 mt-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Cancelar</button>
                    <button type="button" onClick={handleSubmit} className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary">Salvar Tudo</button>
                </div>
            </div>
        </Modal>
    );
};

export default AddSupplierModal;