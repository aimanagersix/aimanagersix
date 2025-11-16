import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { Instituicao } from '../types';

const isPortuguesePhoneNumber = (phone: string): boolean => {
    if (!phone || phone.trim() === '') return false;
    const cleaned = phone.replace(/[\s-()]/g, '').replace(/^\+351/, '');
    const regex = /^(2\d{8}|9[1236]\d{7})$/;
    return regex.test(cleaned);
};

interface AddInstituicaoModalProps {
    onClose: () => void;
    onSave: (instituicao: Omit<Instituicao, 'id'> | Instituicao) => Promise<any>;
    instituicaoToEdit?: Instituicao | null;
}

const AddInstituicaoModal: React.FC<AddInstituicaoModalProps> = ({ onClose, onSave, instituicaoToEdit }) => {
    const [formData, setFormData] = useState({
        codigo: '',
        name: '',
        email: '',
        telefone: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (instituicaoToEdit) {
            setFormData({
                codigo: instituicaoToEdit.codigo,
                name: instituicaoToEdit.name,
                email: instituicaoToEdit.email,
                telefone: instituicaoToEdit.telefone,
            });
        }
    }, [instituicaoToEdit]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name.trim()) newErrors.name = "O nome da instituição é obrigatório.";
        if (!formData.codigo.trim()) newErrors.codigo = "O código é obrigatório.";
        
        if (!formData.email.trim()) {
            newErrors.email = "O email é obrigatório.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "O formato do email é inválido.";
        }
        
        if (!formData.telefone.trim()) {
            newErrors.telefone = "O telefone é obrigatório.";
        } else if (!isPortuguesePhoneNumber(formData.telefone)) {
            newErrors.telefone = "Número inválido. Deve ser um número português de 9 dígitos.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        
        if (instituicaoToEdit) {
            onSave({ ...instituicaoToEdit, ...formData });
        } else {
            onSave(formData);
        }
        onClose();
    };
    
    const modalTitle = instituicaoToEdit ? "Editar Instituição" : "Adicionar Nova Instituição";

    return (
        <Modal title={modalTitle} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Nome da Instituição</label>
                        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.name ? 'border-red-500' : 'border-gray-600'}`} />
                        {errors.name && <p className="text-red-400 text-xs italic mt-1">{errors.name}</p>}
                    </div>
                    <div>
                        <label htmlFor="codigo" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Código</label>
                        <input type="text" name="codigo" id="codigo" value={formData.codigo} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.codigo ? 'border-red-500' : 'border-gray-600'}`} />
                         {errors.codigo && <p className="text-red-400 text-xs italic mt-1">{errors.codigo}</p>}
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Email</label>
                        <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.email ? 'border-red-500' : 'border-gray-600'}`} />
                        {errors.email && <p className="text-red-400 text-xs italic mt-1">{errors.email}</p>}
                    </div>
                     <div>
                        <label htmlFor="telefone" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Telefone</label>
                        <input type="tel" name="telefone" id="telefone" value={formData.telefone} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.telefone ? 'border-red-500' : 'border-gray-600'}`} />
                        {errors.telefone && <p className="text-red-400 text-xs italic mt-1">{errors.telefone}</p>}
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

export default AddInstituicaoModal;