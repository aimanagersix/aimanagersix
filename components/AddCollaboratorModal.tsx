
import React, { useState, useEffect, useRef } from 'react';
import Modal from './common/Modal';
import { Collaborator, Entidade, UserRole, CollaboratorStatus, ConfigItem, ContactTitle, CustomRole, Instituicao, JobTitle } from '../types';
import { SpinnerIcon, CheckIcon } from './common/Icons';
import { FaGlobe, FaMagic, FaCamera, FaTrash, FaKey, FaBriefcase, FaPlus, FaBirthdayCake, FaUserShield, FaBell } from 'react-icons/fa';
import * as dataService from '../services/dataService';

const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isValidMobile = (phone: string): boolean => {
    if (!phone || phone.trim() === '') return true;
    const cleaned = phone.replace(/[\s-()]/g, '').replace(/^\+351/, '');
    // Validar telemóvel português (começa com 9, tem 9 digitos)
    const regex = /^9[1236]\d{7}$/;
    return regex.test(cleaned);
};

const isValidNif = (nif: string): boolean => {
    if (!nif || nif.trim() === '') return true;
    const cleaned = nif.replace(/\s/g, '');
    return /^\d{9}$/.test(cleaned);
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
        dateOfBirth: '', // New field
        address_line: '',
        postal_code: '',
        city: '',
        locality: '',
        canLogin: false,
        receivesNotifications: false,
        role: 'Utilizador', // Access Profile
        job_title_id: '', // Professional Title
        status: CollaboratorStatus.Ativo,
        photoUrl: ''
    });
    
    const [password, setPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [successMessage, setSuccessMessage] = useState('');
    const [isGlobalAdmin, setIsGlobalAdmin] = useState(false);
    const [availableRoles, setAvailableRoles] = useState<CustomRole[]>([]);
    
    // New Job Titles State
    const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
    const [showAddJobTitle, setShowAddJobTitle] = useState(false);
    const [newJobTitleName, setNewJobTitleName] = useState('');

    // Manual Password Reset
    const [showPasswordReset, setShowPasswordReset] = useState(false);

    // Photo Upload State
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Selection State
    const [selectedInstituicao, setSelectedInstituicao] = useState<string>('');
    
    const isSuperAdmin = currentUser?.role === UserRole.SuperAdmin;

    // Load Custom Roles and Job Titles
    useEffect(() => {
        const loadConfig = async () => {
            const roles = await dataService.getCustomRoles();
            setAvailableRoles(roles);
            
            const data = await dataService.fetchAllData();
            if (data.configJobTitles) setJobTitles(data.configJobTitles);
        };
        loadConfig();
    }, []);

    // Fallback roles if DB fetch fails or is empty
    const defaultRoles = ['Admin', 'Técnico', 'Utilizador'];
    const displayRoles = availableRoles.length > 0 ? availableRoles.map(r => r.name) : defaultRoles;
    
    // Filter 'SuperAdmin' from dropdown - it is a system role and should not be selectable
    const filteredRoles = displayRoles.filter(role => role !== UserRole.SuperAdmin);
    const titles = titleOptions && titleOptions.length > 0 ? titleOptions.map(t => t.name) : ['Sr.', 'Sra.', 'Dr.', 'Dra.', 'Eng.', 'Eng.ª'];

    // Filter entities based on selected institution
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
                entidadeId: collaboratorToEdit.entidadeId || '',
                instituicaoId: collaboratorToEdit.instituicaoId || '',
                job_title_id: collaboratorToEdit.job_title_id || ''
            });
            setPhotoPreview(collaboratorToEdit.photoUrl || null);
            
            // Infer Institution from Entity if present, otherwise use direct Institution ID
            if (collaboratorToEdit.entidadeId) {
                const ent = entidades.find(e => e.id === collaboratorToEdit.entidadeId);
                if (ent) setSelectedInstituicao(ent.instituicaoId);
            } else if (collaboratorToEdit.instituicaoId) {
                setSelectedInstituicao(collaboratorToEdit.instituicaoId);
            }

            // Global Admin Check (No entity, No institution)
            if (!collaboratorToEdit.entidadeId && !collaboratorToEdit.instituicaoId && (collaboratorToEdit.role === UserRole.SuperAdmin)) {
                setIsGlobalAdmin(true);
            }
        } else {
             // Default setup for new user
             if (instituicoes.length > 0) {
                 const defaultInst = instituicoes[0].id;
                 setSelectedInstituicao(defaultInst);
                 // Try to pick first entity of that institution
                 const firstEnt = entidades.find(e => e.instituicaoId === defaultInst);
                 setFormData(prev => ({ 
                     ...prev, 
                     instituicaoId: defaultInst,
                     entidadeId: firstEnt?.id || ''
                 }));
             }
        }
    }, [collaboratorToEdit, entidades, instituicoes, isSuperAdmin]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.fullName?.trim()) newErrors.fullName = "O nome é obrigatório.";
        
        if (!formData.email?.trim()) {
            newErrors.email = "O email é obrigatório.";
        } else if (!isValidEmail(formData.email)) {
            newErrors.email = "Formato de email inválido.";
        }

        if (formData.telemovel?.trim() && !isValidMobile(formData.telemovel)) {
            newErrors.telemovel = "Móvel inválido (Deve ter 9 dígitos e começar por 9).";
        }

        if (formData.nif?.trim() && !isValidNif(formData.nif)) {
             newErrors.nif = "O NIF deve ter 9 dígitos numéricos.";
        }
        
        if (!isGlobalAdmin) {
            if (!selectedInstituicao) newErrors.instituicaoId = "A Instituição é obrigatória.";
        }
        
        // Validate password reset
        if (showPasswordReset && !password) {
             newErrors.general = "Se selecionou 'Redefinir Password', deve preencher o campo.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
        
        // Se mudar o perfil e não for SuperAdmin, desativa o modo Global
        if (name === 'role' && value !== UserRole.SuperAdmin) {
             setIsGlobalAdmin(false);
             if (!selectedInstituicao && instituicoes.length > 0) {
                 setSelectedInstituicao(instituicoes[0].id);
             }
        }
        
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = {...prev};
                delete newErrors[name];
                return newErrors;
            });
        }
    };
    
    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                alert("A imagem é muito grande. O máximo é 2MB.");
                return;
            }
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
        for (let i = 0; i < 12; i++) {
            newPass += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        setPassword(newPass);
    };

    const handleInstituicaoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const instId = e.target.value;
        setSelectedInstituicao(instId);
        setFormData(prev => ({ ...prev, instituicaoId: instId, entidadeId: '' })); // Reset entity
    };
    
    const handleGlobalAdminToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked;
        
        if (formData.role !== UserRole.SuperAdmin) {
            alert("Apenas o perfil 'SuperAdmin' pode ter Acesso Global.");
            return;
        }

        setIsGlobalAdmin(checked);
        if (checked) {
            setFormData(prev => ({ ...prev, entidadeId: '', instituicaoId: '' }));
            setSelectedInstituicao('');
        } else {
             if (instituicoes.length > 0) {
                 setSelectedInstituicao(instituicoes[0].id);
             }
        }
    };

    const handleAddJobTitle = async () => {
        if (!newJobTitleName.trim()) return;
        try {
            const newTitle = await dataService.addJobTitle({ name: newJobTitleName.trim() }) as JobTitle;
            setJobTitles(prev => [...prev, newTitle]);
            setFormData(prev => ({ ...prev, job_title_id: newTitle.id }));
            setNewJobTitleName('');
            setShowAddJobTitle(false);
        } catch (e: any) {
            alert("Erro ao adicionar cargo: " + e.message);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        
        setIsSaving(true);
        setSuccessMessage('');

        const address = [formData.address_line, formData.postal_code, formData.city].filter(Boolean).join(', ');
        
        // Clean up empty strings for foreign keys
        // PostgreSQL UUID fields cannot be empty string ""
        let finalEntidadeId = formData.entidadeId || null;
        let finalInstituicaoId = selectedInstituicao || null;
        let finalJobTitleId = formData.job_title_id || null;
        
        if (isGlobalAdmin) {
            finalEntidadeId = null;
            finalInstituicaoId = null;
        }
        
        // Clean optional dateOfBirth to avoid empty string errors in DB
        const cleanDateOfBirth = formData.dateOfBirth === '' ? null : formData.dateOfBirth;

        const dataToSave: any = { 
            ...formData, 
            address,
            dateOfBirth: cleanDateOfBirth,
            numeroMecanografico: formData.numeroMecanografico || 'N/A',
            entidadeId: finalEntidadeId,
            instituicaoId: finalInstituicaoId,
            job_title_id: finalJobTitleId
        };
        
        // Ensure role is correctly passed
        if (!dataToSave.role) {
            dataToSave.role = 'Utilizador';
        }

        delete dataToSave.contacts;
        delete dataToSave.preferences; 
        delete dataToSave.job_title_name;

        try {
            let savedCollaborator;
            
            // 1. Save Collab Data First
            if (collaboratorToEdit) {
                // Pass password if reset was requested
                const passToUpdate = showPasswordReset ? password : undefined;
                savedCollaborator = await onSave({ ...collaboratorToEdit, ...dataToSave }, passToUpdate);
            } else {
                savedCollaborator = await onSave(dataToSave, password || undefined);
            }

            // 2. Upload Photo if selected
            // Ensure we have a valid ID from the save operation before trying to upload photo
            const targetId = savedCollaborator?.id || collaboratorToEdit?.id;

            if (photoFile && targetId) {
                try {
                    await dataService.uploadCollaboratorPhoto(targetId, photoFile);
                } catch (uploadErr: any) {
                    console.error("Photo upload failed", uploadErr);
                    // Don't fail the whole process, just warn
                    alert(`Colaborador salvo com sucesso, mas a foto falhou ao carregar. 
Motivo: ${uploadErr.message || 'Erro de permissão ou bucket inexistente.'}
Verifique as configurações de armazenamento.`);
                }
            } else if (!photoPreview && collaboratorToEdit?.photoUrl && targetId) {
                 // Handle photo removal
                 try {
                    await dataService.updateCollaborator(targetId, { photoUrl: '' });
                 } catch(e) { console.warn("Failed to clear photo URL", e); }
            }
            
            setSuccessMessage("Colaborador gravado com sucesso!");
            setTimeout(() => setSuccessMessage(''), 3000);
            onClose();
            
        } catch (e: any) {
            console.error(e);
            const msg = e.message || "Erro ao salvar colaborador.";
            
            // Show alert if explicit error
            if (msg.includes("row-level security") || msg.includes("Access Denied") || msg.includes("permission denied")) {
                alert("Erro de Permissão: Não tem autorização para alterar este registo. \n\nDICA: Vá a 'Configurações > Config BD' e execute o script de reparação v3.0.");
            } else {
                alert(`Erro: ${msg}`);
            }

            setErrors(prev => ({
                ...prev, 
                general: msg,
                email: msg.toLowerCase().includes("email") ? msg : prev.email
            }));
        } finally {
            setIsSaving(false);
        }
    };

    const modalTitle = collaboratorToEdit ? "Editar Colaborador" : "Adicionar Colaborador";
    const showGlobalToggle = isSuperAdmin && formData.role === UserRole.SuperAdmin;

    return (
        <Modal title={modalTitle} onClose={onClose} maxWidth="max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto max-h-[80vh] p-1 pr-2 custom-scrollbar">
                
                {/* Photo Upload Section */}
                <div className="flex flex-col items-center mb-6">
                    <div className="relative group">
                        <div className="w-24 h-24 rounded-full bg-gray-700 border-2 border-gray-600 flex items-center justify-center overflow-hidden">
                            {photoPreview ? (
                                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-2xl font-bold text-gray-500">{formData.fullName ? formData.fullName.charAt(0).toUpperCase() : '?'}</span>
                            )}
                        </div>
                        <label 
                            htmlFor="photo-upload" 
                            className="absolute bottom-0 right-0 bg-brand-primary p-2 rounded-full text-white cursor-pointer hover:bg-brand-secondary transition-colors shadow-lg"
                            title="Carregar Foto"
                        >
                            <FaCamera className="w-4 h-4" />
                        </label>
                        {photoPreview && (
                            <button
                                type="button"
                                onClick={handleRemovePhoto}
                                className="absolute top-0 right-0 bg-red-600 p-1.5 rounded-full text-white hover:bg-red-500 transition-colors shadow-lg"
                                title="Remover Foto"
                            >
                                <FaTrash className="w-3 h-3" />
                            </button>
                        )}
                        <input 
                            type="file" 
                            id="photo-upload" 
                            ref={fileInputRef}
                            className="hidden" 
                            accept="image/*"
                            onChange={handlePhotoChange}
                        />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Carregar Foto (Máx 2MB)</p>
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
                        <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded p-2 text-sm ${errors.fullName ? 'border-red-500' : 'border-gray-600'}`} required />
                        {errors.fullName && <p className="text-red-400 text-xs italic mt-1">{errors.fullName}</p>}
                    </div>
                </div>

                {/* Job Title */}
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1 flex items-center gap-2">
                        <FaBriefcase /> Cargo / Função Profissional
                    </label>
                    {showAddJobTitle ? (
                            <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={newJobTitleName} 
                                onChange={(e) => setNewJobTitleName(e.target.value)} 
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm" 
                                placeholder="Novo cargo..."
                                autoFocus
                            />
                            <button type="button" onClick={handleAddJobTitle} className="bg-green-600 text-white p-2 rounded"><CheckIcon/></button>
                            <button type="button" onClick={() => setShowAddJobTitle(false)} className="bg-red-600 text-white p-2 rounded"><FaTrash className="w-3 h-3"/></button>
                            </div>
                    ) : (
                        <div className="flex gap-2">
                            <select name="job_title_id" value={formData.job_title_id} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm">
                                <option value="">-- Selecione Cargo --</option>
                                {jobTitles.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
                            </select>
                            <button type="button" onClick={() => setShowAddJobTitle(true)} className="bg-gray-600 text-white p-2 rounded hover:bg-gray-500" title="Adicionar Novo Cargo"><FaPlus className="w-3 h-3"/></button>
                        </div>
                    )}
                    <p className="text-[10px] text-gray-500 mt-1">Ex: Enfermeiro, Contabilista, Diretor.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded p-2 text-sm ${errors.email ? 'border-red-500' : 'border-gray-600'}`} required />
                        {errors.email && <p className="text-red-400 text-xs italic mt-1">{errors.email}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Nº Mecanográfico</label>
                        <input type="text" name="numeroMecanografico" value={formData.numeroMecanografico} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">NIF</label>
                        <input type="text" name="nif" value={formData.nif} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded p-2 text-sm ${errors.nif ? 'border-red-500' : 'border-gray-600'}`} maxLength={9} />
                        {errors.nif && <p className="text-red-400 text-xs italic mt-1">{errors.nif}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Móvel</label>
                        <input type="text" name="telemovel" value={formData.telemovel} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded p-2 text-sm ${errors.telemovel ? 'border-red-500' : 'border-gray-600'}`} placeholder="9xxxxxxxx" maxLength={9} />
                        {errors.telemovel && <p className="text-red-400 text-xs italic mt-1">{errors.telemovel}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Extensão</label>
                        <input type="text" name="telefoneInterno" value={formData.telefoneInterno} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm" />
                    </div>
                </div>
                
                {/* NEW: Date of Birth Field */}
                <div>
                     <label className="block text-xs font-medium text-gray-400 mb-1 flex items-center gap-2">
                        <FaBirthdayCake /> Data de Nascimento
                    </label>
                    <input 
                        type="date" 
                        name="dateOfBirth" 
                        value={formData.dateOfBirth} 
                        onChange={handleChange} 
                        className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">Usada para envio automático de parabéns (se ativado).</p>
                </div>
                
                {/* Hierarchical Selection */}
                <div className="bg-gray-800 p-4 rounded border border-gray-700 space-y-3">
                    <h4 className="text-sm font-bold text-white">Associação Organizacional</h4>
                    
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">1. Instituição</label>
                        <select 
                            value={selectedInstituicao} 
                            onChange={handleInstituicaoChange} 
                            className={`w-full bg-gray-700 border text-white rounded p-2 text-sm ${errors.instituicaoId ? 'border-red-500' : 'border-gray-600'} disabled:opacity-50`}
                            disabled={isGlobalAdmin}
                        >
                            <option value="" disabled>Selecione a Instituição</option>
                            {instituicoes.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                        </select>
                         {errors.instituicaoId && <p className="text-red-400 text-xs italic mt-1">{errors.instituicaoId}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">2. Entidade / Departamento (Opcional)</label>
                        <select 
                            name="entidadeId" 
                            value={formData.entidadeId} 
                            onChange={handleChange} 
                            className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm disabled:opacity-50"
                            disabled={isGlobalAdmin || !selectedInstituicao}
                        >
                            <option value="">-- Diretamente à Instituição --</option>
                            {filteredEntidades.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="bg-gray-900/30 p-4 rounded-lg border border-gray-700 mt-2">
                    <h4 className="text-sm font-semibold text-white mb-3 border-b border-gray-700 pb-1">Morada (Pessoal)</h4>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Endereço</label>
                            <input type="text" name="address_line" value={formData.address_line} onChange={handleChange} placeholder="Rua..." className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm"/>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Código Postal</label>
                                <input type="text" name="postal_code" value={formData.postal_code} onChange={handleChange} placeholder="0000-000" className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm"/>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Cidade</label>
                                <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm"/>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Localidade</label>
                                <input type="text" name="locality" value={formData.locality} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm"/>
                            </div>
                        </div>
                    </div>
                </div>

                {/* System Access Section - Grouped Logic */}
                <div className="bg-gray-900/50 p-4 rounded border border-gray-600 mt-4">
                    <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                        <FaUserShield className="text-brand-secondary"/> Acesso ao Sistema
                    </h4>
                    
                    <div className="flex flex-wrap gap-4 items-center mb-4">
                        <label className="flex items-center cursor-pointer">
                            <input type="checkbox" name="canLogin" checked={formData.canLogin} onChange={handleChange} className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-brand-primary focus:ring-brand-secondary" />
                            <span className="ml-2 text-sm text-gray-300 font-bold">Permitir Login</span>
                        </label>
                        
                        {formData.canLogin && (
                            <div className="flex-grow min-w-[200px] animate-fade-in">
                                <label className="block text-xs font-medium text-gray-400 mb-1 flex items-center gap-2">
                                    <FaKey /> Perfil de Acesso (RBAC)
                                </label>
                                <select name="role" value={formData.role} onChange={handleChange} className="w-full bg-gray-800 border border-gray-600 text-white rounded p-2 text-sm">
                                    {filteredRoles.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                        )}
                    </div>
                    
                    <label className="flex items-center cursor-pointer mb-3">
                        <input type="checkbox" name="receivesNotifications" checked={formData.receivesNotifications} onChange={handleChange} className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-brand-primary focus:ring-brand-secondary" />
                        <span className="ml-2 text-sm text-gray-300 flex items-center gap-1"><FaBell className="text-xs"/> Recebe Notificações (Email)</span>
                    </label>

                    {showGlobalToggle && (
                        <div className={`p-3 rounded border flex items-center transition-colors mb-3 ${isGlobalAdmin ? 'bg-purple-900/40 border-purple-500' : 'bg-gray-800 border-gray-600'}`}>
                            <label className="flex items-center cursor-pointer w-full">
                                <input 
                                    type="checkbox" 
                                    checked={isGlobalAdmin} 
                                    onChange={handleGlobalAdminToggle} 
                                    className="h-5 w-5 rounded border-gray-500 bg-gray-700 text-purple-500 focus:ring-purple-500" 
                                />
                                <div className="ml-3">
                                    <span className="text-sm font-bold text-white flex items-center gap-2">
                                        <FaGlobe className={isGlobalAdmin ? "text-purple-400" : "text-gray-400"} /> 
                                        Acesso Global (Super Admin)
                                    </span>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        Permite ver e gerir todas as instituições sem restrição. Apenas para perfil SuperAdmin.
                                    </p>
                                </div>
                            </label>
                        </div>
                    )}
                
                    {/* Password Management (Inside Access Section) */}
                    {(formData.canLogin && (!collaboratorToEdit || showPasswordReset)) && (
                        <div className="bg-blue-900/10 p-3 rounded border border-blue-900/30">
                            <label className="block text-xs font-bold text-blue-200 mb-1 flex items-center gap-2">
                                <FaKey /> Password Inicial / Reset
                            </label>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)} 
                                    placeholder={collaboratorToEdit ? "Nova Password..." : "Opcional (será gerada se vazio)"} 
                                    className="flex-grow bg-gray-800 border border-gray-600 text-white rounded p-2 text-sm font-mono" 
                                />
                                <button 
                                    type="button" 
                                    onClick={handleGeneratePassword} 
                                    className="p-2 bg-purple-600 text-white rounded hover:bg-purple-500 transition-colors"
                                    title="Gerar password forte"
                                >
                                    <FaMagic />
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">
                                {collaboratorToEdit 
                                    ? "Atenção: Isto irá alterar imediatamente a password do utilizador." 
                                    : "Se deixar em branco, será gerada uma password automática."
                                }
                            </p>
                        </div>
                    )}
                    
                    {collaboratorToEdit && formData.canLogin && !showPasswordReset && (
                        <button 
                            type="button" 
                            onClick={() => setShowPasswordReset(true)}
                            className="text-xs text-blue-400 hover:text-blue-300 underline mt-2 flex items-center gap-1"
                        >
                            <FaKey /> Redefinir Password Manualmente
                        </button>
                    )}
                </div>

                {errors.general && <p className="text-red-400 text-xs border border-red-500/50 bg-red-500/10 p-2 rounded mt-2">{errors.general}</p>}
                
                {successMessage && (
                    <div className="p-3 bg-green-500/20 text-green-300 rounded border border-green-500/50 text-center font-medium animate-fade-in mt-2">
                        {successMessage}
                    </div>
                )}

                <div className="flex justify-end gap-4 pt-4 border-t border-gray-700 mt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Cancelar / Fechar</button>
                    <button type="submit" disabled={isSaving} className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary disabled:opacity-50">
                        {isSaving ? <SpinnerIcon className="h-4 w-4" /> : successMessage ? <CheckIcon className="h-4 w-4"/> : null}
                        {isSaving ? 'A Gravar...' : 'Salvar'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddCollaboratorModal;
