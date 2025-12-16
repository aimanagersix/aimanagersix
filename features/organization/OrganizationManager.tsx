
import React, { useState, useCallback, useEffect } from 'react';
import { 
    Collaborator, Instituicao, Entidade, Team, Supplier, 
    ModuleKey, PermissionAction, defaultTooltipConfig, Assignment, TicketStatus, ConfigItem, Brand, Equipment, Ticket
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
import OnboardingModal from '../../components/OnboardingModal';
// Added for Drill-Down
import EquipmentHistoryModal from '../../components/EquipmentHistoryModal'; 
import { AddTicketModal } from '../../components/AddTicketModal';

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

const PROTECTED_EMAIL = 'josefsmoreira@outlook.com';

const OrganizationManager: React.FC<OrganizationManagerProps> = ({ 
    activeTab, appData, checkPermission, refreshData, currentUser, setActiveTab, onStartChat, setReportType 
}) => {
    // Server-Side Data State for Collaborators
    const [collabsData, setCollabsData] = useState<Collaborator[]>([]);
    const [totalCollabs, setTotalCollabs] = useState(0);
    const [collabsLoading, setCollabsLoading] = useState(false);
    const [collabPage, setCollabPage] = useState(1);
    const [collabPageSize, setCollabPageSize] = useState(20);
    // Local filter state managed here for server calls
    const [collabFilters, setCollabFilters] = useState({ query: '', entidadId: '', status: '', role: '' });
    
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
    const [showOffboardingModal, setShowOffboardingModal] = useState(false);
    const [collaboratorToOffboard, setCollaboratorToOffboard] = useState<Collaborator | null>(null);
    const [showOnboardingModal, setShowOnboardingModal] = useState(false);

    // Drill-Down States (from Collaborator Detail)
    const [detailEquipment, setDetailEquipment] = useState<Equipment | null>(null);
    const [ticketToEdit, setTicketToEdit] = useState<Ticket | null>(null);
    const [showAddTicketModal, setShowAddTicketModal] = useState(false);

    const userTooltipConfig = currentUser?.preferences?.tooltipConfig || defaultTooltipConfig;

    // --- DATA FETCHING (SERVER SIDE) ---
    const fetchCollaborators = useCallback(async () => {
        setCollabsLoading(true);
        try {
            const { data, total } = await dataService.fetchCollaboratorsPaginated({
                page: collabPage,
                pageSize: collabPageSize,
                filters: collabFilters,
                sort: { key: 'fullName', direction: 'ascending' }
            });
            setCollabsData(data);
            setTotalCollabs(total);
        } catch (error) {
            console.error("Error fetching collaborators:", error);
            setCollabsData([]);
            setTotalCollabs(0);
        } finally {
            setCollabsLoading(false);
        }
    }, [collabPage, collabPageSize, collabFilters]);

    useEffect(() => {
        if (activeTab === 'collaborators') {
            fetchCollaborators();
        }
    }, [activeTab, fetchCollaborators]);

    const handleRefresh = async () => {
        await fetchCollaborators();
        refreshData();
    };

    // Handlers...
    const handleAssignEquipment = async (collaboratorId: string, equipmentId: string) => {
        await dataService.updateEquipment(equipmentId, { status: 'Operacional' });
        await dataService.addAssignment({ equipmentId, collaboratorId, assignedDate: new Date().toISOString().split('T')[0] });
        handleRefresh();
    };

    const handleUnassignEquipment = async (equipmentId: string) => {
        await dataService.addAssignment({ equipmentId, returnDate: new Date().toISOString().split('T')[0] });
        handleRefresh();
    };

    const handleSaveCollaborator = async (col: any, pass?: string) => {
        if (collaboratorToEdit) {
            const updatedCollaborator = await dataService.updateCollaborator(collaboratorToEdit.id, col);
            if (pass) {
                try {
                    await dataService.adminResetPassword(collaboratorToEdit.id, pass);
                    setNewCredentials({ email: updatedCollaborator.email, password: pass });
                    setShowCredentialsModal(true);
                } catch (e: any) {
                    alert(`Erro ao redefinir password: ${e.message}`);
                }
            }
            handleRefresh();
            return updatedCollaborator;
        } else {
            const newCol = await dataService.addCollaborator(col, pass);
            if (pass && newCol) {
                setNewCredentials({ email: newCol.email, password: pass });
                setShowCredentialsModal(true);
            }
            handleRefresh();
            return newCol;
        }
    };
    
    const handleDeleteCollaborator = async (id: string) => {
        const collab = collabsData.find(c => c.id === id); // Look in current page first, fall back to API if needed but action is local
        if (collab && collab.email === PROTECTED_EMAIL) {
            alert("Ação Proibida: Este utilizador raiz não pode ser eliminado.");
            return;
        }
        if (window.confirm("Tem a certeza? Esta ação é irreversível.")) { 
            await dataService.deleteCollaborator(id); 
            handleRefresh(); 
        }
    };
    
    const onToggleStatus = async (collaborator: Collaborator) => {
        if (!collaborator) return;
        const isActivating = collaborator.status === 'Inativo';
        if (isActivating) {
            await dataService.updateCollaborator(collaborator.id, { status: 'Ativo' });
            handleRefresh();
            return;
        }
        setCollaboratorToOffboard(collaborator);
        setShowOffboardingModal(true);
    };
    
    const handleConfirmOffboarding = async (collaboratorId: string, reasonId?: string) => {
        const collaborator = collabsData.find(c => c.id === collaboratorId) || appData.collaborators.find((c:any) => c.id === collaboratorId);
        if (!collaborator) return;
        
        if (collaborator.email === PROTECTED_EMAIL) {
            alert("Ação Proibida: Não é possível desativar o utilizador raiz.");
            return;
        }

        const assignedEquipmentIds = appData.assignments
            .filter((a: Assignment) => a.collaboratorId === collaboratorId && !a.returnDate)
            .map((a: Assignment) => a.equipmentId);
        
        for (const eqId of assignedEquipmentIds) {
            await handleUnassignEquipment(eqId); // This refreshes assignments table implicitly via hook
        }
        
        await dataService.updateCollaborator(collaboratorId, { 
            status: 'Inativo',
            deactivation_reason_id: reasonId || undefined
        });
        
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

        handleRefresh();
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
                <>
                <div className="flex justify-end px-6 pt-2 pb-0">
                    {checkPermission('organization', 'create') && (
                        <button 
                            onClick={() => setShowOnboardingModal(true)}
                            className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 shadow-lg"
                        >
                            <span className="text-xl">+</span> Assistente de Onboarding
                        </button>
                    )}
                </div>
                <CollaboratorDashboard 
                    collaborators={collabsData} // Paginated data
                    totalItems={totalCollabs}
                    loading={collabsLoading}
                    page={collabPage}
                    pageSize={collabPageSize}
                    onPageChange={setCollabPage}
                    onPageSizeChange={setCollabPageSize}
                    onFilterChange={setCollabFilters}

                    escolasDepartamentos={appData.entidades}
                    instituicoes={appData.instituicoes}
                    equipment={appData.equipment} // Needed for count/tooltips (Note: global list for lookup)
                    assignments={appData.assignments}
                    tickets={appData.tickets}
                    ticketActivities={appData.ticketActivities}
                    teamMembers={appData.teamMembers}
                    collaboratorHistory={appData.collaboratorHistory}
                    messages={appData.messages}
                    currentUser={currentUser}
                    onEdit={checkPermission('organization', 'edit') ? (c) => { setCollaboratorToEdit(c); setShowAddCollaboratorModal(true); } : undefined}
                    onDelete={checkPermission('organization', 'delete') ? handleDeleteCollaborator : undefined}
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
                    jobTitles={appData.configJobTitles}
                />
                </>
            )}

            {/* ... (Team and Supplier Dashboards - unchanged logic) ... */}
            {activeTab === 'organizacao.teams' && (
                <TeamDashboard 
                    teams={appData.teams}
                    teamMembers={appData.teamMembers}
                    collaborators={appData.collaborators} // Dropdowns need full list
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
                        const contacts = (inst as any).contacts;
                        const instData = { ...inst };
                        delete (instData as any).contacts;

                        let savedInst;
                        if (instituicaoToEdit) {
                            savedInst = await dataService.updateInstituicao(instituicaoToEdit.id, instData);
                        } else {
                            savedInst = await dataService.addInstituicao(instData);
                        }

                        if (contacts && savedInst) {
                            await dataService.syncResourceContacts('instituicao', savedInst.id, contacts);
                        }

                        refreshData();
                    }}
                    instituicaoToEdit={instituicaoToEdit}
                />
            )}
            {showAddEntidadeModal && (
                <AddEntidadeModal
                    onClose={() => setShowAddEntidadeModal(false)}
                    onSave={async (ent) => {
                        const contacts = (ent as any).contacts;
                        const entData = { ...ent };
                        delete (entData as any).contacts;

                        let savedEnt;
                        if (entidadeToEdit && entidadeToEdit.id) {
                            savedEnt = await dataService.updateEntidade(entidadeToEdit.id, entData);
                        } else {
                            savedEnt = await dataService.addEntidade(entData);
                        }

                        if (contacts && savedEnt) {
                            await dataService.syncResourceContacts('entidade', savedEnt.id, contacts);
                        }

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
                        // Separate Contacts from Supplier Data
                        const contacts = (sup as any).contacts;
                        const supplierData = { ...sup };
                        delete (supplierData as any).contacts;

                        let savedSupplier;
                        if (supplierToEdit) {
                            savedSupplier = await dataService.updateSupplier(supplierToEdit.id, supplierData);
                        } else {
                            savedSupplier = await dataService.addSupplier(supplierData);
                        }

                        // Sync Contacts if present
                        if (contacts && savedSupplier) {
                            await dataService.syncResourceContacts('supplier', savedSupplier.id, contacts);
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
                            // Basic import implementation (no server pagination needed here usually)
                            if (type === 'instituicoes') {
                                alert('Importação de instituições não implementada em lote nesta versão de demonstração.');
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
                    // DRILL DOWN HANDLERS
                    onViewEquipment={(eq) => setDetailEquipment(eq)}
                    onViewTicket={(t) => { setTicketToEdit(t); setShowAddTicketModal(true); }}
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

            {showOnboardingModal && (
                <OnboardingModal
                    onClose={() => setShowOnboardingModal(false)}
                    onSave={handleRefresh}
                    equipmentTypes={appData.equipmentTypes}
                    softwareCategories={appData.softwareCategories}
                    entidades={appData.entidades}
                    instituicoes={appData.instituicoes}
                    currentUser={currentUser}
                />
            )}

            {/* DRILL DOWN MODALS */}
            {detailEquipment && (
                <EquipmentHistoryModal 
                    equipment={detailEquipment}
                    assignments={appData.assignments}
                    collaborators={appData.collaborators}
                    escolasDepartamentos={appData.entidades}
                    tickets={appData.tickets}
                    ticketActivities={appData.ticketActivities}
                    onClose={() => setDetailEquipment(null)}
                    onEdit={() => { alert('Use o menu de Ativos para editar.'); }}
                    businessServices={appData.businessServices}
                    serviceDependencies={appData.serviceDependencies}
                    softwareLicenses={appData.softwareLicenses}
                    licenseAssignments={appData.licenseAssignments}
                    vulnerabilities={appData.vulnerabilities}
                    suppliers={appData.suppliers}
                    procurementRequests={appData.procurementRequests}
                    accountingCategories={appData.configAccountingCategories}
                    conservationStates={appData.configConservationStates}
                />
            )}

            {showAddTicketModal && (
                <AddTicketModal
                    onClose={() => setShowAddTicketModal(false)}
                    onSave={async (ticket) => {
                        if (ticketToEdit) await dataService.updateTicket(ticketToEdit.id, ticket);
                        else await dataService.addTicket(ticket);
                        refreshData();
                    }}
                    ticketToEdit={ticketToEdit}
                    escolasDepartamentos={appData.entidades}
                    instituicoes={appData.instituicoes}
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
        </>
    );
};

export default OrganizationManager;
