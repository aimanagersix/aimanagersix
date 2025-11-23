
import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { Collaborator, Entidade, UserRole, CollaboratorStatus, ConfigItem } from '../types';
import { SpinnerIcon } from './common/Icons';

interface AddCollaboratorModalProps {
    onClose: () => void;
    onSave: (collaborator: Omit<Collaborator, 'id'> | Collaborator, password?: string) => Promise<any>;
    collaboratorToEdit?: Collaborator | null;
    escolasDepartamentos: Entidade[];
    currentUser: Collaborator | null;
    roleOptions?: ConfigItem[];
    statusOptions?: ConfigItem[];
}

const AddCollaboratorModal: React.FC<AddCollaboratorModalProps> = ({ 
    onClose, 
    onSave, 
    collaboratorToEdit, 
    escolasDepartamentos, 
    currentUser,
    roleOptions,
    statusOptions 
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
    const [error, setError] = useState('');

    // Use dynamic options if available
    const roles = roleOptions && roleOptions.length > 0 ? roleOptions.map(r => r.name) : Object.values(UserRole);
    const statuses = statusOptions && statusOptions.length > 0 ? statusOptions.map(s => s.name) : Object.values(CollaboratorStatus);

    useEffect(() => {
        if (collaboratorToEdit) {
            setFormData({
                ...collaboratorToEdit,
                address_line: collaboratorToEdit.address_line || collaboratorToEdit.address || '',
                postal_code: collaboratorToEdit.postal_code || '',
                city: collaboratorToEdit.city || '',
                locality: collaboratorToEdit.locality || '',
                nif: collaboratorToEdit.nif || '',
                title: collaboratorToEdit.title || ''
            });
        } else {
             setFormData(prev => ({
                 ...prev,
                 entidadeId: escolasDepartamentos[0]?.id || ''
             }));
        }
    }, [collaboratorToEdit, escolasDepartamentos]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.fullName?.trim() || !formData.email?.trim()) {
            setError("Nome e Email são obrigatórios.");
            return;
        }
        
        setIsSaving(true);
        setError('');

        const address = [formData.address_line, formData.postal_code, formData.city].filter(Boolean).join(', ');
        const dataToSave: any = { 
            ...formData, 
            address,
            numeroMecanografico: formData.numeroMecanografico || 'N/A' 
        };

        try {
            if (collaboratorToEdit) {
                await onSave({ ...collaboratorToEdit, ...dataToSave });
            } else {
                // Only send password if creating new
                await onSave(dataToSave, password || undefined);
            }
            onClose();
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Erro ao salvar colaborador.");
        } finally {
            setIsSaving(false);
        }
    };

    const modalTitle = collaboratorToEdit ? "Editar Colaborador" : "Adicionar Colaborador";

    return (
        <Modal title={modalTitle} onClose={onClose} maxWidth="max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto max-h-[80vh] p-1">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Trato</label>
                        <input type="text" name="title" value={formData.title} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm" placeholder="Dr., Eng."/>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-400 mb-1">Nome Completo</label>
                        <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm" required />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm" required />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Nº Mecanográfico</label>
                        <input type="text" name="numeroMecanografico" value={formData.numeroMecanografico} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">NIF</label>
                        <input type="text" name="nif" value={formData.nif} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Móvel</label>
                        <input type="text" name="telemovel" value={formData.telemovel} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Extensão</label>
                        <input type="text" name="telefoneInterno" value={formData.telefoneInterno} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm" />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Entidade / Departamento</label>
                    <select name="entidadeId" value={formData.entidadeId} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm">
                        {escolasDepartamentos.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                </div>

                <div className="bg-gray-900/30 p-3 rounded border border-gray-700">
                    <h4 className="text-sm font-bold text-white mb-2">Endereço</h4>
                    <div className="space-y-2">
                        <input type="text" name="address_line" value={formData.address_line} onChange={handleChange} placeholder="Morada" className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm" />
                        <div className="grid grid-cols-3 gap-2">
                            <input type="text" name="postal_code" value={formData.postal_code} onChange={handleChange} placeholder="Cód. Postal" className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm" />
                            <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="Cidade" className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm" />
                            <input type="text" name="locality" value={formData.locality} onChange={handleChange} placeholder="Localidade" className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm" />
                        </div>
                    </div>
                </div>

                <div className="bg-gray-900/30 p-3 rounded border border-gray-700">
                    <h4 className="text-sm font-bold text-white mb-2">Acesso ao Sistema</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Perfil</label>
                            <select name="role" value={formData.role} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm">
                                {roles.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Estado</label>
                            <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm">
                                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 mb-2">
                        <label className="flex items-center">
                            <input type="checkbox" name="canLogin" checked={formData.canLogin} onChange={handleChange} className="mr-2" />
                            <span className="text-sm text-white">Permitir Login</span>
                        </label>
                        <label className="flex items-center">
                            <input type="checkbox" name="receivesNotifications" checked={formData.receivesNotifications} onChange={handleChange} className="mr-2" />
                            <span className="text-sm text-white">Recebe Notificações</span>
                        </label>
                    </div>
                    {!collaboratorToEdit && formData.canLogin && (
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Password Inicial</label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm" />
                        </div>
                    )}
                </div>

                {error && <p className="text-red-400 text-sm bg-red-900/20 p-2 rounded">{error}</p>}

                <div className="flex justify-end gap-2 pt-4 border-t border-gray-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500">Cancelar</button>
                    <button type="submit" disabled={isSaving} className="px-4 py-2 bg-brand-primary text-white rounded hover:bg-brand-secondary disabled:opacity-50 flex items-center gap-2">
                        {isSaving && <SpinnerIcon />} Salvar
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddCollaboratorModal;
