
import React, { useState } from 'react';
import { 
    Collaborator, BusinessService, ServiceDependency, Vulnerability, 
    BackupExecution, ResilienceTest, ModuleKey, PermissionAction, SecurityTrainingRecord, TrainingType, Policy
} from '../../types';
import * as dataService from '../../services/dataService';

// Dashboards
import ServiceDashboard from '../../components/ServiceDashboard';
import VulnerabilityDashboard from '../../components/VulnerabilityDashboard';
import BackupDashboard from '../../components/BackupDashboard';
import ResilienceDashboard from '../../components/ResilienceDashboard';
import TrainingDashboard from '../../components/TrainingDashboard';
import PolicyDashboard from '../../components/PolicyDashboard'; // New

// Modals
import AddServiceModal from '../../components/AddServiceModal';
import ServiceDependencyModal from '../../components/ServiceDependencyModal';
import AddVulnerabilityModal from '../../components/AddVulnerabilityModal';
import AddBackupModal from '../../components/AddBackupModal';
import AddResilienceTestModal from '../../components/AddResilienceTestModal';
// FIX: Changed default import to named import for AddTicketModal to resolve the module export error.
import { AddTicketModal } from '../../components/AddTicketModal';
import AddTrainingSessionModal from '../../components/AddTrainingSessionModal';
import AddPolicyModal from '../../components/AddPolicyModal'; // New

interface ComplianceManagerProps {
    activeTab: string;
    appData: any;
    checkPermission: (module: ModuleKey, action: PermissionAction) => boolean;
    refreshData: () => void;
    dashboardFilter: any;
    setDashboardFilter: (filter: any) => void;
    setReportType: (type: string) => void;
    currentUser: Collaborator | null;
}

