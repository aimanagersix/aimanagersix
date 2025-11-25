
import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { Team } from '../types';
import { CheckIcon } from './common/Icons';

interface AddTeamModalProps {
    onClose: () => void;
    onSave: (team: Omit<Team, 'id'> | Team) => void;
    teamToEdit?: Team | null;
}

const AddTeamModal: React.FC<AddTeamModalProps> = ({ onClose, onSave, teamToEdit }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
    });
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (teamToEdit) {
            setFormData({
                name: teamToEdit.name,
                description: teamToEdit.description || '',
            });
        }
    }, [teamToEdit]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.name.trim() === '') {
            setError('O nome da equipa é obrigatório.');
            return;
        }
        setError('');
        setSuccessMessage('');
        
        const dataToSave = {
            name: formData.name,
            description: formData.description || undefined
        };

        if (teamToEdit) {
            onSave({ ...teamToEdit, ...dataToSave });
        } else {
            onSave(dataToSave);
        }
        setSuccessMessage("Equipa gravada com sucesso!");
        setTimeout(() => setSuccessMessage(''), 3000);
        // onClose(); // Removed auto-close
    };
    
    const modalTitle = teamToEdit ? "Editar Equipa" : "Adicionar Nova Equipa";

    return (
        <Modal title={modalTitle} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Nome da Equipa</label>
                    <input 
                        type="text" 
                        name="name" 
                        id="name" 
                        value={formData.name} 
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className={`w-full bg-gray-700 border text-white rounded-md p-2 ${error ? 'border-red-500' : 'border-gray-600'}`}
                    />
                     {error && <p className="text-red-400 text-xs italic mt-1">{error}</p>}
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Descrição (Opcional)</label>
                    <textarea 
                        name="description" 
                        id="description" 
                        rows={3}
                        value={formData.description} 
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} 
                        className="w-full bg-gray-700 border text-white rounded-md p-2 border-gray-600"
                    />
                </div>

                {successMessage && (
                    <div className="p-3 bg-green-500/20 text-green-300 rounded border border-green-500/50 text-center font-medium animate-fade-in">
                        {successMessage}
                    </div>
                )}

                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Cancelar / Fechar</button>
                    <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary">
                        {successMessage ? <CheckIcon className="h-4 w-4"/> : null}
                        Salvar
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddTeamModal;
