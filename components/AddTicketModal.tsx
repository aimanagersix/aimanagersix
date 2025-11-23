
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Modal from './common/Modal';
import { Ticket, Entidade, Collaborator, UserRole, CollaboratorStatus, Team, Equipment, EquipmentType, Assignment, TicketCategory, CriticalityLevel, CIARating, TicketCategoryItem, SecurityIncidentType, SecurityIncidentTypeItem, TicketStatus, TicketActivity, Supplier } from '../types';
import { DeleteIcon, FaShieldAlt, FaExclamationTriangle, FaMagic, FaSpinner, FaCheck, FaLandmark } from './common/Icons';
import { analyzeTicketRequest, findSimilarPastTickets, isAiConfigured } from '../services/geminiService';
import { FaLightbulb, FaLock, FaUserTie, FaTruck } from 'react-icons/fa';
import RegulatoryNotificationModal from './RegulatoryNotificationModal';
import * as dataService from '../services/dataService';

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
    securityIncidentTypes?: SecurityIncidentTypeItem[]; 
    pastTickets?: Ticket[]; // Pass existing tickets for RAG
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

const AddTicketModal: React.FC<AddTicketModalProps> = ({ onClose, onSave, ticketToEdit, escolasDepartamentos: entidades, collaborators, teams, currentUser, userPermissions, equipment, equipmentTypes, assignments, categories, securityIncidentTypes = [], pastTickets = [], initialData }) => {
    
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
                collaboratorId: ticketToEdit.collaboratorId,
                requester_supplier_id: ticketToEdit.requester_supplier_id,
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
        };
        
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
            entidadeId: initialData?.entidadeId || entidades[0]?.id || '',
            collaboratorId: initialData?.collaboratorId || collaborators.find(c => c.entidadeId === (initialData?.entidadeId || entidades[0]?.id))?.id || '',
        };
    });

    const [attachments, setAttachments] = useState<{ name: string; dataUrl: string; size: number }[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Requester Type
    const [requesterType, setRequesterType] = useState<'internal' | 'external'>('internal');
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);

    // AI Analysis State
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState<{category: string, priority: string, solution: string} | null>(null);
    const [similarTicket, setSimilarTicket] = useState<{id: string, resolution: string, reason: string} | null>(null);
    const [autoSeverityMessage, setAutoSeverityMessage] = useState<string | null>(null);
    const [showRegulatoryModal, setShowRegulatoryModal] = useState(false);
    
    const aiConfigured = isAiConfigured();
     
    const isUtilizador = userPermissions.viewScope === 'own';
    const isSecurityIncident = formData.category === TicketCategory.SecurityIncident || formData.category === 'Incidente de Segurança';

    useEffect(() => {
        if (ticketToEdit) {
            setAttachments(ticketToEdit.attachments?.map(a => ({ ...a, size: 0 })) || []);
            if (ticketToEdit.requester_supplier_id) {
                setRequesterType('external');
            }
        }
    }, [ticketToEdit]);

    // Fetch suppliers
    useEffect(() => {
        const loadSuppliers = async () => {
            const data = await dataService.fetchAllData();
            setSuppliers(data.suppliers);
        };
        loadSuppliers();
    }, []);

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
    
    // Smart Compliance: Inherit Risk & Team from Equipment
    useEffect(() => {
        if (formData.equipmentId) {
            const selectedEquipment = equipment.find(e => e.id === formData.equipmentId);
            if (selectedEquipment) {
                // 1. Auto-assign team
                const type = equipmentTypes.find(t => t.id === selectedEquipment.typeId);
                if (type?.default_team_id && !formData.team_id) {
                    setFormData(prev => ({ ...prev, team_id: type.default_team_id! }));
                }

                // 2. Auto-inherit Criticality (Risk Inheritance)
                // Only automate if the asset is High/Critical to ensure safety
                if (selectedEquipment.criticality === CriticalityLevel.High || selectedEquipment.criticality === CriticalityLevel.Critical) {
                    // Automatically upgrade criticality if it's lower than the asset's criticality
                    if (formData.impactCriticality !== selectedEquipment.criticality) {
                        setFormData(prev => ({ ...prev, impactCriticality: selectedEquipment.criticality }));
                        setAutoSeverityMessage(`Nível de risco escalado automaticamente devido à criticidade do ativo (NIS2).`);
                    }
                } else {
                    setAutoSeverityMessage(null);
                }
            }
        } else {
            setAutoSeverityMessage(null);
        }
    }, [formData.equipmentId, equipment, equipmentTypes]);

    useEffect(() => {
        if (!ticketToEdit && !isUtilizador && requesterType === 'internal' && availableCollaborators.length > 0) {
             const currentIsValid = availableCollaborators.some(c => c.id === formData.collaboratorId);
             if (!currentIsValid) {
                 setFormData(prev => ({...prev, collaboratorId: availableCollaborators[0].id}));
             }
        }
    }, [formData.entidadeId, availableCollaborators, ticketToEdit, isUtilizador, formData.collaboratorId, requesterType]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        if (name === 'category') {
             const catObj = categories.find(c => c.name === value);
             setFormData(prev => ({
                 ...prev,
                 category: value,
                 team_id: catObj?.default_team_id || prev.team_id 
             }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.title?.trim()) newErrors.title = "O assunto é obrigatório.";
        if (!formData.entidadeId && requesterType === 'internal') newErrors.entidadeId = "A entidade é obrigatória.";
        
        if (requesterType === 'internal' && !formData.collaboratorId) {
            newErrors.collaboratorId = "O colaborador é obrigatório.";
        }
        if (requesterType === 'external' && !formData.requester_supplier_id) {
            newErrors.requester_supplier_id = "O fornecedor é obrigatório.";
        }

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

    // AI Triage Handler with RAG
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
            // 1. Analyze Category & Priority
            const result = await analyzeTicketRequest(formData.description);
            
            let mappedPriority: CriticalityLevel = CriticalityLevel.Low;
            if (result.suggestedPriority === 'Crítica') mappedPriority = CriticalityLevel.Critical;
            else if (result.suggestedPriority === 'Alta') mappedPriority = CriticalityLevel.High;
            else if (result.suggestedPriority === 'Média') mappedPriority = CriticalityLevel.Medium;

            let bestCategory = activeCategories.find(c => c.toLowerCase() === result.suggestedCategory.toLowerCase()) || result.suggestedCategory;
            if (result.isSecurityIncident) {
                bestCategory = 'Incidente de Segurança'; 
            }

            setAiSuggestion({
                category: bestCategory,
                priority: mappedPriority,
                solution: result.suggestedSolution
            });

            // 2. Find Similar Tickets (RAG)
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        
        const dataToSubmit: any = {
            ...formData,
            team_id: formData.team_id || undefined,
            equipmentId: formData.equipmentId || undefined,
            attachments: attachments.map(({ name, dataUrl }) => ({ name, dataUrl })),
        };
        
        if (requesterType === 'external') {
            // If external supplier, clear collaborator/entity fields (or set to a default System entity if needed by FK)
            // For simplicity in this data model, we allow nulls or use the requester_supplier_id as primary logic in dashboard
            dataToSubmit.collaboratorId = undefined;
            // We might need a dummy Entity if FK is strict, but usually 'entidadeId' is nullable or we use a system entity.
            // Assuming 'entidadeId' can be kept if it's relevant to where the work is done, but 'collaboratorId' is cleared.
        } else {
            dataToSubmit.requester_supplier_id = undefined;
        }

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
        <>
        <Modal title={modalTitle} onClose={onClose} maxWidth="max-w-3xl">
            <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Requester Toggle */}
                <div className="flex justify-center pb-2 border-b border-gray-700 mb-4">
                    <div className="flex bg-gray-700 p-1 rounded-lg">
                        <button
                            type="button"
                            onClick={() => setRequesterType('internal')}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${requesterType === 'internal' ? 'bg-brand-primary text-white shadow' : 'text-gray-400 hover:text-white'}`}
                        >
                            <FaUserTie /> Interno
                        </button>
                        <button
                            type="button"
                            onClick={() => setRequesterType('external')}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${requesterType === 'external' ? 'bg-brand-primary text-white shadow' : 'text-gray-400 hover:text-white'}`}
                        >
                            <FaTruck /> Fornecedor
                        </button>
                    </div>
                </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {requesterType === 'internal' ? (
                        <>
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
                        </>
                    ) : (
                        <div className="col-span-2">
                            <label htmlFor="requester_supplier_id" className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Fornecedor Solicitante</label>
                            <select 
                                name="requester_supplier_id" 
                                id="requester_supplier_id" 
                                value={formData.requester_supplier_id} 
                                onChange={handleChange} 
                                className={`w-full bg-gray-700 border text-white rounded-md p-2 ${errors.requester_supplier_id ? 'border-red-500' : 'border-gray-600'}`}
                            >
                                <option value="" disabled>Selecione um fornecedor</option>
                                {suppliers.map(sup => (
                                    <option key={sup.id} value={sup.id}>{sup.name}</option>
                                ))}
                            </select>
                            {errors.requester_supplier_id && <p className="text-red-400 text-xs italic mt-1">{errors.requester_supplier_id}</p>}
                        </div>
                    )}
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
                    <div className="border border-red-500/50 bg-red-900/20 rounded-lg p-4 space-y-4 animate-fade-in">
                         <div className="flex items-center justify-between border-b border-red-500/30 pb-2 mb-2">
                            <div className="flex items-center gap-2 text-red-400 font-bold">
                                <FaShieldAlt />
                                <h3>Classificação de Incidente de Segurança (NIS2)</h3>
                            </div>
                            {ticketToEdit && (
                                <button
                                    type="button"
                                    onClick={() => setShowRegulatoryModal(true)}
                                    className="text-xs flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded shadow-lg font-bold transition-colors"
                                >
                                    <FaLandmark /> Gerar Notificação Regulatória
                                </button>
                            )}
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
                                {activeSecurityIncidentTypes.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                            {errors.securityIncidentType && <p className="text-red-400 text-xs italic mt-1">{errors.securityIncidentType}</p>}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-red-500/30">
                             <div>
                                <label className="block text-xs font-bold text-red-300 mb-1">Criticidade do Impacto</label>
                                <select 
                                    name="impactCriticality" 
                                    value={formData.impactCriticality} 
                                    onChange={handleChange} 
                                    className={`w-full bg-gray-800 border text-white rounded p-1.5 text-sm ${autoSeverityMessage ? 'border-red-500 ring-2 ring-red-500/50' : 'border-red-700'}`}
                                >
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

                <div className="relative">
                    <div className="flex justify-between items-center mb-1">
                        <label htmlFor="description" className="block text-sm font-medium text-on-surface-dark-secondary">Descrição Detalhada</label>
                        <button
                            type="button"
                            onClick={handleAiAnalyze}
                            disabled={isAnalyzing || !aiConfigured}
                            className={`text-xs flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors ${!aiConfigured ? 'cursor-not-allowed opacity-50' : ''}`}
                            title={!aiConfigured ? "Funcionalidade indisponível: Chave API não configurada" : "Sugerir categoria, prioridade e encontrar tickets semelhantes"}
                        >
                            {isAnalyzing ? <FaSpinner className="animate-spin" /> : <FaMagic />}
                            {isAnalyzing ? 'A analisar...' : 'Triagem IA'}
                        </button>
                    </div>
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
                    
                    {aiSuggestion && (
                        <div className="mt-2 p-3 bg-purple-900/20 border border-purple-500 rounded-md shadow-xl animate-fade-in">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="text-xs font-bold text-purple-200 mb-1">Sugestão Inteligente:</p>
                                    <p className="text-sm text-white">Categoria: <strong>{aiSuggestion.category}</strong> | Prioridade: <strong>{aiSuggestion.priority}</strong></p>
                                    <p className="text-xs text-purple-200 mt-1 italic">"{aiSuggestion.solution}"</p>
                                </div>
                                <div className="flex gap-2">
                                    <button type="button" onClick={applyAiSuggestions} className="bg-purple-600 hover:bg-purple-500 text-white p-1.5 rounded text-xs flex items-center gap-1"><FaCheck /> Aplicar</button>
                                    <button type="button" onClick={() => setAiSuggestion(null)} className="bg-gray-700 hover:bg-gray-600 text-white p-1.5 rounded text-xs">Ignorar</button>
                                </div>
                            </div>
                            
                            {similarTicket && (
                                <div className="border-t border-purple-500/30 pt-2 mt-2">
                                    <div className="flex items-center gap-2 text-yellow-400 text-xs font-bold mb-1">
                                        <FaLightbulb /> Solução Semelhante Encontrada
                                    </div>
                                    <p className="text-xs text-gray-300">
                                        O ticket #{similarTicket.id.substring(0,6)} teve um problema idêntico.
                                        <br/>
                                        <strong>Resolução Anteriror:</strong> {similarTicket.resolution}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
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
                            disabled={requesterType === 'external' || availableEquipment.length === 0}
                        >
                            <option value="">Nenhum</option>
                            {availableEquipment.map(eq => {
                                const isCritical = eq.criticality === CriticalityLevel.High || eq.criticality === CriticalityLevel.Critical;
                                return (
                                    <option key={eq.id} value={eq.id}>
                                        {eq.description} (S/N: {eq.serialNumber}) {isCritical ? '⚠️ [CRÍTICO]' : ''}
                                    </option>
                                );
                            })}
                        </select>
                        {autoSeverityMessage && (
                            <div className="mt-2 p-3 bg-gradient-to-r from-orange-900/40 to-red-900/40 border border-orange-500/70 rounded-md text-xs text-orange-100 flex flex-col gap-1 animate-pulse shadow-lg">
                                <div className="flex items-center gap-2 font-bold text-orange-300">
                                    <FaShieldAlt className="flex-shrink-0 h-4 w-4" />
                                    <span className="uppercase tracking-wider">Compliance Alert (NIS2)</span>
                                </div>
                                <p className="font-medium">{autoSeverityMessage}</p>
                            </div>
                        )}
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
        {showRegulatoryModal && ticketToEdit && (
            <RegulatoryNotificationModal 
                ticket={ticketToEdit} 
                activities={[]} // Passing empty activities for now as they are fetched in dashboard, or could be passed as prop if available
                onClose={() => setShowRegulatoryModal(false)} 
            />
        )}
        </>
    );
};

export default AddTicketModal;
