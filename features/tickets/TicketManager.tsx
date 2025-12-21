
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

const SYSTEM_SENDER_ID = '00000000-0000-0000-0000-000000000000';
const GENERAL_CHANNEL_ID = '00000000-0000-0000-0000-000000000000';

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

    const userTeamIds = useMemo(() => {
        if (!currentUser || !appData.teamMembers) return [];
        return appData.teamMembers.filter((tm: any) => tm.collaborator_id === currentUser.id).map((tm: any) => tm.team_id);
    }, [appData.teamMembers, currentUser]);

    const fetchTickets = useCallback(async () => {
        if (!currentUser) return;
        setTicketsLoading(true);
        try {
            const { data, total } = await dataService.fetchTicketsPaginated({
                page: ticketPage, pageSize: ticketPageSize, filters: dashboardFilter || {}, sort: ticketSort,
                userContext: { id: currentUser.id, role: currentUser.role, teamIds: userTeamIds }
            });
            setTicketsData(data);
            setTotalTickets(total);
        } catch (error) { console.error(error); }
        finally { setTicketsLoading(false); }
    }, [ticketPage, ticketPageSize, dashboardFilter, ticketSort, currentUser, userTeamIds]);

    useEffect(() => { fetchTickets(); }, [fetchTickets]);

    const handleRefresh = async () => { await fetchTickets(); refreshData(); };

    const notifyTeamMates = async (teamId: string, ticketTitle: string, ticketId: string, isNew: boolean) => {
        const members = appData.teamMembers.filter((tm: any) => tm.team_id === teamId);
        const teamName = appData.teams.find((t: any) => t.id === teamId)?.name || 'Equipa';
        
        const alertMsg = `📢 ${isNew ? 'NOVO TICKET' : 'ATRIBUIÇÃO'}: [#${ticketId.substring(0,8)}] - ${ticketTitle} (${teamName}).`;

        // 1. Notificação para o Canal Geral (Garante o Alerta Visual para todos)
        await dataService.addMessage({
            sender_id: SYSTEM_SENDER_ID,
            receiver_id: GENERAL_CHANNEL_ID,
            content: alertMsg,
            timestamp: new Date().toISOString(),
            read: false
        });

        // 2. Mensagens privadas para os membros
        const promises = members.map((member: any) => {
            return dataService.addMessage({
                sender_id: SYSTEM_SENDER_ID,
                receiver_id: member.collaborator_id,
                content: alertMsg,
                timestamp: new Date().toISOString(),
                read: false
            });
        });
        await Promise.allSettled(promises);
    };

    const handleSaveTicket = async (ticket: any) => {
        try {
            if (ticketToEdit) {
                const isTeamChange = ticketToEdit.team_id !== ticket.team_id;
                if (isTeamChange && ticket.status === 'Pedido') {
                    ticket.status = 'Em progresso';
                }
                await dataService.updateTicket(ticketToEdit.id, ticket);
                if (isTeamChange && ticket.team_id) {
                    await notifyTeamMates(ticket.team_id, ticket.title, ticketToEdit.id, false);
                }
            } else {
                const triagemTeam = appData.teams.find((t: any) => t.name === 'Triagem');
                if (!ticket.team_id && triagemTeam) ticket.team_id = triagemTeam.id;
                
                const newTicket = await dataService.addTicket(ticket);
                if (newTicket && newTicket.team_id) {
                    await notifyTeamMates(newTicket.team_id, newTicket.title, newTicket.id, true);
                }
            }
            handleRefresh();
            return true;
        } catch (error: any) { throw error; }
    };

    return (
        <>
            <TicketDashboard 
                tickets={ticketsData} totalItems={totalTickets} loading={ticketsLoading} page={ticketPage} pageSize={ticketPageSize}
                onPageChange={setTicketPage} onPageSizeChange={setTicketPageSize} onFilterChange={setDashboardFilter} sort={ticketSort}
                escolasDepartamentos={appData.entidades} instituicoes={appData.instituicoes} collaborators={appData.collaborators}
                teams={appData.teams} suppliers={appData.suppliers} equipment={appData.equipment}
                categories={appData.ticketCategories} configTicketStatuses={appData.configTicketStatuses}
                onEdit={checkPermission('tickets', 'edit') ? (t) => { setTicketToEdit(t); setShowAddTicketModal(true); } : undefined}
                onUpdateTicket={async (t) => { await dataService.updateTicket(t.id, t); handleRefresh(); }}
                onCreate={checkPermission('tickets', 'create') ? () => { setTicketToEdit(null); setShowAddTicketModal(true); } : undefined}
                onOpenActivities={(t) => { setTicketForActivities(t); setShowTicketActivitiesModal(true); }}
                onGenerateSecurityReport={(t) => { setTicketForRegulatoryReport(t); setShowRegulatoryModal(true); }}
                checkPermission={checkPermission} onOpenCloseTicketModal={(t) => { setTicketToClose(t); setShowCloseTicketModal(true); }}
            />
            {showAddTicketModal && <AddTicketModal onClose={() => setShowAddTicketModal(false)} onSave={handleSaveTicket} ticketToEdit={ticketToEdit} escolasDepartamentos={appData.entidades} instituicoes={appData.instituicoes} collaborators={appData.collaborators} teams={appData.teams} teamMembers={appData.teamMembers} currentUser={currentUser} categories={appData.ticketCategories} securityIncidentTypes={appData.securityIncidentTypes} checkPermission={checkPermission} equipment={appData.equipment} assignments={appData.assignments} softwareLicenses={appData.softwareLicenses} licenseAssignments={appData.licenseAssignments} />}
            {showTicketActivitiesModal && ticketForActivities && <TicketActivitiesModal ticket={ticketForActivities} activities={appData.ticketActivities} collaborators={appData.collaborators} currentUser={currentUser} equipment={appData.equipment} equipmentTypes={appData.equipmentTypes} entidades={appData.entidades} onClose={() => setShowTicketActivitiesModal(false)} onAddActivity={async (act) => { await dataService.addTicketActivity({...act, ticket_id: ticketForActivities.id, technician_id: currentUser?.id, date: new Date().toISOString()}); handleRefresh(); }} assignments={appData.assignments} softwareLicenses={appData.softwareLicenses} licenseAssignments={appData.licenseAssignments} />}
            {showCloseTicketModal && ticketToClose && <CloseTicketModal ticket={ticketToClose} collaborators={appData.collaborators} onClose={() => setShowCloseTicketModal(false)} onConfirm={async (techId, summary) => { await dataService.updateTicket(ticketToClose.id, { status: TicketStatus.Finished, technician_id: techId, finish_date: new Date().toISOString(), resolution_summary: summary }); handleRefresh(); setShowCloseTicketModal(false); }} />}
            {showRegulatoryModal && ticketForRegulatoryReport && <RegulatoryNotificationModal ticket={ticketForRegulatoryReport} activities={[]} onClose={() => setShowRegulatoryModal(false)} />}
        </>
    );
};

export default TicketManager;
