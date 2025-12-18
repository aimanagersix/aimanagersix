
import React, { useState } from 'react';
import { useAppData } from './hooks/useAppData';
import { useLayout } from './contexts/LayoutContext';
import { useLanguage } from './contexts/LanguageContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import OverviewDashboard from './components/OverviewDashboard';
import SmartDashboard from './components/SmartDashboard';
import InventoryManager from './features/inventory/InventoryManager';
import OrganizationManager from './features/organization/OrganizationManager';
import TicketManager from './features/tickets/TicketManager';
import ComplianceManager from './features/compliance/ComplianceManager';
import SettingsManager from './features/settings/SettingsManager';
import SelfServiceDashboard from './features/selfservice/SelfServiceDashboard';
import LoginPage from './components/LoginPage';
import ConfigurationSetup from './components/ConfigurationSetup';
import { UserRole, ModuleKey, PermissionAction } from './types';
import { getSupabase } from './services/supabaseClient';

export const App: React.FC = () => {
    const { isConfigured, setIsConfigured, currentUser, setCurrentUser, appData, refreshData, isLoading } = useAppData();
    const { layoutMode } = useLayout();
    const { t } = useLanguage();
    
    const [activeTab, setActiveTab] = useState('overview');
    const [sidebarExpanded, setSidebarExpanded] = useState(false);
    const [dashboardFilter, setDashboardFilter] = useState<any>(null);
    const [reportType, setReportType] = useState<string | null>(null);

    const checkPermission = (module: ModuleKey, action: PermissionAction): boolean => {
        if (!currentUser) return false;
        if (currentUser.role === UserRole.SuperAdmin) return true;
        // Basic role-based logic if custom roles not yet fully loaded
        if (currentUser.role === UserRole.Admin) return true;
        
        // Self-service overrides
        if (module === 'my_area') return true;
        
        return false;
    };

    const handleLogout = async () => {
        const supabase = getSupabase();
        await supabase.auth.signOut();
        setCurrentUser(null);
        window.location.reload();
    };

    if (!isConfigured) {
        return <ConfigurationSetup onConfigured={() => setIsConfigured(true)} />;
    }

    if (!currentUser && !isLoading) {
        return <LoginPage onLogin={async () => ({ success: true })} onForgotPassword={() => {}} />;
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background-dark flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary"></div>
            </div>
        );
    }

    const isBasic = currentUser?.role === UserRole.Basic;
    const canViewSmartDashboard = checkPermission('dashboard_smart', 'view');

    const tabConfig: Record<string, any> = {
        'overview': !isBasic ? t('nav.overview') : undefined,
        'my.area': checkPermission('my_area', 'view') ? t('nav.my_area') : undefined,
        'overview.smart': canViewSmartDashboard ? t('nav.c_level') : undefined,
        'equipment.inventory': checkPermission('equipment', 'view') ? t('nav.assets_inventory') : undefined,
        'licensing': checkPermission('licensing', 'view') ? t('nav.licensing') : undefined,
        'tickets': checkPermission('tickets', 'view') ? t('nav.tickets') : undefined,
        'organizacao.instituicoes': checkPermission('organization', 'view') ? t('nav.institutions') : undefined,
        'organizacao.entidades': checkPermission('organization', 'view') ? t('nav.entities') : undefined,
        'collaborators': checkPermission('organization', 'view') ? t('nav.collaborators') : undefined,
        'reports': checkPermission('reports', 'view') ? t('nav.reports') : undefined,
        'settings': checkPermission('settings', 'manage') ? t('common.settings') : undefined,
    };

    const renderHeader = () => (
        <Header 
            currentUser={currentUser}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onLogout={handleLogout}
            tabConfig={tabConfig}
            notificationCount={0}
            onNotificationClick={() => {}}
        />
    );

    const renderSidebar = () => (
        <Sidebar 
            currentUser={currentUser}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onLogout={handleLogout}
            tabConfig={tabConfig}
            notificationCount={0}
            onNotificationClick={() => {}}
            isExpanded={sidebarExpanded}
            onHover={setSidebarExpanded}
        />
    );

    return (
        <div className={`min-h-screen bg-background-dark ${layoutMode === 'top' ? 'flex flex-col' : 'flex h-screen overflow-hidden'}`}>
            {layoutMode === 'top' ? renderHeader() : renderSidebar()}
            
            <main className={`flex-1 bg-background-dark transition-all duration-300 overflow-y-auto custom-scrollbar ${layoutMode === 'side' && !sidebarExpanded ? 'ml-20' : layoutMode === 'side' ? 'ml-64' : ''}`}>
                <div className="w-full max-w-[1400px] mx-auto px-4 py-8">
                    {activeTab === 'overview' && (
                        <OverviewDashboard 
                            equipment={appData.equipment}
                            instituicoes={appData.instituicoes}
                            entidades={appData.entidades}
                            assignments={appData.assignments}
                            equipmentTypes={appData.equipmentTypes}
                            tickets={appData.tickets}
                            collaborators={appData.collaborators}
                            teams={appData.teams}
                            expiringWarranties={[]}
                            expiringLicenses={[]}
                            softwareLicenses={appData.softwareLicenses}
                            licenseAssignments={appData.licenseAssignments}
                            vulnerabilities={appData.vulnerabilities}
                            onViewItem={(tab, filter) => { setActiveTab(tab); setDashboardFilter(filter); }}
                            onGenerateComplianceReport={() => {}}
                            onRefresh={refreshData}
                            checkPermission={checkPermission}
                        />
                    )}
                    
                    {activeTab === 'my.area' && currentUser && (
                        <SelfServiceDashboard 
                            currentUser={currentUser}
                            equipment={appData.equipment}
                            assignments={appData.assignments}
                            softwareLicenses={appData.softwareLicenses}
                            licenseAssignments={appData.licenseAssignments}
                            trainings={appData.securityTrainings}
                            brands={appData.brands}
                            types={appData.equipmentTypes}
                        />
                    )}

                    {activeTab === 'overview.smart' && canViewSmartDashboard && (
                        <SmartDashboard 
                            tickets={appData.tickets}
                            vulnerabilities={appData.vulnerabilities}
                            backups={appData.backupExecutions}
                            trainings={appData.securityTrainings}
                            collaborators={appData.collaborators}
                            currentUser={currentUser!}
                        />
                    )}

                    {activeTab.startsWith('equipment') && (
                        <InventoryManager 
                            activeTab={activeTab}
                            appData={appData}
                            checkPermission={checkPermission}
                            refreshData={refreshData}
                            dashboardFilter={dashboardFilter}
                            setDashboardFilter={setDashboardFilter}
                            setReportType={setReportType}
                            currentUser={currentUser}
                            onViewItem={(tab, filter) => { setActiveTab(tab); setDashboardFilter(filter); }}
                        />
                    )}

                    {activeTab === 'licensing' && (
                        <InventoryManager 
                            activeTab={activeTab}
                            appData={appData}
                            checkPermission={checkPermission}
                            refreshData={refreshData}
                            dashboardFilter={dashboardFilter}
                            setDashboardFilter={setDashboardFilter}
                            setReportType={setReportType}
                            currentUser={currentUser}
                            onViewItem={(tab, filter) => { setActiveTab(tab); setDashboardFilter(filter); }}
                        />
                    )}

                    {(activeTab.startsWith('organizacao') || activeTab === 'collaborators') && (
                        <OrganizationManager 
                            activeTab={activeTab}
                            appData={appData}
                            checkPermission={checkPermission}
                            refreshData={refreshData}
                            currentUser={currentUser}
                            setActiveTab={setActiveTab}
                            onStartChat={() => {}}
                            setReportType={setReportType}
                        />
                    )}

                    {activeTab.startsWith('tickets') && (
                        <TicketManager 
                            appData={appData}
                            checkPermission={checkPermission}
                            refreshData={refreshData}
                            dashboardFilter={dashboardFilter}
                            setDashboardFilter={setDashboardFilter}
                            setReportType={setReportType}
                            currentUser={currentUser}
                        />
                    )}

                    {activeTab.startsWith('nis2') && (
                        <ComplianceManager 
                            activeTab={activeTab}
                            appData={appData}
                            checkPermission={checkPermission}
                            refreshData={refreshData}
                            dashboardFilter={dashboardFilter}
                            setDashboardFilter={setDashboardFilter}
                            setReportType={setReportType}
                            currentUser={currentUser}
                        />
                    )}

                    {activeTab === 'settings' && (
                        <SettingsManager 
                            appData={appData}
                            refreshData={refreshData}
                        />
                    )}
                </div>
            </main>
        </div>
    );
};
