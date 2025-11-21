import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Equipment, EquipmentStatus, EquipmentType, Brand, Assignment, Collaborator, Entidade, Instituicao, Ticket, TicketStatus,
  TicketActivity, CollaboratorHistory, Message, UserRole, CollaboratorStatus, SoftwareLicense, LicenseAssignment, Team, TeamMember,
  TicketCategoryItem, SecurityIncidentTypeItem, BusinessService, ServiceDependency, Vulnerability, CriticalityLevel, Supplier
} from './types';
import * as dataService from './services/dataService';
import Header from './components/Header';
import EquipmentDashboard from './components/Dashboard';
import AddEquipmentModal from './components/AddEquipmentModal';
import AssignEquipmentModal from './components/AssignEquipmentModal';
import CollaboratorDashboard from './components/CollaboratorDashboard';
import AddCollaboratorModal from './components/AddCollaboratorModal';
import EntidadeDashboard from './components/EntidadeDashboard';
import AddEntidadeModal from './components/AddEntidadeModal';
import InstituicaoDashboard from './components/InstituicaoDashboard';
import AddInstituicaoModal from './components/AddInstituicaoModal';
import ReportModal from './components/ReportModal';
import CollaboratorHistoryModal from './components/CollaboratorHistoryModal';
import LoginPage from './components/LoginPage';
import CollaboratorDetailModal from './components/CollaboratorDetailModal';
import TicketDashboard from './components/TicketDashboard';
import AddTicketModal from './components/AddTicketModal';
import TicketActivitiesModal from './components/TicketActivitiesModal';
import ConfigurationSetup from './components/ConfigurationSetup';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import ForgotPasswordModal from './components/ForgotPasswordModal';
import ResetPasswordModal from './components/ResetPasswordModal';
import CredentialsModal from './components/CredentialsModal';
import { getSupabase } from './services/supabaseClient';
// import { Session } from '@supabase/supabase-js';
import EquipmentTypeDashboard from './components/EquipmentTypeDashboard';
import AddEquipmentTypeModal from './components/AddEquipmentTypeModal';
import BrandDashboard from './components/BrandDashboard';
import AddBrandModal from './components/AddBrandModal';
import { ChatWidget } from './components/ChatWidget';
import LicenseDashboard from './components/LicenseDashboard';
import AddLicenseModal from './components/AddLicenseModal';
import ManageAssignedLicensesModal from './components/ManageAssignedLicensesModal';
import TeamDashboard from './components/TeamDashboard';
import AddTeamModal from './components/AddTeamModal';
import ManageTeamMembersModal from './components/ManageTeamMembersModal';
import NotificationsModal from './components/NotificationsModal';
import ImportModal, { ImportConfig } from './components/ImportModal';
import OverviewDashboard from './components/OverviewDashboard';
import CategoryDashboard from './components/CategoryDashboard';
import AddCategoryModal from './components/AddCategoryModal';
import SecurityIncidentTypeDashboard from './components/SecurityIncidentTypeDashboard';
import AddSecurityIncidentTypeModal from './components/AddSecurityIncidentTypeModal';
import ServiceDashboard from './components/ServiceDashboard';
import AddServiceModal from './components/AddServiceModal';
import ServiceDependencyModal from './components/ServiceDependencyModal';
import VulnerabilityDashboard from './components/VulnerabilityDashboard';
import AddVulnerabilityModal from './components/AddVulnerabilityModal';
import PrintPreviewModal from './components/PrintPreviewModal';
import AddEquipmentKitModal from './components/AddEquipmentKitModal';
import ConfirmationModal from './components/common/ConfirmationModal';
import CloseTicketModal from './components/CloseTicketModal';
import EquipmentHistoryModal from './components/EquipmentHistoryModal';
import SupplierDashboard from './components/SupplierDashboard';
import AddSupplierModal from './components/AddSupplierModal';

type Session = any;