const ComplianceManager: React.FC<ComplianceManagerProps> = ({ 
    activeTab, appData, checkPermission, refreshData, 
    dashboardFilter, setDashboardFilter, setReportType, currentUser 
}) => {
    
    const [showAddServiceModal, setShowAddServiceModal] = useState(false);
    const [serviceToEdit, setServiceToEdit] = useState<BusinessService | null>(null);
    const [showServiceDependencyModal, setShowServiceDependencyModal] = useState(false);
    const [serviceForDependencies, setServiceForDependencies] = useState<BusinessService | null>(null);

    const [showAddVulnerabilityModal, setShowAddVulnerabilityModal] = useState(false);
    const [vulnerabilityToEdit, setVulnerabilityToEdit] = useState<Vulnerability | null>(null);

    const [showAddBackupModal, setShowAddBackupModal] = useState(false);
    const [backupToEdit, setBackupToEdit] = useState<BackupExecution | null>(null);

    const [showAddResilienceTestModal, setShowAddResilienceTestModal] = useState(false);
    const [testToEdit, setTestToEdit] = useState<ResilienceTest | null>(null);
    
    // Training
    const [showAddTrainingSessionModal, setShowAddTrainingSessionModal] = useState(false);
    
    // Policies
    const [showAddPolicyModal, setShowAddPolicyModal] = useState(false);
    const [policyToEdit, setPolicyToEdit] = useState<Policy | null>(null);
    
    // Ticket Modal (for auto-ticket creation from findings)
    const [showAddTicketModal, setShowAddTicketModal] = useState(false);
    const [ticketToEdit, setTicketToEdit] = useState<any>(null);

    const handleBatchAddTraining = async (data: {
        collaboratorIds: string[];
        training_type: string;
        completion_date: string;
        notes?: string;
        score: number;
        duration_hours?: number;
    }) => {
        // Create records for each collaborator
        const promises = data.collaboratorIds.map(collabId => {
            const record: any = {
                collaborator_id: collabId,
                training_type: data.training_type,
                completion_date: data.completion_date,
                status: 'Concluído',
                score: data.score,
                notes: data.notes,
                duration_hours: data.duration_hours,
            };
            return dataService.addSecurityTraining(record);
        });

        try {
            await Promise.all(promises);
            refreshData();
            alert(`Sessão registada com sucesso para ${data.collaboratorIds.length} colaboradores.`);
        } catch (e) {
            console.error("Batch training failed", e);
            alert("Erro ao registar sessões em lote.");
        }
    };

    return (
        <>
             {activeTab === 'nis2.bia' && (
                <ServiceDashboard 
                    services={appData.businessServices}
                    dependencies={appData.serviceDependencies}
                    collaborators={appData.collaborators}
                    onEdit={checkPermission('compliance_bia', 'edit') ? (s) => { setServiceToEdit(s); setShowAddServiceModal(true); } : undefined}
                    onDelete={checkPermission('compliance_bia', 'delete') ? async (id) => { if (window.confirm("Tem a certeza?")) { await dataService.deleteBusinessService(id); refreshData(); } } : undefined}
                    onCreate={checkPermission('compliance_bia', 'create') ? () => { setServiceToEdit(null); setShowAddServiceModal(true); } : undefined}
                    onManageDependencies={checkPermission('compliance_bia', 'edit') ? (s) => { setServiceForDependencies(s); setShowServiceDependencyModal(true); } : undefined}
                    onGenerateReport={() => setReportType('bia')}
                />
            )}

            {activeTab === 'nis2.security' && (
                <VulnerabilityDashboard 
                    vulnerabilities={appData.vulnerabilities}
                    onEdit={checkPermission('compliance_security', 'edit') ? (v) => { setVulnerabilityToEdit(v); setShowAddVulnerabilityModal(true); } : undefined}
                    onDelete={checkPermission('compliance_security', 'delete') ? async (id) => { if (window.confirm("Tem a certeza?")) { await dataService.deleteVulnerability(id); refreshData(); } } : undefined}
                    onCreate={checkPermission('compliance_security', 'create') ? () => { setVulnerabilityToEdit(null); setShowAddVulnerabilityModal(true); } : undefined}
                    initialFilter={dashboardFilter}
                    onClearInitialFilter={() => setDashboardFilter(null)}
                    onCreateTicket={(vuln) => {
                        setTicketToEdit({
                            title: `Vulnerabilidade: ${vuln.cve_id}`,
                            description: `Correção necessária para vulnerabilidade ${vuln.cve_id}.\nAfeta: ${vuln.affected_software}\n\nDetalhes: ${vuln.description}`,
                            category: 'Incidente de Segurança',
                            securityIncidentType: 'Exploração de Vulnerabilidade',
                            impactCriticality: vuln.severity,
                        } as any);
                        setShowAddTicketModal(true);
                    }}
                />
            )}

            {activeTab === 'nis2.backups' && (
                <BackupDashboard 
                    backups={appData.backupExecutions}
                    collaborators={appData.collaborators}
                    equipment={appData.equipment}
                    onEdit={checkPermission('compliance_backups', 'edit') ? (b) => { setBackupToEdit(b); setShowAddBackupModal(true); } : undefined}
                    onDelete={checkPermission('compliance_backups', 'delete') ? async (id) => { if (window.confirm("Tem a certeza?")) { await dataService.deleteBackupExecution(id); refreshData(); } } : undefined}
                    onCreate={checkPermission('compliance_backups', 'create') ? () => { setBackupToEdit(null); setShowAddBackupModal(true); } : undefined}
                />
            )}

            {activeTab === 'nis2.resilience' && (
                <ResilienceDashboard 
                    resilienceTests={appData.resilienceTests}
                    onEdit={checkPermission('compliance_resilience', 'edit') ? (t) => { setTestToEdit(t); setShowAddResilienceTestModal(true); } : undefined}
                    onDelete={checkPermission('compliance_resilience', 'delete') ? async (id) => { if (window.confirm("Tem a certeza?")) { await dataService.deleteResilienceTest(id); refreshData(); } } : undefined}
                    onCreate={checkPermission('compliance_resilience', 'create') ? () => { setTestToEdit(null); setShowAddResilienceTestModal(true); } : undefined}
                    onCreateTicket={(ticketData) => {
                        setTicketToEdit(ticketData as any);
                        setShowAddTicketModal(true);
                    }}
                />
            )}

            {activeTab === 'nis2.training' && (
                <TrainingDashboard 
                    trainings={appData.securityTrainings}
                    collaborators={appData.collaborators}
                    trainingTypes={appData.configTrainingTypes}
                    onCreate={checkPermission('compliance_training', 'create') ? () => setShowAddTrainingSessionModal(true) : undefined}
                />
            )}

            {activeTab === 'nis2.policies' && (
                <PolicyDashboard 
                    policies={appData.policies}
                    acceptances={appData.policyAcceptances}
                    collaborators={appData.collaborators}
                    onEdit={checkPermission('compliance_policies', 'edit') ? (p) => { setPolicyToEdit(p); setShowAddPolicyModal(true); } : undefined}
                    onDelete={checkPermission('compliance_policies', 'delete') ? async (id) => { if (window.confirm("Tem a certeza? O histórico de aceitação será perdido.")) { await dataService.deletePolicy(id); refreshData(); } } : undefined}
                    onCreate={checkPermission('compliance_policies', 'create') ? () => { setPolicyToEdit(null); setShowAddPolicyModal(true); } : undefined}
                />
            )}

            {/* --- MODALS --- */}
            {showAddServiceModal && (
                <AddServiceModal 
                    onClose={() => setShowAddServiceModal(false)}
                    onSave={async (svc) => {
                        if (serviceToEdit) await dataService.updateBusinessService(serviceToEdit.id, svc);
                        else await dataService.addBusinessService(svc);
                        refreshData();
                    }}
                    serviceToEdit={serviceToEdit}
                    collaborators={appData.collaborators}
                    suppliers={appData.suppliers}
                />
            )}
            {showServiceDependencyModal && serviceForDependencies && (
                <ServiceDependencyModal 
                    onClose={() => setShowServiceDependencyModal(false)}
                    service={serviceForDependencies}
                    dependencies={appData.serviceDependencies.filter((d:any) => d.service_id === serviceForDependencies.id)}
                    allEquipment={appData.equipment}
                    allLicenses={appData.softwareLicenses}
                    onAddDependency={async (dep) => { await dataService.addServiceDependency(dep); refreshData(); }}
                    onRemoveDependency={async (id) => { await dataService.deleteServiceDependency(id); refreshData(); }}
                />
            )}
            {showAddVulnerabilityModal && (
                <AddVulnerabilityModal 
                    onClose={() => setShowAddVulnerabilityModal(false)}
                    onSave={async (vuln) => {
                        if (vulnerabilityToEdit) await dataService.updateVulnerability(vulnerabilityToEdit.id, vuln);
                        else await dataService.addVulnerability(vuln);
                        refreshData();
                    }}
                    vulnToEdit={vulnerabilityToEdit}
                />
            )}
            {showAddBackupModal && (
                <AddBackupModal 
                    onClose={() => setShowAddBackupModal(false)}
                    onSave={async (backup) => {
                        if (backupToEdit) await dataService.updateBackupExecution(backupToEdit.id, backup);
                        else await dataService.addBackupExecution(backup);
                        refreshData();
                    }}
                    backupToEdit={backupToEdit}
                    currentUser={currentUser}
                    equipmentList={appData.equipment}
                    equipmentTypes={appData.equipmentTypes}
                    onCreateTicket={async (ticket) => { await dataService.addTicket(ticket); refreshData(); }}
                />
            )}
            {showAddResilienceTestModal && (
                <AddResilienceTestModal 
                    onClose={() => setShowAddResilienceTestModal(false)}
                    onSave={async (test) => {
                        if (testToEdit) await dataService.updateResilienceTest(testToEdit.id, test);
                        else await dataService.addResilienceTest(test);
                        refreshData();
                    }}
                    testToEdit={testToEdit}
                    onCreateTicket={async (ticket) => { await dataService.addTicket(ticket); refreshData(); }}
                    entidades={appData.entidades}
                    suppliers={appData.suppliers}
                />
            )}
             {showAddTicketModal && (
                <AddTicketModal
                    onClose={() => setShowAddTicketModal(false)}
                    onSave={async (ticket) => {
                         await dataService.addTicket(ticket);
                         refreshData();
                    }}
                    ticketToEdit={ticketToEdit}
                    escolasDepartamentos={appData.entidades}
                    collaborators={appData.collaborators}
                    teams={appData.teams}
                    currentUser={currentUser}
                    userPermissions={{ viewScope: 'all' }}
                    equipment={appData.equipment}
                    equipmentTypes={appData.equipmentTypes}
                    assignments={appData.assignments}
                    categories={appData.ticketCategories}
                    securityIncidentTypes={appData.securityIncidentTypes}
                    pastTickets={appData.tickets}
                />
            )}
            {showAddTrainingSessionModal && (
                <AddTrainingSessionModal
                    onClose={() => setShowAddTrainingSessionModal(false)}
                    onSave={handleBatchAddTraining}
                    collaborators={appData.collaborators}
                    trainingTypes={appData.configTrainingTypes}
                    instituicoes={appData.instituicoes}
                    entidades={appData.entidades}
                />
            )}
            {showAddPolicyModal && (
                <AddPolicyModal 
                    onClose={() => setShowAddPolicyModal(false)}
                    onSave={async (p) => {
                        if (policyToEdit) await dataService.updatePolicy(policyToEdit.id, p);
                        else await dataService.addPolicy(p);
                        refreshData();
                    }}
                    policyToEdit={policyToEdit}
                />
            )}
        </>
    );
};

export default ComplianceManager;