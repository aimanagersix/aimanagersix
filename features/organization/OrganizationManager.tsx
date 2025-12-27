import React, { useState, useCallback, useEffect } from 'react';
import { Collaborator, Instituicao, Entidade, Assignment, TicketStatus, ConfigItem, Supplier } from '../../types';
import * as dataService from '../../services/dataService';
import InstituicaoDashboard from '../../components/InstituicaoDashboard';
import EntidadeDashboard from '../../components/EntidadeDashboard';
import CollaboratorDashboard from '../../components/CollaboratorDashboard';
import SupplierDashboard from '../../components/SupplierDashboard';
import AddInstituicaoModal from '../../components/AddInstituicaoModal';
import AddEntidadeModal from '../../components/AddEntidadeModal';
import AddCollaboratorModal from '../../components/AddCollaboratorModal';
import AddSupplierModal from '../../components/AddSupplierModal';
import CollaboratorHistoryModal from '../../components/CollaboratorHistoryModal';
import { CollaboratorDetailModal } from '../../components/CollaboratorDetailModal';
import CredentialsModal from '../../components/CredentialsModal';
import OffboardingModal from '../../components/OffboardingModal';
import OnboardingModal from '../../components/OnboardingModal';
import EntidadeDetailModal from '../../components/EntidadeDetailModal';

interface OrganizationManagerProps {
    activeTab: string;
    appData: any;
    checkPermission: (module: any, action: any) => boolean;
    refreshData: () => void;
    currentUser: Collaborator | null;
    setActiveTab: (tab: string) => void;
    onStartChat: (collaborator: Collaborator) => void;
    setReportType: (type: string) => void;
}

