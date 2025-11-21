
import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { BackupExecution, BackupType, Collaborator } from '../types';
import { FaServer } from 'react-icons/fa';

interface AddBackupModalProps {
    onClose: () => void;
    onSave: (backup: Omit<BackupExecution, 'id'> | BackupExecution) => void;
    backupToEdit?: BackupExecution | null;
    currentUser: Collaborator | null;
}

const AddBackupModal: React.FC<AddBackupModalProps> = ({ onClose, onSave, backupToEdit, currentUser }) => {
    const [formData, setFormData] = useState<Partial<BackupExecution>>({
        system_name: '',
        backup_date: '',
        test_date: new Date().toISOString().split('T')[0],
        status: 'Sucesso',
        type: BackupType.Full,
        restore_time_minutes: 0,
        tester_id: currentUser?.id || '',
        notes: '',
        evidence_attachment: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (backupToEdit) {
            setFormData({ ...backupToEdit });
        }
    }, [backupToEdit]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.system_name?.trim()) newErrors.system_name = "O nome do sistema é obrigatório.";
        if (!formData.test_date) newErrors.test_date = "A data do teste é obrigatória.";
        if (!formData.backup_date) newErrors.backup_date = "A data do backup original é obrigatória.";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'restore_time_minutes' ? parseInt(value) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        
        const dataToSave: any = { ...formData };
        if (!dataToSave.restore_time_minutes) delete dataToSave.restore_time_minutes;

        if (backupToEdit) {
            onSave({ ...backupToEdit, ...dataToSave });
        } else {
            onSave(dataToSave);
        }
        onClose();
    };
    
    const modalTitle = backupToEdit ? "Editar Registo de Teste" : "Registar Teste de Restauro";

    return (
        <Modal title={modalTitle} onClose={onClose} maxWidth="max-w-lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="system_name" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Sistema / Servidor Testado</label>
                    <input 
                        type="text" 
                        name="system_name" 
                        id="system_name" 
                        value={formData.system_name} 
                        onChange={handleChange} 
                        placeholder="Ex: Servidor ERP, Base de Dados SQL..."
                        className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.system_name ? 'border-red-500' : 'border-gray-600'}`} 
                    />
                    {errors.system_name && <p className="text-red-400 text-xs italic mt-1">{errors.system_name}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="type" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Tipo de Backup</label>
                        <select name="type" value={formData.type} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2">
                            {Object.values(BackupType).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Resultado do Teste</label>
                        <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2">
                            <option value="Sucesso">Sucesso</option>
                            <option value="Falha">Falha</option>
                            <option value="Parcial">Parcial</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="test_date" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Data do Teste</label>
                        <input type="date" name="test_date" value={formData.test_date} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.test_date ? 'border-red-500' : 'border-gray-600'}`} />
                        {errors.test_date && <p className="text-red-400 text-xs italic mt-1">{errors.test_date}</p>}
                    </div>
                    <div>
                        <label htmlFor="backup_date" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Data do Backup (Snapshot)</label>
                        <input type="date" name="backup_date" value={formData.backup_date} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.backup_date ? 'border-red-500' : 'border-gray-600'}`} />
                        {errors.backup_date && <p className="text-red-400 text-xs italic mt-1">{errors.backup_date}</p>}
                    </div>
                </div>

                <div>
                    <label htmlFor="restore_time_minutes" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Tempo de Restauro (Minutos)</label>
                    <input 
                        type="number" 
                        name="restore_time_minutes" 
                        value={formData.restore_time_minutes} 
                        onChange={handleChange} 
                        className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" 
                        placeholder="Opcional (para validar RTO)"
                    />
                </div>

                <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Notas / Observações</label>
                    <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"></textarea>
                </div>

                <div>
                    <label htmlFor="evidence_attachment" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Link para Evidência (Log/Screenshot)</label>
                    <input type="text" name="evidence_attachment" value={formData.evidence_attachment} onChange={handleChange} placeholder="URL do ficheiro (Sharepoint, Drive...)" className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" />
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-gray-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary flex items-center gap-2">
                        <FaServer />
                        Registar Teste
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddBackupModal;
