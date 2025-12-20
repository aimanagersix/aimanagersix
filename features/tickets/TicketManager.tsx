
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
                filters: dashboardFilter || {},
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

    const handleSaveTicket = async (ticket: any) => {
        if (ticketToEdit) {
            await dataService.updateTicket(ticketToEdit.id, ticket);
        } else {
            const newTicket = await dataService.addTicket(ticket);
            
            // Pedido 1: Automação de Chat para Membros da Equipa
            if (newTicket && newTicket.team_id) {
                const members = appData.teamMembers.filter((tm: any) => tm.team_id === newTicket.team_id);
                
                // Enviar mensagem para cada membro da equipa (exceto o próprio criador, se for técnico)
                const chatPromises = members.map((member: any) => {
                    if (member.collaborator_id === currentUser?.id) return Promise.resolve();
                    
                    return dataService.addMessage({
                        sender_id: '00000000-0000-0000-0000-000000000000', // ID de Sistema
                        receiver_id: member.collaborator_id,
                        content: `📢 NOVO TICKET na sua Equipa: [#${newTicket.id.substring(0,8)}] - ${newTicket.title}.`,
                        timestamp: new Date().toISOString(),
                        read: false
                    });
                });
                
                await Promise.allSettled(chatPromises);
            }
        }
        handleRefresh();
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
                sort={ticketSort}
                escolasDepartamentos={appData.entidades}
                collaborators={appData.collaborators}
                teams={appData.teams}
                suppliers={appData.suppliers} 
                equipment={appData.equipment}
                categories={appData.ticketCategories}
                configTicketStatuses={appData.configTicketStatuses}
                onEdit={checkPermission('tickets', 'edit') ? (t) => { setTicketToEdit(t); setShowAddTicketModal(true); } : undefined}
                onCreate={checkPermission('tickets', 'create') ? () => { setTicketToEdit(null); setShowAddTicketModal(true); } : undefined}
                onOpenActivities={(t) => { setTicketForActivities(t); setShowTicketActivitiesModal(true); }}
                onGenerateSecurityReport={(t) => { 
                    setTicketForRegulatoryReport(t);
                    setShowRegulatoryModal(true);
                }}
                checkPermission={checkPermission}
            />

            {showAddTicketModal && (
                <AddTicketModal
                    onClose={() => setShowAddTicketModal(false)}
                    onSave={handleSaveTicket}
                    ticketToEdit={ticketToEdit}
                    escolasDepartamentos={appData.entidades}
                    instituicoes={appData.instituicoes}
                    collaborators={appData.collaborators}
                    teams={appData.teams}
                    teamMembers={appData.teamMembers}
                    currentUser={currentUser}
                    categories={appData.ticketCategories}
                    securityIncidentTypes={appData.securityIncidentTypes}
                    checkPermission={checkPermission}
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
                    activities={[]} 
                    onClose={() => setShowRegulatoryModal(false)}
                />
            )}
        </>
    );
};

export default TicketManager;
