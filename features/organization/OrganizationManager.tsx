
import React, { useState } from 'react';
import { 
    Collaborator, Instituicao, Entidade, Team, Supplier, 
    ModuleKey, PermissionAction, defaultTooltipConfig, Brand, Assignment, SoftwareLicense, LicenseAssignment, TicketStatus, ConfigItem
} from '../../types';
import * as dataService from '../../services/dataService';

// Dashboards
import InstituicaoDashboard from '../../components/InstituicaoDashboard';
import EntidadeDashboard from '../../components/EntidadeDashboard';
import CollaboratorDashboard from '../../components/CollaboratorDashboard';
import TeamDashboard from '../../components/TeamDashboard';
import SupplierDashboard from '../../components/SupplierDashboard';

// Modals
import AddInstituicaoModal from '../../components/AddInstituicaoModal';
import AddEntidadeModal from '../../components/AddEntidadeModal';
import AddCollaboratorModal from '../../components/AddCollaboratorModal';
import AddTeamModal from '../../components/AddTeamModal';
import ManageTeamMembersModal from '../../components/ManageTeamMembersModal';
import AddSupplierModal from '../../components/AddSupplierModal';
import ImportModal from '../../components/ImportModal';
import CollaboratorHistoryModal from '../../components/CollaboratorHistoryModal';
import { CollaboratorDetailModal } from '../../components/CollaboratorDetailModal';
import CredentialsModal from '../../components/CredentialsModal';
import OffboardingModal from '../../components/OffboardingModal';

interface OrganizationManagerProps {
    activeTab: string;
    appData: any;
    checkPermission: (module: ModuleKey, action: PermissionAction) => boolean;
    refreshData: () => void;
    currentUser: Collaborator | null;
    setActiveTab: (tab: string) => void;
    onStartChat: (collaborator: Collaborator) => void;
    setReportType: (type: string) => void;
}

