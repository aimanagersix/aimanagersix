import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { Entidade, Instituicao, EntidadeStatus } from '../types';

const isPortuguesePhoneNumber = (phone: string): boolean => {
    if (!phone || phone.trim() === '') return true; // Optional fields are valid if empty
    const cleaned = phone.replace(/[\s-()]/g, '').replace(/^\+351/, '');
    const regex = /^(2\d{8}|9[1236]\d{7})$/;
    return regex.test(cleaned);
};

interface AddEntidadeModalProps {
    onClose: () => void;
    onSave: (entidade: Omit<Entidade, 'id'> | Entidade) => Promise<any>;
    entidadeToEdit?: Entidade | null;
    instituicoes: Instituicao[];
}

const AddEntityModal: React.FC<AddEntidadeModalProps> = ({ onClose, onSave, entidadeToEdit, instituicoes }) => {
    const [formData, setFormData] = useState({
        instituicaoId: instituicoes[0]?.id || '',
        codigo: '',
        name: '',
        description: '',
        email: '',
        responsavel: '',
        telefone: '',
        telemovel: '',
        telefoneInterno: '',
        status: EntidadeStatus.Ativo
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (entidadeToEdit) {
            setFormData({
                instituicaoId: entidadeToEdit.instituicaoId,
                codigo: entidadeToEdit.codigo,
                name: entidadeToEdit.name,
                description: entidadeToEdit.description,
                email: entidadeToEdit.email,
                responsavel: entidadeToEdit.responsavel || '',
                telefone: entidadeToEdit.telefone || '',
                telemovel: entidadeToEdit.telemovel || '',
                telefoneInterno: entidadeToEdit.telefoneInterno || '',
                status: entidadeToEdit.status || EntidadeStatus.Ativo,
            });
        }
    }, [entidadeToEdit]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.instituicaoId) newErrors.instituicaoId = "A instituição é obrigatória.";
        if (!formData.name.trim()) newErrors.name = "O nome é obrigatório.";
        if (!formData.codigo.trim()) newErrors.codigo = "O código é obrigatório.";
        if (!formData.email.trim()) {
            newErrors.email = "O email é obrigatório.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "O formato do email é inválido.";
        }
        if (formData.telefone.trim() && !isPortuguesePhoneNumber(formData.telefone)) {
            newErrors.telefone = "Número de telefone inválido. Use um número português de 9 dígitos.";
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        
        if (entidadeToEdit) {
            onSave({ ...entidadeToEdit, ...formData });
        } else {
            onSave(formData);
        }
        onClose();
    };
    
    const modalTitle = entidadeToEdit ? "Editar Entidade" : "Adicionar Nova Entidade";

    return (
        <Modal title={modalTitle} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label htmlFor="instituicaoId" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Instituição</label>
                        <select name="instituicaoId" id="instituicaoId" value={formData.instituicaoId} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.instituicaoId ? 'border-red-500' : 'border-gray-600'}`} >
                             <option value="" disabled>Selecione uma Instituição</option>
                             {instituicoes.map(ent => (
                                 <option key={ent.id} value={ent.id}>{ent.name}</option>
                             ))}
                        </select>
                         {errors.instituicaoId && <p className="text-red-400 text-xs italic mt-1">{errors.instituicaoId}</p>}
                    </div>
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Nome da Entidade</label>
                        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.name ? 'border-red-500' : 'border-gray-600'}`} />
                        {errors.name && <p className="text-red-400 text-xs italic mt-1">{errors.name}</p>}
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="codigo" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Código</label>
                        <input type="text" name="codigo" id="codigo" value={formData.codigo} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.codigo ? 'border-red-500' : 'border-gray-600'}`} />
                        {errors.codigo && <p className="text-red-400 text-xs italic mt-1">{errors.codigo}</p>}
                    </div>
                     <div>
                        <label htmlFor="status" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Status</label>
                        <select name="status" id="status" value={formData.status} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" >
                             {Object.values(EntidadeStatus).map(status => (
                                 <option key={status} value={status}>{status}</option>
                             ))}
                        </select>
                    </div>
                 </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Email</label>
                    <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.email ? 'border-red-500' : 'border-gray-600'}`} />
                    {errors.email && <p className="text-red-400 text-xs italic mt-1">{errors.email}</p>}
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Descrição</label>
                    <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={3} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" ></textarea>
                </div>
                 <div className="border-t border-gray-600 pt-4 mt-4">
                    <h3 className="text-lg font-medium text-on-surface-dark mb-2">Contacto do Responsável</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="responsavel" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Nome do Responsável (Opcional)</label>
                            <input type="text" name="responsavel" id="responsavel" value={formData.responsavel} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" />
                        </div>
                        <div>
                            <label htmlFor="telefone" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Telefone (Opcional)</label>
                            <input type="tel" name="telefone" id="telefone" value={formData.telefone} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.telefone ? 'border-red-500' : 'border-gray-600'}`} />
                             {errors.telefone && <p className="text-red-400 text-xs italic mt-1">{errors.telefone}</p>}
                        </div>
                        <div>
                            <label htmlFor="telemovel" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Telemóvel (Opcional)</label>
                            <input type="tel" name="telemovel" id="telemovel" value={formData.telemovel} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.telemovel ? 'border-red-500' : 'border-gray-600'}`} />
                            {errors.telemovel && <p className="text-red-400 text-xs italic mt-1">{errors.telemovel}</p>}
                        </div>
                        <div>
                            <label htmlFor="telefoneInterno" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Telefone Interno (Opcional)</label>
                            <input type="text" name="telefoneInterno" id="telefoneInterno" value={formData.telefoneInterno} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.telefoneInterno ? 'border-red-500' : 'border-gray-600'}`} />
                            {errors.telefoneInterno && <p className="text-red-400 text-xs italic mt-1">{errors.telefoneInterno}</p>}
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

export default AddEntityModal;
