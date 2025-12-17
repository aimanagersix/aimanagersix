
import React, { useState, useCallback, useEffect } from 'react';
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
    const [ticketSort, setTicketSort] = useState<{ key: string, direction: 'ascending' | 'descending' }>({ key: 'requestDate', direction: 'descending' });

    const [showAddTicketModal, setShowAddTicketModal] = useState(false);
    const [ticketToEdit, setTicketToEdit] = useState<Ticket | null>(null);
    
    const [showCloseTicketModal, setShowCloseTicketModal] = useState(false);
    const [ticketToClose, setTicketToClose] = useState<Ticket | null>(null);
    
    const [showTicketActivitiesModal, setShowTicketActivitiesModal] = useState(false);
    const [ticketForActivities, setTicketForActivities] = useState<Ticket | null>(null);

    const [showRegulatoryModal, setShowRegulatoryModal] = useState(false);
    const [ticketForRegulatoryReport, setTicketForRegulatoryReport] = useState<Ticket | null>(null);

    // --- DEFAULT FILTER LOGIC ---
    useEffect(() => {
        // Se não houver filtro, aplicar o padrão de "Abertos"
        if (!dashboardFilter || Object.keys(dashboardFilter).length === 0) {
            setDashboardFilter({ status: [TicketStatus.Requested, TicketStatus.InProgress] });
        }
    }, []);

    const fetchTickets = useCallback(async () => {
        setTicketsLoading(true);
        try {
            const { data, total } = await dataService.fetchTicketsPaginated({
                page: ticketPage,
                pageSize: ticketPageSize,
                filters: dashboardFilter,
                sort: ticketSort
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
    }, [ticketPage, ticketPageSize, dashboardFilter, ticketSort]);

    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    const handleRefresh = async () => {
        await fetchTickets();
        refreshData(); 
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
                onSortChange={setTicketSort}
                sort={ticketSort}
                
                escolasDepartamentos={appData.entidades}
                collaborators={appData.collaborators}
                teams={appData.teams}
                suppliers={appData.suppliers} 
                equipment={appData.equipment}
                equipmentTypes={appData.equipmentTypes}
                categories={appData.ticketCategories}
                initialFilter={dashboardFilter}
                onClearInitialFilter={() => setDashboardFilter({})}
                onEdit={checkPermission('tickets', 'edit') ? (t) => { setTicketToEdit(t); setShowAddTicketModal(true); } : undefined}
                onCreate={checkPermission('tickets', 'create') ? () => { setTicketToEdit(null); setShowAddTicketModal(true); } : undefined}
                onOpenCloseTicketModal={checkPermission('tickets', 'edit') ? (t) => { setTicketToClose(t); setShowCloseTicketModal(true); } : undefined}
                onUpdateTicket={checkPermission('tickets', 'edit') ? async (t) => { await dataService.updateTicket(t.id, t); handleRefresh(); } : undefined}
                onGenerateReport={checkPermission('reports', 'view') ? () => setReportType('ticket') : undefined}
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
                    instituicoes={appData.instituicoes}
                    collaborators={appData.collaborators}
                    suppliers={appData.suppliers}
                    teams={appData.teams}
                    currentUser={currentUser}
                    userPermissions={{ viewScope: 'all', canManage: checkPermission('tickets', 'manage') }}
                    equipment={appData.equipment}
                    equipmentTypes={appData.equipmentTypes}
                    assignments={appData.assignments}
                    categories={appData.ticketCategories}
                    securityIncidentTypes={appData.securityIncidentTypes}
                    pastTickets={ticketsData} 
                />
            )}
            {/* Outros modais omitidos */}
        </>
    );
};

export default TicketManager;
