
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Modal from './common/Modal';
import { BackupExecution, BackupType, Collaborator, Equipment, EquipmentType, Ticket, TicketStatus } from '../types';
import { FaServer, FaFileContract, FaDownload, FaTicketAlt, FaCalendarPlus, FaRobot } from 'react-icons/fa';
import { DeleteIcon, SpinnerIcon } from './common/Icons';
import { analyzeBackupScreenshot } from '../services/geminiService';

interface AddBackupModalProps {
    onClose: () => void;
    onSave: (backup: Omit<BackupExecution, 'id'> | BackupExecution) => void;
    backupToEdit?: BackupExecution | null;
    currentUser: Collaborator | null;
    equipmentList: Equipment[];
    equipmentTypes: EquipmentType[];
    onCreateTicket?: (ticket: Partial<Ticket>) => void;
}

const MAX_FILES = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const AddBackupModal: React.FC<AddBackupModalProps> = ({ onClose, onSave, backupToEdit, currentUser, equipmentList, equipmentTypes, onCreateTicket }) => {
    const [formData, setFormData] = useState<Partial<BackupExecution>>({
        system_name: '',
        equipment_id: '',
        backup_date: '',
        test_date: new Date().toISOString().split('T')[0],
        status: 'Sucesso',
        type: BackupType.Full,
        restore_time_minutes: 0,
        tester_id: currentUser?.id || '',
        notes: '',
        attachments: []
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [attachments, setAttachments] = useState<{ name: string; dataUrl: string; size: number }[]>([]);
    
    // Ticket creation state
    const [createTicket, setCreateTicket] = useState(false);
    const [ticketDate, setTicketDate] = useState('');
    
    // AI Analysis State
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Filter eligible equipment based on type configuration
    const eligibleEquipment = useMemo(() => {
        const allowedTypeIds = new Set(
            equipmentTypes.filter(t => t.requiresBackupTest).map(t => t.id)
        );
        return equipmentList.filter(e => allowedTypeIds.has(e.typeId));
    }, [equipmentList, equipmentTypes]);

    const equipmentMap = useMemo(() => new Map(equipmentList.map(e => [e.id, e])), [equipmentList]);

    useEffect(() => {
        if (backupToEdit) {
            setFormData({ ...backupToEdit });
            if (backupToEdit.attachments) {
                setAttachments(backupToEdit.attachments.map(a => ({ ...a, size: 0 })));
            }
        }
    }, [backupToEdit]);

    // Update system name when equipment changes
    useEffect(() => {
        if (formData.equipment_id && !backupToEdit) {
            const eq = equipmentMap.get(formData.equipment_id);
            if (eq) {
                setFormData(prev => ({ ...prev, system_name: eq.description }));
            }
        }
    }, [formData.equipment_id, equipmentMap, backupToEdit]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.system_name?.trim()) newErrors.system_name = "O nome do sistema é obrigatório.";
        if (!formData.test_date) newErrors.test_date = "A data do teste é obrigatória.";
        if (!formData.backup_date) newErrors.backup_date = "A data do backup original é obrigatória.";
        
        if (createTicket && !ticketDate) {
            newErrors.ticketDate = "Selecione a data para o ticket.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'restore_time_minutes' ? parseInt(value) : value }));
    };

    const handleAiAnalysis = async (file: File, dataUrl: string) => {
        if (!file.type.startsWith('image/')) return;
        
        if (!confirm("Pretende que a IA analise este print screen para preencher os dados automaticamente?")) return;

        setIsAnalyzing(true);
        try {
            const base64 = dataUrl.split(',')[1];
            const result = await analyzeBackupScreenshot(base64, file.type);
            
            setFormData(prev => ({
                ...prev,
                status: result.status,
                backup_date: result.date || prev.backup_date, // Use extracted date or keep existing
                system_name: result.systemName || prev.system_name
            }));
            
            alert(`Análise Completa!\nEstado: ${result.status}\nData Extraída: ${result.date}`);
        } catch (error) {
            console.error(error);
            alert("Não foi possível analisar a imagem.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        if (attachments.length + files.length > MAX_FILES) {
            alert(`Não pode anexar mais de ${MAX_FILES} ficheiros.`);
            return;
        }
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.size > MAX_FILE_SIZE) {
                alert(`O ficheiro "${file.name}" é demasiado grande. O limite é de 5MB.`);
                continue;
            }

            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                const dataUrl = loadEvent.target?.result as string;
                setAttachments(prev => [...prev, { name: file.name, dataUrl, size: file.size }]);
                // Trigger AI analysis for images
                if (file.type.startsWith('image/') && !backupToEdit) {
                    handleAiAnalysis(file, dataUrl);
                }
            };
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    };
    
    const handleRemoveAttachment = (indexToRemove: number) => {
        setAttachments(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleSetTicketDate = (monthsToAdd: number) => {
        const date = new Date();
        date.setMonth(date.getMonth() + monthsToAdd);
        setTicketDate(date.toISOString().split('T')[0]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        
        const dataToSave: any = { 
            ...formData,
            attachments: attachments.map(({ name, dataUrl }) => ({ name, dataUrl }))
        };
        // Clean up optional fields to avoid empty strings in UUID/Integer columns
        if (!dataToSave.restore_time_minutes) delete dataToSave.restore_time_minutes;
        if (!dataToSave.equipment_id) delete dataToSave.equipment_id;
        if (!dataToSave.tester_id) delete dataToSave.tester_id;

        if (backupToEdit) {
            onSave({ ...backupToEdit, ...dataToSave });
        } else {
            onSave(dataToSave);
        }

        // Handle Automatic Ticket Creation
        if (createTicket && onCreateTicket && !backupToEdit) {
            const eq = formData.equipment_id ? equipmentMap.get(formData.equipment_id) : null;
            const title = eq 
                ? `Teste de Restauro: ${eq.description}` 
                : `Teste de Restauro: ${formData.system_name}`;
            
            const ticketPayload: Partial<Ticket> = {
                title: title,
                description: `Agendamento automático de teste de restauro (backup verify) para o sistema: ${formData.system_name}.\n\nBaseado no teste anterior realizado em ${formData.test_date}.`,
                requestDate: ticketDate, // This will be the scheduled date
                status: TicketStatus.Requested,
                equipmentId: formData.equipment_id || undefined,
                category: 'Manutenção' // Fallback category
            };
            onCreateTicket(ticketPayload);
        }

        onClose();
    };
    
    const modalTitle = backupToEdit ? "Editar Registo de Teste" : "Registar Teste de Restauro";

    return (
        <Modal title={modalTitle} onClose={onClose} maxWidth="max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Equipment Selection */}
                <div className="bg-gray-900/30 p-3 rounded border border-gray-700">
                    <label htmlFor="equipment_id" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Sistema / Equipamento (Apenas tipos elegíveis)</label>
                    <select 
                        name="equipment_id" 
                        id="equipment_id" 
                        value={formData.equipment_id} 
                        onChange={handleChange} 
                        className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm mb-2"
                    >
                        <option value="">-- Selecione Equipamento (Opcional) --</option>
                        {eligibleEquipment.length > 0 ? eligibleEquipment.map(eq => (
                            <option key={eq.id} value={eq.id}>{eq.description} (S/N: {eq.serialNumber})</option>
                        )) : (
                            <option value="" disabled>Nenhum equipamento marcado para backup</option>
                        )}
                    </select>
                    
                    <label htmlFor="system_name" className="block text-xs font-medium text-on-surface-dark-secondary mb-1">Nome do Sistema (Manual se não selecionado)</label>
                    <input 
                        type="text" 
                        name="system_name" 
                        id="system_name" 
                        value={formData.system_name} 
                        onChange={handleChange} 
                        placeholder="Ex: Servidor ERP, Base de Dados SQL..."
                        className={`w-full bg-gray-700 border text-white rounded-md p-2 text-sm ${errors.system_name ? 'border-red-500' : 'border-gray-600'}`} 
                    />
                    {errors.system_name && <p className="text-red-400 text-xs italic mt-1">{errors.system_name}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="type" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Tipo de Backup</label>
                        <select name="type" value={formData.type} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm">
                            {Object.values(BackupType).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <div className="flex justify-between items-center">
                            <label htmlFor="status" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Resultado do Teste</label>
                            {isAnalyzing && <span className="text-xs text-purple-400 flex items-center gap-1"><SpinnerIcon /> IA a analisar...</span>}
                        </div>
                        <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm">
                            <option value="Sucesso">Sucesso</option>
                            <option value="Falha">Falha</option>
                            <option value="Parcial">Parcial</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="test_date" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Data do Teste</label>
                        <input type="date" name="test_date" value={formData.test_date} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 text-sm ${errors.test_date ? 'border-red-500' : 'border-gray-600'}`} />
                        {errors.test_date && <p className="text-red-400 text-xs italic mt-1">{errors.test_date}</p>}
                    </div>
                    <div>
                        <label htmlFor="backup_date" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Data do Backup (Snapshot)</label>
                        <input type="date" name="backup_date" value={formData.backup_date} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 text-sm ${errors.backup_date ? 'border-red-500' : 'border-gray-600'}`} />
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
                        className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm" 
                        placeholder="Opcional (para validar RTO)"
                    />
                </div>

                <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Notas / Observações</label>
                    <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm"></textarea>
                </div>

                {/* Evidence / Attachments Section */}
                <div>
                    <label className="block text-sm font-medium text-on-surface-dark-secondary mb-2">Evidências (Print Screens, Logs)</label>
                    
                    <div className="mb-2 p-2 bg-indigo-900/30 rounded border border-indigo-500/30 text-xs text-indigo-200 flex items-center gap-2">
                        <FaRobot />
                        <span>Dica: Anexe um print screen do sucesso do backup para preenchimento automático dos campos pela IA.</span>
                    </div>

                    <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700">
                        {attachments.length > 0 && (
                            <ul className="space-y-2 mb-3">
                                {attachments.map((file, index) => (
                                    <li key={index} className="flex justify-between items-center text-sm p-2 bg-surface-dark rounded-md">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <FaFileContract className="text-gray-400 flex-shrink-0" />
                                            <span className="truncate text-on-surface-dark-secondary">
                                                {file.name}
                                                {file.size > 0 && <span className="text-xs ml-2 text-gray-400">({formatFileSize(file.size)})</span>}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button type="button" onClick={() => handleRemoveAttachment(index)} className="text-red-400 hover:text-red-300 ml-2 p-1" title="Remover">
                                                <DeleteIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                        <input
                            type="file"
                            multiple
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            className="hidden"
                            accept="image/*,application/pdf,text/plain"
                        />
                         <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={attachments.length >= MAX_FILES}
                            className="w-full px-4 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dashed border border-gray-500"
                        >
                            {`+ Anexar e Validar Evidências (${attachments.length}/${MAX_FILES})`}
                        </button>
                    </div>
                </div>

                {/* Automated Ticket Creation Section */}
                {!backupToEdit && onCreateTicket && (
                    <div className="border-t border-gray-700 pt-4 mt-2">
                        <div className="flex items-center mb-3">
                            <input
                                type="checkbox"
                                id="createTicket"
                                checked={createTicket}
                                onChange={(e) => setCreateTicket(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 bg-gray-700 text-brand-primary focus:ring-brand-secondary"
                            />
                            <label htmlFor="createTicket" className="ml-2 block text-sm font-bold text-white flex items-center gap-2">
                                <FaTicketAlt className="text-brand-secondary" />
                                Criar Ticket Automático para Próximo Teste?
                            </label>
                        </div>

                        {createTicket && (
                            <div className="pl-6 animate-fade-in space-y-2">
                                <label className="block text-xs font-medium text-on-surface-dark-secondary">Data para o Ticket (Agendamento)</label>
                                <div className="flex gap-2 items-center">
                                    <input 
                                        type="date" 
                                        value={ticketDate} 
                                        onChange={(e) => setTicketDate(e.target.value)}
                                        className={`bg-gray-700 border text-white rounded-md p-2 text-sm ${errors.ticketDate ? 'border-red-500' : 'border-gray-600'}`} 
                                    />
                                    <button type="button" onClick={() => handleSetTicketDate(3)} className="px-2 py-1 text-xs bg-gray-600 rounded hover:bg-gray-500 flex items-center gap-1"><FaCalendarPlus/> +3 Meses</button>
                                    <button type="button" onClick={() => handleSetTicketDate(6)} className="px-2 py-1 text-xs bg-gray-600 rounded hover:bg-gray-500 flex items-center gap-1"><FaCalendarPlus/> +6 Meses</button>
                                    <button type="button" onClick={() => handleSetTicketDate(12)} className="px-2 py-1 text-xs bg-gray-600 rounded hover:bg-gray-500 flex items-center gap-1"><FaCalendarPlus/> +1 Ano</button>
                                </div>
                                {errors.ticketDate && <p className="text-red-400 text-xs italic">{errors.ticketDate}</p>}
                            </div>
                        )}
                    </div>
                )}

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
