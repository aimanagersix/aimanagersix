import React, { useState, useEffect, useRef } from 'react';
import Modal from './common/Modal';
import { Collaborator, Entidade, UserRole, CollaboratorStatus, AppModule } from '../types';
import { FaMagic, FaEye, FaEyeSlash, UserIcon, CameraIcon, DeleteIcon } from './common/Icons';
import * as dataService from '../services/dataService';
import { getSupabase } from '../services/supabaseClient';


const isPortuguesePhoneNumber = (phone: string): boolean => {
    if (!phone || phone.trim() === '') return true; // Optional fields are valid if empty
    const cleaned = phone.replace(/[\s-()]/g, '').replace(/^\+351/, '');
    const regex = /^(2\d{8}|9[1236]\d{7})$/;
    return regex.test(cleaned);
};

const generateStrongPassword = (): string => {
    const length = 12;
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '@$!%*?&';
    
    // Ensure all character types are included
    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];
    
    const allChars = uppercase + lowercase + numbers + special;
    for (let i = 4; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password to avoid a predictable pattern
    return password.split('').sort(() => 0.5 - Math.random()).join('');
};

const AVAILABLE_MODULES: { key: AppModule; label: string }[] = [
    { key: 'inventory', label: 'Inventário (Equipamentos, Marcas, Tipos)' },
    { key: 'organization', label: 'Organização (Instituições, Entidades, Equipas)' },
    { key: 'collaborators', label: 'Gestão de Colaboradores' },
    { key: 'licensing', label: 'Licenciamento de Software' },
    { key: 'tickets', label: 'Suporte e Tickets' },
];

interface AddCollaboratorModalProps {
    onClose: () => void;
    onSave: (collaborator: Omit<Collaborator, 'id'> | Collaborator, password?: string) => void;
    collaboratorToEdit?: Collaborator | null;
    escolasDepartamentos: Entidade[];
    currentUser: Collaborator | null;
}

