
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Modal from './common/Modal';
import { Ticket, Entidade, Collaborator, UserRole, CollaboratorStatus, Team, Equipment, EquipmentType, Assignment, TicketCategory, CriticalityLevel, CIARating, TicketCategoryItem, SecurityIncidentType, SecurityIncidentTypeItem, TicketStatus, TicketActivity, Supplier, Instituicao } from '../types';
import { FaTrash as DeleteIcon, FaShieldAlt, FaExclamationTriangle, FaMagic, FaSpinner, FaCheck, FaLandmark, FaDownload, SpinnerIcon } from './common/Icons';
import { analyzeTicketRequest, findSimilarPastTickets, isAiConfigured } from '../services/geminiService';
import { FaLightbulb, FaLock, FaUserTie, FaTruck, FaUsers, FaBuilding, FaTools } from 'react-icons/fa';
import RegulatoryNotificationModal from './RegulatoryNotificationModal';
import * as dataService from '../services/dataService';
import { getSupabase } from '../services/supabaseClient';

interface AddTicketModalProps {
    onClose: () => void;
    onSave: (ticket: Omit<Ticket, 'id' | 'requestDate' | 'status' | 'finishDate'> | Ticket) => Promise<any>;
    ticketToEdit?: Ticket | null;
    escolasDepartamentos: Entidade[];
    instituicoes: Instituicao[];
    collaborators: Collaborator[];
    suppliers?: Supplier[];
    teams: Team[];
    currentUser: Collaborator | null;
    userPermissions: { viewScope: string };
    equipment: Equipment[];
    equipmentTypes: EquipmentType[];
    assignments: Assignment[];
    categories: TicketCategoryItem[];
    securityIncidentTypes?: SecurityIncidentTypeItem[]; 
    pastTickets?: Ticket[];
    initialData?: Partial<Ticket> | null;
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

export const AddTicketModal: React.FC<AddTicketModalProps> = ({ onClose, onSave, ticketToEdit, escolasDepartamentos: entidades, instituicoes, collaborators, suppliers = [], teams, currentUser, userPermissions, equipment, equipmentTypes, assignments, categories, securityIncidentTypes = [], pastTickets = [], initialData }) => {
    
    const activeCategories = useMemo(() => {
         if (categories.length > 0) {
             return categories.filter(c => c.is_active).map(c => c.name);
         }
         return Object.values(TicketCategory);
    }, [categories]);

    const activeSecurityIncidentTypes = useMemo(() => {
        if (securityIncidentTypes.length > 0) {
            return securityIncidentTypes.filter(t => t.is_active).map(t => t.name);
        }
        return Object.values(SecurityIncidentType);
    }, [securityIncidentTypes]);

    const [formData, setFormData] = useState<Partial<Ticket>>(() => {
        if (ticketToEdit) {
            return {
                title: ticketToEdit.title || '',
                entidadeId: ticketToEdit.entidadeId,
                instituicaoId: ticketToEdit.instituicaoId,
                collaboratorId: ticketToEdit.collaboratorId,
                requester_supplier_id: ticketToEdit.requester_supplier_id,
                supplier_id: ticketToEdit.supplier_id, // Linked external service provider
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
        
        const baseData = {
            title: initialData?.title || '',
            description: initialData?.description || '',
            team_id: '',
            equipmentId: '',
            category: initialData?.category || activeCategories[0] || 'Falha Técnica',
            securityIncidentType: initialData?.securityIncidentType,
            impactCriticality: (initialData?.impactCriticality as CriticalityLevel) || CriticalityLevel.Low,
            impactConfidentiality: (initialData?.impactConfidentiality as CIARating) || CIARating.Low,
            impactIntegrity: (initialData?.impactIntegrity as CIARating) || CIARating.Low,
            impactAvailability: (initialData?.impactAvailability as CIARating) || CIARating.Low,
            supplier_id: '',
        };
        
        const defaultCatObj = categories.find(c => c.name === baseData.category);
        if (defaultCatObj?.default_team_id) {
            baseData.team_id = defaultCatObj.default_team_id;
        }

        // Auto-fill for normal users
        const isUtilizador = userPermissions.viewScope === 'own' || currentUser?.role === 'Utilizador';
        if (isUtilizador && currentUser) {
            return {
                ...baseData,
                entidadeId: currentUser.entidadeId,
                instituicaoId: currentUser.instituicaoId,
                collaboratorId: currentUser.id,
            };
        }
        
        return {
            ...baseData,
            entidadeId: initialData?.entidadeId || entidades[0]?.id || '',
            instituicaoId: initialData?.instituicaoId || '',
            collaboratorId: initialData?.collaboratorId || collaborators.find(c => c.entidadeId === (initialData?.entidadeId || entidades[0]?.id))?.id || '',
        };
    });

    const [attachments, setAttachments] = useState<{ name: string; dataUrl: string; size: number }[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Requester Type
    const [requesterType, setRequesterType] = useState<'internal' | 'external'>('internal');

    // AI Analysis State
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState<{category: string, priority: string, solution: string} | null>(null);
    const [similarTicket, setSimilarTicket] = useState<{id: string, resolution: string, reason: string} | null>(null);
    const [autoSeverityMessage, setAutoSeverityMessage] = useState<string | null>(null);
    const [showRegulatoryModal, setShowRegulatoryModal] = useState(false);

    // Saving State
    const [isSaving, setIsSaving] = useState(false);

    // Realtime Presence State
    const [activeViewers, setActiveViewers] = useState<any[]>([]);
    
    const aiConfigured = isAiConfigured();
     
    // Determine if user is restricted
    const isUtilizador = userPermissions.viewScope === 'own' || currentUser?.role === 'Utilizador';
    
    // Enhanced Security Detection: Check property on object first, fall back to string match
    const isSecurityIncident = useMemo(() => {
        const selectedCatObj = categories.find(c => c.name === formData.category);
        if (selectedCatObj && selectedCatObj.is_security !== undefined) {
             return selectedCatObj.is_security;
        }

        // Fallback for legacy or unconfigured
        const cat = (formData.category || '').toLowerCase();
        return cat.includes('segurança') || 
               cat.includes('security') || 
               cat.includes('incidente') || // Broad catch for "Incidente de..."
               formData.category === TicketCategory.SecurityIncident;
    }, [formData.category, categories]);

    useEffect(() => {
        if (ticketToEdit) {
            setAttachments(ticketToEdit.attachments?.map(a => ({ ...a, size: 0 })) || []);
            if (ticketToEdit.requester_supplier_id) {
                setRequesterType('external');
            }
        }
    }, [ticketToEdit]);
    
    const availableCollaborators = useMemo(() => {
        if (isUtilizador && currentUser) {
            return [currentUser];
        }
        // Filter by Entity OR Institution
        if (formData.entidadeId) {
            return collaborators.filter(c => c.entidadeId === formData.entidadeId && c.status === CollaboratorStatus.Ativo);
        } else if (formData.instituicaoId) {
             // If only institution selected, show all collabs in that institution
             return collaborators.filter(c => c.instituicaoId === formData.instituicaoId && c.status === CollaboratorStatus.Ativo);
        }
        return [];
    }, [formData.entidadeId, formData.instituicaoId, collaborators, isUtilizador, currentUser]);

    const availableEquipment = useMemo(() => {
        const activeAssignments = assignments.filter(a => !a.returnDate);
        const equipmentIds = new Set<string>();

        activeAssignments.forEach(a => {
            // Equipment assigned to the collaborator directly
            if (formData.collaboratorId && a.collaboratorId === formData.collaboratorId) {
                equipmentIds.add(a.equipmentId);
            }
            // Equipment assigned to the location (Entity)
            if (formData.entidadeId && a.entidadeId === formData.entidadeId && !a.collaboratorId) {
                equipmentIds.add(a.equipmentId);
            }
        });

        return equipment.filter(e => equipmentIds.has(e.id));
    }, [formData.entidadeId, formData.collaboratorId, assignments, equipment]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        if (name === 'category') {
             const catObj = categories.find(c => c.name === value);
             setFormData(prev => ({
                 ...prev,
                 category: value,
                 team_id: catObj?.default_team_id || prev.team_id 
             }));
        } else if (name === 'entidadeId') {
             // When entity changes, auto-set institution
             const ent = entidades.find(e => e.id === value);
             setFormData(prev => ({ ...prev, entidadeId: value, instituicaoId: ent?.instituicaoId || prev.instituicaoId }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.title?.trim()) newErrors.title = "O assunto é obrigatório.";
        
        // Validation: Must have EITHER EntidadeId OR InstituicaoId if internal
        if (requesterType === 'internal') {
             if (!formData.entidadeId && !formData.instituicaoId) {
                 newErrors.entidadeId = "Selecione a Entidade ou Instituição.";
             }
             if (!formData.collaboratorId) {
                newErrors.collaboratorId = "O colaborador é obrigatório.";
            }
        }
        
        if (requesterType === 'external' && !formData.requester_supplier_id) {
            newErrors.requester_supplier_id = "O fornecedor solicitante é obrigatório.";
        }

        if (!formData.description?.trim()) newErrors.description = "A descrição do problema é obrigatória.";
        
        // Validation for Security Incidents
        if (isSecurityIncident && !formData.securityIncidentType) {
            newErrors.securityIncidentType = "Por favor, selecione o tipo de incidente de segurança.";
        }
        
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
    
    const handleAiAnalyze = async () => {
         if (!aiConfigured) return;
        if (!formData.description || formData.description.length < 10) {
            alert("Por favor, descreva o problema com mais detalhe antes de analisar.");
            return;
        }
        setIsAnalyzing(true);
        setAiSuggestion(null);
        setSimilarTicket(null);

        try {
            const result = await analyzeTicketRequest(formData.description);
            
            let mappedPriority: CriticalityLevel = CriticalityLevel.Low;
            if (result.suggestedPriority === 'Crítica') mappedPriority = CriticalityLevel.Critical;
            else if (result.suggestedPriority === 'Alta') mappedPriority = CriticalityLevel.High;
            else if (result.suggestedPriority === 'Média') mappedPriority = CriticalityLevel.Medium;

            let bestCategory = activeCategories.find(c => c.toLowerCase() === result.suggestedCategory.toLowerCase()) || result.suggestedCategory;
            
            // Check if we have a real category that is marked as security
            if (result.isSecurityIncident) {
                const securityCat = categories.find(c => c.is_security);
                if (securityCat) {
                    bestCategory = securityCat.name;
                } else {
                    // Fallback name check
                    const fallbackCat = activeCategories.find(c => c.toLowerCase().includes('segurança')) || 'Incidente de Segurança';
                    bestCategory = fallbackCat;
                }
            }

            setAiSuggestion({
                category: bestCategory,
                priority: mappedPriority,
                solution: result.suggestedSolution
            });

            const resolvedTickets = pastTickets
                .filter(t => t.status === TicketStatus.Finished && t.resolution_summary)
                .map(t => ({
                    id: t.id,
                    description: t.description,
                    resolution: t.resolution_summary!
                }));

            if (resolvedTickets.length > 0) {
                const similar = await findSimilarPastTickets(formData.description, resolvedTickets);
                if (similar.found && similar.ticketId) {
                    setSimilarTicket({
                        id: similar.ticketId,
                        resolution: similar.resolution || '',
                        reason: similar.similarityReason || ''
                    });
                }
            }

        } catch (error) {
            console.error("AI Analysis failed", error);
            alert("Não foi possível analisar o ticket no momento.");
        } finally {
            setIsAnalyzing(false);
        }
    };
    
    const applyAiSuggestions = () => {
        if (!aiSuggestion) return;
        setFormData(prev => ({
            ...prev,
            category: aiSuggestion.category,
            impactCriticality: aiSuggestion.priority as CriticalityLevel,
            description: prev.description + `\n\n[Sugestão IA: ${aiSuggestion.solution}]`
        }));
        setAiSuggestion(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        
        setIsSaving(true);

        try {
            const dataToSave: any = {
                ...formData,
                team_id: formData.team_id || undefined,
                equipmentId: formData.equipmentId || undefined,
                supplier_id: formData.supplier_id || undefined,
                attachments: attachments.map(({ name, dataUrl }) => ({ name, dataUrl })),
            };
            
            if (requesterType === 'external') {
                dataToSave.collaboratorId = undefined;
                dataToSave.entidadeId = undefined;
                dataToSave.instituicaoId = undefined;
            } else {
                dataToSave.requester_supplier_id = undefined;
            }
            
            // Clean empty strings for UUID fields
            if (!dataToSave.entidadeId) dataToSave.entidadeId = undefined;
            if (!dataToSave.instituicaoId) dataToSave.instituicaoId = undefined;

            if (!isSecurityIncident) {
                delete dataToSave.securityIncidentType;
                delete dataToSave.impactCriticality;
                delete dataToSave.impactConfidentiality;
                delete dataToSave.impactIntegrity;
                delete dataToSave.impactAvailability;
            }

            if (ticketToEdit) {
                await onSave({ ...ticketToEdit, ...dataToSave });
            } else {
                await onSave(dataToSave as Omit<Ticket, 'id' | 'requestDate' | 'status' | 'finishDate'>);
            }
            onClose();
        } catch (error: any) {
             console.error("Error saving ticket:", error);
             alert(`Erro ao gravar ticket: ${error.message || "Verifique os campos."}`);
        } finally {
            setIsSaving(false);
        }
    };

    const modalTitle = ticketToEdit ? "Editar Ticket" : "Adicionar Novo Ticket";
    const assignedCollabName = collaborators.find(c => c.id === formData.collaboratorId)?.fullName;
    const assignedEntName = entidades.find(e => e.id === formData.entidadeId)?.name;
    const assignedInstName = instituicoes.find(i => i.id === formData.instituicaoId)?.name;

    return (
        <>
        <Modal title={modalTitle} onClose={onClose} maxWidth="max-w-3xl">
             <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Requester Toggle */}
                {!isUtilizador && (
                    <div className="flex justify-center pb-2 border-b border-gray-700 mb-4">
                        <div className="flex bg-gray-700 p-1 rounded-lg">
                            <button type="button" onClick={() => setRequesterType('internal')} className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${requesterType === 'internal' ? 'bg-brand-primary text-white shadow' : 'text-gray-400 hover:text-white'}`}><FaUserTie /> Interno</button>
                            <button type="button" onClick={() => setRequesterType('external')} className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${requesterType === 'external' ? 'bg-brand-primary text-white shadow' : 'text-gray-400 hover:text-white'}`}><FaTruck /> Fornecedor</button>
                        </div>
                    </div>
                )}
                
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {requesterType === 'internal' ? (
                        <>
                            {isUtilizador ? (
                                // Read-Only View for Normal Users
                                <>
                                    <div className="col-span-2 bg-gray-800/50 p-3 rounded border border-gray-600 flex justify-between items-center">
                                        <div>
                                            <p className="text-xs text-gray-400 uppercase">Solicitante (Eu)</p>
                                            <p className="text-white font-bold">{currentUser?.fullName}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-400 uppercase">Departamento</p>
                                            <p className="text-white font-bold">{assignedEntName || assignedInstName || 'Geral'}</p>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                // Admin View - Full Selection
                                <>
                                    <div>
                                        <label htmlFor="instituicaoId" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Instituição / Entidade</label>
                                        <div className="flex flex-col gap-2">
                                            <select name="instituicaoId" value={formData.instituicaoId} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm">
                                                <option value="">Selecione Instituição</option>
                                                {instituicoes.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                                            </select>
                                            {formData.instituicaoId && (
                                                <select name="entidadeId" value={formData.entidadeId} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm">
                                                    <option value="">-- Geral / Sem Entidade --</option>
                                                    {entidades.filter(e => e.instituicaoId === formData.instituicaoId).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                                </select>
                                            )}
                                        </div>
                                        {errors.entidadeId && <p className="text-red-400 text-xs italic mt-1">{errors.entidadeId}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="collaboratorId" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Colaborador</label>
                                        <select name="collaboratorId" id="collaboratorId" value={formData.collaboratorId} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.collaboratorId ? 'border-red-500' : 'border-gray-600'}`} disabled={availableCollaborators.length === 0}>
                                            <option value="" disabled>Selecione um colaborador</option>
                                            {availableCollaborators.map(col => (<option key={col.id} value={col.id}>{col.fullName}</option>))}
                                        </select>
                                        {errors.collaboratorId && <p className="text-red-400 text-xs italic mt-1">{errors.collaboratorId}</p>}
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                         <div className="col-span-2">
                            <label htmlFor="requester_supplier_id" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Fornecedor Solicitante</label>
                            <select name="requester_supplier_id" id="requester_supplier_id" value={formData.requester_supplier_id} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.requester_supplier_id ? 'border-red-500' : 'border-gray-600'}`}>
                                <option value="" disabled>Selecione um fornecedor</option>
                                {suppliers.map(sup => (<option key={sup.id} value={sup.id}>{sup.name}</option>))}
                            </select>
                            {errors.requester_supplier_id && <p className="text-red-400 text-xs italic mt-1">{errors.requester_supplier_id}</p>}
                        </div>
                    )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Categoria</label>
                        <select name="category" id="category" value={formData.category} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2">
                            {activeCategories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="equipmentId" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Equipamento Associado (Opcional)</label>
                        <select name="equipmentId" value={formData.equipmentId} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm">
                            <option value="">-- Nenhum --</option>
                            {availableEquipment.map(eq => (
                                <option key={eq.id} value={eq.id}>{eq.description} (S/N: {eq.serialNumber})</option>
                            ))}
                        </select>
                    </div>
                </div>
                
                {/* External Supplier Link (For internal tickets about an external service) */}
                {requesterType === 'internal' && (
                    <div>
                         <label htmlFor="supplier_id" className="block text-sm font-medium text-on-surface-dark-secondary mb-1 flex items-center gap-2">
                            <FaTools className="text-gray-400"/> Fornecedor / Serviço Externo Associado (Opcional)
                         </label>
                        <select name="supplier_id" value={formData.supplier_id} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm">
                            <option value="">-- Nenhum --</option>
                            {suppliers.map(sup => (<option key={sup.id} value={sup.id}>{sup.name}</option>))}
                        </select>
                    </div>
                )}

                {isSecurityIncident && (
                     <div className="border border-red-500/50 bg-red-900/20 rounded-lg p-4 space-y-4 animate-fade-in">
                         <div className="flex items-center gap-2 text-red-400 font-bold"><FaShieldAlt /><h3>Incidente de Segurança (NIS2)</h3></div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-bold text-white mb-1">Tipo de Incidente</label>
                                <select name="securityIncidentType" value={formData.securityIncidentType} onChange={handleChange} className={`w-full bg-gray-800 border text-white rounded-md p-2 ${errors.securityIncidentType ? 'border-red-500' : 'border-red-700'}`}>
                                    <option value="">-- Selecione --</option>
                                    {activeSecurityIncidentTypes.map(type => (<option key={type} value={type}>{type}</option>))}
                                </select>
                                {errors.securityIncidentType && <p className="text-red-400 text-xs italic mt-1">{errors.securityIncidentType}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-white mb-1">Criticidade</label>
                                <select name="impactCriticality" value={formData.impactCriticality} onChange={handleChange} className="w-full bg-gray-800 border border-red-700 text-white rounded-md p-2">
                                     {Object.values(CriticalityLevel).map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                     </div>
                )}

                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Assunto</label>
                    <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.title ? 'border-red-500' : 'border-gray-600'}`} />
                    {errors.title && <p className="text-red-400 text-xs italic mt-1">{errors.title}</p>}
                </div>

                <div className="relative">
                     <div className="flex justify-between items-center mb-1">
                        <label htmlFor="description" className="block text-sm font-medium text-on-surface-dark-secondary">Descrição Detalhada</label>
                        <button type="button" onClick={handleAiAnalyze} disabled={isAnalyzing || !aiConfigured} className={`text-xs flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors ${!aiConfigured ? 'cursor-not-allowed opacity-50' : ''}`}>
                            {isAnalyzing ? <FaSpinner className="animate-spin" /> : <FaMagic />} {isAnalyzing ? 'A analisar...' : 'Triagem IA'}
                        </button>
                    </div>
                    <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={4} className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.description ? 'border-red-500' : 'border-gray-600'}`} ></textarea>
                    {errors.description && <p className="text-red-400 text-xs italic mt-1">{errors.description}</p>}
                    
                    {/* AI Suggestion Box */}
                    {aiSuggestion && (
                        <div className="mt-2 p-3 bg-purple-900/20 border border-purple-500 rounded-md shadow-xl animate-fade-in">
                            <p className="text-xs font-bold text-purple-200 mb-1">Sugestão Inteligente:</p>
                            <p className="text-sm text-white">Categoria: <strong>{aiSuggestion.category}</strong> | Prioridade: <strong>{aiSuggestion.priority}</strong></p>
                            <div className="flex gap-2 mt-2">
                                <button type="button" onClick={applyAiSuggestions} className="bg-purple-600 hover:bg-purple-500 text-white p-1.5 rounded text-xs flex items-center gap-1"><FaCheck /> Aplicar</button>
                                <button type="button" onClick={() => setAiSuggestion(null)} className="bg-gray-700 hover:bg-gray-600 text-white p-1.5 rounded text-xs">Ignorar</button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-gray-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500" disabled={isSaving}>Cancelar</button>
                    <button 
                        type="submit" 
                        className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary flex items-center gap-2 disabled:opacity-50"
                        disabled={isSaving}
                    >
                         {isSaving ? <SpinnerIcon className="h-4 w-4" /> : null}
                         {isSaving ? 'A Gravar...' : 'Salvar'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
