
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import LoginPage from './components/LoginPage';
import ConfigurationSetup from './components/ConfigurationSetup';
import OverviewDashboard from './components/OverviewDashboard';
import EquipmentDashboard from './components/Dashboard';
import CollaboratorDashboard from './components/CollaboratorDashboard';
import InstituicaoDashboard from './components/InstituicaoDashboard';
import EntidadeDashboard from './components/EntidadeDashboard';
import LicenseDashboard from './components/LicenseDashboard';
import TicketDashboard from './components/TicketDashboard';
import TeamDashboard from './components/TeamDashboard';
import EquipmentTypeDashboard from './components/EquipmentTypeDashboard';
import BrandDashboard from './components/BrandDashboard';
import { ImportConfig } from './components/ImportModal';
import ManageAssignedLicensesModal from './components/ManageAssignedLicensesModal';
import * as dataService from './services/dataService';
import { getSupabase } from './services/supabaseClient';
import { 
    Equipment, Instituicao, Entidade, Collaborator, Assignment, EquipmentType, Brand, 
    Ticket, TicketActivity, CollaboratorHistory, Message, SoftwareLicense, LicenseAssignment, 
    Team, TeamMember, EquipmentStatus, TicketStatus
} from './types';

export const App = () => {
    // Auth & Config State
    const [session, setSession] = useState<any>(null);
    const [isConfigured, setIsConfigured] = useState(false);
    const [currentUser, setCurrentUser] = useState<Collaborator | null>(null);
    const [activeTab, setActiveTab] = useState('overview');
    
    // Data State
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
    const [entidades, setEntidades] = useState<Entidade[]>([]);
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [ticketActivities, setTicketActivities] = useState<TicketActivity[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([]);
    const [softwareLicenses, setSoftwareLicenses] = useState<SoftwareLicense[]>([]);
    const [licenseAssignments, setLicenseAssignments] = useState<LicenseAssignment[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    
    // Modal State for Licensing
    const [manageLicensesEquipment, setManageLicensesEquipment] = useState<Equipment | null>(null);

    // Computed Maps
    const brandMap = React.useMemo(() => new Map(brands.map(b => [b.id, b.name])), [brands]);
    const equipmentTypeMap = React.useMemo(() => new Map(equipmentTypes.map(t => [t.id, t.name])), [equipmentTypes]);
    const assignedEquipmentIds = React.useMemo(() => new Set(assignments.filter(a => !a.returnDate).map(a => a.equipmentId)), [assignments]);
    
    // Initial Filter State for Dashboards (passed from Overview)
    const [dashboardFilter, setDashboardFilter] = useState<any>(null);

    // Check Config & Auth on Mount
    useEffect(() => {
        const checkConfig = () => {
            const url = localStorage.getItem('SUPABASE_URL');
            const key = localStorage.getItem('SUPABASE_ANON_KEY');
            const apiKey = localStorage.getItem('API_KEY');
            if (url && key && apiKey) setIsConfigured(true);
        };
        checkConfig();
    }, []);

    const refreshData = async () => {
         try {
            const data = await dataService.fetchAllData();
            setEquipment(data.equipment);
            setInstituicoes(data.instituicoes);
            setEntidades(data.entidades);
            setCollaborators(data.collaborators);
            setEquipmentTypes(data.equipmentTypes);
            setBrands(data.brands);
            setAssignments(data.assignments);
            setTickets(data.tickets);
            setTicketActivities(data.ticketActivities);
            setSoftwareLicenses(data.softwareLicenses);
            setLicenseAssignments(data.licenseAssignments);
            setTeams(data.teams);
            setTeamMembers(data.teamMembers);
        } catch (error) {
            console.error("Error loading data", error);
        }
    };

    useEffect(() => {
        if (isConfigured) {
             const supabase = getSupabase();
             supabase.auth.getSession().then(({ data: { session } }) => {
                setSession(session);
                if (session) refreshData();
             });

             const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
                setSession(session);
                if (session) refreshData();
             });
             return () => subscription.unsubscribe();
        }
    }, [isConfigured]);
    
    useEffect(() => {
        if (session?.user?.email && collaborators.length > 0) {
            const user = collaborators.find(c => c.email === session.user.email);
            setCurrentUser(user || null);
        }
    }, [session, collaborators]);

    const handleImport = async (dataType: ImportConfig['dataType'], data: any[]) => {
        try {
            let count = 0;
            if (dataType === 'collaborators') {
                const { data: inserted } = await dataService.addMultipleCollaborators(data as any);
                count = inserted ? inserted.length : 0;
                if (inserted) {
                    // Force cast to bypass TS mismatch between Supabase response and state type
                    setCollaborators(prev => [...prev, ...(inserted as any[] as Collaborator[])]);
                }
            } else if (dataType === 'instituicoes') {
                 const { data: inserted } = await dataService.addMultipleInstituicoes(data as any);
                 count = inserted ? inserted.length : 0;
                 if (inserted) {
                     setInstituicoes(prev => [...prev, ...(inserted as any[] as Instituicao[])]);
                 }
            } else if (dataType === 'entidades') {
                 const { data: inserted } = await dataService.addMultipleEntidades(data as any);
                 count = inserted ? inserted.length : 0;
                 if (inserted) {
                     setEntidades(prev => [...prev, ...(inserted as any[] as Entidade[])]);
                 }
            }
            return { success: true, message: `Importação concluída com sucesso! ${count} registos importados.` };
        } catch (error: any) {
            return { success: false, message: `Erro na importação: ${error.message}` };
        }
    };

    const handleLogin = async (email: string, pass: string) => {
        const supabase = getSupabase();
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) return { success: false, error: error.message };
        return { success: true };
    };
    
    const handleLogout = async () => {
        const supabase = getSupabase();
        await supabase.auth.signOut();
        setSession(null);
        setCurrentUser(null);
    };

    const handleViewItem = (tab: string, filter: any) => {
        setActiveTab(tab);
        setDashboardFilter(filter);
    };
    
    const handleManageKeys = (equipment: Equipment) => {
        setManageLicensesEquipment(equipment);
    };

    const handleSaveAssignedLicenses = async (equipmentId: string, licenseIds: string[]) => {
        try {
            await dataService.syncLicenseAssignments(equipmentId, licenseIds);
            await refreshData();
            setManageLicensesEquipment(null);
        } catch (error) {
            console.error("Failed to sync licenses:", error);
            alert("Erro ao guardar as licenças. Por favor tente novamente.");
        }
    };


    if (!isConfigured) return <ConfigurationSetup onConfigured={() => setIsConfigured(true)} />;
    if (!session) return <LoginPage onLogin={handleLogin} onForgotPassword={() => {}} />;

    return (
        <div className="min-h-screen bg-background-dark text-on-surface-dark">
            <Header 
                currentUser={currentUser} 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
                onLogout={handleLogout} 
                tabConfig={{
                    overview: true, 'equipment.inventory': true, 'equipment.brands': true, 'equipment.types': true,
                    'organizacao.instituicoes': true, 'organizacao.entidades': true, 'organizacao.teams': true,
                    collaborators: true, licensing: true, tickets: { title: 'Suporte' }
                }}
                notificationCount={0} // Todo: implement count logic
                onNotificationClick={() => {}}
            />
            <main className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === 'overview' && (
                    <OverviewDashboard 
                        equipment={equipment} instituicoes={instituicoes} entidades={entidades} assignments={assignments} 
                        equipmentTypes={equipmentTypes} tickets={tickets} collaborators={collaborators} teams={teams}
                        expiringWarranties={[]} // Todo: filter logic
                        expiringLicenses={[]} // Todo: filter logic
                        softwareLicenses={softwareLicenses} licenseAssignments={licenseAssignments}
                        onViewItem={handleViewItem} 
                    />
                )}
                {activeTab === 'equipment.inventory' && (
                    <EquipmentDashboard 
                         equipment={equipment} brands={brands} equipmentTypes={equipmentTypes} brandMap={brandMap} equipmentTypeMap={equipmentTypeMap}
                         assignedEquipmentIds={assignedEquipmentIds} assignments={assignments} collaborators={collaborators} entidades={entidades}
                         initialFilter={dashboardFilter} onClearInitialFilter={() => setDashboardFilter(null)} 
                         onShowHistory={() => {}} // Todo: implement handler
                         onAssign={() => {}} // Todo: implement handler
                         onManageKeys={handleManageKeys}
                    />
                )}
                 {activeTab === 'collaborators' && (
                     <CollaboratorDashboard 
                        collaborators={collaborators} escolasDepartamentos={entidades} equipment={equipment} assignments={assignments} 
                        tickets={tickets} ticketActivities={ticketActivities} teamMembers={teamMembers} currentUser={currentUser}
                     />
                 )}
                 {activeTab === 'organizacao.instituicoes' && <InstituicaoDashboard instituicoes={instituicoes} escolasDepartamentos={entidades} />}
                 {activeTab === 'organizacao.entidades' && <EntidadeDashboard escolasDepartamentos={entidades} instituicoes={instituicoes} collaborators={collaborators} />}
                 {activeTab === 'licensing' && (
                    <LicenseDashboard 
                        licenses={softwareLicenses} licenseAssignments={licenseAssignments} equipmentData={equipment} 
                        assignments={assignments} collaborators={collaborators} brandMap={brandMap} equipmentTypeMap={equipmentTypeMap}
                        initialFilter={dashboardFilter} onClearInitialFilter={() => setDashboardFilter(null)}
                    />
                 )}
                 {activeTab === 'tickets' && (
                    <TicketDashboard 
                        tickets={tickets} escolasDepartamentos={entidades} collaborators={collaborators} teams={teams} 
                        equipment={equipment} equipmentTypes={equipmentTypes} 
                        initialFilter={dashboardFilter} onClearInitialFilter={() => setDashboardFilter(null)}
                    />
                 )}
                 {activeTab === 'organizacao.teams' && (
                    <TeamDashboard 
                        teams={teams} teamMembers={teamMembers} collaborators={collaborators} tickets={tickets} 
                        onEdit={() => {}} onDelete={() => {}} onManageMembers={() => {}}
                    />
                 )}
                 {activeTab === 'equipment.brands' && <BrandDashboard brands={brands} equipment={equipment} />}
                 {activeTab === 'equipment.types' && <EquipmentTypeDashboard equipmentTypes={equipmentTypes} equipment={equipment} />}
            </main>

            {manageLicensesEquipment && (
                <ManageAssignedLicensesModal
                    equipment={manageLicensesEquipment}
                    allLicenses={softwareLicenses}
                    allAssignments={licenseAssignments}
                    onClose={() => setManageLicensesEquipment(null)}
                    onSave={handleSaveAssignedLicenses}
                />
            )}
        </div>
    );
};