const AddCollaboratorModal: React.FC<AddCollaboratorModalProps> = ({ onClose, onSave, collaboratorToEdit, escolasDepartamentos: entidades, currentUser }) => {
    const [formData, setFormData] = useState<Partial<Collaborator>>({
        numeroMecanografico: '',
        fullName: '',
        email: '',
        entidadeId: entidades[0]?.id || '',
        telefoneInterno: '',
        telemovel: '',
        dateOfBirth: '',
        photoUrl: '',
        canLogin: false,
        receivesNotifications: true,
        role: UserRole.Basic,
        status: CollaboratorStatus.Ativo,
        allowedModules: [],
    });
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showPassword, setShowPassword] = useState(false);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const isAdmin = currentUser?.role === UserRole.Admin;

    useEffect(() => {
        if (collaboratorToEdit) {
            setFormData({
                numeroMecanografico: collaboratorToEdit.numeroMecanografico,
                fullName: collaboratorToEdit.fullName,
                email: collaboratorToEdit.email,
                entidadeId: collaboratorToEdit.entidadeId,
                telefoneInterno: collaboratorToEdit.telefoneInterno || '',
                telemovel: collaboratorToEdit.telemovel || '',
                dateOfBirth: collaboratorToEdit.dateOfBirth || '',
                photoUrl: collaboratorToEdit.photoUrl || '',
                canLogin: collaboratorToEdit.canLogin,
                receivesNotifications: collaboratorToEdit.receivesNotifications ?? true,
                role: collaboratorToEdit.role,
                status: collaboratorToEdit.status || CollaboratorStatus.Ativo,
                allowedModules: collaboratorToEdit.allowedModules || [],
            });
            if (collaboratorToEdit.photoUrl) {
                setPhotoPreview(collaboratorToEdit.photoUrl);
            }
        } else {
             setFormData({
                numeroMecanografico: '',
                fullName: '',
                email: '',
                entidadeId: entidades[0]?.id || '',
                telefoneInterno: '',
                telemovel: '',
                dateOfBirth: '',
                photoUrl: '',
                canLogin: false,
                receivesNotifications: true,
                role: UserRole.Basic,
                status: CollaboratorStatus.Ativo,
                allowedModules: [],
            });
        }
    }, [collaboratorToEdit, entidades]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.numeroMecanografico?.trim()) newErrors.numeroMecanografico = "O nº mecanográfico é obrigatório.";
        if (!formData.fullName?.trim()) newErrors.fullName = "O nome completo é obrigatório.";
        if (!formData.entidadeId) newErrors.entidadeId = "A entidade é obrigatória.";
        
        if (!formData.email?.trim()) {
            newErrors.email = "O email é obrigatório.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "O formato do email é inválido.";
        }
        
        // Password validation only for new users with login enabled
        if (!collaboratorToEdit && formData.canLogin) {
            if (!password.trim()) {
                newErrors.password = "A password é obrigatória para novos colaboradores com acesso.";
            } else {
                const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
                if (!passwordRegex.test(password)) {
                    newErrors.password = "A password deve ter no mínimo 6 caracteres, incluindo uma maiúscula, um número e um caracter especial (@$!%*?&).";
                }
            }
        }
        
        if (formData.telemovel?.trim() && !isPortuguesePhoneNumber(formData.telemovel)) {
            newErrors.telemovel = "Número de telemóvel inválido. Use um número português de 9 dígitos.";
        }
        if (formData.telefoneInterno && !/^\d+$/.test(formData.telefoneInterno)) {
            newErrors.telefoneInterno = "O telefone interno deve conter apenas números.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };
    
    const handleModuleToggle = (moduleKey: AppModule) => {
        setFormData(prev => {
            const currentModules = prev.allowedModules || [];
            if (currentModules.includes(moduleKey)) {
                return { ...prev, allowedModules: currentModules.filter(m => m !== moduleKey) };
            } else {
                return { ...prev, allowedModules: [...currentModules, moduleKey] };
            }
        });
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleRemovePhoto = () => {
        setPhotoFile(null);
        setPhotoPreview(null);
        setFormData(prev => ({ ...prev, photoUrl: '' }));
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        
        let photoUrl = formData.photoUrl;

        // If a new photo file is selected, upload it
        if (photoFile && (collaboratorToEdit?.id || !collaboratorToEdit)) {
            const userId = collaboratorToEdit?.id || (currentUser?.id || crypto.randomUUID());
            const uploadedUrl = await dataService.uploadCollaboratorPhoto(userId, photoFile);
            if (uploadedUrl) {
                photoUrl = uploadedUrl;
            }
        }
    
        const dataToSave: any = {
            ...formData,
            photoUrl: photoUrl || undefined,
            dateOfBirth: formData.dateOfBirth || undefined,
            telefoneInterno: formData.telefoneInterno?.trim() || undefined,
            telemovel: formData.telemovel?.trim() || undefined,
        };
        
        if (collaboratorToEdit) {
            onSave({ ...collaboratorToEdit, ...dataToSave });
        } else {
            onSave(dataToSave, password);
        }
    
        onClose();
    };

    const modalTitle = collaboratorToEdit ? "Editar Colaborador" : "Adicionar Novo Colaborador";
    const showPasswordField = !collaboratorToEdit && formData.canLogin;

    return (
        <Modal title={modalTitle} onClose={onClose} maxWidth="max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="flex-shrink-0">
                         <input type="file" ref={fileInputRef} onChange={handlePhotoChange} accept="image/*" className="hidden" />
                        <div className="relative w-24 h-24">
                            {photoPreview ? (
                                <img src={photoPreview} alt="Avatar" className="w-24 h-24 rounded-full object-cover" />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center">
                                    <UserIcon className="h-12 w-12 text-gray-500" />
                                </div>
                            )}
                            <div className="absolute bottom-0 right-0 flex flex-col gap-1">
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-1.5 bg-brand-primary text-white rounded-full hover:bg-brand-secondary text-xs" title="Carregar foto">
                                    <CameraIcon className="h-4 w-4" />
                                </button>
                                {photoPreview && (
                                    <button type="button" onClick={handleRemovePhoto} className="p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 text-xs" title="Remover foto">
                                        <DeleteIcon className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="w-full space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="numeroMecanografico" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Nº Mecanográfico</label>
                                <input type="text" name="numeroMecanografico" id="numeroMecanografico" value={formData.numeroMecanografico} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.numeroMecanografico ? 'border-red-500' : 'border-gray-600'}`} />
                                {errors.numeroMecanografico && <p className="text-red-400 text-xs italic mt-1">{errors.numeroMecanografico}</p>}
                            </div>
                            <div>
                                <label htmlFor="fullName" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Nome Completo</label>
                                <input type="text" name="fullName" id="fullName" value={formData.fullName} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.fullName ? 'border-red-500' : 'border-gray-600'}`} />
                                {errors.fullName && <p className="text-red-400 text-xs italic mt-1">{errors.fullName}</p>}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label htmlFor="entidadeId" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Entidade</label>
                        <select name="entidadeId" id="entidadeId" value={formData.entidadeId} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.entidadeId ? 'border-red-500' : 'border-gray-600'}`} >
                            <option value="" disabled>Selecione uma entidade</option>
                            {entidades.map(entidade => (
                                <option key={entidade.id} value={entidade.id}>{entidade.name}</option>
                            ))}
                        </select>
                        {errors.entidadeId && <p className="text-red-400 text-xs italic mt-1">{errors.entidadeId}</p>}
                    </div>
                     <div>
                        <label htmlFor="dateOfBirth" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Data de Nascimento (Opcional)</label>
                        <input type="date" name="dateOfBirth" id="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 border-gray-600`} />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Email</label>
                        <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.email ? 'border-red-500' : 'border-gray-600'}`} />
                        {errors.email && <p className="text-red-400 text-xs italic mt-1">{errors.email}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label htmlFor="telefoneInterno" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Telefone Interno (Opcional)</label>
                        <input type="tel" name="telefoneInterno" id="telefoneInterno" value={formData.telefoneInterno} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.telefoneInterno ? 'border-red-500' : 'border-gray-600'}`} />
                        {errors.telefoneInterno && <p className="text-red-400 text-xs italic mt-1">{errors.telefoneInterno}</p>}
                    </div>
                     <div>
                        <label htmlFor="telemovel" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Telemóvel (Opcional)</label>
                        <input type="tel" name="telemovel" id="telemovel" value={formData.telemovel} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.telemovel ? 'border-red-500' : 'border-gray-600'}`} />
                        {errors.telemovel && <p className="text-red-400 text-xs italic mt-1">{errors.telemovel}</p>}
                    </div>
                </div>
                
                 <div className="border-t border-gray-600 pt-4 mt-4">
                    <h3 className="text-lg font-medium text-on-surface-dark mb-2">Credenciais e Permissões</h3>
                     <div className="space-y-4">
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                name="canLogin"
                                id="canLogin"
                                checked={formData.canLogin}
                                onChange={handleChange}
                                className="h-4 w-4 rounded border-gray-300 bg-gray-700 text-brand-primary focus:ring-brand-secondary disabled:bg-gray-800 disabled:cursor-not-allowed"
                                disabled={!!collaboratorToEdit && !collaboratorToEdit.canLogin}
                            />
                             <label htmlFor="canLogin" className="ml-3 block text-sm font-medium text-on-surface-dark-secondary">
                                Permitir login na plataforma
                                {!!collaboratorToEdit && !collaboratorToEdit.canLogin && 
                                    <span className="text-xs block text-yellow-400">(A ativação de login só é permitida na criação do utilizador.)</span>
                                }
                            </label>
                        </div>

                        {showPasswordField && (
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Password Temporária</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-grow">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            id="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Defina uma password segura"
                                            className={`w-full bg-gray-700 border text-white rounded-md p-2 pr-10 ${errors.password ? 'border-red-500' : 'border-gray-600'}`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-white"
                                            aria-label={showPassword ? "Ocultar password" : "Mostrar password"}
                                        >
                                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setPassword(generateStrongPassword())}
                                        className="p-2 bg-gray-600 text-white rounded-md hover:bg-gray-500"
                                        title="Sugerir password forte"
                                    >
                                        <FaMagic />
                                    </button>
                                </div>
                                {errors.password && <p className="text-red-400 text-xs italic mt-1">{errors.password}</p>}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="status" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Status</label>
                                <select name="status" id="status" value={formData.status} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2">
                                    {Object.values(CollaboratorStatus).map(status => (
                                        <option key={status} value={status}>{status}</option>
                                    ))}
                                </select>
                            </div>
                            {isAdmin && (
                                <div>
                                    <label htmlFor="role" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Perfil</label>
                                    <select name="role" id="role" value={formData.role} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2">
                                        {Object.values(UserRole).map(role => (
                                            <option key={role} value={role}>{role}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {isAdmin && formData.role !== UserRole.Admin && (
                            <div className="bg-gray-800 p-4 rounded-md border border-gray-700 mt-4">
                                <label className="block text-sm font-medium text-white mb-3">Acesso a Módulos</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {AVAILABLE_MODULES.map(module => (
                                        <div key={module.key} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id={`module-${module.key}`}
                                                checked={(formData.allowedModules || []).includes(module.key)}
                                                onChange={() => handleModuleToggle(module.key)}
                                                className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-brand-primary focus:ring-brand-secondary"
                                            />
                                            <label htmlFor={`module-${module.key}`} className="ml-2 block text-sm text-on-surface-dark-secondary">
                                                {module.label}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    Se nenhum módulo for selecionado, o colaborador terá acesso apenas à Visão Geral.
                                </p>
                            </div>
                        )}
                        
                        {formData.canLogin && isAdmin && (
                            <div className="flex items-center mt-4">
                                <input
                                    type="checkbox"
                                    name="receivesNotifications"
                                    id="receivesNotifications"
                                    checked={formData.receivesNotifications}
                                    onChange={handleChange}
                                    className="h-4 w-4 rounded border-gray-300 bg-gray-700 text-brand-primary focus:ring-brand-secondary"
                                />
                                <label htmlFor="receivesNotifications" className="ml-3 block text-sm font-medium text-on-surface-dark-secondary">
                                    Receber notificações da plataforma
                                </label>
                            </div>
                        )}
                     </div>
                </div>


                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary">Salvar</button>
                </div>
            </form>
        </Modal>
    );
};

export default AddCollaboratorModal;