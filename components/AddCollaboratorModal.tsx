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
        numeroMecanografico: '',
        title: '',
        fullName: '',
        entidadeId: '',
        instituicaoId: '',
        email: '',
        nif: '',
        telefoneInterno: '',
        telemovel: '',
        dateOfBirth: '',
        admissionDate: '', // Novo campo
        address_line: '',
        postal_code: '',
        city: '',
        locality: '',
        canLogin: false,
        receivesNotifications: false,
        role: 'Utilizador',
        job_title_id: '',
        status: CollaboratorStatus.Ativo,
        photoUrl: ''
    });
    
    const [password, setPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [successMessage, setSuccessMessage] = useState('');
    const [isGlobalAdmin, setIsGlobalAdmin] = useState(false);
    const [availableRoles, setAvailableRoles] = useState<CustomRole[]>([]);
    
    const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
    const [showAddJobTitle, setShowAddJobTitle] = useState(false);
    const [newJobTitleName, setNewJobTitleName] = useState('');

    const [showPasswordReset, setShowPasswordReset] = useState(false);

    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [selectedInstituicao, setSelectedInstituicao] = useState<string>('');
    const isSuperAdmin = currentUser?.role === UserRole.SuperAdmin;
    // Fix: Added missing showGlobalToggle definition to allow toggling global access for SuperAdmin roles
    const showGlobalToggle = isSuperAdmin && formData.role === UserRole.SuperAdmin;

    useEffect(() => {
        const loadConfig = async () => {
            const roles = await dataService.getCustomRoles();
            setAvailableRoles(roles);
            const data = await dataService.fetchAllData();
            if (data.configJobTitles) setJobTitles(data.configJobTitles);
        };
        loadConfig();
    }, []);

    const defaultRoles = ['Admin', 'Técnico', 'Utilizador'];
    const displayRoles = availableRoles.length > 0 ? availableRoles.map(r => r.name) : defaultRoles;
    // Fix: Dynamically filter roles based on current user's privileges; only SuperAdmins can assign the SuperAdmin role
    const filteredRoles = isSuperAdmin ? displayRoles : displayRoles.filter(role => role !== UserRole.SuperAdmin);
    const titles = titleOptions && titleOptions.length > 0 ? titleOptions.map(t => t.name) : ['Sr.', 'Sra.', 'Dr.', 'Dra.', 'Eng.', 'Eng.ª'];
    const filteredEntidades = entidades.filter(e => e.instituicaoId === selectedInstituicao);

    useEffect(() => {
        if (collaboratorToEdit) {
            setFormData({
                ...collaboratorToEdit,
                address_line: collaboratorToEdit.address_line || collaboratorToEdit.address || '',
                postal_code: collaboratorToEdit.postal_code || '',
                city: collaboratorToEdit.city || '',
                locality: collaboratorToEdit.locality || '',
                nif: collaboratorToEdit.nif || '',
                title: collaboratorToEdit.title || '',
                dateOfBirth: collaboratorToEdit.dateOfBirth || '',
                admissionDate: collaboratorToEdit.admissionDate || '',
                entidadeId: collaboratorToEdit.entidadeId || '',
                instituicaoId: collaboratorToEdit.instituicaoId || '',
                job_title_id: collaboratorToEdit.job_title_id || ''
            });
            setPhotoPreview(collaboratorToEdit.photoUrl || null);
            if (collaboratorToEdit.entidadeId) {
                const ent = entidades.find(e => e.id === collaboratorToEdit.entidadeId);
                if (ent) setSelectedInstituicao(ent.instituicaoId);
            } else if (collaboratorToEdit.instituicaoId) {
                setSelectedInstituicao(collaboratorToEdit.instituicaoId);
            }
            if (!collaboratorToEdit.entidadeId && !collaboratorToEdit.instituicaoId && (collaboratorToEdit.role === UserRole.SuperAdmin)) {
                setIsGlobalAdmin(true);
            }
        } else {
             if (instituicoes.length > 0) {
                 const defaultInst = instituicoes[0].id;
                 setSelectedInstituicao(defaultInst);
                 const firstEnt = entidades.find(e => e.instituicaoId === defaultInst);
                 setFormData(prev => ({ ...prev, instituicaoId: defaultInst, entidadeId: firstEnt?.id || '' }));
             }
        }
    }, [collaboratorToEdit, entidades, instituicoes]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.fullName?.trim()) newErrors.fullName = "O nome é obrigatório.";
        if (!formData.email?.trim()) newErrors.email = "O email é obrigatório.";
        else if (!isValidEmail(formData.email)) newErrors.email = "Formato de email inválido.";
        if (formData.telemovel?.trim() && !isValidMobile(formData.telemovel)) newErrors.telemovel = "Móvel inválido (9 dígitos, iniciar com 9).";
        if (formData.nif?.trim() && !isValidNif(formData.nif)) newErrors.nif = "O NIF deve ter 9 dígitos numéricos.";
        if (!isGlobalAdmin && !selectedInstituicao) newErrors.instituicaoId = "A Instituição é obrigatória.";
        if (showPasswordReset && !password) newErrors.general = "Preencha a nova password.";
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
    
    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 2 * 1024 * 1024) { alert("Max 2MB."); return; }
            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleRemovePhoto = () => {
        setPhotoFile(null);
        setPhotoPreview(null);
        setFormData(prev => ({ ...prev, photoUrl: '' }));
        if (fileInputRef.current) fileInputRef.current.value = '';
    };
    
    const handleGeneratePassword = () => {
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let newPass = "";
        for (let i = 0; i < 12; i++) newPass += charset.charAt(Math.floor(Math.random() * charset.length));
        setPassword(newPass);
    };

    const handleInstituicaoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const instId = e.target.value;
        setSelectedInstituicao(instId);
        setFormData(prev => ({ ...prev, instituicaoId: instId, entidadeId: '' }));
    };
    
    const handleGlobalAdminToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (formData.role !== UserRole.SuperAdmin) { alert("Apenas SuperAdmin pode ter Acesso Global."); return; }
        setIsGlobalAdmin(e.target.checked);
        if (e.target.checked) setFormData(prev => ({ ...prev, entidadeId: '', instituicaoId: '' }));
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setIsSaving(true);
        const address = [formData.address_line, formData.postal_code, formData.city].filter(Boolean).join(', ');
        const cleanDateOfBirth = formData.dateOfBirth === '' ? null : formData.dateOfBirth;
        const cleanAdmissionDate = formData.admissionDate === '' ? null : formData.admissionDate;

        const dataToSave: any = { 
            ...formData, 
            address,
            dateOfBirth: cleanDateOfBirth,
            admissionDate: cleanAdmissionDate,
            numeroMecanografico: formData.numeroMecanografico || 'N/A',
            entidadeId: isGlobalAdmin ? null : (formData.entidadeId || null),
            instituicaoId: isGlobalAdmin ? null : (selectedInstituicao || null),
            job_title_id: formData.job_title_id || null
        };
        
        delete dataToSave.contacts;
        delete dataToSave.preferences; 
        delete dataToSave.job_title_name;

        try {
            let savedCollab;
            if (collaboratorToEdit) savedCollab = await onSave({ ...collaboratorToEdit, ...dataToSave }, showPasswordReset ? password : undefined);
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
                            {photoPreview ? <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" /> : <span className="text-2xl font-bold text-gray-500">{formData.fullName ? formData.fullName.charAt(0).toUpperCase() : '?'}</span>}
                        </div>
                        <label htmlFor="photo-upload" className="absolute bottom-0 right-0 bg-brand-primary p-2 rounded-full text-white cursor-pointer hover:bg-brand-secondary shadow-lg"><FaCamera className="w-4 h-4" /></label>
                        {photoPreview && <button type="button" onClick={handleRemovePhoto} className="absolute top-0 right-0 bg-red-600 p-1.5 rounded-full text-white hover:bg-red-500 shadow-lg"><FaTrash className="w-3 h-3" /></button>}
                        <input type="file" id="photo-upload" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoChange} />
                    </div>
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
                        <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full bg-gray-700 border text-white rounded p-2 text-sm" required />
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
                        <input type="date" name="admissionDate" value={formData.admissionDate} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-gray-700 border text-white rounded p-2 text-sm" required />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Nº Mecanográfico</label>
                        <input type="text" name="numeroMecanografico" value={formData.numeroMecanografico} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><label className="block text-xs font-medium text-gray-400 mb-1">NIF</label><input type="text" name="nif" value={formData.nif} onChange={handleChange} className="w-full bg-gray-700 border text-white rounded p-2 text-sm" maxLength={9} /></div>
                    <div><label className="block text-xs font-medium text-gray-400 mb-1">Móvel</label><input type="text" name="telemovel" value={formData.telemovel} onChange={handleChange} className="w-full bg-gray-700 border text-white rounded p-2 text-sm" maxLength={9} /></div>
                    <div><label className="block text-xs font-medium text-gray-400 mb-1 flex items-center gap-1"><FaBirthdayCake/> Data Nasc.</label><input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="w-full bg-gray-700 border text-white rounded p-2 text-sm" /></div>
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
                        <select name="entidadeId" value={formData.entidadeId} onChange={handleChange} className="w-full bg-gray-700 border text-white rounded p-2 text-sm" disabled={isGlobalAdmin || !selectedInstituicao}>
                            <option value="">-- Diretamente à Instituição --</option>
                            {filteredEntidades.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="bg-gray-900/50 p-4 rounded border border-gray-600 mt-4">
                    <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><FaUserShield className="text-brand-secondary"/> Acesso ao Sistema</h4>
                    <div className="flex flex-wrap gap-4 items-center">
                        <label className="flex items-center cursor-pointer"><input type="checkbox" name="canLogin" checked={formData.canLogin} onChange={handleChange} className="h-4 w-4 rounded bg-gray-700 text-brand-primary" /><span className="ml-2 text-sm text-gray-300">Permitir Login</span></label>
                        {formData.canLogin && (
                            <select name="role" value={formData.role} onChange={handleChange} className="flex-grow bg-gray-800 border border-gray-600 text-white rounded p-2 text-sm">
                                {filteredRoles.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        )}
                    </div>
                    {showGlobalToggle && (
                         <label className="flex items-center cursor-pointer mt-3"><input type="checkbox" checked={isGlobalAdmin} onChange={handleGlobalAdminToggle} className="h-4 w-4 rounded bg-gray-700 text-purple-500" /><span className="ml-2 text-sm text-white">Acesso Global (Super Admin)</span></label>
                    )}
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-gray-700 mt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Cancelar</button>
                    <button type="submit" disabled={isSaving} className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary disabled:opacity-50">
                        {isSaving ? <SpinnerIcon className="h-4 w-4" /> : 'Salvar'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddCollaboratorModal;