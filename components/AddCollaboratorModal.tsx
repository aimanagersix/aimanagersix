
import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { Collaborator, Entidade, UserRole, CollaboratorStatus, ConfigItem, ContactTitle } from '../types';
import { SpinnerIcon, CheckIcon } from './common/Icons';
import { FaGlobe } from 'react-icons/fa';

const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isValidPhoneNumber = (phone: string): boolean => {
    if (!phone || phone.trim() === '') return true;
    const cleaned = phone.replace(/[\s-()]/g, '').replace(/^\+351/, '');
    const regex = /^(2\d{8}|9[1236]\d{7})$/;
    return regex.test(cleaned);
};

interface AddCollaboratorModalProps {
    onClose: () => void;
    onSave: (collaborator: Omit<Collaborator, 'id'> | Collaborator, password?: string) => Promise<any>;
    collaboratorToEdit?: Collaborator | null;
    escolasDepartamentos: Entidade[];
    currentUser: Collaborator | null;
    roleOptions?: ConfigItem[];
    titleOptions?: ContactTitle[];
}

const AddCollaboratorModal: React.FC<AddCollaboratorModalProps> = ({ 
    onClose, 
    onSave, 
    collaboratorToEdit, 
    escolasDepartamentos, 
    currentUser,
    roleOptions,
    titleOptions 
}) => {
    const [formData, setFormData] = useState<Partial<Collaborator>>({
        numeroMecanografico: '',
        title: '',
        fullName: '',
        entidadeId: escolasDepartamentos[0]?.id || '',
        email: '',
        nif: '',
        telefoneInterno: '',
        telemovel: '',
        address_line: '',
        postal_code: '',
        city: '',
        locality: '',
        canLogin: false,
        receivesNotifications: false,
        role: UserRole.Utilizador,
        status: CollaboratorStatus.Ativo
    });
    const [password, setPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [successMessage, setSuccessMessage] = useState('');
    const [isGlobalAdmin, setIsGlobalAdmin] = useState(false);

    // Use dynamic options if available
    const roles = roleOptions && roleOptions.length > 0 ? roleOptions.map(r => r.name) : Object.values(UserRole);
    const titles = titleOptions && titleOptions.length > 0 ? titleOptions.map(t => t.name) : ['Sr.', 'Sra.', 'Dr.', 'Dra.', 'Eng.', 'Eng.ª'];

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
                entidadeId: collaboratorToEdit.entidadeId || ''
            });
            setIsGlobalAdmin(!collaboratorToEdit.entidadeId);
        } else {
             setFormData(prev => ({
                 ...prev,
                 entidadeId: escolasDepartamentos[0]?.id || ''
             }));
        }
    }, [collaboratorToEdit, escolasDepartamentos]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.fullName?.trim()) newErrors.fullName = "O nome é obrigatório.";
        if (!formData.email?.trim()) {
            newErrors.email = "O email é obrigatório.";
        } else if (!isValidEmail(formData.email)) {
            newErrors.email = "Formato de email inválido.";
        }

        if (formData.telemovel?.trim() && !isValidPhoneNumber(formData.telemovel)) {
            newErrors.telemovel = "Móvel inválido (9 dígitos, iniciar com 9).";
        }

        if (formData.nif?.trim()) {
             const cleanNif = formData.nif.replace(/\s/g, '');
             if (!/^\d{9}$/.test(cleanNif)) {
                 newErrors.nif = "O NIF deve ter 9 dígitos.";
             }
        }
        
        if (!isGlobalAdmin && !formData.entidadeId) {
            newErrors.entidadeId = "A entidade é obrigatória.";
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
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = {...prev};
                delete newErrors[name];
                return newErrors;
            });
        }
    };
    
    const handleGlobalAdminToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked;
        setIsGlobalAdmin(checked);
        if (checked) {
            setFormData(prev => ({ ...prev, entidadeId: '' }));
        } else {
            setFormData(prev => ({ ...prev, entidadeId: escolasDepartamentos[0]?.id || '' }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        
        setIsSaving(true);
        setSuccessMessage('');

        const address = [formData.address_line, formData.postal_code, formData.city].filter(Boolean).join(', ');
        const dataToSave: any = { 
            ...formData, 
            address,
            numeroMecanografico: formData.numeroMecanografico || 'N/A',
            entidadeId: isGlobalAdmin ? null : formData.entidadeId
        };

        try {
            let result;
            if (collaboratorToEdit) {
                result = await onSave({ ...collaboratorToEdit, ...dataToSave });
            } else {
                result = await onSave(dataToSave, password || undefined);
            }
            
            if (result) {
                setSuccessMessage("Colaborador gravado com sucesso!");
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        } catch (e: any) {
            console.error(e);
            setErrors(prev => ({...prev, general: e.message || "Erro ao salvar colaborador."}));
        } finally {
            setIsSaving(false);
        }
    };

    const modalTitle = collaboratorToEdit ? "Editar Colaborador" : "Adicionar Colaborador";
    const isAdminRole = formData.role === 'Admin';

    return (
        <Modal title={modalTitle} onClose={onClose} maxWidth="max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto max-h-[80vh] p-1">
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
                        <input type="text" name="nif" value={formData.nif} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded p-2 text-sm ${errors.nif ? 'border-red-500' : 'border-gray-600'}`} />
                        {errors.nif && <p className="text-red-400 text-xs italic mt-1">{errors.nif}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Móvel</label>
                        <input type="text" name="telemovel" value={formData.telemovel} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded p-2 text-sm ${errors.telemovel ? 'border-red-500' : 'border-gray-600'}`} />
                        {errors.telemovel && <p className="text-red-400 text-xs italic mt-1">{errors.telemovel}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Extensão</label>
                        <input type="text" name="telefoneInterno" value={formData.telefoneInterno} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Perfil de Acesso</label>
                        <select name="role" value={formData.role} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm">
                            {roles.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Status</label>
                        <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm">
                            <option value="Ativo">Ativo</option>
                            <option value="Inativo">Inativo</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Entidade / Departamento</label>
                    <select 
                        name="entidadeId" 
                        value={formData.entidadeId} 
                        onChange={handleChange} 
                        className={`w-full bg-gray-700 border text-white rounded p-2 text-sm ${errors.entidadeId ? 'border-red-500' : 'border-gray-600'} disabled:opacity-50 disabled:cursor-not-allowed`}
                        disabled={isGlobalAdmin}
                    >
                        <option value="" disabled>Selecione...</option>
                        {escolasDepartamentos.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                    {errors.entidadeId && <p className="text-red-400 text-xs italic mt-1">{errors.entidadeId}</p>}
                </div>

                {isAdminRole && (
                    <div className="bg-purple-900/20 p-3 rounded border border-purple-500/30 flex items-center">
                         <label className="flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={isGlobalAdmin} 
                                onChange={handleGlobalAdminToggle} 
                                className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-purple-500 focus:ring-purple-500" 
                            />
                            <span className="ml-2 text-sm font-bold text-purple-300 flex items-center gap-2">
                                <FaGlobe /> Acesso Global (Super Admin)
                            </span>
                        </label>
                        <p className="text-xs text-gray-400 ml-auto pl-4">
                            Permite ver todas as instituições sem restrição de entidade.
                        </p>
                    </div>
                )}

                <div className="flex items-center gap-4 pt-2">
                    <label className="flex items-center cursor-pointer">
                        <input type="checkbox" name="canLogin" checked={formData.canLogin} onChange={handleChange} className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-brand-primary focus:ring-brand-secondary" />
                        <span className="ml-2 text-sm text-gray-300">Permitir Login</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                        <input type="checkbox" name="receivesNotifications" checked={formData.receivesNotifications} onChange={handleChange} className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-brand-primary focus:ring-brand-secondary" />
                        <span className="ml-2 text-sm text-gray-300">Recebe Notificações</span>
                    </label>
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

                {!collaboratorToEdit && formData.canLogin && (
                    <div className="border-t border-gray-600 pt-4">
                        <label className="block text-xs font-medium text-gray-400 mb-1">Password Inicial</label>
                        <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Opcional (será gerada se vazio)" className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm" />
                        <p className="text-xs text-gray-500 mt-1">Se deixar em branco, o utilizador terá de fazer "Esqueci-me da password".</p>
                    </div>
                )}

                {errors.general && <p className="text-red-400 text-xs">{errors.general}</p>}
                
                {successMessage && (
                    <div className="p-3 bg-green-500/20 text-green-300 rounded border border-green-500/50 text-center font-medium animate-fade-in">
                        {successMessage}
                    </div>
                )}

                <div className="flex justify-end gap-4 pt-4 border-t border-gray-700">
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
