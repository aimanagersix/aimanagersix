
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { 
    Ticket, Collaborator, ModuleKey, PermissionAction, TicketStatus
} from '../../types';
import * as dataService from '../../services/dataService';

// Components
import TicketDashboard from '../../components/TicketDashboard';

// Modals
import { AddTicketModal } from '../../components/AddTicketModal';
import CloseTicketModal from '../../components/CloseTicketModal';
import TicketActivitiesModal from '../../components/TicketActivitiesModal';
import RegulatoryNotificationModal from '../../components/RegulatoryNotificationModal';

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
    // Server-Side Data State for Tickets
    const [ticketsData, setTicketsData] = useState<Ticket[]>([]);
    const [totalTickets, setTotalTickets] = useState(0);
    const [ticketsLoading, setTicketsLoading] = useState(false);
    const [ticketPage, setTicketPage] = useState(1);
    const [ticketPageSize, setTicketPageSize] = useState(20);
    // Fix: requestDate to request_date
    const [ticketSort, setTicketSort] = useState<{ key: string, direction: 'ascending' | 'descending' }>({ key: 'request_date', direction: 'descending' });

    const [showAddTicketModal, setShowAddTicketModal] = useState(false);
    const [ticketToEdit, setTicketToEdit] = useState<Ticket | null>(null);
    
    const [showCloseTicketModal, setShowCloseTicketModal] = useState(false);
    const [ticketToClose, setTicketToClose] = useState<Ticket | null>(null);
    
    const [showTicketActivitiesModal, setShowTicketActivitiesModal] = useState(false);
    const [ticketForActivities, setTicketForActivities] = useState<Ticket | null>(null);

    const [showRegulatoryModal, setShowRegulatoryModal] = useState(false);
    const [ticketForRegulatoryReport, setTicketForRegulatoryReport] = useState<Ticket | null>(null);

    // Get User's teams for filtered fetch
    const userTeamIds = useMemo(() => {
        if (!currentUser || !appData.teamMembers) return [];
        return appData.teamMembers
            .filter((tm: any) => tm.collaborator_id === currentUser.id)
            .map((tm: any) => tm.team_id);
    }, [appData.teamMembers, currentUser]);

    const fetchTickets = useCallback(async () => {
        if (!currentUser) return;
        setTicketsLoading(true);
        try {
            const { data, total } = await dataService.fetchTicketsPaginated({
                page: ticketPage,
                pageSize: ticketPageSize,
                filters: dashboardFilter,
                sort: ticketSort,
                userContext: {
                    id: currentUser.id,
                    role: currentUser.role,
                    teamIds: userTeamIds
                }
            });
            setTicketsData(data);
            setTotalTickets(total);
        } catch (error) {
            console.error("Error fetching tickets:", error);
            setTicketsData([]);
            setTotalTickets(0);
        } finally {
            setTicketsLoading(false);
        }
    }, [ticketPage, ticketPageSize, dashboardFilter, ticketSort, currentUser, userTeamIds]);

    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    const handleRefresh = async () => {
        await fetchTickets();
        refreshData(); 
    };

    const handleAddActivity = async (activity: { description: string, equipment_id?: string }) => {
        if (!ticketForActivities) return;
        await dataService.addTicketActivity({
            ticket_id: ticketForActivities.id,
            technician_id: currentUser?.id,
            description: activity.description,
            equipment_id: activity.equipment_id,
            date: new Date().toISOString()
        });
        // Activities load internally in the modal, but we trigger a refresh of the list too
        handleRefresh();
    };

    return (
        <>
            <TicketDashboard 
                tickets={ticketsData}
                totalItems={totalTickets}
                loading={ticketsLoading}
                page={ticketPage}
                pageSize={ticketPageSize}
                onPageChange={setTicketPage}
                onPageSizeChange={setTicketPageSize}
                onFilterChange={setDashboardFilter}
                // Fix: TicketDashboard might need sort prop instead of separate sort handlers if not defined in props
                sort={ticketSort}
                
                escolasDepartamentos={appData.entidades}
                collaborators={appData.collaborators}
                teams={appData.teams}
                suppliers={appData.suppliers} 
                equipment={appData.equipment}
                categories={appData.ticketCategories}
                onEdit={checkPermission('tickets', 'edit') ? (t) => { setTicketToEdit(t); setShowAddTicketModal(true); } : undefined}
                onCreate={checkPermission('tickets', 'create') ? () => { setTicketToEdit(null); setShowAddTicketModal(true); } : undefined}
                onOpenActivities={(t) => { setTicketForActivities(t); setShowTicketActivitiesModal(true); }}
                onGenerateSecurityReport={(t) => { 
                    setTicketForRegulatoryReport(t);
                    setShowRegulatoryModal(true);
                }}
            />

            {showAddTicketModal && (
                <AddTicketModal
                    onClose={() => setShowAddTicketModal(false)}
                    onSave={async (ticket) => {
                        if (ticketToEdit) await dataService.updateTicket(ticketToEdit.id, ticket);
                        else await dataService.addTicket(ticket);
                        handleRefresh();
                    }}
                    ticketToEdit={ticketToEdit}
                    escolasDepartamentos={appData.entidades}
                    // Fix: Added instituicoes to AddTicketModal props if needed by component
                    instituicoes={appData.instituicoes}
                    collaborators={appData.collaborators}
                    teams={appData.teams}
                    currentUser={currentUser}
                    categories={appData.ticketCategories}
                    securityIncidentTypes={appData.securityIncidentTypes}
                />
            )}

            {showTicketActivitiesModal && ticketForActivities && (
                <TicketActivitiesModal
                    ticket={ticketForActivities}
                    activities={appData.ticketActivities}
                    collaborators={appData.collaborators}
                    currentUser={currentUser}
                    equipment={appData.equipment}
                    equipmentTypes={appData.equipmentTypes}
                    entidades={appData.entidades}
                    onClose={() => setShowTicketActivitiesModal(false)}
                    onAddActivity={handleAddActivity}
                    assignments={appData.assignments}
                />
            )}

            {showCloseTicketModal && ticketToClose && (
                <CloseTicketModal
                    ticket={ticketToClose}
                    collaborators={appData.collaborators}
                    onClose={() => setShowCloseTicketModal(false)}
                    onConfirm={async (techId, summary) => {
                        await dataService.updateTicket(ticketToClose.id, { 
                            status: TicketStatus.Finished, 
                            technician_id: techId, 
                            // Fix: finishDate to finish_date
                            finish_date: new Date().toISOString(),
                            resolution_summary: summary
                        });
                        handleRefresh();
                        setShowCloseTicketModal(false);
                    }}
                />
            )}

            {showRegulatoryModal && ticketForRegulatoryReport && (
                <RegulatoryNotificationModal 
                    ticket={ticketForRegulatoryReport}
                    activities={[]} // Fetched inside or passed
                    onClose={() => setShowRegulatoryModal(false)}
                />
            )}
        </>
    );
};

export default TicketManager;