const OrganizationManager: React.FC<OrganizationManagerProps> = ({ activeTab, appData, checkPermission, refreshData, currentUser, setActiveTab, onStartChat, setReportType }) => {
    const [collabsData, setCollabsData] = useState<Collaborator[]>([]);
    const [totalCollabs, setTotalCollabs] = useState(0);
    const [collabsLoading, setCollabsLoading] = useState(false);
    const [collabPage, setCollabPage] = useState(1);
    const [collabPageSize, setCollabPageSize] = useState(20);
    const [collabFilters, setCollabFilters] = useState({ query: '', entidade_id: '', status: '', role: '' });
    
    const [showAddInstituicaoModal, setShowAddInstituicaoModal] = useState(false);
    const [instituicaoToEdit, setInstituicaoToEdit] = useState<Instituicao | null>(null);
    const [showAddEntidadeModal, setShowAddEntidadeModal] = useState(false);
    const [entidadeToEdit, setEntidadeToEdit] = useState<Entidade | null>(null);
    const [showAddCollaboratorModal, setShowAddCollaboratorModal] = useState(false);
    const [collaboratorToEdit, setCollaboratorToEdit] = useState<Collaborator | null>(null);
    const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
    const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);
    const [showCollaboratorHistoryModal, setShowCollaboratorHistoryModal] = useState(false);
    const [historyCollaborator, setHistoryCollaborator] = useState<Collaborator | null>(null);
    const [showCollaboratorDetailModal, setShowCollaboratorDetailModal] = useState(false);
    const [detailCollaborator, setDetailCollaborator] = useState<Collaborator | null>(null);
    const [showCredentialsModal, setShowCredentialsModal] = useState(false);
    const [newCredentials, setNewCredentials] = useState<{email: string, password?: string} | null>(null);
    const [showOffboardingModal, setShowOffboardingModal] = useState(false);
    const [collaboratorToOffboard, setCollaboratorToOffboard] = useState<Collaborator | null>(null);
    const [showOnboardingModal, setShowOnboardingModal] = useState(false);
    const [selectedEntityForDrillDown, setSelectedEntityForDrillDown] = useState<Entidade | null>(null);

    const fetchCollaborators = useCallback(async () => {
        setCollabsLoading(true);
        try {
            const { data, total } = await dataService.fetchCollaboratorsPaginated({ page: collabPage, pageSize: collabPageSize, filters: collabFilters, sort: { key: 'full_name', direction: 'ascending' } });
            setCollabsData(data);
            setTotalCollabs(total);
        } catch (error) { console.error(error); }
        finally { setCollabsLoading(false); }
    }, [collabPage, collabPageSize, collabFilters]);

    useEffect(() => { if (activeTab === 'collaborators') fetchCollaborators(); }, [activeTab, fetchCollaborators]);

    const handleRefresh = async () => { 
        dataService.invalidateLocalCache();
        await fetchCollaborators(); 
        refreshData(); 
    };

    const handleSaveCollaborator = async (col: any, photoFile?: File | null, pass?: string) => {
        let resultCol;
        try {
            if (collaboratorToEdit) {
                await dataService.updateCollaborator(collaboratorToEdit.id, col);
                const email = col.email || collaboratorToEdit.email;
                if (pass) { 
                    await dataService.adminResetPassword(collaboratorToEdit.id, pass); 
                    setNewCredentials({ email: email, password: pass }); 
                    setShowCredentialsModal(true); 
                }
                resultCol = { ...collaboratorToEdit, ...col };
            } else {
                resultCol = await dataService.addCollaborator(col, pass);
                if (pass) { 
                    setNewCredentials({ email: resultCol.email, password: pass }); 
                    setShowCredentialsModal(true); 
                }
            }
            if (photoFile && resultCol?.id) {
                await dataService.uploadCollaboratorPhoto(resultCol.id, photoFile);
            }
            await handleRefresh(); 
            return resultCol;
        } catch (err) {
            console.error("[OrgManager] Falha na gravação composta:", err);
            throw err;
        }
    };

    const handleSaveSupplier = async (s: any) => {
        try {
            const contacts = s.contacts || [];
            const supplierData = { ...s };
            delete supplierData.contacts;

            let resultSupplier;
            if (supplierToEdit || s.id) {
                const id = s.id || supplierToEdit?.id;
                await dataService.updateSupplier(id, supplierData);
                resultSupplier = { ...supplierData, id };
            } else {
                resultSupplier = await dataService.addSupplier(supplierData);
            }

            if (resultSupplier?.id) {
                await dataService.syncResourceContacts('supplier', resultSupplier.id, contacts);
            }

            refreshData();
            return resultSupplier;
        } catch (err) {
            console.error("[OrgManager] Erro ao gravar fornecedor:", err);
            throw err;
        }
    };

    const handleToggleSupplierStatus = async (id: string) => {
        try {
            const supplier = appData.suppliers.find((s: Supplier) => s.id === id);
            if (supplier) {
                const newStatus = supplier.is_active === false;
                await dataService.updateSupplier(id, { is_active: newStatus });
                refreshData();
            }
        } catch (e) {
            console.error("Failed to toggle supplier status", e);
            alert("Erro ao alterar estado do fornecedor.");
        }
    };
    
    return (
        <>
            {activeTab === 'organizacao.instituicoes' && (
                <InstituicaoDashboard instituicoes={appData.instituicoes} escolasDepartamentos={appData.entidades} collaborators={appData.collaborators} assignments={appData.assignments} equipment={appData.equipment} brands={appData.brands} equipmentTypes={appData.equipmentTypes} onEdit={checkPermission('org_institutions', 'edit') ? (i) => { setInstituicaoToEdit(i); setShowAddInstituicaoModal(true); } : undefined} onDelete={checkPermission('org_institutions', 'delete') ? async (id) => { if (window.confirm("Apagar?")) { await dataService.deleteInstituicao(id); refreshData(); } } : undefined} onCreate={checkPermission('org_institutions', 'create') ? () => { setInstituicaoToEdit(null); setShowAddInstituicaoModal(true); } : undefined} onToggleStatus={checkPermission('org_institutions', 'edit') ? async (id) => { const inst = appData.instituicoes.find((i: Instituicao) => i.id === id); if (inst) { await dataService.updateInstituicao(id, { is_active: inst.is_active === false }); refreshData(); } } : undefined} onViewCollaborator={(c) => { setDetailCollaborator(c); setShowCollaboratorDetailModal(true); }} />
            )}

            {activeTab === 'organizacao.entidades' && (
                <EntidadeDashboard escolasDepartamentos={appData.entidades} instituicoes={appData.instituicoes} collaborators={appData.collaborators} assignments={appData.assignments} onEdit={checkPermission('org_entities', 'edit') ? (e) => { setEntidadeToEdit(e); setShowAddEntidadeModal(true); } : undefined} onDelete={checkPermission('org_entities', 'delete') ? async (id) => { if (window.confirm("Apagar?")) { await dataService.deleteEntidade(id); refreshData(); } } : undefined} onCreate={checkPermission('org_entities', 'create') ? () => { setEntidadeToEdit(null); setShowAddEntidadeModal(true); } : undefined} onToggleStatus={checkPermission('org_entities', 'edit') ? async (id) => { const ent = appData.entidades.find((e: Entidade) => e.id === id); if (ent) { await dataService.updateEntidade(id, { status: ent.status === 'Ativo' ? 'Inativo' : 'Ativo' }); refreshData(); } } : undefined} onViewDetails={(e) => setSelectedEntityForDrillDown(e)} />
            )}

            {activeTab === 'collaborators' && (
                <CollaboratorDashboard 
                    collaborators={collabsData} 
                    totalItems={totalCollabs} 
                    loading={collabsLoading} 
                    page={collabPage} 
                    pageSize={collabPageSize} 
                    onPageChange={setCollabPage} 
                    onPageSizeChange={setCollabPageSize} 
                    onFilterChange={setCollabFilters} 
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
                    jobTitles={appData.configJobTitles}
                    onEdit={checkPermission('org_collaborators', 'edit') ? (c) => { setCollaboratorToEdit(c); setShowAddCollaboratorModal(true); } : undefined} 
                    onDelete={checkPermission('org_collaborators', 'delete') ? async (id, reason) => { if(confirm("Deseja eliminar este colaborador?")) { await dataService.deleteCollaborator(id, reason); await handleRefresh(); } } : undefined} 
                    onCreate={checkPermission('org_collaborators', 'create') ? () => { setCollaboratorToEdit(null); setShowAddCollaboratorModal(true); } : undefined} 
                    onShowHistory={(c) => { setHistoryCollaborator(c); setShowCollaboratorHistoryModal(true); }} 
                    onShowDetails={(c) => { setDetailCollaborator(c); setShowCollaboratorDetailModal(true); }} 
                    onStartChat={onStartChat} 
                    onToggleStatus={checkPermission('org_collaborators', 'edit') ? async (c) => { if(c.status === 'Ativo') { setCollaboratorToOffboard(c); setShowOffboardingModal(true); } else { await dataService.updateCollaborator(c.id, { status: 'Ativo' }); await handleRefresh(); } } : undefined} 
                />
            )}

            {activeTab === 'organizacao.suppliers' && (
                <SupplierDashboard suppliers={appData.suppliers} businessServices={appData.businessServices} onEdit={checkPermission('org_suppliers', 'edit') ? (s) => { setSupplierToEdit(s); setShowAddSupplierModal(true); } : undefined} onDelete={checkPermission('org_suppliers', 'delete') ? async (id) => { if (confirm("Apagar?")) { await dataService.deleteSupplier(id); refreshData(); } } : undefined} onCreate={checkPermission('org_suppliers', 'create') ? () => { setSupplierToEdit(null); setShowAddSupplierModal(true); } : undefined} onToggleStatus={checkPermission('org_suppliers', 'edit') ? handleToggleSupplierStatus : undefined} />
            )}

            {showAddInstituicaoModal && <AddInstituicaoModal onClose={() => setShowAddInstituicaoModal(false)} onSave={async (inst) => { if (instituicaoToEdit) await dataService.updateInstituicao(instituicaoToEdit.id, inst); else await dataService.addInstituicao(inst); refreshData(); }} instituicaoToEdit={instituicaoToEdit} />}
            {showAddEntidadeModal && <AddEntidadeModal onClose={() => setShowAddEntidadeModal(false)} onSave={async (ent) => { if (entidadeToEdit) await dataService.updateEntidade(entidadeToEdit.id, ent); else await dataService.addEntidade(ent); refreshData(); }} entidadeToEdit={entidadeToEdit} instituicoes={appData.instituicoes} />}
            {showAddCollaboratorModal && <AddCollaboratorModal onClose={() => setShowAddCollaboratorModal(false)} onSave={handleSaveCollaborator} collaboratorToEdit={collaboratorToEdit} escolasDepartamentos={appData.entidades} instituicoes={appData.instituicoes} currentUser={currentUser} />}
            {showAddSupplierModal && <AddSupplierModal onClose={() => setShowAddSupplierModal(false)} onSave={handleSaveSupplier} supplierToEdit={supplierToEdit} businessServices={appData.businessServices} teams={appData.teams} onCreateTicket={async (t) => { await dataService.addTicket(t); refreshData(); }} />}
            {showCollaboratorHistoryModal && historyCollaborator && <CollaboratorHistoryModal collaborator={historyCollaborator} history={appData.collaboratorHistory} escolasDepartamentos={appData.entidades} onClose={() => setShowCollaboratorHistoryModal(false)} />}
            {showCollaboratorDetailModal && detailCollaborator && <CollaboratorDetailModal collaborator={detailCollaborator} assignments={appData.assignments} equipment={appData.equipment} tickets={appData.tickets} brandMap={new Map(appData.brands.map((b:any)=>[b.id,b.name]))} equipmentTypeMap={new Map(appData.equipmentTypes.map((t:any)=>[t.id,t.name]))} licenseAssignments={appData.licenseAssignments} softwareLicenses={appData.softwareLicenses} onClose={() => setShowCollaboratorDetailModal(false)} onShowHistory={()=>{}} onStartChat={onStartChat} onEdit={(c)=>{setCollaboratorToEdit(c);setShowAddCollaboratorModal(true);}} onViewTicket={(t) => { setDetailCollaborator(null); setShowCollaboratorDetailModal(false); setActiveTab('tickets.list'); }} onViewEquipment={(eq) => { setDetailCollaborator(null); setShowCollaboratorDetailModal(false); setActiveTab('equipment.inventory'); }} />}
            {showCredentialsModal && newCredentials && <CredentialsModal onClose={() => setShowCredentialsModal(false)} email={newCredentials.email} password={newCredentials.password} />}
            {showOffboardingModal && collaboratorToOffboard && <OffboardingModal onClose={() => setShowOffboardingModal(false)} onConfirm={async (id, rid) => { await dataService.updateCollaborator(id, { status: 'Inativo', deactivation_reason_id: rid }); await handleRefresh(); }} collaborator={collaboratorToOffboard} assignments={appData.assignments} licenseAssignments={appData.licenseAssignments} equipment={appData.equipment} softwareLicenses={appData.softwareLicenses} brandMap={new Map()} equipmentTypeMap={new Map()} deactivationReasons={appData.configCollaboratorDeactivationReasons} />}
            {showOnboardingModal && <OnboardingModal onClose={() => setShowOnboardingModal(false)} onSave={handleRefresh} equipmentTypes={appData.equipmentTypes} softwareCategories={appData.softwareCategories} entidades={appData.entidades} instituicoes={appData.instituicoes} currentUser={currentUser} />}
            {selectedEntityForDrillDown && <EntidadeDetailModal entidade={selectedEntityForDrillDown} instituicao={appData.instituicoes.find((i:any)=>i.id===selectedEntityForDrillDown.instituicao_id)} collaborators={appData.collaborators} assignments={appData.assignments} equipment={appData.equipment} brands={appData.brands} equipmentTypes={appData.equipmentTypes} onClose={() => setSelectedEntityForDrillDown(null)} onEdit={() => { const ent = selectedEntityForDrillDown; setSelectedEntityForDrillDown(null); setEntidadeToEdit(ent); setShowAddEntidadeModal(true); }} />}
        </>
    );
};

export default OrganizationManager;