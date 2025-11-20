








import React, { useState, useEffect, useMemo, useRef } from 'react';
import Modal from './common/Modal';
import { Ticket, Entidade, Collaborator, UserRole, CollaboratorStatus, Team, Equipment, EquipmentType, Assignment, TicketCategory, CriticalityLevel, CIARating, TicketCategoryItem, SecurityIncidentType } from '../types';
import { DeleteIcon, FaShieldAlt, FaExclamationTriangle } from './common/Icons';

interface AddTicketModalProps {
    onClose: () => void;
    onSave: (ticket: Omit<Ticket, 'id' | 'requestDate' | 'status' | 'finishDate'> | Ticket) => Promise<any>;
    ticketToEdit?: Ticket | null;
    escolasDepartamentos: Entidade[];
    collaborators: Collaborator[];
    teams: Team[];
    currentUser: Collaborator | null;
    userPermissions: { viewScope: string };
    equipment: Equipment[];
    equipmentTypes: EquipmentType[];
    assignments: Assignment[];
    categories: TicketCategoryItem[];
}

const MAX_FILES = 3;
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const AddTicketModal: React.FC<AddTicketModalProps> = ({ onClose, onSave, ticketToEdit, escolasDepartamentos: entidades, collaborators, teams, currentUser, userPermissions, equipment, equipmentTypes, assignments, categories }) => {
    
    // Determine available categories. Use active dynamic ones, fallback to Enum if empty.
    const activeCategories = useMemo(() => {
         if (categories.length > 0) {
             return categories.filter(c => c.is_active).map(c => c.name);
         }
         return Object.values(TicketCategory);
    }, [categories]);

    // Initial State Logic
    const [formData, setFormData] = useState<Partial<Ticket>>(() => {
        if (ticketToEdit) {
            return {
                title: ticketToEdit.title || '',
                entidadeId: ticketToEdit.entidadeId,
                collaboratorId: ticketToEdit.collaboratorId,
                description: ticketToEdit.description,
                team_id: ticketToEdit.team_id || '',
                equipmentId: ticketToEdit.equipmentId || '',
                category: ticketToEdit.category || activeCategories[0],
                securityIncidentType: ticketToEdit.securityIncidentType,
                impactCriticality: ticketToEdit.impactCriticality,
                impactConfidentiality: ticketToEdit.impactConfidentiality,
                impactIntegrity: ticketToEdit.impactIntegrity,
                impactAvailability: ticketToEdit.impactAvailability,
            };
        }
        
        // Default values for new ticket
        const baseData = {
            title: '',
            description: '',
            team_id: '',
            equipmentId: '',
            category: activeCategories[0] || 'Falha Técnica',
            securityIncidentType: undefined,
            impactCriticality: CriticalityLevel.Low,
            impactConfidentiality: CIARating.Low,
            impactIntegrity: CIARating.Low,
            impactAvailability: CIARating.Low,
        };
        
        // If default category has a default team, set it initially
        const defaultCatObj = categories.find(c => c.name === baseData.category);
        if (defaultCatObj?.default_team_id) {
            baseData.team_id = defaultCatObj.default_team_id;
        }

        const isUtilizador = userPermissions.viewScope === 'own';
        if (isUtilizador && currentUser) {
            return {
                ...baseData,
                entidadeId: currentUser.entidadeId,
                collaboratorId: currentUser.id,
            };
        }
        
        return {
            ...baseData,
            entidadeId: entidades[0]?.id || '',
            collaboratorId: collaborators.find(c => c.entidadeId === entidades[0]?.id)?.id || '',
        };
    });

    const [attachments, setAttachments] = useState<{ name: string; dataUrl: string; size: number }[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);
     
    const isUtilizador = userPermissions.viewScope === 'own';
    const isSecurityIncident = formData.category === TicketCategory.SecurityIncident || formData.category === 'Incidente de Segurança';

    // Load attachments only once when editing
    useEffect(() => {
        if (ticketToEdit) {
            setAttachments(ticketToEdit.attachments?.map(a => ({ ...a, size: 0 })) || []);
        }
    }, [ticketToEdit]);

    const availableCollaborators = useMemo(() => {
        if (isUtilizador && currentUser) {
            return [currentUser];
        }
        return collaborators.filter(c => c.entidadeId === formData.entidadeId && c.status === CollaboratorStatus.Ativo);
    }, [formData.entidadeId, collaborators, isUtilizador, currentUser]);

    const availableEquipment = useMemo(() => {
        const activeAssignments = assignments.filter(a => !a.returnDate);
        const equipmentIds = new Set<string>();

        activeAssignments.forEach(a => {
            if (a.entidadeId === formData.entidadeId) {
                if (formData.collaboratorId && a.collaboratorId === formData.collaboratorId) {
                    equipmentIds.add(a.equipmentId);
                } else if (!a.collaboratorId) {
                    equipmentIds.add(a.equipmentId);
                }
            }
        });

        return equipment.filter(e => equipmentIds.has(e.id));
    }, [formData.entidadeId, formData.collaboratorId, assignments, equipment]);
    
    // Auto-select team based on equipment type
    useEffect(() => {
        if (formData.equipmentId) {
            const selectedEquipment = equipment.find(e => e.id === formData.equipmentId);
            if (selectedEquipment) {
                const type = equipmentTypes.find(t => t.id === selectedEquipment.typeId);
                if (type?.default_team_id) {
                    setFormData(prev => ({ ...prev, team_id: type.default_team_id! }));
                }
            }
        }
    }, [formData.equipmentId, equipment, equipmentTypes]);

    // Auto-select first collaborator when entity changes (only for new tickets by admins)
    useEffect(() => {
        if (!ticketToEdit && !isUtilizador && availableCollaborators.length > 0) {
             // Only update if current collaborator is not valid for the new entity
             const currentIsValid = availableCollaborators.some(c => c.id === formData.collaboratorId);
             if (!currentIsValid) {
                 setFormData(prev => ({...prev, collaboratorId: availableCollaborators[0].id}));
             }
        }
    }, [formData.entidadeId, availableCollaborators, ticketToEdit, isUtilizador, formData.collaboratorId]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        if (name === 'category') {
             // Check if this category has a default team
             const catObj = categories.find(c => c.name === value);
             setFormData(prev => ({
                 ...prev,
                 category: value,
                 team_id: catObj?.default_team_id || prev.team_id // Only overwrite if category has a specific team, else keep user selection
             }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.title?.trim()) newErrors.title = "O assunto é obrigatório.";
        if (!formData.entidadeId) newErrors.entidadeId = "A entidade é obrigatória.";
        if (!formData.collaboratorId) newErrors.collaboratorId = "O colaborador é obrigatório.";
        if (!formData.description?.trim()) newErrors.description = "A descrição do problema é obrigatória.";
        if (isSecurityIncident && !formData.securityIncidentType) newErrors.securityIncidentType = "Por favor, selecione o tipo de incidente de segurança.";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
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
                alert(`O ficheiro "${file.name}" é demasiado grande. O limite é de 2MB.`);
                continue;
            }

            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                const dataUrl = loadEvent.target?.result as string;
                setAttachments(prev => [...prev, { name: file.name, dataUrl, size: file.size }]);
            };
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    };
    
    const handleRemoveAttachment = (indexToRemove: number) => {
        setAttachments(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        
        const dataToSubmit: any = {
            ...formData,
            team_id: formData.team_id || undefined,
            equipmentId: formData.equipmentId || undefined,
            attachments: attachments.map(({ name, dataUrl }) => ({ name, dataUrl })),
        };
        
        // Clean up Security fields if not security incident
        if (formData.category !== TicketCategory.SecurityIncident && formData.category !== 'Incidente de Segurança') {
            delete dataToSubmit.securityIncidentType;
            delete dataToSubmit.impactCriticality;
            delete dataToSubmit.impactConfidentiality;
            delete dataToSubmit.impactIntegrity;
            delete dataToSubmit.impactAvailability;
        }

        if (ticketToEdit) {
            onSave({ ...ticketToEdit, ...dataToSubmit });
        } else {
            onSave(dataToSubmit as Omit<Ticket, 'id' | 'requestDate' | 'status' | 'finishDate'>);
        }
        onClose();
    };

    const modalTitle = ticketToEdit ? "Editar Ticket" : "Adicionar Novo Ticket";

    return (
        <Modal title={modalTitle} onClose={onClose} maxWidth="max-w-3xl">
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="entidadeId" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Entidade</label>
                        <select 
                            name="entidadeId" 
                            id="entidadeId" 
                            value={formData.entidadeId} 
                            onChange={handleChange} 
                            className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.entidadeId ? 'border-red-500' : 'border-gray-600'} disabled:bg-gray-800 disabled:cursor-not-allowed`}
                            disabled={isUtilizador}
                        >
                            <option value="" disabled>Selecione uma entidade</option>
                            {entidades.map(entidade => (
                                <option key={entidade.id} value={entidade.id}>{entidade.name}</option>
                            ))}
                        </select>
                        {errors.entidadeId && <p className="text-red-400 text-xs italic mt-1">{errors.entidadeId}</p>}
                    </div>
                    <div>
                        <label htmlFor="collaboratorId" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Colaborador</label>
                        <select 
                            name="collaboratorId" 
                            id="collaboratorId" 
                            value={formData.collaboratorId} 
                            onChange={handleChange} 
                            className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.collaboratorId ? 'border-red-500' : 'border-gray-600'} disabled:bg-gray-800 disabled:cursor-not-allowed`}
                             disabled={isUtilizador || availableCollaborators.length === 0}
                        >
                            <option value="" disabled>Selecione um colaborador</option>
                            {availableCollaborators.map(col => (
                                <option key={col.id} value={col.id}>{col.fullName}</option>
                            ))}
                        </select>
                         {errors.collaboratorId && <p className="text-red-400 text-xs italic mt-1">{errors.collaboratorId}</p>}
                    </div>
                </div>
                
                <div>
                    <label htmlFor="category" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Categoria do Incidente / Pedido</label>
                    <select
                        name="category"
                        id="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"
                    >
                        {activeCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                {isSecurityIncident && (
                    <div className="border border-red-500/50 bg-red-900/20 rounded-lg p-4 space-y-4">
                         <div className="flex items-center gap-2 text-red-400 font-bold border-b border-red-500/30 pb-2 mb-2">
                            <FaShieldAlt />
                            <h3>Classificação de Incidente de Segurança (NIS2)</h3>
                        </div>
                        <p className="text-xs text-red-200 mb-2">
                            <FaExclamationTriangle className="inline mr-1"/>
                            Especifique o tipo de ataque para ativar os protocolos de resposta corretos (ex: Ransomware tem SLA de 24h).
                        </p>
                        
                        <div>
                            <label htmlFor="securityIncidentType" className="block text-sm font-bold text-white mb-1">Tipo de Ataque / Incidente</label>
                            <select 
                                name="securityIncidentType" 
                                id="securityIncidentType" 
                                value={formData.securityIncidentType} 
                                onChange={handleChange} 
                                className={`w-full bg-gray-800 border text-white rounded-md p-2 ${errors.securityIncidentType ? 'border-red-500' : 'border-red-700'}`}
                            >
                                <option value="">-- Selecione o Tipo de Incidente --</option>
                                {Object.values(SecurityIncidentType).map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                            {errors.securityIncidentType && <p className="text-red-400 text-xs italic mt-1">{errors.securityIncidentType}</p>}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-red-500/30">
                             <div>
                                <label className="block text-xs font-bold text-red-300 mb-1">Criticidade do Impacto</label>
                                <select name="impactCriticality" value={formData.impactCriticality} onChange={handleChange} className="w-full bg-gray-800 border border-red-700 text-white rounded p-1.5 text-sm">
                                    {Object.values(CriticalityLevel).map(val => <option key={val} value={val}>{val}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-300 mb-1">Confidencialidade Afetada?</label>
                                <select name="impactConfidentiality" value={formData.impactConfidentiality} onChange={handleChange} className="w-full bg-gray-800 border border-gray-600 text-white rounded p-1.5 text-sm">
                                    {Object.values(CIARating).map(val => <option key={val} value={val}>{val}</option>)}
                                </select>
                            </div>
                             <div>
                                <label className="block text-xs font-medium text-gray-300 mb-1">Integridade Afetada?</label>
                                <select name="impactIntegrity" value={formData.impactIntegrity} onChange={handleChange} className="w-full bg-gray-800 border border-gray-600 text-white rounded p-1.5 text-sm">
                                    {Object.values(CIARating).map(val => <option key={val} value={val}>{val}</option>)}
                                </select>
                            </div>
                             <div>
                                <label className="block text-xs font-medium text-gray-300 mb-1">Disponibilidade Afetada?</label>
                                <select name="impactAvailability" value={formData.impactAvailability} onChange={handleChange} className="w-full bg-gray-800 border border-gray-600 text-white rounded p-1.5 text-sm">
                                    {Object.values(CIARating).map(val => <option key={val} value={val}>{val}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Assunto</label>
                    <input 
                        type="text" 
                        name="title" 
                        id="title" 
                        value={formData.title} 
                        onChange={handleChange} 
                        placeholder="Resumo curto do problema (ex: Impressora avariada)"
                        className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.title ? 'border-red-500' : 'border-gray-600'}`} 
                    />
                    {errors.title && <p className="text-red-400 text-xs italic mt-1">{errors.title}</p>}
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Descrição Detalhada</label>
                    <textarea 
                        name="description" 
                        id="description" 
                        value={formData.description} 
                        onChange={handleChange} 
                        rows={4} 
                        placeholder="Descreva o problema em detalhe..."
                        className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.description ? 'border-red-500' : 'border-gray-600'}`} 
                    ></textarea>
                    {errors.description && <p className="text-red-400 text-xs italic mt-1">{errors.description}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="equipmentId" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Equipamento Associado (Opcional)</label>
                        <select
                            name="equipmentId"
                            id="equipmentId"
                            value={formData.equipmentId}
                            onChange={handleChange}
                            className="w-full bg-gray-700 border text-white rounded-md p-2 border-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed"
                            disabled={availableEquipment.length === 0}
                        >
                            <option value="">Nenhum</option>
                            {availableEquipment.map(eq => (
                                <option key={eq.id} value={eq.id}>{eq.description} (S/N: {eq.serialNumber})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="team_id" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Atribuir à Equipa (Opcional)</label>
                        <select
                            name="team_id"
                            id="team_id"
                            value={formData.team_id}
                            onChange={handleChange}
                            className="w-full bg-gray-700 border text-white rounded-md p-2 border-gray-600"
                        >
                            <option value="">Nenhuma</option>
                            {teams.map(team => (
                                <option key={team.id} value={team.id}>{team.name}</option>
                            ))}
                        </select>
                        {formData.team_id && (
                            <p className="text-xs text-gray-400 mt-1">
                                {categories.find(c => c.name === formData.category)?.default_team_id === formData.team_id 
                                ? '(Definida automaticamente pela categoria)' 
                                : ''}
                            </p>
                        )}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-on-surface-dark-secondary mb-2">Anexos</label>
                    <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700">
                        {attachments.length > 0 && (
                            <ul className="space-y-2 mb-3">
                                {attachments.map((file, index) => (
                                    <li key={index} className="flex justify-between items-center text-sm p-2 bg-surface-dark rounded-md">
                                        <span className="truncate text-on-surface-dark-secondary">
                                            {file.name}
                                            {file.size > 0 && <span className="text-xs ml-2 text-gray-400">({formatFileSize(file.size)})</span>}
                                        </span>
                                        <button type="button" onClick={() => handleRemoveAttachment(index)} className="text-red-400 hover:text-red-300 ml-2">
                                            <DeleteIcon className="h-4 w-4" />
                                        </button>
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
                            accept="image/*,application/pdf"
                        />
                         <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={attachments.length >= MAX_FILES}
                            className="w-full px-4 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {`Anexar Ficheiros (${attachments.length}/${MAX_FILES})`}
                        </button>
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

export default AddTicketModal;