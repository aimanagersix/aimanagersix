
import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { CalendarEvent, Collaborator, Team } from '../types';
import { FaSave, FaCalendarAlt, FaUserFriends, FaLock, FaBell, FaClock } from 'react-icons/fa';
import { SpinnerIcon } from './common/Icons';

interface AddCalendarEventModalProps {
    onClose: () => void;
    onSave: (event: Omit<CalendarEvent, 'id' | 'created_at'> | CalendarEvent) => Promise<void>;
    eventToEdit?: CalendarEvent | null;
    currentUser: Collaborator | null;
    teams: Team[];
}

const AddCalendarEventModal: React.FC<AddCalendarEventModalProps> = ({ onClose, onSave, eventToEdit, currentUser, teams }) => {
    const [formData, setFormData] = useState<Partial<CalendarEvent>>({
        title: '',
        description: '',
        start_date: new Date().toISOString().slice(0, 16), // format for datetime-local
        end_date: '',
        is_all_day: false,
        color: '#10B981', // Default green for personal
        is_private: true,
        team_id: '',
        reminder_minutes: 0,
        created_by: currentUser?.id
    });
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (eventToEdit) {
            setFormData({
                ...eventToEdit,
                start_date: new Date(eventToEdit.start_date).toISOString().slice(0, 16),
                end_date: eventToEdit.end_date ? new Date(eventToEdit.end_date).toISOString().slice(0, 16) : ''
            });
        }
    }, [eventToEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        
        setFormData(prev => {
            const newData = { 
                ...prev, 
                [name]: type === 'checkbox' ? checked : value 
            };
            
            // Auto-switch color based on privacy/team
            if (name === 'is_private') {
                if (!checked) newData.color = '#F59E0B'; // Orange for team
                else newData.color = '#10B981'; // Green for personal
            }
            
            return newData;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title?.trim()) {
            setErrors({ title: 'O título é obrigatório.' });
            return;
        }
        if (!formData.start_date) {
            setErrors({ start_date: 'A data de início é obrigatória.' });
            return;
        }

        setIsSaving(true);
        try {
            const dataToSave: any = {
                ...formData,
                start_date: new Date(formData.start_date!).toISOString(),
                end_date: formData.end_date ? new Date(formData.end_date).toISOString() : undefined,
                reminder_minutes: formData.reminder_minutes ? parseInt(String(formData.reminder_minutes)) : undefined,
                team_id: formData.is_private ? null : (formData.team_id || null)
            };

            if (eventToEdit) {
                await onSave({ ...eventToEdit, ...dataToSave });
            } else {
                await onSave(dataToSave);
            }
            onClose();
        } catch (e: any) {
            console.error(e);
            alert("Erro ao gravar evento.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal title={eventToEdit ? "Editar Evento" : "Novo Evento / Tarefa"} onClose={onClose} maxWidth="max-w-lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Título</label>
                    <input 
                        type="text" 
                        name="title" 
                        value={formData.title} 
                        onChange={handleChange} 
                        className={`w-full bg-gray-700 border border-gray-600 text-white rounded p-2 ${errors.title ? 'border-red-500' : ''}`}
                        placeholder="Ex: Reunião de Equipa, Backup Manual..."
                        autoFocus
                    />
                    {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
                </div>

                <div className="flex gap-4 items-center">
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-400 mb-1">Início</label>
                        <input 
                            type="datetime-local" 
                            name="start_date" 
                            value={formData.start_date} 
                            onChange={handleChange} 
                            className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-400 mb-1">Fim (Opcional)</label>
                        <input 
                            type="datetime-local" 
                            name="end_date" 
                            value={formData.end_date} 
                            onChange={handleChange} 
                            className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-gray-800/50 p-3 rounded border border-gray-700">
                    <div className="flex-1">
                        <label className="flex items-center cursor-pointer mb-2">
                            <input 
                                type="checkbox" 
                                name="is_all_day" 
                                checked={formData.is_all_day} 
                                onChange={handleChange}
                                className="rounded border-gray-500 bg-gray-700 text-brand-primary mr-2"
                            />
                            <span className="text-sm text-gray-300">Dia Inteiro</span>
                        </label>
                        
                        <div className="flex items-center gap-2">
                             <label className="text-xs text-gray-400">Cor:</label>
                             <input 
                                type="color" 
                                name="color" 
                                value={formData.color} 
                                onChange={handleChange}
                                className="bg-transparent border-none w-6 h-6 p-0 cursor-pointer"
                            />
                        </div>
                    </div>

                    <div className="flex-1 border-l border-gray-600 pl-4">
                         <label className="block text-xs font-medium text-gray-400 mb-1 flex items-center gap-1"><FaBell/> Lembrete</label>
                         <select 
                            name="reminder_minutes" 
                            value={formData.reminder_minutes} 
                            onChange={handleChange} 
                            className="w-full bg-gray-700 border border-gray-600 text-white rounded p-1 text-xs"
                        >
                            <option value="0">Sem aviso</option>
                            <option value="15">15 minutos antes</option>
                            <option value="30">30 minutos antes</option>
                            <option value="60">1 hora antes</option>
                            <option value="1440">1 dia antes</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Visibilidade</label>
                    <div className="flex gap-4">
                        <label className={`flex-1 cursor-pointer border p-3 rounded flex items-center justify-center gap-2 transition-colors ${formData.is_private ? 'bg-green-900/20 border-green-500 text-green-400' : 'bg-gray-800 border-gray-600 text-gray-400'}`}>
                            <input 
                                type="radio" 
                                name="is_private" 
                                checked={formData.is_private === true} 
                                onChange={() => setFormData(prev => ({ ...prev, is_private: true, color: '#10B981', team_id: '' }))}
                                className="hidden"
                            />
                            <FaLock /> Privado (Só eu)
                        </label>
                        <label className={`flex-1 cursor-pointer border p-3 rounded flex items-center justify-center gap-2 transition-colors ${!formData.is_private ? 'bg-orange-900/20 border-orange-500 text-orange-400' : 'bg-gray-800 border-gray-600 text-gray-400'}`}>
                            <input 
                                type="radio" 
                                name="is_private" 
                                checked={formData.is_private === false} 
                                onChange={() => setFormData(prev => ({ ...prev, is_private: false, color: '#F59E0B', team_id: teams[0]?.id || '' }))}
                                className="hidden"
                            />
                            <FaUserFriends /> Equipa
                        </label>
                    </div>
                    
                    {!formData.is_private && (
                        <div className="mt-2 animate-fade-in">
                             <label className="block text-xs font-medium text-gray-400 mb-1">Selecione a Equipa</label>
                             <select 
                                name="team_id" 
                                value={formData.team_id} 
                                onChange={handleChange} 
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm"
                            >
                                <option value="">-- Geral / Pública --</option>
                                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Descrição</label>
                    <textarea 
                        name="description" 
                        value={formData.description} 
                        onChange={handleChange} 
                        rows={3} 
                        className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm"
                        placeholder="Detalhes adicionais..."
                    />
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-gray-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500" disabled={isSaving}>Cancelar</button>
                    <button type="submit" className="px-6 py-2 bg-brand-primary text-white rounded hover:bg-brand-secondary flex items-center gap-2" disabled={isSaving}>
                        {isSaving ? <SpinnerIcon className="h-4 w-4"/> : <FaSave />} {isSaving ? 'A Gravar...' : 'Guardar Evento'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddCalendarEventModal;
