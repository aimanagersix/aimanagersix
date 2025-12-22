import React, { useState, useEffect, useRef } from 'react';
import Modal from './common/Modal';
import { Collaborator, Entidade, UserRole, CollaboratorStatus, ConfigItem, ContactTitle, CustomRole, Instituicao, JobTitle } from '../types';
import { SpinnerIcon, CheckIcon } from './common/Icons';
import { FaGlobe, FaMagic, FaCamera, FaTrash, FaKey, FaBriefcase, FaPlus, FaBirthdayCake, FaUserShield, FaBell, FaCalendarAlt } from 'react-icons/fa';
import * as dataService from '../services/dataService';

const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isValidMobile = (phone: string): boolean => {
    if (!phone || phone.trim() === '') return true;
    const cleaned = phone.replace(/[\s-()]/g, '').replace(/^\+351/, '');
    const regex = /^9[1236]\d{7}$/;
    return regex.test(cleaned);
};

const isValidNif = (nif: string): boolean => {
    if (!nif || nif.trim() === '') return true;
    const cleaned = nif.replace(/\s/g, '');
    return /^\d{9}$/.test(cleaned);
};

// Extract domain from website URL
const extractDomain = (url: string): string => {
    try {
        let domain = url.trim();
        if (!domain) return '';
        if (!domain.startsWith('http')) domain = 'https://' + domain;
        const hostname = new URL(domain).hostname;
        return hostname.replace(/^www\./, '');
    } catch { return ''; }
};

// Auxiliar para compressão de imagem
const compressProfileImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_SIZE = 400; 
                let width = img.width;
                let height = img.height;
                if (width > height) {
                    if (width > MAX_SIZE) {
                        height *= MAX_SIZE / width;
                        width = MAX_SIZE;
                    }
                } else {
                    if (height > MAX_SIZE) {
                        width *= MAX_SIZE / height;
                        height = MAX_SIZE;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: 'image/jpeg', lastModified: Date.now() }));
                    } else {
                        resolve(file); 
                    }
                }, 'image/jpeg', 0.7);
            };
        };
    });
};

interface AddCollaboratorModalProps {
    onClose: () => void;
    onSave: (collaborator: Omit<Collaborator, 'id'> | Collaborator, password?: string) => Promise<any>;
    collaboratorToEdit?: Collaborator | null;
    escolasDepartamentos: Entidade[];
    instituicoes: Instituicao[];
    currentUser: Collaborator | null;
    roleOptions?: ConfigItem[];
    titleOptions?: ContactTitle[];
}