const InnerApp: React.FC = () => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('overview');
    const [initialFilter, setInitialFilter] = useState<any>(null);
    
    // State for Data
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
    const [entidades, setEntidades] = useState<Entidade[]>([]);
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([]);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [ticketActivities, setTicketActivities] = useState<TicketActivity[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [collaboratorHistory, setCollaboratorHistory] = useState<CollaboratorHistory[]>([]);
    const [softwareLicenses, setSoftwareLicenses] = useState<SoftwareLicense[]>([]);
    const [licenseAssignments, setLicenseAssignments] = useState<LicenseAssignment[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [ticketCategories, setTicketCategories] = useState<TicketCategoryItem[]>([]);
    const [securityIncidentTypes, setSecurityIncidentTypes] = useState<SecurityIncidentTypeItem[]>([]);
    const [businessServices, setBusinessServices] = useState<BusinessService[]>([]);
    const [serviceDependencies, setServiceDependencies] = useState<ServiceDependency[]>([]);
    const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);

    // UI State
    const [isConfigured, setIsConfigured] = useState(!!localStorage.getItem('SUPABASE_URL'));
    const [currentUser, setCurrentUser] = useState<Collaborator | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    // Modals State
    const [showAddEquipment, setShowAddEquipment] = useState(false);
    const [equipmentToEdit, setEquipmentToEdit] = useState<Equipment | null>(null);
    const [showAssignEquipment, setShowAssignEquipment] = useState<Equipment | null>(null);
    const [showAddCollaborator, setShowAddCollaborator] = useState(false);
    const [collaboratorToEdit, setCollaboratorToEdit] = useState<Collaborator | null>(null);
    const [showAddEntidade, setShowAddEntidade] = useState(false);
    const [entidadeToEdit, setEntidadeToEdit] = useState<Entidade | null>(null);
    const [showAddInstituicao, setShowAddInstituicao] = useState(false);
    const [instituicaoToEdit, setInstituicaoToEdit] = useState<Instituicao | null>(null);
    const [showReport, setShowReport] = useState<{ type: 'equipment' | 'collaborator' | 'ticket' | 'licensing' | 'compliance' | 'bia', visible: boolean }>({ type: 'equipment', visible: false });
    const [historyCollaborator, setHistoryCollaborator] = useState<Collaborator | null>(null);
    const [detailCollaborator, setDetailCollaborator] = useState<Collaborator | null>(null);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [showResetPassword, setShowResetPassword] = useState(false);
    const [newCredentials, setNewCredentials] = useState<{email: string, password?: string} | null>(null);
    const [showAddTicket, setShowAddTicket] = useState(false);
    const [ticketToEdit, setTicketToEdit] = useState<Ticket | null>(null);
    const [ticketActivitiesModal, setTicketActivitiesModal] = useState<Ticket | null>(null);
    const [showAddType, setShowAddType] = useState(false);
    const [typeToEdit, setTypeToEdit] = useState<EquipmentType | null>(null);
    const [showAddBrand, setShowAddBrand] = useState(false);
    const [brandToEdit, setBrandToEdit] = useState<Brand | null>(null);
    const [activeChatCollaboratorId, setActiveChatCollaboratorId] = useState<string | null>(null);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [showAddLicense, setShowAddLicense] = useState(false);
    const [licenseToEdit, setLicenseToEdit] = useState<SoftwareLicense | null>(null);
    const [showManageLicenses, setShowManageLicenses] = useState<Equipment | null>(null);
    const [showAddTeam, setShowAddTeam] = useState(false);
    const [teamToEdit, setTeamToEdit] = useState<Team | null>(null);
    const [showManageTeamMembers, setShowManageTeamMembers] = useState<Team | null>(null);
    const [showNotifications, setShowNotifications] = useState(false);
    const [importConfig, setImportConfig] = useState<ImportConfig | null>(null);
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [categoryToEdit, setCategoryToEdit] = useState<TicketCategoryItem | null>(null);
    const [showAddIncidentType, setShowAddIncidentType] = useState(false);
    const [incidentTypeToEdit, setIncidentTypeToEdit] = useState<SecurityIncidentTypeItem | null>(null);
    const [showAddService, setShowAddService] = useState(false);
    const [serviceToEdit, setServiceToEdit] = useState<BusinessService | null>(null);
    const [showServiceDependencies, setShowServiceDependencies] = useState<BusinessService | null>(null);
    const [showAddVulnerability, setShowAddVulnerability] = useState(false);
    const [vulnerabilityToEdit, setVulnerabilityToEdit] = useState<Vulnerability | null>(null);
    const [securityReportHtml, setSecurityReportHtml] = useState<string | null>(null);
    const [showAddKit, setShowAddKit] = useState(false);
    const [kitInitialData, setKitInitialData] = useState<Partial<Equipment> | null>(null);
    const [confirmationModal, setConfirmationModal] = useState<{ show: boolean, title: string, message: string, onConfirm: () => void } | null>(null);
    const [showCloseTicket, setShowCloseTicket] = useState<Ticket | null>(null);
    const [equipmentForHistory, setEquipmentForHistory] = useState<Equipment | null>(null);
    const [showAddSupplier, setShowAddSupplier] = useState(false);
    const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);

    // Maps
    const brandMap = useMemo(() => new Map(brands.map(b => [b.id, b.name])), [brands]);
    const equipmentTypeMap = useMemo(() => new Map(equipmentTypes.map(t => [t.id, t.name])), [equipmentTypes]);
    const assignedEquipmentIds = useMemo(() => new Set(assignments.filter(a => !a.returnDate).map(a => a.equipmentId)), [assignments]);

    // Data Loading
    const refreshData = useCallback(async () => {
        if (!isConfigured) return;
        try {
            const data = await dataService.fetchAllData();
            setEquipment(data.equipment);
            setInstituicoes(data.instituicoes);
            setEntidades(data.entidades);
            setCollaborators(data.collaborators);
            setAssignments(data.assignments);
            setTickets(data.tickets);
            setTicketActivities(data.ticketActivities);
            setBrands(data.brands);
            setEquipmentTypes(data.equipmentTypes);
            setSoftwareLicenses(data.softwareLicenses);
            setLicenseAssignments(data.licenseAssignments);
            setTeams(data.teams);
            setTeamMembers(data.teamMembers);
            setMessages(data.messages);
            setCollaboratorHistory(data.collaboratorHistory);
            setTicketCategories(data.ticketCategories);
            setBusinessServices(data.businessServices);
            setServiceDependencies(data.serviceDependencies);
            setVulnerabilities(data.vulnerabilities);
            setSecurityIncidentTypes(data.securityIncidentTypes);
            setSuppliers(data.suppliers);
        } catch (error) {
            console.error("Failed to load data:", error);
        } finally {
            setLoading(false);
        }
    }, [isConfigured]);

    // Auth & Session
    useEffect(() => {
        if (!isConfigured) return;

        const supabase = getSupabase();
        (supabase.auth as any).getSession().then(({ data: { session } }: any) => {
            setSession(session);
            if (session) loadUser(session.user.id);
            else setLoading(false);
            
            // Check for password recovery flow
            const hash = window.location.hash;
            if (hash && hash.includes('type=recovery')) {
                setShowResetPassword(true);
            }
        });

        const { data: { subscription } } = (supabase.auth as any).onAuthStateChange((_event: any, session: any) => {
            setSession(session);
            if (session) loadUser(session.user.id);
            else {
                setCurrentUser(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, [isConfigured]);
    
    // Fetch data periodically or on load
    useEffect(() => {
        if (session) {
            refreshData();
            const interval = setInterval(refreshData, 30000); // Refresh every 30s
            return () => clearInterval(interval);
        }
    }, [session, refreshData]);

    const loadUser = async (userId: string) => {
        try {
             const data = await dataService.fetchAllData(); // Ensure we have data
             const user = data.collaborators.find((c: any) => c.id === userId);
             if (user) {
                 setCurrentUser(user);
                 // Update state with fetched data to avoid double fetch
                 setEquipment(data.equipment);
                 setInstituicoes(data.instituicoes);
                 setEntidades(data.entidades);
                 setCollaborators(data.collaborators);
                 setAssignments(data.assignments);
                 setTickets(data.tickets);
                 setTicketActivities(data.ticketActivities);
                 setBrands(data.brands);
                 setEquipmentTypes(data.equipmentTypes);
                 setSoftwareLicenses(data.softwareLicenses);
                 setLicenseAssignments(data.licenseAssignments);
                 setTeams(data.teams);
                 setTeamMembers(data.teamMembers);
                 setMessages(data.messages);
                 setCollaboratorHistory(data.collaboratorHistory);
                 setTicketCategories(data.ticketCategories);
                 setBusinessServices(data.businessServices);
                 setServiceDependencies(data.serviceDependencies);
                 setVulnerabilities(data.vulnerabilities);
                 setSecurityIncidentTypes(data.securityIncidentTypes);
                 setSuppliers(data.suppliers);
             } else {
                 console.warn("User logged in but not found in collaborators table");
             }
        } catch (e) {
            console.error("Error loading user data", e);
        } finally {
             setLoading(false);
        }
    };

    const handleLogin = async () => {
        return { success: true };
    };

    const handleLogout = async () => {
        const supabase = getSupabase();
        await (supabase.auth as any).signOut();
        setCurrentUser(null);
        setSession(null);
    };
    
    const handleGenerateSecurityReport = (ticket: Ticket) => {
        const entity = entidades.find(e => e.id === ticket.entidadeId);
        const requester = collaborators.find(c => c.id === ticket.collaboratorId);
        const technician = ticket.technicianId ? collaborators.find(c => c.id === ticket.technicianId) : null;
        const affectedEquipment = ticket.equipmentId ? equipment.find(e => e.id === ticket.equipmentId) : null;
        const activities = ticketActivities.filter(ta => ta.ticketId === ticket.id).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const collaboratorMap = new Map(collaborators.map(c => [c.id, c.fullName]));

        const html = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6;">
                <div style="border-bottom: 3px solid #c0392b; padding-bottom: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h1 style="margin: 0; font-size: 24px; color: #c0392b;">Notificação de Incidente de Segurança</h1>
                        <span style="font-size: 12px; color: #666; text-transform: uppercase;">Conformidade NIS2 / RGPD</span>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: bold; font-size: 14px;">ID: #${ticket.id.substring(0,8)}</div>
                        <div style="font-size: 12px;">Data: ${new Date().toLocaleDateString()}</div>
                    </div>
                </div>
                <div style="background-color: #f9f9f9; border: 1px solid #ddd; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
                    <h3 style="margin-top: 0; border-bottom: 1px solid #ccc; padding-bottom: 5px;">1. Identificação</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 5px; font-weight: bold; width: 30%;">Organização Afetada:</td>
                            <td style="padding: 5px;">${entity?.name || 'N/A'} (${entity?.codigo || '-'})</td>
                        </tr>
                         <tr>
                            <td style="padding: 5px; font-weight: bold;">Reportado Por:</td>
                            <td style="padding: 5px;">${requester?.fullName || 'N/A'} (${requester?.email || '-'})</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px; font-weight: bold;">Responsável Técnico:</td>
                            <td style="padding: 5px;">${technician?.fullName || 'Não atribuído'}</td>
                        </tr>
                    </table>
                </div>
                <div style="margin-bottom: 20px;">
                    <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 5px;">2. Detalhes do Incidente</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 5px; font-weight: bold; width: 30%;">Tipo de Incidente:</td>
                            <td style="padding: 5px; color: #c0392b; font-weight: bold;">${ticket.securityIncidentType || 'Genérico'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px; font-weight: bold;">Data/Hora Deteção:</td>
                            <td style="padding: 5px;">${new Date(ticket.requestDate).toLocaleString()}</td>
                        </tr>
                         <tr>
                            <td style="padding: 5px; font-weight: bold;">Estado Atual:</td>
                            <td style="padding: 5px;">${ticket.status}</td>
                        </tr>
                    </table>
                    <div style="margin-top: 10px;">
                        <span style="font-weight: bold; display: block; margin-bottom: 5px;">Descrição:</span>
                        <div style="padding: 10px; background-color: #fff; border: 1px solid #eee; font-style: italic;">
                            "${ticket.description}"
                        </div>
                    </div>
                </div>
                <div style="margin-bottom: 20px;">
                    <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 5px;">3. Análise de Impacto (C-I-A)</h3>
                    <table style="width: 100%; border: 1px solid #ddd; text-align: center; border-collapse: collapse;">
                        <thead style="background-color: #eee;">
                            <tr>
                                <th style="padding: 8px; border: 1px solid #ddd;">Criticidade Global</th>
                                <th style="padding: 8px; border: 1px solid #ddd;">Confidencialidade</th>
                                <th style="padding: 8px; border: 1px solid #ddd;">Integridade</th>
                                <th style="padding: 8px; border: 1px solid #ddd;">Disponibilidade</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; color: #c0392b;">${ticket.impactCriticality || 'N/A'}</td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${ticket.impactConfidentiality || 'N/A'}</td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${ticket.impactIntegrity || 'N/A'}</td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${ticket.impactAvailability || 'N/A'}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                ${affectedEquipment ? `
                <div style="margin-bottom: 20px;">
                    <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 5px;">4. Ativos Comprometidos</h3>
                     <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 5px; font-weight: bold; width: 30%;">Equipamento:</td>
                            <td style="padding: 5px;">${affectedEquipment.description}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px; font-weight: bold;">Marca/Modelo:</td>
                            <td style="padding: 5px;">${brands.find(b => b.id === affectedEquipment.brandId)?.name} / ${equipmentTypes.find(t => t.id === affectedEquipment.typeId)?.name}</td>
                        </tr>
                         <tr>
                            <td style="padding: 5px; font-weight: bold;">Nº Série:</td>
                            <td style="padding: 5px;">${affectedEquipment.serialNumber}</td>
                        </tr>
                    </table>
                </div>
                ` : ''}
                 <div style="margin-bottom: 20px;">
                    <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 5px;">5. Cronologia de Resposta</h3>
                    ${activities.length > 0 ? `
                        <ul style="list-style-type: none; padding: 0;">
                            ${activities.map(act => `
                                <li style="margin-bottom: 10px; padding-left: 15px; border-left: 2px solid #ccc;">
                                    <div style="font-size: 11px; color: #777;">${new Date(act.date).toLocaleString()} - ${collaboratorMap.get(act.technicianId) || 'Técnico'}</div>
                                    <div style="font-size: 13px;">${act.description}</div>
                                </li>
                            `).join('')}
                        </ul>
                    ` : '<p style="color: #777; font-style: italic;">Nenhuma intervenção registada até ao momento.</p>'}
                </div>
                <div style="margin-top: 50px; border-top: 2px solid #333; padding-top: 10px; display: flex; justify-content: space-between;">
                    <div style="text-align: center; width: 40%;">
                        <br><br>
                        <div style="border-top: 1px solid #999; font-size: 12px;">Assinatura do Responsável de Segurança</div>
                    </div>
                     <div style="text-align: center; width: 40%;">
                        <br><br>
                        <div style="border-top: 1px solid #999; font-size: 12px;">Data de Fecho / Aprovação</div>
                    </div>
                </div>
            </div>
        `;
        setSecurityReportHtml(html);
    };

    const simpleSaveWrapper = async (saveFn: Function, data: any, editId?: string) => {
        try {
            let result;
            if (editId) result = await saveFn(editId, data);
            else result = await saveFn(data);
            await refreshData();
            return result;
        } catch (e) {
            console.error(e);
            alert("Erro ao salvar dados. Verifique a consola.");
            return null;
        }
    };

    const handleDelete = (title: string, message: string, onConfirm: () => void) => {
        setConfirmationModal({ show: true, title, message, onConfirm: () => { onConfirm(); setConfirmationModal(null); } });
    };
    
    const expiringWarranties = useMemo(() => {
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);
        return equipment.filter(e => {
            if (!e.warrantyEndDate) return false;
            const date = new Date(e.warrantyEndDate);
            return date <= thirtyDaysFromNow; 
        });
    }, [equipment]);

    const expiringLicenses = useMemo(() => {
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);
        const usedSeatsMap = licenseAssignments.reduce((acc, assignment) => {
            acc.set(assignment.softwareLicenseId, (acc.get(assignment.softwareLicenseId) || 0) + 1);
            return acc;
        }, new Map<string, number>());

        return softwareLicenses.filter(l => {
            const isExpiring = l.expiryDate ? new Date(l.expiryDate) <= thirtyDaysFromNow : false;
            const used = usedSeatsMap.get(l.id) || 0;
            const isDepleted = l.totalSeats - used <= 0;
            return isExpiring || isDepleted;
        });
    }, [softwareLicenses, licenseAssignments]);

    const activeTickets = useMemo(() => {
        return tickets.filter(t => t.status !== TicketStatus.Finished && (!t.technicianId || t.technicianId === currentUser?.id));
    }, [tickets, currentUser]);

    const notificationCount = expiringWarranties.length + expiringLicenses.length + activeTickets.length;


    if (!isConfigured) {
        return <ConfigurationSetup onConfigured={() => { setIsConfigured(true); window.location.reload(); }} />;
    }

    if (loading) {
        return <div className="min-h-screen bg-background-dark flex items-center justify-center text-white">A carregar sistema...</div>;
    }

    if (!currentUser) {
        return <LoginPage onLogin={handleLogin} onForgotPassword={() => setShowForgotPassword(true)} />;
    }
    
    const tabConfig: any = {
        'overview': 'Visão Geral',
        'equipment.inventory': 'Inventário',
        'equipment.brands': 'Marcas',
        'equipment.types': 'Tipos',
        'organizacao.instituicoes': 'Instituições',
        'organizacao.entidades': 'Entidades',
        'organizacao.teams': 'Equipas',
        'collaborators': 'Colaboradores',
        'licensing': 'Licenciamento',
        'organizacao.suppliers': 'Fornecedores (Risco)',
        'tickets': { title: 'Tickets', list: 'Lista de Tickets', categories: 'Categorias', incident_types: 'Tipos de Incidente' },
        'nis2': { title: 'Norma (NIS2)', bia: 'BIA (Serviços)', security: 'Segurança (CVE)' }
    };

    return (
        <div className="min-h-screen bg-background-dark flex flex-col">
            <Header 
                currentUser={currentUser} 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
                onLogout={handleLogout}
                tabConfig={tabConfig}
                notificationCount={notificationCount}
                onNotificationClick={() => setShowNotifications(true)}
            />

            <main className="flex-grow max-w-screen-xl mx-auto w-full p-4 sm:p-6 lg:p-8">
                {activeTab === 'overview' && (
                    <OverviewDashboard
                        equipment={equipment}
                        instituicoes={instituicoes}
                        entidades={entidades}
                        assignments={assignments}
                        equipmentTypes={equipmentTypes}
                        tickets={tickets}
                        collaborators={collaborators}
                        teams={teams}
                        expiringWarranties={expiringWarranties}
                        expiringLicenses={expiringLicenses}
                        softwareLicenses={softwareLicenses}
                        licenseAssignments={licenseAssignments}
                        businessServices={businessServices}
                        vulnerabilities={vulnerabilities}
                        onViewItem={(tab, filter) => { setActiveTab(tab); setInitialFilter(filter); }}
                        onGenerateComplianceReport={() => { setShowReport({ type: 'compliance', visible: true }); }}
                    />
                )}

                {activeTab === 'tickets.list' && (
                    <TicketDashboard
                        tickets={tickets}
                        escolasDepartamentos={entidades}
                        collaborators={collaborators}
                        teams={teams}
                        equipment={equipment}
                        equipmentTypes={equipmentTypes}
                        categories={ticketCategories}
                        initialFilter={initialFilter}
                        onClearInitialFilter={() => setInitialFilter(null)}
                        onUpdateTicket={(t) => simpleSaveWrapper(dataService.updateTicket, t, t.id)}
                        onEdit={(t) => { setTicketToEdit(t); setShowAddTicket(true); }}
                        onOpenCloseTicketModal={(t) => setShowCloseTicket(t)}
                        onOpenActivities={(t) => setTicketActivitiesModal(t)}
                        onGenerateReport={() => setShowReport({ type: 'ticket', visible: true })}
                        onGenerateSecurityReport={handleGenerateSecurityReport}
                    />
                )}
                
                    {activeTab === 'equipment.inventory' && (
                        <EquipmentDashboard 
                            equipment={equipment}
                            brands={brands}
                            equipmentTypes={equipmentTypes}
                            brandMap={brandMap}
                            equipmentTypeMap={equipmentTypeMap}
                            assignedEquipmentIds={assignedEquipmentIds}
                            assignments={assignments}
                            collaborators={collaborators}
                            entidades={entidades}
                            initialFilter={initialFilter}
                            onClearInitialFilter={() => setInitialFilter(null)}
                            onAssign={(eq) => setShowAssignEquipment(eq)}
                            onShowHistory={(eq) => setEquipmentForHistory(eq)}
                            onEdit={(eq) => { setEquipmentToEdit(eq); setShowAddEquipment(true); }}
                            businessServices={businessServices}
                            serviceDependencies={serviceDependencies}
                            onGenerateReport={() => setShowReport({ type: 'equipment', visible: true })}
                            onManageKeys={(eq) => setShowManageLicenses(eq)}
                            onCreate={() => { setEquipmentToEdit(null); setShowAddEquipment(true); }}
                        />
                    )}
                
                {activeTab === 'equipment.brands' && (
                    <BrandDashboard
                        brands={brands}
                        equipment={equipment}
                        onEdit={(b) => { setBrandToEdit(b); setShowAddBrand(true); }}
                        onDelete={(id) => handleDelete('Excluir Marca', 'Tem a certeza que deseja excluir esta marca? Esta ação não pode ser desfeita.', () => simpleSaveWrapper(dataService.deleteBrand, id))}
                        onCreate={() => { setBrandToEdit(null); setShowAddBrand(true); }}
                    />
                )}

                {activeTab === 'equipment.types' && (
                    <EquipmentTypeDashboard
                        equipmentTypes={equipmentTypes}
                        equipment={equipment}
                        onEdit={(t) => { setTypeToEdit(t); setShowAddType(true); }}
                        onDelete={(id) => handleDelete('Excluir Tipo de Equipamento', 'Tem a certeza que deseja excluir este tipo? Esta ação não pode ser desfeita.', () => simpleSaveWrapper(dataService.deleteEquipmentType, id))}
                        onCreate={() => { setTypeToEdit(null); setShowAddType(true); }}
                    />
                )}

                {activeTab === 'organizacao.instituicoes' && (
                    <InstituicaoDashboard
                        instituicoes={instituicoes}
                        escolasDepartamentos={entidades}
                        onEdit={(i) => { setInstituicaoToEdit(i); setShowAddInstituicao(true); }}
                        onDelete={(id) => handleDelete('Excluir Instituição', 'Tem a certeza que deseja excluir esta instituição?', () => simpleSaveWrapper(dataService.deleteInstituicao, id))}
                        onCreate={() => { setInstituicaoToEdit(null); setShowAddInstituicao(true); }}
                    />
                )}

                {activeTab === 'organizacao.entidades' && (
                    <EntidadeDashboard
                        escolasDepartamentos={entidades}
                        instituicoes={instituicoes}
                        collaborators={collaborators}
                        assignments={assignments}
                        tickets={tickets}
                        collaboratorHistory={collaboratorHistory}
                        onEdit={(e) => { setEntidadeToEdit(e); setShowAddEntidade(true); }}
                        onDelete={(id) => handleDelete('Excluir Entidade', 'Tem a certeza que deseja excluir esta entidade?', () => simpleSaveWrapper(dataService.deleteEntidade, id))}
                        onCreate={() => { setEntidadeToEdit(null); setShowAddEntidade(true); }}
                        onToggleStatus={(id) => {
                            const ent = entidades.find(e => e.id === id);
                            if (ent) {
                                const newStatus = ent.status === 'Ativo' ? 'Inativo' : 'Ativo';
                                simpleSaveWrapper(dataService.updateEntidade, { status: newStatus }, id);
                            }
                        }}
                    />
                )}

                {activeTab === 'collaborators' && (
                    <CollaboratorDashboard
                        collaborators={collaborators}
                        escolasDepartamentos={entidades}
                        equipment={equipment}
                        assignments={assignments}
                        tickets={tickets}
                        ticketActivities={ticketActivities}
                        teamMembers={teamMembers}
                        collaboratorHistory={collaboratorHistory}
                        messages={messages}
                        currentUser={currentUser}
                        onEdit={(c) => { setCollaboratorToEdit(c); setShowAddCollaborator(true); }}
                        onDelete={(id) => handleDelete('Excluir Colaborador', 'Tem a certeza que deseja excluir este colaborador?', () => simpleSaveWrapper(dataService.deleteCollaborator, id))}
                        onShowHistory={(c) => { setHistoryCollaborator(c); }}
                        onShowDetails={(c) => { setDetailCollaborator(c); }}
                        onGenerateReport={() => setShowReport({ type: 'collaborator', visible: true })}
                        onStartChat={(c) => { setActiveChatCollaboratorId(c.id); setIsChatOpen(true); }}
                        onCreate={() => { setCollaboratorToEdit(null); setShowAddCollaborator(true); }}
                        onToggleStatus={(id) => {
                            const col = collaborators.find(c => c.id === id);
                            if (col) {
                                const newStatus = col.status === 'Ativo' ? 'Inativo' : 'Ativo';
                                simpleSaveWrapper(dataService.updateCollaborator, { status: newStatus }, id);
                            }
                        }}
                    />
                )}

                {activeTab === 'licensing' && (
                    <LicenseDashboard
                        licenses={softwareLicenses}
                        licenseAssignments={licenseAssignments}
                        equipmentData={equipment}
                        assignments={assignments}
                        collaborators={collaborators}
                        brandMap={brandMap}
                        equipmentTypeMap={equipmentTypeMap}
                        initialFilter={initialFilter}
                        onClearInitialFilter={() => setInitialFilter(null)}
                        onEdit={(l) => { setLicenseToEdit(l); setShowAddLicense(true); }}
                        onDelete={(id) => handleDelete('Excluir Licença', 'Tem a certeza que deseja excluir esta licença?', () => simpleSaveWrapper(dataService.deleteLicense, id))}
                        onToggleStatus={(id) => {
                            const lic = softwareLicenses.find(l => l.id === id);
                            if (lic) {
                                const newStatus = lic.status === 'Ativo' ? 'Inativo' : 'Ativo';
                                simpleSaveWrapper(dataService.updateLicense, { status: newStatus }, id);
                            }
                        }}
                        onGenerateReport={() => setShowReport({ type: 'licensing', visible: true })}
                        businessServices={businessServices}
                        serviceDependencies={serviceDependencies}
                        onCreate={() => { setLicenseToEdit(null); setShowAddLicense(true); }}
                    />
                )}

                {activeTab === 'organizacao.teams' && (
                    <TeamDashboard
                        teams={teams}
                        teamMembers={teamMembers}
                        collaborators={collaborators}
                        tickets={tickets}
                        equipmentTypes={equipmentTypes}
                        onEdit={(t) => { setTeamToEdit(t); setShowAddTeam(true); }}
                        onDelete={(id) => handleDelete('Excluir Equipa', 'Tem a certeza que deseja excluir esta equipa?', () => simpleSaveWrapper(dataService.deleteTeam, id))}
                        onManageMembers={(t) => { setTeamToEdit(t); setShowManageTeamMembers(t); }}
                        onCreate={() => { setTeamToEdit(null); setShowAddTeam(true); }}
                    />
                )}

                {activeTab === 'organizacao.suppliers' && (
                    <SupplierDashboard
                        suppliers={suppliers}
                        onEdit={(s) => { setSupplierToEdit(s); setShowAddSupplier(true); }}
                        onDelete={(id) => handleDelete('Excluir Fornecedor', 'Tem a certeza? Esta ação não pode ser desfeita.', () => simpleSaveWrapper(dataService.deleteSupplier, id))}
                        onCreate={() => { setSupplierToEdit(null); setShowAddSupplier(true); }}
                    />
                )}

                {activeTab === 'tickets.categories' && (
                    <CategoryDashboard
                        categories={ticketCategories}
                        tickets={tickets}
                        teams={teams}
                        onEdit={(c) => { setCategoryToEdit(c); setShowAddCategory(true); }}
                        onDelete={(id) => handleDelete('Excluir Categoria', 'Tem a certeza que deseja excluir esta categoria?', () => simpleSaveWrapper(dataService.deleteTicketCategory, id))}
                        onCreate={() => { setCategoryToEdit(null); setShowAddCategory(true); }}
                        onToggleStatus={(id) => {
                            const cat = ticketCategories.find(c => c.id === id);
                            if (cat) simpleSaveWrapper(dataService.updateTicketCategory, { is_active: !cat.is_active }, id);
                        }}
                    />
                )}

                {activeTab === 'tickets.incident_types' && (
                    <SecurityIncidentTypeDashboard
                        incidentTypes={securityIncidentTypes}
                        tickets={tickets}
                        onEdit={(t) => { setIncidentTypeToEdit(t); setShowAddIncidentType(true); }}
                        onDelete={(id) => handleDelete('Excluir Tipo de Incidente', 'Tem a certeza que deseja excluir este tipo?', () => simpleSaveWrapper(dataService.deleteSecurityIncidentType, id))}
                        onCreate={() => { setIncidentTypeToEdit(null); setShowAddIncidentType(true); }}
                        onToggleStatus={(id) => {
                            const type = securityIncidentTypes.find(t => t.id === id);
                            if (type) simpleSaveWrapper(dataService.updateSecurityIncidentType, { is_active: !type.is_active }, id);
                        }}
                    />
                )}

                {activeTab === 'nis2.bia' && (
                    <ServiceDashboard
                        services={businessServices}
                        dependencies={serviceDependencies}
                        collaborators={collaborators}
                        onEdit={(s) => { setServiceToEdit(s); setShowAddService(true); }}
                        onDelete={(id) => handleDelete('Excluir Serviço BIA', 'Tem a certeza? Isto removerá todas as dependências mapeadas.', () => simpleSaveWrapper(dataService.deleteBusinessService, id))}
                        onManageDependencies={(s) => { setServiceToEdit(s); setShowServiceDependencies(s); }}
                        onCreate={() => { setServiceToEdit(null); setShowAddService(true); }}
                        onGenerateReport={() => setShowReport({ type: 'bia', visible: true })}
                    />
                )}

                {activeTab === 'nis2.security' && (
                    <VulnerabilityDashboard
                        vulnerabilities={vulnerabilities}
                        initialFilter={initialFilter}
                        onClearInitialFilter={() => setInitialFilter(null)}
                        onEdit={(v) => { setVulnerabilityToEdit(v); setShowAddVulnerability(true); }}
                        onDelete={(id) => handleDelete('Excluir Vulnerabilidade', 'Tem a certeza que deseja excluir este registo?', () => simpleSaveWrapper(dataService.deleteVulnerability, id))}
                        onCreate={() => { setVulnerabilityToEdit(null); setShowAddVulnerability(true); }}
                    />
                )}

            </main>

            {/* --- MODALS --- */}
            {securityReportHtml && (
                <PrintPreviewModal 
                    onClose={() => setSecurityReportHtml(null)} 
                    reportContentHtml={securityReportHtml} 
                />
            )}
            
            {equipmentForHistory && (
                <EquipmentHistoryModal
                    equipment={equipmentForHistory}
                    assignments={assignments}
                    collaborators={collaborators}
                    escolasDepartamentos={entidades}
                    tickets={tickets}
                    ticketActivities={ticketActivities}
                    businessServices={businessServices}
                    serviceDependencies={serviceDependencies}
                    softwareLicenses={softwareLicenses}
                    licenseAssignments={licenseAssignments}
                    vulnerabilities={vulnerabilities}
                    onClose={() => setEquipmentForHistory(null)}
                    suppliers={suppliers}
                />
            )}

            {showAddTicket && (
                <AddTicketModal
                    onClose={() => { setShowAddTicket(false); setTicketToEdit(null); }}
                    onSave={(t) => {
                        if (ticketToEdit) return simpleSaveWrapper(dataService.updateTicket, t, ticketToEdit.id);
                        else return simpleSaveWrapper(dataService.addTicket, t);
                    }}
                    ticketToEdit={ticketToEdit}
                    escolasDepartamentos={entidades}
                    collaborators={collaborators}
                    teams={teams}
                    currentUser={currentUser}
                    userPermissions={{ viewScope: 'all' }}
                    equipment={equipment}
                    equipmentTypes={equipmentTypes}
                    assignments={assignments}
                    categories={ticketCategories}
                    securityIncidentTypes={securityIncidentTypes}
                />
            )}

            {showReport.visible && (
                <ReportModal
                    type={showReport.type}
                    onClose={() => setShowReport({ ...showReport, visible: false })}
                    equipment={equipment}
                    brandMap={brandMap}
                    equipmentTypeMap={equipmentTypeMap}
                    instituicoes={instituicoes}
                    escolasDepartamentos={entidades}
                    collaborators={collaborators}
                    assignments={assignments}
                    tickets={tickets}
                    softwareLicenses={softwareLicenses}
                    licenseAssignments={licenseAssignments}
                    businessServices={businessServices}
                    serviceDependencies={serviceDependencies}
                />
            )}
                {showNotifications && (
                <NotificationsModal
                    onClose={() => setShowNotifications(false)}
                    expiringWarranties={expiringWarranties}
                    expiringLicenses={expiringLicenses}
                    teamTickets={activeTickets}
                    collaborators={collaborators}
                    teams={teams}
                    onViewItem={(tab, filter) => { setShowNotifications(false); setActiveTab(tab); setInitialFilter(filter); }}
                    onSnooze={(id) => dataService.snoozeNotification(currentUser.id, id, 'ticket').then(refreshData)}
                    currentUser={currentUser}
                    licenseAssignments={licenseAssignments}
                />
            )}

                {confirmationModal && (
                <ConfirmationModal
                    title={confirmationModal.title}
                    message={confirmationModal.message}
                    onConfirm={confirmationModal.onConfirm}
                    onClose={() => setConfirmationModal(null)}
                />
            )}

            {showAddEquipment && (
                <AddEquipmentModal
                    onClose={() => { setShowAddEquipment(false); setEquipmentToEdit(null); }}
                    onSave={(eq) => {
                        if (equipmentToEdit) return simpleSaveWrapper(dataService.updateEquipment, eq, equipmentToEdit.id);
                        else return simpleSaveWrapper(dataService.addEquipment, eq);
                    }}
                    brands={brands}
                    equipmentTypes={equipmentTypes}
                    equipmentToEdit={equipmentToEdit}
                    onSaveBrand={(b) => dataService.addBrand(b).then(res => { refreshData(); return res; })}
                    onSaveEquipmentType={(t) => dataService.addEquipmentType(t).then(res => { refreshData(); return res; })}
                    onOpenKitModal={(data) => {
                        setShowAddEquipment(false);
                        setKitInitialData(data);
                        setShowAddKit(true);
                    }}
                    suppliers={suppliers}
                />
            )}

            {showAssignEquipment && (
                <AssignEquipmentModal
                    equipment={showAssignEquipment}
                    brandMap={brandMap}
                    equipmentTypeMap={equipmentTypeMap}
                    escolasDepartamentos={entidades}
                    collaborators={collaborators}
                    onClose={() => setShowAssignEquipment(null)}
                    onAssign={(a) => simpleSaveWrapper(dataService.addAssignment, a)}
                />
            )}

            {showAddCollaborator && (
                <AddCollaboratorModal
                    onClose={() => { setShowAddCollaborator(false); setCollaboratorToEdit(null); }}
                    onSave={async (col, password) => {
                        try {
                            let result;
                            if (collaboratorToEdit) result = await dataService.updateCollaborator(collaboratorToEdit.id, col);
                            else result = await dataService.addCollaborator(col);
                            
                            if (password && result) {
                                const supabase = getSupabase();
                                const { error } = await (supabase.auth as any).signUp({
                                    email: col.email,
                                    password: password,
                                    options: { data: { collaborator_id: result.id } }
                                });
                                if (!error) setNewCredentials({ email: col.email, password });
                            }
                            await refreshData();
                        } catch (e) { console.error(e); alert("Erro ao salvar colaborador."); }
                    }}
                    collaboratorToEdit={collaboratorToEdit}
                    escolasDepartamentos={entidades}
                    currentUser={currentUser}
                />
            )}

            {showAddEntidade && (
                <AddEntidadeModal
                    onClose={() => { setShowAddEntidade(false); setEntidadeToEdit(null); }}
                    onSave={(e) => {
                        if (entidadeToEdit) return simpleSaveWrapper(dataService.updateEntidade, e, entidadeToEdit.id);
                        else return simpleSaveWrapper(dataService.addEntidade, e);
                    }}
                    entidadeToEdit={entidadeToEdit}
                    instituicoes={instituicoes}
                />
            )}

            {showAddInstituicao && (
                <AddInstituicaoModal
                    onClose={() => { setShowAddInstituicao(false); setInstituicaoToEdit(null); }}
                    onSave={(i) => {
                        if (instituicaoToEdit) return simpleSaveWrapper(dataService.updateInstituicao, i, instituicaoToEdit.id);
                        else return simpleSaveWrapper(dataService.addInstituicao, i);
                    }}
                    instituicaoToEdit={instituicaoToEdit}
                />
            )}

            {showAddBrand && (
                <AddBrandModal
                    onClose={() => { setShowAddBrand(false); setBrandToEdit(null); }}
                    onSave={(b) => {
                        if (brandToEdit) return simpleSaveWrapper(dataService.updateBrand, b, brandToEdit.id);
                        else return simpleSaveWrapper(dataService.addBrand, b);
                    }}
                    brandToEdit={brandToEdit}
                />
            )}

            {showAddType && (
                <AddEquipmentTypeModal
                    onClose={() => { setShowAddType(false); setTypeToEdit(null); }}
                    onSave={(t) => {
                        if (typeToEdit) return simpleSaveWrapper(dataService.updateEquipmentType, t, typeToEdit.id);
                        else return simpleSaveWrapper(dataService.addEquipmentType, t);
                    }}
                    typeToEdit={typeToEdit}
                    teams={teams}
                />
            )}

            {showAddLicense && (
                <AddLicenseModal
                    onClose={() => { setShowAddLicense(false); setLicenseToEdit(null); }}
                    onSave={(l) => {
                        if (licenseToEdit) return simpleSaveWrapper(dataService.updateLicense, l, licenseToEdit.id);
                        else return simpleSaveWrapper(dataService.addLicense, l);
                    }}
                    licenseToEdit={licenseToEdit}
                    suppliers={suppliers}
                />
            )}

            {showAddTeam && (
                <AddTeamModal
                    onClose={() => { setShowAddTeam(false); setTeamToEdit(null); }}
                    onSave={(t) => {
                        if (teamToEdit) return simpleSaveWrapper(dataService.updateTeam, t, teamToEdit.id);
                        else return simpleSaveWrapper(dataService.addTeam, t);
                    }}
                    teamToEdit={teamToEdit}
                />
            )}

            {showAddCategory && (
                <AddCategoryModal
                    onClose={() => { setShowAddCategory(false); setCategoryToEdit(null); }}
                    onSave={(c) => {
                        if (categoryToEdit) return simpleSaveWrapper(dataService.updateTicketCategory, c, categoryToEdit.id);
                        else return simpleSaveWrapper(dataService.addTicketCategory, c);
                    }}
                    categoryToEdit={categoryToEdit}
                    teams={teams}
                />
            )}

            {showAddIncidentType && (
                <AddSecurityIncidentTypeModal
                    onClose={() => { setShowAddIncidentType(false); setIncidentTypeToEdit(null); }}
                    onSave={(t) => {
                        if (incidentTypeToEdit) return simpleSaveWrapper(dataService.updateSecurityIncidentType, t, incidentTypeToEdit.id);
                        else return simpleSaveWrapper(dataService.addSecurityIncidentType, t);
                    }}
                    typeToEdit={incidentTypeToEdit}
                />
            )}

            {showAddService && (
                <AddServiceModal
                    onClose={() => { setShowAddService(false); setServiceToEdit(null); }}
                    onSave={(s) => {
                        if (serviceToEdit) return simpleSaveWrapper(dataService.updateBusinessService, s, serviceToEdit.id);
                        else return simpleSaveWrapper(dataService.addBusinessService, s);
                    }}
                    serviceToEdit={serviceToEdit}
                    collaborators={collaborators}
                    suppliers={suppliers}
                />
            )}

            {showAddVulnerability && (
                <AddVulnerabilityModal
                    onClose={() => { setShowAddVulnerability(false); setVulnerabilityToEdit(null); }}
                    onSave={(v) => {
                        if (vulnerabilityToEdit) return simpleSaveWrapper(dataService.updateVulnerability, v, vulnerabilityToEdit.id);
                        else return simpleSaveWrapper(dataService.addVulnerability, v);
                    }}
                    vulnToEdit={vulnerabilityToEdit}
                />
            )}
            
            {showAddSupplier && (
                <AddSupplierModal
                    onClose={() => { setShowAddSupplier(false); setSupplierToEdit(null); }}
                    onSave={(s) => {
                        if (supplierToEdit) return simpleSaveWrapper(dataService.updateSupplier, s, supplierToEdit.id);
                        else return simpleSaveWrapper(dataService.addSupplier, s);
                    }}
                    supplierToEdit={supplierToEdit}
                />
            )}

            {showAddKit && (
                <AddEquipmentKitModal
                    onClose={() => { setShowAddKit(false); setKitInitialData(null); }}
                    onSaveKit={(items) => simpleSaveWrapper(dataService.addMultipleEquipment, items)}
                    brands={brands}
                    equipmentTypes={equipmentTypes}
                    initialData={kitInitialData}
                    onSaveEquipmentType={(t) => dataService.addEquipmentType(t)}
                    equipment={equipment}
                />
            )}

            {historyCollaborator && (
                <CollaboratorHistoryModal
                    collaborator={historyCollaborator}
                    history={collaboratorHistory}
                    escolasDepartamentos={entidades}
                    onClose={() => setHistoryCollaborator(null)}
                />
            )}

            {detailCollaborator && (
                <CollaboratorDetailModal
                    collaborator={detailCollaborator}
                    assignments={assignments}
                    equipment={equipment}
                    tickets={tickets}
                    brandMap={brandMap}
                    equipmentTypeMap={equipmentTypeMap}
                    onClose={() => setDetailCollaborator(null)}
                    onShowHistory={(c) => { setDetailCollaborator(null); setHistoryCollaborator(c); }}
                    onStartChat={(c) => { setDetailCollaborator(null); setActiveChatCollaboratorId(c.id); setIsChatOpen(true); }}
                />
            )}

            {ticketActivitiesModal && (
                <TicketActivitiesModal
                    ticket={ticketActivitiesModal}
                    activities={ticketActivities.filter(a => a.ticketId === ticketActivitiesModal.id)}
                    collaborators={collaborators}
                    currentUser={currentUser}
                    equipment={equipment}
                    equipmentTypes={equipmentTypes}
                    entidades={entidades}
                    assignments={assignments}
                    onClose={() => setTicketActivitiesModal(null)}
                    onAddActivity={(act) => simpleSaveWrapper(dataService.addTicketActivity, { ...act, ticketId: ticketActivitiesModal.id, technicianId: currentUser?.id })}
                />
            )}

            {showCloseTicket && (
                <CloseTicketModal
                    ticket={showCloseTicket}
                    collaborators={collaborators}
                    onClose={() => setShowCloseTicket(null)}
                    onConfirm={(technicianId) => {
                        const now = new Date().toISOString();
                        simpleSaveWrapper(dataService.updateTicket, { status: TicketStatus.Finished, finishDate: now, technicianId }, showCloseTicket.id);
                        setShowCloseTicket(null);
                    }}
                />
            )}

            {showManageLicenses && (
                <ManageAssignedLicensesModal
                    equipment={showManageLicenses}
                    allLicenses={softwareLicenses}
                    allAssignments={licenseAssignments}
                    onClose={() => setShowManageLicenses(null)}
                    onSave={(eqId, licIds) => {
                        simpleSaveWrapper(dataService.syncLicenseAssignments, licIds, eqId);
                        setShowManageLicenses(null);
                    }}
                />
            )}

            {showManageTeamMembers && (
                <ManageTeamMembersModal
                    team={showManageTeamMembers}
                    allCollaborators={collaborators}
                    teamMembers={teamMembers}
                    onClose={() => setShowManageTeamMembers(null)}
                    onSave={async (teamId, memberIds) => {
                        await dataService.syncTeamMembers(teamId, memberIds);
                        await refreshData();
                        setShowManageTeamMembers(null);
                    }}
                />
            )}

            {showServiceDependencies && (
                <ServiceDependencyModal
                    service={showServiceDependencies}
                    dependencies={serviceDependencies.filter(d => d.service_id === showServiceDependencies.id)}
                    allEquipment={equipment}
                    allLicenses={softwareLicenses}
                    onClose={() => setShowServiceDependencies(null)}
                    onAddDependency={(dep) => simpleSaveWrapper(dataService.addServiceDependency, dep)}
                    onRemoveDependency={(id) => simpleSaveWrapper(dataService.deleteServiceDependency, null, id)} 
                />
            )}

            {newCredentials && (
                <CredentialsModal
                    onClose={() => setNewCredentials(null)}
                    email={newCredentials.email}
                    password={newCredentials.password}
                />
            )}

            {showForgotPassword && <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />}
            {showResetPassword && session && <ResetPasswordModal onClose={() => setShowResetPassword(false)} session={session} />}

            {currentUser && (
                <>
                    <ChatWidget 
                        currentUser={currentUser} 
                        collaborators={collaborators} 
                        messages={messages} 
                        onSendMessage={(receiverId, content) => simpleSaveWrapper(dataService.addMessage, { senderId: currentUser.id, receiverId, content })} 
                        onMarkMessagesAsRead={(senderId) => dataService.markMessagesAsRead(senderId, currentUser.id).then(refreshData)}
                        isOpen={isChatOpen}
                        onToggle={() => setIsChatOpen(!isChatOpen)}
                        activeChatCollaboratorId={activeChatCollaboratorId}
                        onSelectConversation={(id) => setActiveChatCollaboratorId(id)}
                        unreadMessagesCount={messages.filter(m => m.receiverId === currentUser.id && !m.read).length}
                    />
                </>
            )}

        </div>
    );
};

export const App: React.FC = () => {
    return (
        <LanguageProvider>
            <InnerApp />
        </LanguageProvider>
    );
};