const OrganizationManager: React.FC<OrganizationManagerProps> = ({ 
    activeTab, appData, checkPermission, refreshData, currentUser, setActiveTab, onStartChat, setReportType 
}) => {
    // Modals State
    const [showAddInstituicaoModal, setShowAddInstituicaoModal] = useState(false);
    const [instituicaoToEdit, setInstituicaoToEdit] = useState<Instituicao | null>(null);
    
    const [showAddEntidadeModal, setShowAddEntidadeModal] = useState(false);
    const [entidadeToEdit, setEntidadeToEdit] = useState<Entidade | null>(null);

    const [showAddCollaboratorModal, setShowAddCollaboratorModal] = useState(false);
    const [collaboratorToEdit, setCollaboratorToEdit] = useState<Collaborator | null>(null);
    
    const [showAddTeamModal, setShowAddTeamModal] = useState(false);
    const [teamToEdit, setTeamToEdit] = useState<Team | null>(null);
    const [showManageTeamMembersModal, setShowManageTeamMembersModal] = useState(false);
    const [teamToManage, setTeamToManage] = useState<Team | null>(null);
    
    const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
    const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);

    const [showImportModal, setShowImportModal] = useState(false);
    const [importConfig, setImportConfig] = useState<any>(null);
    
    const [showCollaboratorHistoryModal, setShowCollaboratorHistoryModal] = useState(false);
    const [historyCollaborator, setHistoryCollaborator] = useState<Collaborator | null>(null);
    
    const [showCollaboratorDetailModal, setShowCollaboratorDetailModal] = useState(false);
    const [detailCollaborator, setDetailCollaborator] = useState<Collaborator | null>(null);

    const [showCredentialsModal, setShowCredentialsModal] = useState(false);
    const [newCredentials, setNewCredentials] = useState<{email: string, password?: string} | null>(null);
    
    // Offboarding State
    const [showOffboardingModal, setShowOffboardingModal] = useState(false);
    const [collaboratorToOffboard, setCollaboratorToOffboard] = useState<Collaborator | null>(null);

    const userTooltipConfig = currentUser?.preferences?.tooltipConfig || defaultTooltipConfig;

    // Handlers for Detail Modal Actions
    const handleAssignEquipment = async (collaboratorId: string, equipmentId: string) => {
        await dataService.updateEquipment(equipmentId, { status: 'Operacional' });
        await dataService.addAssignment({ equipmentId, collaboratorId, assignedDate: new Date().toISOString().split('T')[0] });
        refreshData();
    };

    const handleUnassignEquipment = async (equipmentId: string) => {
        await dataService.addAssignment({ equipmentId, returnDate: new Date().toISOString().split('T')[0] });
        refreshData();
    };

    const handleSaveCollaborator = async (col: any, pass?: string) => {
        if (collaboratorToEdit) {
            const updatedCollaborator = await dataService.updateCollaborator(collaboratorToEdit.id, col);
            refreshData();
            return updatedCollaborator;
        } else {
            const newCol = await dataService.addCollaborator(col, pass);
            if (pass && newCol) {
                setNewCredentials({ email: newCol.email, password: pass });
                setShowCredentialsModal(true);
            }
            refreshData();
            return newCol;
        }
    };
    
    const onToggleStatus = async (collaborator: Collaborator) => {
        if (!collaborator) return;
        
        const isActivating = collaborator.status === 'Inativo';
        if (isActivating) {
            await dataService.updateCollaborator(collaborator.id, { status: 'Ativo' });
            refreshData();
            return;
        }

        const assignedEquipment = appData.assignments.filter((a: Assignment) => a.collaboratorId === collaborator.id && !a.returnDate);
        // Now we open the modal even if no equipment, to capture the deactivation reason
        setCollaboratorToOffboard(collaborator);
        setShowOffboardingModal(true);
    };
    
    const handleConfirmOffboarding = async (collaboratorId: string, reasonId?: string) => {
        const collaborator = appData.collaborators.find((c: Collaborator) => c.id === collaboratorId);
        if (!collaborator) return;

        // 1. Unassign all equipment
        const assignedEquipmentIds = appData.assignments
            .filter((a: Assignment) => a.collaboratorId === collaboratorId && !a.returnDate)
            .map((a: Assignment) => a.equipmentId);
        
        for (const eqId of assignedEquipmentIds) {
            await handleUnassignEquipment(eqId);
        }
        
        // 2. Inactivate collaborator and set reason
        await dataService.updateCollaborator(collaboratorId, { 
            status: 'Inativo',
            deactivation_reason_id: reasonId || undefined
        });
        
        // 3. Create ticket for IT
        await dataService.addTicket({
            title: `Offboarding: ${collaborator.fullName}`,
            description: `Processo de saída iniciado para ${collaborator.fullName}. Motivo: ${reasonId ? appData.configCollaboratorDeactivationReasons.find((r: ConfigItem) => r.id === reasonId)?.name : 'N/A'}. Por favor, revogar todos os acessos.`,
            status: TicketStatus.Requested,
            category: 'Manutenção',
            requestDate: new Date().toISOString(),
            collaboratorId: currentUser?.id,
            entidadeId: currentUser?.entidadeId
        });
        
        await dataService.logAction('OFFBOARDING', 'Collaborator', `Offboarding process initiated for ${collaborator.fullName}`, collaboratorId);

        refreshData();
    };

    return (
        <>
             {activeTab === 'organizacao.instituicoes' && (
                <InstituicaoDashboard 
                    instituicoes={appData.instituicoes}
                    escolasDepartamentos={appData.entidades}
                    collaborators={appData.collaborators}
                    assignments={appData.assignments}
                    equipment={appData.equipment}
                    brands={appData.brands}
                    equipmentTypes={appData.equipmentTypes}
                    onEdit={checkPermission('organization', 'edit') ? (i) => { setInstituicaoToEdit(i); setShowAddInstituicaoModal(true); } : undefined}
                    onDelete={checkPermission('organization', 'delete') ? async (id) => { if (window.confirm("Tem a certeza?")) { await dataService.deleteInstituicao(id); refreshData(); } } : undefined}
                    onCreate={checkPermission('organization', 'create') ? () => { setInstituicaoToEdit(null); setShowAddInstituicaoModal(true); } : undefined}
                    onAddEntity={checkPermission('organization', 'create') ? (instId) => { setEntidadeToEdit({ instituicaoId: instId } as any); setShowAddEntidadeModal(true); } : undefined}
                    onCreateCollaborator={checkPermission('organization', 'create') ? () => { setCollaboratorToEdit(null); setShowAddCollaboratorModal(true); } : undefined}
                    onImport={checkPermission('organization', 'create') ? () => { setImportConfig({ dataType: 'instituicoes', title: 'Importar Instituições', columnMap: { 'Nome': 'name', 'Código': 'codigo', 'Email': 'email', 'Telefone': 'telefone' }, templateFileName: 'instituicoes_template.xlsx' }); setShowImportModal(true); } : undefined}
                    onToggleStatus={checkPermission('organization', 'edit') ? async (id) => { 
                        const inst = appData.instituicoes.find((i: Instituicao) => i.id === id);
                        if (inst) { await dataService.updateInstituicao(id, { is_active: inst.is_active === false }); refreshData(); }
                    } : undefined}
                />
            )}

            {activeTab === 'organizacao.entidades' && (
                <EntidadeDashboard 
                    escolasDepartamentos={appData.entidades}
                    instituicoes={appData.instituicoes}
                    collaborators={appData.collaborators}
                    assignments={appData.assignments}
                    tickets={appData.tickets}
                    collaboratorHistory={appData.collaboratorHistory}
                    equipment={appData.equipment}
                    brands={appData.brands}
                    equipmentTypes={appData.equipmentTypes}
                    onEdit={checkPermission('organization', 'edit') ? (e) => { setEntidadeToEdit(e); setShowAddEntidadeModal(true); } : undefined}
                    onDelete={checkPermission('organization', 'delete') ? async (id) => { if (window.confirm("Tem a certeza?")) { await dataService.deleteEntidade(id); refreshData(); } } : undefined}
                    onCreate={checkPermission('organization', 'create') ? () => { setEntidadeToEdit(null); setShowAddEntidadeModal(true); } : undefined}
                    onAddCollaborator={checkPermission('organization', 'create') ? (entId) => { setCollaboratorToEdit({ entidadeId: entId } as any); setShowAddCollaboratorModal(true); } : undefined}
                    onImport={checkPermission('organization', 'create') ? () => { setImportConfig({ dataType: 'entidades', title: 'Importar Entidades', columnMap: { 'Nome': 'name', 'Código': 'codigo', 'Email': 'email', 'Responsável': 'responsavel' }, templateFileName: 'entidades_template.xlsx' }); setShowImportModal(true); } : undefined}
                    onToggleStatus={checkPermission('organization', 'edit') ? async (id) => {
                        const ent = appData.entidades.find((e: Entidade) => e.id === id);
                        if (ent) { await dataService.updateEntidade(id, { status: ent.status === 'Ativo' ? 'Inativo' : 'Ativo' }); refreshData(); }
                    } : undefined}
                />
            )}

            {activeTab === 'collaborators' && (
                <CollaboratorDashboard 
                    collaborators={appData.collaborators}
                    escolasDepartamentos={appData.entidades}
                    instituicoes={appData.instituicoes}
                    equipment={appData.equipment}
                    assignments={appData.assignments}
                    tickets={appData.tickets}
                    ticketActivities={appData.ticketActivities}
                    teamMembers={appData.teamMembers}
                    collaboratorHistory={appData.collaboratorHistory}
                    messages={appData.messages}
                    currentUser={currentUser}
                    onEdit={checkPermission('organization', 'edit') ? (c) => { setCollaboratorToEdit(c); setShowAddCollaboratorModal(true); } : undefined}
                    onDelete={checkPermission('organization', 'delete') ? async (id) => { if (window.confirm("Tem a certeza?")) { await dataService.deleteCollaborator(id); refreshData(); } } : undefined}
                    onCreate={checkPermission('organization', 'create') ? () => { setCollaboratorToEdit(null); setShowAddCollaboratorModal(true); } : undefined}
                    onShowHistory={(c) => { setHistoryCollaborator(c); setShowCollaboratorHistoryModal(true); }}
                    onShowDetails={(c) => { setDetailCollaborator(c); setShowCollaboratorDetailModal(true); }}
                    onStartChat={onStartChat}
                    onGenerateReport={checkPermission('reports', 'view') ? () => setReportType('collaborator') : undefined}
                    onToggleStatus={checkPermission('organization', 'edit') ? onToggleStatus : undefined}
                    tooltipConfig={userTooltipConfig}
                    onAssignEquipment={checkPermission('equipment', 'edit') ? handleAssignEquipment : undefined}
                    onUnassignEquipment={checkPermission('equipment', 'edit') ? handleUnassignEquipment : undefined}
                    deactivationReasons={appData.configCollaboratorDeactivationReasons}
                />
            )}

            {activeTab === 'organizacao.teams' && (
                <TeamDashboard 
                    teams={appData.teams}
                    teamMembers={appData.teamMembers}
                    collaborators={appData.collaborators}
                    tickets={appData.tickets}
                    equipmentTypes={appData.equipmentTypes}
                    onEdit={checkPermission('organization', 'edit') ? (t) => { setTeamToEdit(t); setShowAddTeamModal(true); } : undefined}
                    onDelete={checkPermission('organization', 'delete') ? async (id) => { if (window.confirm("Tem a certeza?")) { await dataService.deleteTeam(id); refreshData(); } } : undefined}
                    onCreate={checkPermission('organization', 'create') ? () => { setTeamToEdit(null); setShowAddTeamModal(true); } : undefined}
                    onManageMembers={checkPermission('organization', 'edit') ? (t) => { setTeamToManage(t); setShowManageTeamMembersModal(true); } : undefined}
                    onToggleStatus={checkPermission('organization', 'edit') ? async (id) => {
                        const t = appData.teams.find((team: Team) => team.id === id);
                        if (t) { await dataService.updateTeam(id, { is_active: t.is_active === false }); refreshData(); }
                    } : undefined}
                />
            )}

            {activeTab === 'organizacao.suppliers' && (
                <SupplierDashboard 
                    suppliers={appData.suppliers}
                    businessServices={appData.businessServices}
                    onEdit={checkPermission('suppliers', 'edit') ? (s) => { setSupplierToEdit(s); setShowAddSupplierModal(true); } : undefined}
                    onDelete={checkPermission('suppliers', 'delete') ? async (id) => { if (window.confirm("Tem a certeza?")) { await dataService.deleteSupplier(id); refreshData(); } } : undefined}
                    onCreate={checkPermission('suppliers', 'create') ? () => { setSupplierToEdit(null); setShowAddSupplierModal(true); } : undefined}
                    onToggleStatus={checkPermission('suppliers', 'edit') ? async (id) => {
                        const s = appData.suppliers.find((sup: Supplier) => sup.id === id);
                        if (s) { await dataService.updateSupplier(id, { is_active: s.is_active === false }); refreshData(); }
                    } : undefined}
                />
            )}

            {/* --- MODALS --- */}
            {showAddInstituicaoModal && (
                <AddInstituicaoModal
                    onClose={() => setShowAddInstituicaoModal(false)}
                    onSave={async (inst) => {
                        if (instituicaoToEdit) await dataService.updateInstituicao(instituicaoToEdit.id, inst);
                        else await dataService.addInstituicao(inst);
                        refreshData();
                    }}
                    instituicaoToEdit={instituicaoToEdit}
                />
            )}
            {showAddEntidadeModal && (
                <AddEntidadeModal
                    onClose={() => setShowAddEntidadeModal(false)}
                    onSave={async (ent) => {
                        if (entidadeToEdit && entidadeToEdit.id) await dataService.updateEntidade(entidadeToEdit.id, ent);
                        else await dataService.addEntidade(ent);
                        refreshData();
                    }}
                    entidadeToEdit={entidadeToEdit}
                    instituicoes={appData.instituicoes}
                />
            )}
            {showAddCollaboratorModal && (
                <AddCollaboratorModal
                    onClose={() => setShowAddCollaboratorModal(false)}
                    onSave={handleSaveCollaborator}
                    collaboratorToEdit={collaboratorToEdit}
                    escolasDepartamentos={appData.entidades}
                    instituicoes={appData.instituicoes}
                    currentUser={currentUser}
                    roleOptions={appData.customRoles.map((r:any) => ({ id: r.id, name: r.name }))}
                    titleOptions={appData.contactTitles.map((t:any) => ({ id: t.id, name: t.name }))}
                />
            )}
            {showAddTeamModal && (
                <AddTeamModal
                    onClose={() => setShowAddTeamModal(false)}
                    onSave={async (team) => {
                        if (teamToEdit) await dataService.updateTeam(teamToEdit.id, team);
                        else await dataService.addTeam(team);
                        refreshData();
                    }}
                    teamToEdit={teamToEdit}
                />
            )}
            {showManageTeamMembersModal && teamToManage && (
                <ManageTeamMembersModal 
                    onClose={() => setShowManageTeamMembersModal(false)}
                    onSave={async (teamId, memberIds) => {
                        await dataService.syncTeamMembers(teamId, memberIds);
                        refreshData();
                        setShowManageTeamMembersModal(false);
                    }}
                    team={teamToManage}
                    allCollaborators={appData.collaborators}
                    teamMembers={appData.teamMembers}
                />
            )}
            {showAddSupplierModal && (
                <AddSupplierModal 
                    onClose={() => setShowAddSupplierModal(false)}
                    onSave={async (sup) => {
                        let savedSupplier;
                        if (supplierToEdit) {
                            savedSupplier = await dataService.updateSupplier(supplierToEdit.id, sup);
                        } else {
                            savedSupplier = await dataService.addSupplier(sup);
                        }
                        refreshData();
                        return savedSupplier;
                    }}
                    supplierToEdit={supplierToEdit}
                    teams={appData.teams}
                    businessServices={appData.businessServices}
                    onCreateTicket={async (ticket) => { await dataService.addTicket(ticket); refreshData(); }}
                />
            )}
             {showImportModal && importConfig && (
                <ImportModal 
                    config={importConfig} 
                    onClose={() => setShowImportModal(false)} 
                    onImport={async (type, data) => {
                        try {
                            if (type === 'instituicoes') {
                                alert('Importação de instituições não implementada em lote nesta versão de demonstração.');
                            }
                            else if (type === 'entidades') {
                                 alert('Importação de entidades não implementada em lote nesta versão de demonstração.');
                            }
                            refreshData();
                            return { success: true, message: `Importação processada.` };
                        } catch (e: any) {
                            return { success: false, message: e.message };
                        }
                    }} 
                />
            )}
            {showCollaboratorHistoryModal && historyCollaborator && (
                <CollaboratorHistoryModal 
                    collaborator={historyCollaborator} 
                    history={appData.collaboratorHistory} 
                    escolasDepartamentos={appData.entidades} 
                    onClose={() => setShowCollaboratorHistoryModal(false)} 
                />
            )}
            {showCollaboratorDetailModal && detailCollaborator && (
                <CollaboratorDetailModal
                    collaborator={detailCollaborator}
                    assignments={appData.assignments}
                    equipment={appData.equipment}
                    tickets={appData.tickets}
                    brandMap={new Map(appData.brands.map((b: Brand) => [b.id, b.name]))}
                    equipmentTypeMap={new Map(appData.equipmentTypes.map((t: any) => [t.id, t.name]))}
                    licenseAssignments={appData.licenseAssignments}
                    softwareLicenses={appData.softwareLicenses}
                    onClose={() => setShowCollaboratorDetailModal(false)}
                    onShowHistory={(c) => { setShowCollaboratorDetailModal(false); setHistoryCollaborator(c); setShowCollaboratorHistoryModal(true); }}
                    onStartChat={onStartChat}
                    onEdit={(c) => { setShowCollaboratorDetailModal(false); setCollaboratorToEdit(c); setShowAddCollaboratorModal(true); }}
                    onAssignEquipment={checkPermission('equipment', 'edit') ? handleAssignEquipment : undefined}
                    onUnassignEquipment={checkPermission('equipment', 'edit') ? handleUnassignEquipment : undefined}
                    onConfirmOffboarding={checkPermission('organization', 'edit') ? handleConfirmOffboarding : undefined}
                    deactivationReasons={appData.configCollaboratorDeactivationReasons}
                />
            )}
            
            {showCredentialsModal && newCredentials && (
                <CredentialsModal 
                    onClose={() => { setShowCredentialsModal(false); setNewCredentials(null); }}
                    email={newCredentials.email}
                    password={newCredentials.password}
                />
            )}

            {showOffboardingModal && collaboratorToOffboard && (
                <OffboardingModal 
                    onClose={() => setShowOffboardingModal(false)}
                    onConfirm={handleConfirmOffboarding}
                    collaborator={collaboratorToOffboard}
                    assignments={appData.assignments}
                    licenseAssignments={appData.licenseAssignments}
                    equipment={appData.equipment}
                    softwareLicenses={appData.softwareLicenses}
                    brandMap={new Map(appData.brands.map((b: Brand) => [b.id, b.name]))}
                    equipmentTypeMap={new Map(appData.equipmentTypes.map((t: any) => [t.id, t.name]))}
                    deactivationReasons={appData.configCollaboratorDeactivationReasons}
                />
            )}
        </>
    );
};

export default OrganizationManager;
