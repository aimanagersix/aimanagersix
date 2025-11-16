import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { Collaborator, Entidade, UserRole, CollaboratorStatus } from '../types';

const isPortuguesePhoneNumber = (phone: string): boolean => {
    if (!phone || phone.trim() === '') return true; // Optional fields are valid if empty
    const cleaned = phone.replace(/[\s-()]/g, '').replace(/^\+351/, '');
    const regex = /^(2\d{8}|9[1236]\d{7})$/;
    return regex.test(cleaned);
};

interface AddCollaboratorModalProps {
    onClose: () => void;
    onSave: (collaborator: Omit<Collaborator, 'id'> | Collaborator) => Promise<any>;
    collaboratorToEdit?: Collaborator | null;
    escolasDepartamentos: Entidade[];
    currentUser: Collaborator | null;
}

const AddCollaboratorModal: React.FC<AddCollaboratorModalProps> = ({ onClose, onSave, collaboratorToEdit, escolasDepartamentos: entidades, currentUser }) => {
    const [formData, setFormData] = useState({
        numeroMecanografico: '',
        fullName: '',
        email: '',
        entidadeId: entidades[0]?.id || '',
        telefoneInterno: '',
        telemovel: '',
        password: '',
        canLogin: false,
        role: UserRole.Basic,
        status: CollaboratorStatus.Ativo,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    
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
                password: '', // Password field is for setting/resetting, not displaying
                canLogin: collaboratorToEdit.canLogin,
                role: collaboratorToEdit.role,
                status: collaboratorToEdit.status || CollaboratorStatus.Ativo,
            });
        } else {
             setFormData({
                numeroMecanografico: '',
                fullName: '',
                email: '',
                entidadeId: entidades[0]?.id || '',
                telefoneInterno: '',
                telemovel: '',
                password: '',
                canLogin: false,
                role: UserRole.Basic,
                status: CollaboratorStatus.Ativo,
            });
        }
    }, [collaboratorToEdit, entidades]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.numeroMecanografico.trim()) newErrors.numeroMecanografico = "O nº mecanográfico é obrigatório.";
        if (!formData.fullName.trim()) newErrors.fullName = "O nome completo é obrigatório.";
        if (!formData.entidadeId) newErrors.entidadeId = "A entidade é obrigatória.";
        
        if (!formData.email.trim()) {
            newErrors.email = "O email é obrigatório.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "O formato do email é inválido.";
        }
        
        if (!collaboratorToEdit && !formData.password.trim()) {
            newErrors.password = "A password é obrigatória para novos colaboradores.";
        } else if (formData.password.trim() && formData.password.length < 6) {
            newErrors.password = "A password deve ter pelo menos 6 caracteres.";
        }
        
        if (formData.telemovel.trim() && !isPortuguesePhoneNumber(formData.telemovel)) {
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
    
        // Clean up optional fields. Send null for empty strings.
        // This works for both insert (becomes NULL) and update (sets to NULL).
        const dataToSave: any = {
            ...formData,
            telefoneInterno: formData.telefoneInterno?.trim() || null,
            telemovel: formData.telemovel?.trim() || null,
        };
        
        if (collaboratorToEdit) {
            // If password is not being changed, remove it from the submission object
            if (!dataToSave.password || dataToSave.password.trim() === '') {
                delete dataToSave.password;
            }
            // Non-admins can't change roles
            if (!isAdmin) {
                dataToSave.role = collaboratorToEdit.role;
            }
            onSave({ ...collaboratorToEdit, ...dataToSave });
        } else {
            // Non-admins can only create Basic users
            if (!isAdmin) {
                dataToSave.role = UserRole.Basic;
            }
            onSave(dataToSave);
        }
    
        onClose();
    };

    const modalTitle = collaboratorToEdit ? "Editar Colaborador" : "Adicionar Novo Colaborador";

    return (
        <Modal title={modalTitle} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Email</label>
                        <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.email ? 'border-red-500' : 'border-gray-600'}`} />
                        {errors.email && <p className="text-red-400 text-xs italic mt-1">{errors.email}</p>}
                    </div>
                     <div>
                        <label htmlFor="entidadeId" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Entidade (Apenas Ativas)</label>
                        <select name="entidadeId" id="entidadeId" value={formData.entidadeId} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.entidadeId ? 'border-red-500' : 'border-gray-600'}`} >
                            <option value="" disabled>Selecione uma entidade</option>
                            {entidades.map(entidade => (
                                <option key={entidade.id} value={entidade.id}>{entidade.name}</option>
                            ))}
                        </select>
                        {errors.entidadeId && <p className="text-red-400 text-xs italic mt-1">{errors.entidadeId}</p>}
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
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="password" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Password</label>
                            <input
                                type="password"
                                name="password"
                                id="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder={collaboratorToEdit ? "Deixar em branco para não alterar" : "Defina uma password"}
                                className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.password ? 'border-red-500' : 'border-gray-600'}`}
                            />
                            {errors.password && <p className="text-red-400 text-xs italic mt-1">{errors.password}</p>}
                        </div>
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
                         <div className="flex items-center pt-2 md:pt-6">
                            <input
                                type="checkbox"
                                name="canLogin"
                                id="canLogin"
                                checked={formData.canLogin}
                                onChange={handleChange}
                                className="h-4 w-4 rounded border-gray-300 bg-gray-700 text-brand-primary focus:ring-brand-secondary"
                            />
                             <label htmlFor="canLogin" className="ml-3 block text-sm font-medium text-on-surface-dark-secondary">
                                Permitir login na plataforma
                            </label>
                        </div>
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