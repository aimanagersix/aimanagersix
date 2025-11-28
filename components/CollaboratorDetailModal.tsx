
import React, { useState, useMemo, useEffect, useRef } from 'react';
import Modal from './common/Modal';
import { Collaborator, Assignment, Equipment, Ticket, CollaboratorStatus, TicketStatus, SecurityTrainingRecord, TrainingType, TooltipConfig, defaultTooltipConfig, EquipmentStatus } from '../types';
import { FaLaptop, FaTicketAlt, FaHistory, FaComment, FaEnvelope, FaPhone, FaMobileAlt, FaUserTag, FaCheckCircle, FaTimesCircle, FaCalendarAlt, FaEdit, FaUserShield, FaGraduationCap, FaPlus, FaMagic, FaSpinner, FaKey, FaPrint, FaMousePointer, FaInfoCircle, FaSave, FaBoxOpen, FaSearch, FaUnlink, FaLink, FaExclamationTriangle, FaLock, FaUnlock, FaChevronDown, FaListAlt, FaIdCard } from './common/Icons';
import { analyzeCollaboratorRisk, isAiConfigured } from '../services/geminiService';
import * as dataService from '../services/dataService';
import { getSupabase } from '../services/supabaseClient';

interface CollaboratorDetailModalProps {
    collaborator: Collaborator;
    assignments: Assignment[];
    equipment: Equipment[];
    tickets: Ticket[];
    brandMap: Map<string, string>;
    equipmentTypeMap: Map<string, string>;
    onClose: () => void;
    onShowHistory: (collaborator: Collaborator) => void;
    onStartChat: (collaborator: Collaborator) => void;
    onEdit: (collaborator: Collaborator) => void;
    onAssignEquipment?: (collaboratorId: string, equipmentId: string) => Promise<void>;
    onUnassignEquipment?: (equipmentId: string) => Promise<void>;
}

const getStatusClass = (status: CollaboratorStatus) => {
    switch (status) {
        case CollaboratorStatus.Ativo: return 'bg-green-500/20 text-green-400';
        case CollaboratorStatus.Inativo: return 'bg-red-500/20 text-red-400';
        default: return 'bg-gray-500/20 text-gray-400';
    }
};

const getTicketStatusClass = (status: TicketStatus) => {
    switch (status) {
        case TicketStatus.Requested: return 'bg-yellow-500/20 text-yellow-400';
        case TicketStatus.InProgress: return 'bg-blue-500/20 text-blue-400';
        case TicketStatus.Finished: return 'bg-green-500/20 text-green-400';
        default: return 'bg-gray-500/20 text-gray-400';
    }
};

// Subcomponent for KPI Cards
const KpiCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string; onClick?: () => void }> = ({ title, value, icon, color, onClick }) => (
    <div 
        onClick={onClick}
        className={`p-4 rounded-lg border border-gray-700 bg-gray-800/50 flex items-center gap-4 ${onClick ? 'cursor-pointer hover:bg-gray-700/50 transition-colors' : ''}`}
    >
        <div className={`p-3 rounded-full ${color} text-white`}>
            {icon}
        </div>
        <div>
            <p className="text-xs text-gray-400 uppercase font-bold">{title}</p>
            <p className="text-xl font-bold text-white">{value}</p>
        </div>
    </div>
);

