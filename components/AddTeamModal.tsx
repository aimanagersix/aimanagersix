
import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { Team } from '../types';
import { CheckIcon, SpinnerIcon } from './common/Icons';

interface AddTeamModalProps {
    onClose: () => void;
    onSave: (team: Omit<Team, 'id'> | Team) => Promise<void>;
    teamToEdit?: Team | null;
}

const AddTeamModal: React.FC<AddTeamModalProps> = ({ onClose, onSave, teamToEdit }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
    });
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (teamToEdit) {
            setFormData({
                name: teamToEdit.name,
                description: teamToEdit.description || '',
            });
        }
    }, [teamToEdit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.name.trim() === '') {
            setError('O nome da equipa é obrigatório.');
            return;
        }
        setError('');
        setIsSaving(true);
        
        try {
            const dataToSave = {
                name: formData.name,
                description: formData.description || undefined
            };

            if (teamToEdit) {
                await onSave({ ...teamToEdit, ...dataToSave });
            } else {
                await onSave(dataToSave);
            }
            onClose();
        } catch (err: any) {
            console.error("Failed to save team", err);
            setError(err.message || "Erro ao gravar equipa.");
        } finally {
            setIsSaving(false);
        }
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

                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500" disabled={isSaving}>Cancelar</button>
                    <button type="submit" disabled={isSaving} className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary disabled:opacity-50">
                        {isSaving ? <SpinnerIcon className="h-4 w-4"/> : <CheckIcon className="h-4 w-4"/>}
                        {isSaving ? 'A Gravar...' : 'Salvar'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddTeamModal;
