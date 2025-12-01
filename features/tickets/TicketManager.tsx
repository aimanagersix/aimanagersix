
import React, { useState } from 'react';
import { 
    Ticket, Collaborator, ModuleKey, PermissionAction
} from '../../types';
import * as dataService from '../../services/dataService';

// Components
import TicketDashboard from '../../components/TicketDashboard';

// Modals
// FIX: Changed default import to named import for AddTicketModal to resolve the module export error.
import { AddTicketModal } from '../../components/AddTicketModal';
import CloseTicketModal from '../../components/CloseTicketModal';
import TicketActivitiesModal from '../../components/TicketActivitiesModal';

interface TicketManagerProps {
    appData: any;
    checkPermission: (module: ModuleKey, action: PermissionAction) => boolean;
    refreshData: () => void;
    dashboardFilter: any;
    setDashboardFilter: (filter: any) => void;
    setReportType: (type: string) => void;
    currentUser: Collaborator | null;
}

const TicketManager: React.FC<TicketManagerProps> = ({ 
    appData, checkPermission, refreshData, 
    dashboardFilter, setDashboardFilter, setReportType, currentUser 
}) => {
    
    const [showAddTicketModal, setShowAddTicketModal] = useState(false);
    const [ticketToEdit, setTicketToEdit] = useState<Ticket | null>(null);
    const [showCloseTicketModal, setShowCloseTicketModal] = useState(false);
    const [ticketToClose, setTicketToClose] = useState<Ticket | null>(null);
    const [showTicketActivitiesModal, setShowTicketActivitiesModal] = useState(false);
    const [ticketForActivities, setTicketForActivities] = useState<Ticket | null>(null);

    return (
        <>
            <TicketDashboard 
                tickets={appData.tickets}
                escolasDepartamentos={appData.entidades}
                collaborators={appData.collaborators}
                teams={appData.teams}
                equipment={appData.equipment}
                equipmentTypes={appData.equipmentTypes}
                categories={appData.ticketCategories}
                initialFilter={dashboardFilter}
                onClearInitialFilter={() => setDashboardFilter(null)}
                onEdit={checkPermission('tickets', 'edit') ? (t) => { setTicketToEdit(t); setShowAddTicketModal(true); } : undefined}
                onCreate={checkPermission('tickets', 'create') ? () => { setTicketToEdit(null); setShowAddTicketModal(true); } : undefined}
                onOpenCloseTicketModal={checkPermission('tickets', 'edit') ? (t) => { setTicketToClose(t); setShowCloseTicketModal(true); } : undefined}
                onUpdateTicket={checkPermission('tickets', 'edit') ? async (t) => { await dataService.updateTicket(t.id, t); refreshData(); } : undefined}
                onGenerateReport={checkPermission('reports', 'view') ? () => setReportType('ticket') : undefined}
                onOpenActivities={(t) => { setTicketForActivities(t); setShowTicketActivitiesModal(true); }}
                onGenerateSecurityReport={(t) => { 
                    setTicketToEdit(t);
                    setShowAddTicketModal(true);
                }}
            />

            {/* --- MODALS --- */}
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
            {showCloseTicketModal && ticketToClose && (
                <CloseTicketModal
                    ticket={ticketToClose}
                    collaborators={appData.collaborators}
                    onClose={() => setShowCloseTicketModal(false)}
                    onConfirm={async (techId, resolution) => {
                        await dataService.updateTicket(ticketToClose.id, { 
                            status: 'Finalizado', 
                            finishDate: new Date().toISOString().split('T')[0], 
                            technicianId: techId,
                            resolution_summary: resolution 
                        });
                        refreshData();
                        setShowCloseTicketModal(false);
                    }}
                    activities={appData.ticketActivities.filter((a: any) => a.ticketId === ticketToClose.id)}
                />
            )}
            {showTicketActivitiesModal && ticketForActivities && (
                <TicketActivitiesModal
                    ticket={ticketForActivities}
                    activities={appData.ticketActivities.filter((a: any) => a.ticketId === ticketForActivities.id)}
                    collaborators={appData.collaborators}
                    currentUser={currentUser}
                    equipment={appData.equipment}
                    equipmentTypes={appData.equipmentTypes}
                    entidades={appData.entidades}
                    assignments={appData.assignments}
                    onClose={() => setShowTicketActivitiesModal(false)}
                    onAddActivity={async (activity) => {
                        await dataService.addTicketActivity({
                            ...activity,
                            ticketId: ticketForActivities.id,
                            technicianId: currentUser?.id || '',
                            date: new Date().toISOString()
                        });
                        refreshData();
                    }}
                />
            )}
        </>
    );
};

export default TicketManager;