const CollaboratorDetailModal: React.FC<CollaboratorDetailModalProps> = ({
    collaborator,
    assignments,
    equipment,
    tickets,
    brandMap,
    equipmentTypeMap,
    onClose,
    onShowHistory,
    onStartChat,
    onEdit,
    onAssignEquipment,
    onUnassignEquipment
}) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'support' | 'training' | 'preferences'>('overview');
    
    // Training State
    const [trainings, setTrainings] = useState<SecurityTrainingRecord[]>([]);
    const [isLoadingTraining, setIsLoadingTraining] = useState(false);
    const [showAddTraining, setShowAddTraining] = useState(false);
    const [newTraining, setNewTraining] = useState<Partial<SecurityTrainingRecord>>({
        training_type: TrainingType.PhishingSimulation,
        completion_date: new Date().toISOString().split('T')[0],
        status: 'Concluído',
        score: 100
    });
    
    // Quick Assign State
    const [stockEquipment, setStockEquipment] = useState<Equipment[]>([]);
    const [selectedStockId, setSelectedStockId] = useState('');
    const [assignSearchQuery, setAssignSearchQuery] = useState(''); // New search state
    const [isAssigning, setIsAssigning] = useState(false);
    
    // Password Change State
    const [isCurrentUser, setIsCurrentUser] = useState(false);
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    
    // AI Analysis State
    const [isAnalyzingRisk, setIsAnalyzingRisk] = useState(false);
    const [aiRiskAnalysis, setAiRiskAnalysis] = useState<{ needsTraining: boolean, reason: string, recommendedModule: string } | null>(null);
    const aiConfigured = isAiConfigured();

    // User Preferences State
    const [userTooltipConfig, setUserTooltipConfig] = useState<TooltipConfig>(collaborator.preferences?.tooltipConfig || defaultTooltipConfig);

    // Print Menu State
    const [showPrintMenu, setShowPrintMenu] = useState(false);
    const printMenuRef = useRef<HTMLDivElement>(null);

    // Check if current user
    useEffect(() => {
        const checkUser = async () => {
            const supabase = getSupabase();
            const { data: { user } } = await (supabase.auth as any).getUser();
            if (user && user.id === collaborator.id) {
                setIsCurrentUser(true);
            }
        };
        checkUser();
    }, [collaborator.id]);

    // Click outside handler for print menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (printMenuRef.current && !printMenuRef.current.contains(event.target as Node)) {
                setShowPrintMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch training on mount
    useEffect(() => {
        const fetchTraining = async () => {
            setIsLoadingTraining(true);
            const allData = await dataService.fetchAllData(); 
            const userTraining = (allData.securityTrainings || []).filter((t: any) => t.collaborator_id === collaborator.id);
            setTrainings(userTraining);
            setIsLoadingTraining(false);
        };
        fetchTraining();
    }, [collaborator.id]);
    
    // Fetch stock for Quick Assign
    useEffect(() => {
        if (activeTab === 'inventory') {
            const available = equipment.filter(e => e.status === EquipmentStatus.Stock);
            setStockEquipment(available);
        }
    }, [activeTab, equipment]);

    // Filter stock based on search query
    const filteredStock = useMemo(() => {
        if (!assignSearchQuery) return stockEquipment;
        const query = assignSearchQuery.toLowerCase();
        
        return stockEquipment.filter(e => {
            const brand = brandMap.get(e.brandId)?.toLowerCase() || '';
            const type = equipmentTypeMap.get(e.typeId)?.toLowerCase() || '';
            const serial = e.serialNumber.toLowerCase();
            const desc = e.description.toLowerCase();
            
            return brand.includes(query) || type.includes(query) || serial.includes(query) || desc.includes(query);
        });
    }, [stockEquipment, assignSearchQuery, brandMap, equipmentTypeMap]);

    const assignedEquipment = useMemo(() => {
        const collaboratorEquipmentIds = new Set(
            assignments
                .filter(a => a.collaboratorId === collaborator.id && !a.returnDate)
                .map(a => a.equipmentId)
        );
        return equipment.filter(e => collaboratorEquipmentIds.has(e.id));
    }, [assignments, equipment, collaborator.id]);

    const collaboratorTickets = useMemo(() => {
        return tickets
            .filter(t => t.collaboratorId === collaborator.id)
            .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
    }, [tickets, collaborator.id]);

    const openTicketsCount = collaboratorTickets.filter(t => t.status !== TicketStatus.Finished).length;

    const handleChatClick = () => {
        onStartChat(collaborator);
        onClose(); 
    };
    
    const handleQuickAssign = async () => {
        if (!onAssignEquipment || !selectedStockId) return;
        setIsAssigning(true);
        try {
            await onAssignEquipment(collaborator.id, selectedStockId);
            setSelectedStockId('');
            alert("Equipamento atribuído com sucesso!");
            // Typically parent updates data, forcing re-render
        } catch (e) {
            console.error(e);
            alert("Erro ao atribuir equipamento.");
        } finally {
            setIsAssigning(false);
        }
    };
    
    const handleUnassign = async (id: string) => {
        if (!onUnassignEquipment || !confirm("Tem a certeza que deseja desassociar este equipamento?")) return;
        try {
            await onUnassignEquipment(id);
            // Parent updates
        } catch(e) {
            alert("Erro ao desassociar.");
        }
    };

    const handleAddTraining = async () => {
        if (!newTraining.training_type || !newTraining.completion_date) return;
        
        try {
            await dataService.addSecurityTraining({
                ...newTraining,
                collaborator_id: collaborator.id
            } as any);
            setShowAddTraining(false);
            const allData = await dataService.fetchAllData();
            const userTraining = (allData.securityTrainings || []).filter((t: any) => t.collaborator_id === collaborator.id);
            setTrainings(userTraining);
        } catch (e) {
            console.error(e);
            alert("Erro ao adicionar formação.");
        }
    };

    const handleUpdatePassword = async () => {
        setPasswordError('');
        if (!newPassword || newPassword.length < 6) {
            setPasswordError('A password deve ter pelo menos 6 caracteres.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError('As passwords não coincidem.');
            return;
        }

        setIsUpdatingPassword(true);
        try {
            const supabase = getSupabase();
            const { error } = await (supabase.auth as any).updateUser({ password: newPassword });
            if (error) throw error;
            
            alert("Password atualizada com sucesso!");
            setShowPasswordChange(false);
            setNewPassword('');
            setConfirmPassword('');
        } catch (e: any) {
            console.error("Error updating password:", e);
            setPasswordError(e.message || "Erro ao atualizar password.");
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    const handleAnalyzeRisk = async () => {
        if (!aiConfigured) return;
        setIsAnalyzingRisk(true);
        try {
            const result = await analyzeCollaboratorRisk(collaboratorTickets);
            setAiRiskAnalysis(result);
        } catch (e) {
            console.error(e);
            alert("Erro na análise de risco.");
        } finally {
            setIsAnalyzingRisk(false);
        }
    };

    const toggleTooltipField = (field: keyof TooltipConfig) => {
        setUserTooltipConfig(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const handleSavePreferences = async () => {
        try {
            const updatedPreferences = {
                ...collaborator.preferences,
                tooltipConfig: userTooltipConfig
            };
            await dataService.updateCollaborator(collaborator.id, { preferences: updatedPreferences });
            alert("Preferências guardadas com sucesso! A página será recarregada.");
            window.location.reload();
        } catch (e) {
            console.error(e);
            alert("Erro ao guardar preferências.");
        }
    };

    const handlePrint = (type: 'inventory' | 'full') => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const commonStyles = `
            body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #333; max-width: 850px; margin: 0 auto; }
            h1 { color: #0D47A1; border-bottom: 2px solid #0D47A1; padding-bottom: 10px; margin-bottom: 20px; font-size: 24px; }
            h2 { font-size: 16px; background-color: #f0f0f0; padding: 8px; border-left: 4px solid #0D47A1; margin-top: 30px; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 0.5px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f9f9f9; font-weight: bold; color: #555; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
            .info-item { margin-bottom: 8px; }
            .label { font-weight: bold; font-size: 11px; color: #666; text-transform: uppercase; display: block; }
            .value { font-size: 14px; color: #222; }
            .footer { margin-top: 50px; border-top: 1px solid #ccc; padding-top: 10px; font-size: 10px; text-align: center; color: #888; }
            .signature-box { margin-top: 50px; display: flex; justify-content: space-between; }
            .signature-line { border-top: 1px solid #333; padding-top: 5px; text-align: center; font-size: 12px; width: 40%; }
            .term-text { font-size: 11px; color: #555; text-align: justify; margin-top: 20px; font-style: italic; }
        `;

        const headerHtml = `
            <div class="info-grid">
                <div>
                    <div class="info-item"><span class="label">Nome Completo</span><span class="value">${collaborator.fullName}</span></div>
                    <div class="info-item"><span class="label">Nº Mecanográfico</span><span class="value">${collaborator.numeroMecanografico || 'N/A'}</span></div>
                    <div class="info-item"><span class="label">Função / Cargo</span><span class="value">${collaborator.role}</span></div>
                </div>
                <div>
                    <div class="info-item"><span class="label">Email</span><span class="value">${collaborator.email}</span></div>
                    <div class="info-item"><span class="label">Telefone</span><span class="value">${collaborator.telemovel || collaborator.telefoneInterno || 'N/A'}</span></div>
                    <div class="info-item"><span class="label">Status</span><span class="value">${collaborator.status}</span></div>
                </div>
            </div>
        `;

        const inventoryRows = assignedEquipment.length > 0 
            ? assignedEquipment.map(e => `
                <tr>
                    <td>${equipmentTypeMap.get(e.typeId)}</td>
                    <td>${brandMap.get(e.brandId)}</td>
                    <td>${e.description}</td>
                    <td>${e.serialNumber}</td>
                    <td>${e.inventoryNumber || '-'}</td>
                </tr>`).join('')
            : '<tr><td colspan="5" style="text-align:center; padding: 15px;">Nenhum equipamento atribuído.</td></tr>';

        const inventoryHtml = `
            <h2>Equipamentos Atribuídos</h2>
            <table>
                <thead>
                    <tr>
                        <th>Tipo</th>
                        <th>Marca</th>
                        <th>Descrição</th>
                        <th>Nº Série</th>
                        <th>Nº Inventário</th>
                    </tr>
                </thead>
                <tbody>
                    ${inventoryRows}
                </tbody>
            </table>
        `;

        let contentHtml = '';

        if (type === 'inventory') {
            contentHtml = `
                <h1>Ficha de Inventário do Colaborador</h1>
                ${headerHtml}
                ${inventoryHtml}
                <div class="term-text">
                    <p>Declaro que recebi os equipamentos acima listados em bom estado de conservação e funcionamento. Comprometo-me a utilizá-los exclusivamente para fins profissionais e a devolvê-los quando solicitado ou no término da minha colaboração com a empresa.</p>
                </div>
                <div class="signature-box">
                    <div class="signature-line">Departamento de TI</div>
                    <div class="signature-line">O Colaborador<br>(${new Date().toLocaleDateString()})</div>
                </div>
            `;
        } else {
            // Full Dossier
            const trainingRows = trainings.length > 0
                ? trainings.map(t => `
                    <tr>
                        <td>${t.training_type}</td>
                        <td>${new Date(t.completion_date).toLocaleDateString()}</td>
                        <td>${t.status}</td>
                        <td>${t.score ? t.score + '%' : '-'}</td>
                        <td>${t.duration_hours ? t.duration_hours + 'h' : '-'}</td>
                    </tr>`).join('')
                : '<tr><td colspan="5" style="text-align:center;">Sem registo de formação.</td></tr>';

            const recentTicketsRows = collaboratorTickets.slice(0, 5).length > 0
                ? collaboratorTickets.slice(0, 5).map(t => `
                    <tr>
                        <td>${new Date(t.requestDate).toLocaleDateString()}</td>
                        <td>${t.title}</td>
                        <td>${t.category || '-'}</td>
                        <td>${t.status}</td>
                    </tr>`).join('')
                : '<tr><td colspan="4" style="text-align:center;">Sem tickets recentes.</td></tr>';

            contentHtml = `
                <h1>Dossier do Colaborador</h1>
                ${headerHtml}
                
                <div class="info-item" style="margin-top: -10px; margin-bottom: 20px;">
                     <span class="label">Morada</span>
                     <span class="value">${collaborator.address_line || '-'}, ${collaborator.postal_code || ''} ${collaborator.city || ''}</span>
                </div>

                ${inventoryHtml}

                <h2>Histórico de Formação & Segurança</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Formação</th>
                            <th>Data</th>
                            <th>Estado</th>
                            <th>Score</th>
                            <th>Duração</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${trainingRows}
                    </tbody>
                </table>

                <h2>Últimos Tickets de Suporte</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Assunto</th>
                            <th>Categoria</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${recentTicketsRows}
                    </tbody>
                </table>

                <div class="footer">
                    Documento gerado automaticamente pelo AIManager em ${new Date().toLocaleString()}
                </div>
            `;
        }

        printWindow.document.write(`
            <html>
            <head>
                <title>Ficha Colaborador - ${collaborator.fullName}</title>
                <style>${commonStyles}</style>
            </head>
            <body>
                ${contentHtml}
                <script>window.onload = function() { window.print(); }</script>
            </body>
            </html>
        `);
        printWindow.document.close();
        setShowPrintMenu(false);
    };

    return (
        <Modal title={`Detalhes do Colaborador`} onClose={onClose} maxWidth="max-w-4xl">
            <div className="flex flex-col h-[80vh]">
                {/* Header Section */}
                <div className="flex-shrink-0 flex flex-col sm:flex-row items-start gap-6 p-4 bg-gray-900/50 rounded-lg mb-4 relative">
                    {collaborator.photoUrl ? (
                        <img src={collaborator.photoUrl} alt={collaborator.fullName} className="w-24 h-24 rounded-full object-cover flex-shrink-0" />
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-brand-secondary flex items-center justify-center font-bold text-white text-4xl flex-shrink-0">
                            {collaborator.fullName.charAt(0)}
                        </div>
                    )}
                    <div className="flex-grow">
                        <h2 className="text-2xl font-bold text-white">{collaborator.fullName}</h2>
                        <p className="text-on-surface-dark-secondary">{collaborator.numeroMecanografico}</p>
                        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                            <div className="flex items-center gap-2"><FaEnvelope className="text-gray-400" /> <a href={`mailto:${collaborator.email}`} className="hover:underline hover:text-white">{collaborator.email}</a></div>
                            {collaborator.telemovel && <div className="flex items-center gap-2"><FaMobileAlt className="text-gray-400" /> <a href={`tel:${collaborator.telemovel}`} className="hover:underline hover:text-white">{collaborator.telemovel}</a></div>}
                            {collaborator.telefoneInterno && <div className="flex items-center gap-2"><FaPhone className="text-gray-400" /> Interno: <a href={`tel:${collaborator.telefoneInterno}`} className="hover:underline hover:text-white">{collaborator.telefoneInterno}</a></div>}
                            <div className="flex items-center gap-2"><FaUserTag className="text-gray-400" /> {collaborator.role}</div>
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${getStatusClass(collaborator.status)}`}>{collaborator.status}</span>
                            </div>
                        </div>
                    </div>
                     <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
                        <div className="relative" ref={printMenuRef}>
                            <button 
                                onClick={() => setShowPrintMenu(!showPrintMenu)}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors shadow-lg"
                            >
                                <FaPrint /> Imprimir <FaChevronDown className="text-xs" />
                            </button>
                            {showPrintMenu && (
                                <div className="absolute right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-md shadow-xl z-50 py-1">
                                    <button 
                                        onClick={() => handlePrint('inventory')}
                                        className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm text-white hover:bg-gray-700 transition-colors"
                                    >
                                        <FaListAlt className="text-blue-400"/> Ficha de Inventário
                                    </button>
                                    <button 
                                        onClick={() => handlePrint('full')}
                                        className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm text-white hover:bg-gray-700 transition-colors border-t border-gray-700"
                                    >
                                        <FaIdCard className="text-green-400"/> Dossier Completo
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        <button 
                            onClick={() => { onClose(); onEdit(collaborator); }} 
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors shadow-lg font-semibold"
                        >
                            <FaEdit /> Editar Dados
                        </button>
                        <button onClick={handleChatClick} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition-colors">
                            <FaComment /> Enviar Mensagem
                        </button>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-gray-700 mb-4">
                    <button 
                        onClick={() => setActiveTab('overview')} 
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'overview' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        Visão Geral
                    </button>
                    <button 
                        onClick={() => setActiveTab('inventory')} 
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'inventory' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        Inventário
                    </button>
                    <button 
                        onClick={() => setActiveTab('support')} 
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'support' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        Suporte
                    </button>
                    <button 
                        onClick={() => setActiveTab('training')} 
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'training' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
                    >
                        Formação & Segurança
                    </button>
                    {isCurrentUser && (
                        <button 
                            onClick={() => setActiveTab('preferences')} 
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'preferences' ? 'border-brand-secondary text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
                        >
                            Preferências
                        </button>
                    )}
                </div>

                {/* Tab Content */}
                <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 space-y-6">
                    
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {/* KPI Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <KpiCard 
                                    title="Total de Ativos" 
                                    value={assignedEquipment.length} 
                                    icon={<FaLaptop className="text-xl"/>} 
                                    color="bg-blue-600" 
                                    onClick={() => setActiveTab('inventory')}
                                />
                                <KpiCard 
                                    title="Tickets Abertos" 
                                    value={openTicketsCount} 
                                    icon={<FaTicketAlt className="text-xl"/>} 
                                    color={openTicketsCount > 0 ? "bg-yellow-600" : "bg-green-600"}
                                    onClick={() => setActiveTab('support')}
                                />
                                <KpiCard 
                                    title="Formações" 
                                    value={trainings.length} 
                                    icon={<FaGraduationCap className="text-xl"/>} 
                                    color="bg-purple-600"
                                    onClick={() => setActiveTab('training')}
                                />
                                <KpiCard 
                                    title="Acesso ao Sistema" 
                                    value={collaborator.canLogin ? 'Permitido' : 'Bloqueado'} 
                                    icon={collaborator.canLogin ? <FaUnlock className="text-xl"/> : <FaLock className="text-xl"/>} 
                                    color={collaborator.canLogin ? "bg-green-600" : "bg-red-600"}
                                />
                            </div>

                            {/* Account Management (Password) */}
                            {isCurrentUser && (
                                <section className="bg-gray-800/30 p-4 rounded-lg border border-gray-700">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                            <FaKey className="text-yellow-500" /> Segurança da Conta
                                        </h3>
                                        <button 
                                            onClick={() => setShowPasswordChange(!showPasswordChange)}
                                            className="text-xs text-brand-secondary hover:text-white underline"
                                        >
                                            {showPasswordChange ? 'Cancelar' : 'Alterar Password'}
                                        </button>
                                    </div>
                                    
                                    {showPasswordChange && (
                                        <div className="mt-4 space-y-3 animate-fade-in bg-gray-900/50 p-3 rounded border border-gray-600">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs text-gray-400 mb-1">Nova Password</label>
                                                    <input 
                                                        type="password" 
                                                        value={newPassword}
                                                        onChange={(e) => setNewPassword(e.target.value)}
                                                        className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-400 mb-1">Confirmar Password</label>
                                                    <input 
                                                        type="password" 
                                                        value={confirmPassword}
                                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                                        className="w-full bg-gray-700 border border-gray-600 text-white rounded p-2 text-sm"
                                                    />
                                                </div>
                                            </div>
                                            {passwordError && <p className="text-red-400 text-xs">{passwordError}</p>}
                                            <div className="flex justify-end">
                                                <button 
                                                    onClick={handleUpdatePassword}
                                                    disabled={isUpdatingPassword}
                                                    className="px-4 py-2 bg-brand-primary text-white rounded text-sm hover:bg-brand-secondary disabled:opacity-50"
                                                >
                                                    {isUpdatingPassword ? 'A atualizar...' : 'Atualizar Password'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </section>
                            )}
                            
                            {/* Address Info */}
                             <div className="bg-gray-900/30 p-4 rounded-lg border border-gray-700">
                                <h3 className="text-sm font-semibold text-white mb-3 border-b border-gray-700 pb-1">Morada Pessoal</h3>
                                <div className="text-sm text-gray-300 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-gray-500 text-xs uppercase">Endereço</p>
                                        <p>{collaborator.address_line || 'Não definido'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-xs uppercase">Localidade</p>
                                        <p>{collaborator.postal_code} {collaborator.locality}</p>
                                        <p>{collaborator.city}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'inventory' && (
                        <div className="space-y-6">
                            {/* Current Inventory with Actions */}
                            <div>
                                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2"><FaBoxOpen className="text-blue-400"/> Equipamento em Posse</h3>
                                {assignedEquipment.length > 0 ? (
                                    <div className="space-y-2">
                                        {assignedEquipment.map(item => (
                                            <div key={item.id} className="flex items-center justify-between bg-gray-800/50 p-3 rounded border border-gray-700">
                                                <div>
                                                    <p className="font-bold text-white">{item.description}</p>
                                                    <p className="text-xs text-gray-400">S/N: {item.serialNumber}</p>
                                                    <p className="text-xs text-gray-500">{brandMap.get(item.brandId)}</p>
                                                </div>
                                                <button 
                                                    onClick={() => handleUnassign(item.id)}
                                                    className="text-xs bg-red-900/30 text-red-400 border border-red-500/30 px-3 py-1.5 rounded hover:bg-red-900/50 flex items-center gap-1 transition-colors"
                                                >
                                                    <FaUnlink /> Desassociar
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-sm italic bg-gray-900/20 p-4 rounded text-center">Nenhum equipamento atribuído atualmente.</p>
                                )}
                            </div>

                            {/* Quick Assign Section */}
                            <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700">
                                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><FaLink className="text-green-400"/> Atribuição Imediata (Stock)</h3>
                                <p className="text-xs text-gray-400 mb-3">Selecione um equipamento disponível em stock para atribuir a este colaborador.</p>
                                
                                <div className="flex flex-col sm:flex-row gap-2 items-center">
                                    <div className="flex-grow relative w-full">
                                        <input
                                            type="text"
                                            placeholder="Filtrar stock por série, marca ou tipo..."
                                            value={assignSearchQuery}
                                            onChange={(e) => setAssignSearchQuery(e.target.value)}
                                            className="w-full bg-gray-700 border border-gray-600 text-white rounded-t-md p-2 pl-8 text-sm focus:ring-green-500 focus:border-green-500 border-b-0"
                                        />
                                        <FaSearch className="absolute left-2.5 top-2.5 text-gray-400 h-3 w-3 pointer-events-none"/>
                                        
                                        <select 
                                            value={selectedStockId} 
                                            onChange={(e) => setSelectedStockId(e.target.value)} 
                                            className="w-full bg-gray-700 border border-gray-600 text-white rounded-b-md p-2 text-sm"
                                        >
                                            <option value="">-- Selecione do Stock ({filteredStock.length}) --</option>
                                            {filteredStock.map(e => (
                                                <option key={e.id} value={e.id}>
                                                    {e.description} (S/N: {e.serialNumber})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <button 
                                        onClick={handleQuickAssign}
                                        disabled={!selectedStockId || isAssigning}
                                        className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-500 disabled:opacity-50 flex items-center justify-center gap-2 h-[72px] sm:h-auto"
                                    >
                                        {isAssigning ? <FaSpinner className="animate-spin"/> : <FaCheckCircle />} 
                                        Associar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'support' && (
                        <section>
                             <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2"><FaTicketAlt /> Histórico de Suporte</h3>
                                <span className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs">Total: {collaboratorTickets.length}</span>
                            </div>
                            
                            {collaboratorTickets.length > 0 ? (
                                 <table className="w-full text-sm text-left text-on-surface-dark-secondary border border-gray-700 rounded-md overflow-hidden">
                                    <thead className="text-xs text-on-surface-dark-secondary uppercase bg-gray-700/50">
                                        <tr>
                                            <th className="px-4 py-2">Data</th>
                                            <th className="px-4 py-2">Assunto</th>
                                            <th className="px-4 py-2">Descrição</th>
                                            <th className="px-4 py-2">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {collaboratorTickets.map(ticket => (
                                            <tr key={ticket.id} className="border-b border-gray-700 last:border-0 hover:bg-gray-800/50 transition-colors">
                                                <td className="px-4 py-3">{new Date(ticket.requestDate).toLocaleDateString()}</td>
                                                <td className="px-4 py-3 text-white font-medium">{ticket.title}</td>
                                                <td className="px-4 py-3 text-gray-400 truncate max-w-xs" title={ticket.description}>{ticket.description}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${getTicketStatusClass(ticket.status)}`}>
                                                        {ticket.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="text-center py-8 text-gray-500 border border-dashed border-gray-700 rounded-md">Nenhum ticket registado.</p>
                            )}
                        </section>
                    )}

                    {activeTab === 'training' && (
                        <div className="space-y-6">
                            <div className="bg-blue-900/20 border border-blue-900/50 p-4 rounded-lg text-sm text-blue-200">
                                <div className="flex items-center gap-2 font-bold mb-2">
                                    <FaUserShield className="text-xl"/> Higiene Cibernética (NIS2 Artigo 7º)
                                </div>
                                <p>
                                    Os colaboradores devem receber formação regular em segurança.
                                    Utilize a IA para analisar o comportamento de risco com base nos tickets abertos.
                                </p>
                            </div>

                            {/* AI Risk Analysis */}
                            <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="font-bold text-white flex items-center gap-2"><FaMagic className="text-purple-400"/> Análise de Risco Humano (IA)</h4>
                                    <button 
                                        onClick={handleAnalyzeRisk}
                                        disabled={isAnalyzingRisk || !aiConfigured}
                                        className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isAnalyzingRisk ? <FaSpinner className="animate-spin"/> : <FaMagic/>} Analisar Comportamento
                                    </button>
                                </div>
                                
                                {aiRiskAnalysis && (
                                    <div className={`p-3 rounded border ${aiRiskAnalysis.needsTraining ? 'bg-orange-900/20 border-orange-500/50' : 'bg-green-900/20 border-green-500/50'} animate-fade-in`}>
                                        <p className={`font-bold ${aiRiskAnalysis.needsTraining ? 'text-orange-400' : 'text-green-400'}`}>
                                            {aiRiskAnalysis.needsTraining ? "Risco Detetado: Formação Recomendada" : "Comportamento Seguro"}
                                        </p>
                                        <p className="text-sm text-gray-300 mt-1">{aiRiskAnalysis.reason}</p>
                                        {aiRiskAnalysis.needsTraining && (
                                            <div className="mt-2 text-xs text-white bg-orange-600/20 p-2 rounded inline-block">
                                                Recomendação: <strong>{aiRiskAnalysis.recommendedModule}</strong>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {!aiRiskAnalysis && !isAnalyzingRisk && (
                                    <p className="text-xs text-gray-500 italic">Clique para analisar o histórico de tickets e detetar padrões de risco.</p>
                                )}
                            </div>

                            {/* Training Records */}
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="font-bold text-white flex items-center gap-2"><FaGraduationCap /> Registo de Formação</h4>
                                    <button onClick={() => setShowAddTraining(!showAddTraining)} className="text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded flex items-center gap-2">
                                        <FaPlus /> Registar Ação
                                    </button>
                                </div>

                                {showAddTraining && (
                                    <div className="bg-gray-800 p-3 rounded border border-gray-600 mb-4 animate-fade-in">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                            <select 
                                                className="bg-gray-700 border border-gray-600 text-white rounded p-1.5 text-sm"
                                                value={newTraining.training_type}
                                                onChange={(e) => setNewTraining({...newTraining, training_type: e.target.value as TrainingType})}
                                            >
                                                {Object.values(TrainingType).map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                            <input 
                                                type="date" 
                                                className="bg-gray-700 border border-gray-600 text-white rounded p-1.5 text-sm"
                                                value={newTraining.completion_date}
                                                onChange={(e) => setNewTraining({...newTraining, completion_date: e.target.value})}
                                            />
                                            <input 
                                                type="number" 
                                                placeholder="Score (0-100)" 
                                                className="bg-gray-700 border border-gray-600 text-white rounded p-1.5 text-sm"
                                                value={newTraining.score}
                                                onChange={(e) => setNewTraining({...newTraining, score: parseInt(e.target.value)})}
                                            />
                                            <input 
                                                type="text" 
                                                placeholder="Notas..." 
                                                className="bg-gray-700 border border-gray-600 text-white rounded p-1.5 text-sm"
                                                value={newTraining.notes}
                                                onChange={(e) => setNewTraining({...newTraining, notes: e.target.value})}
                                            />
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => setShowAddTraining(false)} className="text-xs px-3 py-1 bg-gray-600 text-white rounded">Cancelar</button>
                                            <button onClick={handleAddTraining} className="text-xs px-3 py-1 bg-brand-primary text-white rounded">Salvar</button>
                                        </div>
                                    </div>
                                )}

                                {isLoadingTraining ? (
                                    <p className="text-center text-gray-500 text-sm"><FaSpinner className="animate-spin"/> A carregar...</p>
                                ) : trainings.length > 0 ? (
                                    <div className="space-y-2">
                                        {trainings.map(t => (
                                            <div key={t.id} className="flex items-center justify-between p-3 bg-surface-dark rounded border border-gray-700">
                                                <div>
                                                    <p className="font-bold text-white text-sm">{t.training_type}</p>
                                                    <p className="text-xs text-gray-400">{new Date(t.completion_date).toLocaleDateString()} - {t.status}</p>
                                                </div>
                                                <div className="text-right">
                                                    {t.score !== undefined && (
                                                        <span className={`text-sm font-bold ${t.score >= 70 ? 'text-green-400' : 'text-red-400'}`}>
                                                            {t.score}%
                                                        </span>
                                                    )}
                                                    {t.duration_hours && (
                                                        <span className="block text-xs text-gray-500 mt-1">{t.duration_hours} Horas</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center py-4 text-gray-500 text-sm bg-gray-900/20 rounded border border-dashed border-gray-700">Nenhuma formação registada.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'preferences' && (
                         <div className="p-1">
                            <div className="bg-gray-900/50 border border-gray-700 p-4 rounded-lg">
                                <h3 className="font-bold text-white mb-2 flex items-center gap-2"><FaMousePointer className="text-blue-400"/> Personalização de Tooltips</h3>
                                <p className="text-sm text-gray-400 mb-4">
                                    Escolha quais informações aparecem quando passa o rato sobre os equipamentos nas listagens.
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {Object.keys(defaultTooltipConfig).map(key => {
                                        const field = key as keyof TooltipConfig;
                                        const labels: Record<string, string> = {
                                            showNomeNaRede: "Nome na Rede",
                                            showAssignedTo: "Atribuído a",
                                            showOsVersion: "Versão do SO",
                                            showLastPatch: "Último Patch",
                                            showSerialNumber: "Número de Série",
                                            showBrand: "Marca / Tipo",
                                            showWarranty: "Garantia",
                                            showLocation: "Localização Física",
                                            showIpAddress: "Endereço IP",
                                            showCollabName: "Nome do Colaborador",
                                            showCollabJob: "Função / Cargo",
                                            showCollabEntity: "Entidade Associada",
                                            showCollabContact: "Email / Telefone"
                                        };
                                        
                                        if (!key.startsWith('showCollab')) {
                                            return (
                                                <label key={key} className="flex items-center space-x-2 cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={userTooltipConfig[field]} 
                                                        onChange={() => toggleTooltipField(field)} 
                                                        className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-brand-secondary" 
                                                    />
                                                    <span className="text-sm text-gray-300">{labels[key] || key}</span>
                                                </label>
                                            );
                                        }
                                        return null;
                                    })}
                                </div>
                                
                                <div className="mt-4 pt-4 border-t border-gray-700">
                                    <h4 className="text-sm font-bold text-white mb-2">Tooltips de Colaboradores</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {Object.keys(defaultTooltipConfig).map(key => {
                                            const field = key as keyof TooltipConfig;
                                            const labels: Record<string, string> = {
                                                showCollabName: "Nome Completo",
                                                showCollabJob: "Função / Cargo",
                                                showCollabEntity: "Entidade Associada",
                                                showCollabContact: "Email / Telefone"
                                            };

                                            if (key.startsWith('showCollab')) {
                                                return (
                                                    <label key={key} className="flex items-center space-x-2 cursor-pointer">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={userTooltipConfig[field]} 
                                                            onChange={() => toggleTooltipField(field)} 
                                                            className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-brand-secondary" 
                                                        />
                                                        <span className="text-sm text-gray-300">{labels[key] || key}</span>
                                                    </label>
                                                );
                                            }
                                            return null;
                                        })}
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <button onClick={handleSavePreferences} className="bg-brand-primary text-white px-4 py-2 rounded hover:bg-brand-secondary transition-colors flex items-center gap-2">
                                        <FaSave /> Guardar Preferências Pessoais
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default CollaboratorDetailModal;