const AddCollaboratorModal: React.FC<AddCollaboratorModalProps> = ({ 
    onClose, 
    onSave, 
    collaboratorToEdit, 
    escolasDepartamentos: entidades, 
    instituicoes,
    currentUser,
    roleOptions,
    titleOptions 
}) => {
    const [formData, setFormData] = useState<Partial<Collaborator>>({
        numero_mecanografico: '',
        title: '',
        full_name: '',
        entidade_id: '',
        instituicao_id: '',
        email: '',
        nif: '',
        telefone_interno: '',
        telemovel: '',
        date_of_birth: '',
        admission_date: '',
        address_line: '',
        postal_code: '',
        city: '',
        locality: '',
        can_login: false,
        receives_notifications: false,
        role: 'Utilizador',
        job_title_id: '',
        status: CollaboratorStatus.Ativo,
        photo_url: ''
    });
    
    const [password, setPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isCompressing, setIsCompressing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [availableRoles, setAvailableRoles] = useState<CustomRole[]>([]);
    const [dbTitles, setDbTitles] = useState<string[]>([]);
    
    const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
    const [showAddJobTitle, setShowAddJobTitle] = useState(false);
    const [newJobTitleName, setNewJobTitleName] = useState('');

    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [selectedInstituicao, setSelectedInstituicao] = useState<string>('');
    const [isGlobalAdmin, setIsGlobalAdmin] = useState(false);
    const isSuperAdmin = currentUser?.role === UserRole.SuperAdmin;
    const showGlobalToggle = isSuperAdmin && formData.role === UserRole.SuperAdmin;

    useEffect(() => {
        const loadConfig = async () => {
            const roles = await dataService.getCustomRoles();
            setAvailableRoles(roles);
            const data = await dataService.fetchAllData();
            if (data.configJobTitles) setJobTitles(data.configJobTitles);
            if (data.contactTitles) setDbTitles(data.contactTitles.map((t: any) => t.name));
        };
        loadConfig();
    }, []);

    const defaultRoles = ['Admin', 'Técnico', 'Utilizador'];
    const displayRoles = availableRoles.length > 0 ? availableRoles.map(r => r.name) : defaultRoles;
    const filteredRoles = isSuperAdmin ? displayRoles : displayRoles.filter(role => role !== UserRole.SuperAdmin);
    const titles = dbTitles.length > 0 ? dbTitles : (titleOptions && titleOptions.length > 0 ? titleOptions.map(t => t.name) : ['Sr.', 'Sra.', 'Dr.', 'Dra.', 'Eng.', 'Eng.ª']);
    const filteredEntidades = entidades.filter(e => e.instituicao_id === selectedInstituicao);

    useEffect(() => {
        if (collaboratorToEdit) {
            setFormData({
                ...collaboratorToEdit,
                address_line: collaboratorToEdit.address_line || (collaboratorToEdit as any).address || '',
                postal_code: collaboratorToEdit.postal_code || '',
                city: collaboratorToEdit.city || '',
                locality: collaboratorToEdit.locality || '',
                nif: collaboratorToEdit.nif || '',
                title: collaboratorToEdit.title || '',
                date_of_birth: collaboratorToEdit.date_of_birth || '',
                admission_date: collaboratorToEdit.admission_date || '',
                entidade_id: collaboratorToEdit.entidade_id || '',
                instituicao_id: collaboratorToEdit.instituicao_id || '',
                job_title_id: collaboratorToEdit.job_title_id || ''
            });
            setPhotoPreview(collaboratorToEdit.photo_url || null);
            if (collaboratorToEdit.entidade_id) {
                const ent = entidades.find(e => e.id === collaboratorToEdit.entidade_id);
                if (ent) setSelectedInstituicao(ent.instituicao_id);
            } else if (collaboratorToEdit.instituicao_id) {
                setSelectedInstituicao(collaboratorToEdit.instituicao_id);
            }
            if (!collaboratorToEdit.entidade_id && !collaboratorToEdit.instituicao_id && (collaboratorToEdit.role === UserRole.SuperAdmin)) {
                setIsGlobalAdmin(true);
            }
        } else {
             if (instituicoes.length > 0) {
                 const defaultInst = instituicoes[0].id;
                 setSelectedInstituicao(defaultInst);
                 const firstEnt = entidades.find(e => e.instituicao_id === defaultInst);
                 setFormData(prev => ({ ...prev, instituicao_id: defaultInst, entidade_id: firstEnt?.id || '' }));
             }
        }
    }, [collaboratorToEdit, entidades, instituicoes]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.full_name?.trim()) newErrors.full_name = "O nome é obrigatório.";
        if (!formData.email?.trim()) newErrors.email = "O email é obrigatório.";
        else if (!isValidEmail(formData.email)) newErrors.email = "Formato de email inválido.";
        if (formData.telemovel?.trim() && !isValidMobile(formData.telemovel)) newErrors.telemovel = "Móvel inválido (9 dígitos, iniciar com 9).";
        if (formData.nif?.trim() && !isValidNif(formData.nif)) newErrors.nif = "O NIF deve ter 9 dígitos numéricos.";
        if (!isGlobalAdmin && !selectedInstituicao) newErrors.instituicao_id = "A Instituição é obrigatória.";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }));
        if (name === 'role' && value !== UserRole.SuperAdmin) {
             setIsGlobalAdmin(false);
             if (!selectedInstituicao && instituicoes.length > 0) setSelectedInstituicao(instituicoes[0].id);
        }
        if (errors[name]) setErrors(prev => { const n = {...prev}; delete n[name]; return n; });
    };
    
    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setIsCompressing(true);
            try {
                const compressedFile = await compressProfileImage(file);
                setPhotoFile(compressedFile);
                setPhotoPreview(URL.createObjectURL(compressedFile));
            } catch (err) {
                console.error("Erro ao processar imagem:", err);
                setPhotoFile(file);
                setPhotoPreview(URL.createObjectURL(file));
            } finally {
                setIsCompressing(false);
            }
        }
    };

    const handleRemovePhoto = () => {
        setPhotoFile(null);
        setPhotoPreview(null);
        setFormData(prev => ({ ...prev, photo_url: '' }));
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleInstituicaoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const instId = e.target.value;
        setSelectedInstituicao(instId);
        setFormData(prev => ({ ...prev, instituicao_id: instId, entidade_id: '' }));
    };
    
    const handleGlobalAdminToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (formData.role !== UserRole.SuperAdmin) { alert("Apenas SuperAdmin pode ter Acesso Global."); return; }
        setIsGlobalAdmin(e.target.checked);
        if (e.target.checked) setFormData(prev => ({ ...prev, entidade_id: '', instituicao_id: '' }));
        else if (instituicoes.length > 0) setSelectedInstituicao(instituicoes[0].id);
    };

    const handleAddJobTitle = async () => {
        if (!newJobTitleName.trim()) return;
        try {
            const newTitle = await dataService.addJobTitle({ name: newJobTitleName.trim() }) as JobTitle;
            setJobTitles(prev => [...prev, newTitle]);
            setFormData(prev => ({ ...prev, job_title_id: newTitle.id }));
            setNewJobTitleName('');
            setShowAddJobTitle(false);
        } catch (e: any) { alert("Erro: " + e.message); }
    };

    const handleGeneratePassword = () => {
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let newPass = "";
        for (let i = 0; i < 12; i++) newPass += charset.charAt(Math.floor(Math.random() * charset.length));
        setPassword(newPass);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setIsSaving(true);
        
        // FIX: Remove 'address' completely from payload to match schema cache
        const { ...baseData } = formData;
        if ((baseData as any).address) delete (baseData as any).address;

        const cleanDateOfBirth = formData.date_of_birth === '' ? null : formData.date_of_birth;
        const cleanAdmissionDate = formData.admission_date === '' ? null : formData.admission_date;

        const dataToSave: any = { 
            ...baseData, 
            date_of_birth: cleanDateOfBirth,
            admission_date: cleanAdmissionDate,
            numero_mecanografico: formData.numero_mecanografico || 'N/A',
            entidade_id: isGlobalAdmin ? null : (formData.entidade_id || null),
            instituicao_id: isGlobalAdmin ? null : (selectedInstituicao || null),
            job_title_id: formData.job_title_id || null
        };
        
        delete dataToSave.contacts;
        delete dataToSave.preferences; 
        delete dataToSave.job_title_name;

        try {
            let savedCollab;
            // FIX: Use await to ensure the promise resolves before continuing
            if (collaboratorToEdit) savedCollab = await onSave({ ...collaboratorToEdit, ...dataToSave }, password || undefined);
            else savedCollab = await onSave(dataToSave, password || undefined);

            const targetId = savedCollab?.id || collaboratorToEdit?.id;
            if (photoFile && targetId) await dataService.uploadCollaboratorPhoto(targetId, photoFile);
            onClose();
        } catch (e: any) { alert("Erro: " + e.message); }
        finally { setIsSaving(false); }
    };

    return (
        <Modal title={collaboratorToEdit ? "Editar Colaborador" : "Adicionar Colaborador"} onClose={onClose} maxWidth="max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto max-h-[80vh] p-1 pr-2 custom-scrollbar">
                <div className="flex flex-col items-center mb-6">
                    <div className="relative group">
                        <div className="w-24 h-24 rounded-full bg-gray-700 border-2 border-gray-600 flex items-center justify-center overflow-hidden">
                            {isCompressing ? (
                                <SpinnerIcon className="text-brand-secondary h-8 w-8" />
                            ) : photoPreview ? (
                                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-2xl font-bold text-gray-500">{formData.full_name ? formData.full_name.charAt(0).toUpperCase() : '?'}</span>
                            )}
                        </div>
                        <label htmlFor="photo-upload" className="absolute bottom-0 right-0 bg-brand-primary p-2 rounded-full text-white cursor-pointer hover:bg-brand-secondary shadow-lg"><FaCamera className="w-4 h-4" /></label>
                        {photoPreview && <button type="button" onClick={handleRemovePhoto} className="absolute top-0 right-0 bg-red-600 p-1.5 rounded-full text-white hover:bg-red-500 shadow-lg"><FaTrash className="w-3 h-3" /></button>}
                        <input type="file" id="photo-upload" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoChange} />
                    </div>
                    {isCompressing && <p className="text-[10px] text-brand-secondary mt-1 animate-pulse">A otimizar imagem...</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Trato</label>
                        <select name="title" value={formData.title} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm">
                            <option value="">--</option>
                            {titles.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-400 mb-1">Nome Completo</label>
                        <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} className="w-full bg-gray-700 border text-white rounded p-2 text-sm" required />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                         <label className="block text-xs font-medium text-gray-400 mb-1 flex items-center gap-2"><FaBriefcase /> Cargo / Função</label>
                         <div className="flex gap-2">
                            <select name="job_title_id" value={formData.job_title_id} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm">
                                <option value="">-- Selecione Cargo --</option>
                                {jobTitles.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
                            </select>
                            <button type="button" onClick={() => setShowAddJobTitle(true)} className="bg-gray-600 text-white p-2 rounded hover:bg-gray-500"><FaPlus className="w-3 h-3"/></button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1 flex items-center gap-2"><FaCalendarAlt /> Data Admissão</label>
                        <input type="date" name="admission_date" value={formData.admission_date} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-gray-700 border text-white rounded p-2 text-sm" required />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Nº Mecanográfico</label>
                        <input type="text" name="numero_mecanografico" value={formData.numero_mecanografico} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><label className="block text-xs font-medium text-gray-400 mb-1">NIF</label><input type="text" name="nif" value={formData.nif} onChange={handleChange} className="w-full bg-gray-700 border text-white rounded p-2 text-sm" maxLength={9} /></div>
                    <div><label className="block text-xs font-medium text-gray-400 mb-1">Móvel</label><input type="text" name="telemovel" value={formData.telemovel} onChange={handleChange} className="w-full bg-gray-700 border text-white rounded p-2 text-sm" maxLength={9} /></div>
                    <div><label className="block text-xs font-medium text-gray-400 mb-1 flex items-center gap-1"><FaBirthdayCake/> Data Nasc.</label><input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} className="w-full bg-gray-700 border text-white rounded p-2 text-sm" /></div>
                </div>
                
                <div className="bg-gray-800 p-4 rounded border border-gray-700 space-y-3">
                    <h4 className="text-sm font-bold text-white">Associação Organizacional</h4>
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Instituição</label>
                        <select value={selectedInstituicao} onChange={handleInstituicaoChange} className="w-full bg-gray-700 border text-white rounded p-2 text-sm" disabled={isGlobalAdmin}>
                            <option value="" disabled>Selecione...</option>
                            {instituicoes.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Entidade / Departamento</label>
                        <select name="entidade_id" value={formData.entidade_id} onChange={handleChange} className="w-full bg-gray-700 border text-white rounded p-2 text-sm" disabled={isGlobalAdmin || !selectedInstituicao}>
                            <option value="">-- Diretamente à Instituição --</option>
                            {filteredEntidades.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="bg-gray-900/50 p-4 rounded border border-gray-600 mt-4">
                    <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><FaUserShield className="text-brand-secondary"/> Acesso ao Sistema</h4>
                    <div className="flex flex-wrap gap-4 items-center">
                        <label className="flex items-center cursor-pointer"><input type="checkbox" name="can_login" checked={formData.can_login} onChange={handleChange} className="h-4 w-4 rounded bg-gray-700 text-brand-primary" /><span className="ml-2 text-sm text-gray-300">Permitir Login</span></label>
                        
                        {formData.can_login && (
                            <div className="mt-3 w-full space-y-3 animate-fade-in border-t border-gray-700 pt-3">
                                <div>
                                    <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">Perfil de Acesso</label>
                                    <select name="role" value={formData.role} onChange={handleChange} className="w-full bg-gray-800 border border-gray-600 text-white rounded p-2 text-sm">
                                        {filteredRoles.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                                
                                <div className="relative">
                                    <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">Definir Password Temporária</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={password} 
                                            onChange={e => setPassword(e.target.value)} 
                                            placeholder="Senha inicial..." 
                                            className="flex-grow bg-gray-800 border border-gray-600 text-white rounded p-2 text-sm font-mono"
                                        />
                                        <button 
                                            type="button" 
                                            onClick={handleGeneratePassword} 
                                            className="bg-gray-700 px-3 rounded text-white hover:bg-gray-600 flex items-center gap-1"
                                            title="Gerar Password Forte"
                                        >
                                            <FaMagic size={12}/> <span className="text-[10px]">Auto</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    {showGlobalToggle && (
                         <label className="flex items-center cursor-pointer mt-3"><input type="checkbox" checked={isGlobalAdmin} onChange={handleGlobalAdminToggle} className="h-4 w-4 rounded bg-gray-700 text-purple-500" /><span className="ml-2 text-sm text-white">Acesso Global (Super Admin)</span></label>
                    )}
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-gray-700 mt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Cancelar</button>
                    <button type="submit" disabled={isSaving || isCompressing} className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary disabled:opacity-50">
                        {isSaving ? <SpinnerIcon className="h-4 w-4" /> : 'Salvar'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddCollaboratorModal;