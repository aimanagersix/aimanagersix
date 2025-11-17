import React, { useMemo } from 'react';
import { Equipment, Instituicao, Entidade, Assignment, EquipmentStatus, EquipmentType, Ticket, TicketStatus, Collaborator, Team, SoftwareLicense, LicenseAssignment, LicenseStatus } from '../types';
import { FaCheckCircle, FaTools, FaTimesCircle, FaWarehouse, FaTicketAlt, FaShieldAlt, FaKey, FaBoxOpen, FaHistory, FaUsers, FaCalendarAlt, FaExclamationTriangle, FaLaptop, FaDesktop } from './common/Icons';

interface OverviewDashboardProps {
    equipment: Equipment[];
    instituicoes: Instituicao[];
    entidades: Entidade[];
    assignments: Assignment[];
    equipmentTypes: EquipmentType[];
    tickets: Ticket[];
    collaborators: Collaborator[];
    teams: Team[];
    expiringWarranties: Equipment[];
    expiringLicenses: SoftwareLicense[];
    softwareLicenses: SoftwareLicense[];
    licenseAssignments: LicenseAssignment[];
    onViewItem: (tab: string, filter: any) => void;
}

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    onClick?: () => void;
    subtext?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, onClick, subtext }) => (
    <div 
        className={`bg-surface-dark p-4 rounded-lg shadow-lg flex items-center space-x-4 ${onClick ? 'cursor-pointer hover:bg-gray-800/50 transition-colors' : ''}`}
        onClick={onClick}
        role={onClick ? 'button' : 'figure'}
        tabIndex={onClick ? 0 : -1}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onClick?.()}
    >
        <div className={`p-3 rounded-full ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-on-surface-dark-secondary font-medium">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
            {subtext && <p className="text-xs text-gray-400">{subtext}</p>}
        </div>
    </div>
);

const BarChart: React.FC<{ title: string; data: { name: string; value: number }[], icon?: React.ReactNode }> = ({ title, data, icon }) => {
    const maxValue = useMemo(() => Math.max(...data.map(item => item.value), 0), [data]);

    return (
        <div className="bg-surface-dark p-6 rounded-lg shadow-lg h-full">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                {icon}
                {title}
            </h3>
            <div className="space-y-3">
                {data.length > 0 ? data.map((item, index) => (
                    <div key={index} className="flex items-center" title={`${item.name}: ${item.value}`}>
                        <div className="w-1/3 text-sm text-on-surface-dark-secondary truncate pr-2">{item.name}</div>
                        <div className="w-2/3 flex items-center">
                            <div className="w-full bg-gray-700 rounded-full h-4">
                                <div
                                    className="bg-brand-secondary h-4 rounded-full"
                                    style={{ width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%` }}
                                ></div>
                            </div>
                            <span className="ml-3 font-semibold text-white text-sm">{item.value}</span>
                        </div>
                    </div>
                )) : <p className="text-on-surface-dark-secondary text-sm">Nenhum dado disponível.</p>}
            </div>
        </div>
    );
};

const RecentActivityItem: React.FC<{ activity: any, icon: React.ReactNode }> = ({ activity, icon }) => (
    <div className="flex items-start gap-3">
        <div className="p-2 bg-gray-700 rounded-full mt-1">
            {icon}
        </div>
        <div>
            <p className="text-sm text-on-surface-dark" dangerouslySetInnerHTML={{ __html: activity.text }}></p>
            <p className="text-xs text-gray-400">{new Date(activity.date).toLocaleString()}</p>
        </div>
    </div>
);

const AvailableLicensesCard: React.FC<{ licenses: { productName: string; availableSeats: number }[]; onViewAll: () => void; }> = ({ licenses, onViewAll }) => {
    const totalAvailable = licenses.reduce((sum, l) => sum + l.availableSeats, 0);
    const topLicenses = licenses.slice(0, 3);

    return (
        <div className="bg-surface-dark p-4 rounded-lg shadow-lg flex flex-col h-full">
            <div 
                className={`flex items-center space-x-4 mb-3 ${totalAvailable > 0 ? 'cursor-pointer' : ''}`}
                onClick={onViewAll}
            >
                <div className="p-3 rounded-full bg-teal-500">
                    <FaBoxOpen className="h-6 w-6 text-white" />
                </div>
                <div>
                    <p className="text-sm text-on-surface-dark-secondary font-medium">Licenças Disponíveis</p>
                    <p className="text-2xl font-bold text-white">{totalAvailable}</p>
                    <p className="text-xs text-gray-400">Total de vagas</p>
                </div>
            </div>
            <div className="flex-grow space-y-2 text-sm overflow-hidden pt-2 border-t border-gray-700/50">
                {topLicenses.length > 0 ? topLicenses.map((license, index) => (
                    <div key={index} className="flex justify-between items-center gap-2">
                        <span className="text-on-surface-dark truncate" title={license.productName}>{license.productName}</span>
                        <span className="font-semibold text-white bg-gray-700 px-2 py-0.5 rounded-full text-xs flex-shrink-0">{license.availableSeats}</span>
                    </div>
                )) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-center text-gray-400 text-xs">Nenhuma licença com vagas disponíveis.</p>
                    </div>
                )}
            </div>
            {licenses.length > 0 && (
                 <button onClick={onViewAll} className="mt-auto pt-2 text-center text-sm text-brand-secondary hover:underline w-full">
                    {licenses.length > 3 ? 'Ver todas...' : 'Ver licenças'}
                </button>
            )}
        </div>
    );
};


const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ 
    equipment, instituicoes, entidades, assignments, equipmentTypes, tickets, collaborators, teams,
    expiringWarranties, expiringLicenses, softwareLicenses, licenseAssignments, onViewItem 
}) => {
    const stats = useMemo(() => {
        const statusCounts: Record<string, number> = {};
        for (const item of equipment) {
            statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
        }
        return {
            operational: statusCounts[EquipmentStatus.Operational] || 0,
            stock: statusCounts[EquipmentStatus.Stock] || 0,
            warranty: statusCounts[EquipmentStatus.Warranty] || 0,
            decommissioned: statusCounts[EquipmentStatus.Decommissioned] || 0,
        };
    }, [equipment]);

    const ticketStats = useMemo(() => ({
        open: tickets.filter(t => t.status === TicketStatus.Requested || t.status === TicketStatus.InProgress).length,
    }), [tickets]);
    
    const healthStats = useMemo(() => {
        return {
            expiringWarranties: expiringWarranties.length,
            expiringLicenses: expiringLicenses.length,
        };
    }, [expiringWarranties, expiringLicenses]);

    const availableLicensesData = useMemo(() => {
        const usedSeatsMap = licenseAssignments.reduce((acc, assignment) => {
            acc.set(assignment.softwareLicenseId, (acc.get(assignment.softwareLicenseId) || 0) + 1);
            return acc;
        }, new Map<string, number>());
        
        return softwareLicenses
            .filter(license => (license.status || LicenseStatus.Ativo) === LicenseStatus.Ativo)
            .map(license => {
                const usedSeats = usedSeatsMap.get(license.id) || 0;
                const availableSeats = license.totalSeats - usedSeats;
                return {
                    productName: license.productName,
                    availableSeats,
                };
            })
            .filter(license => license.availableSeats > 0)
            .sort((a, b) => b.availableSeats - a.availableSeats);
    }, [softwareLicenses, licenseAssignments]);


    const equipmentByAge = useMemo(() => {
        const now = new Date();
        const ageGroups = {
            '< 1 ano': 0,
            '1-2 anos': 0,
            '2-4 anos': 0,
            '4-6 anos': 0,
            '> 6 anos': 0,
        };

        equipment.forEach(eq => {
            if (!eq.purchaseDate) return;
            const ageInYears = (now.getTime() - new Date(eq.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
            if (ageInYears < 1) ageGroups['< 1 ano']++;
            else if (ageInYears < 2) ageGroups['1-2 anos']++;
            else if (ageInYears < 4) ageGroups['2-4 anos']++;
            else if (ageInYears < 6) ageGroups['4-6 anos']++;
            else ageGroups['> 6 anos']++;
        });

        return Object.entries(ageGroups).map(([name, value]) => ({ name, value }));
    }, [equipment]);
    
    const ticketsByTeam = useMemo(() => {
        const teamMap = new Map(teams.map(t => [t.id, t.name]));
        const counts = tickets.reduce((acc, ticket) => {
            if (ticket.team_id) {
                const teamName = teamMap.get(ticket.team_id) || 'Equipa Desconhecida';
                acc.set(teamName, (acc.get(teamName) || 0) + 1);
            }
            return acc;
        }, new Map<string, number>());

        return Array.from(counts.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a,b) => b.value - a.value);
    }, [tickets, teams]);
    
    const top5EquipmentTypes = useMemo(() => {
        const counts = equipment.reduce((acc, eq) => {
            acc[eq.typeId] = (acc[eq.typeId] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const typeMap = new Map(equipmentTypes.map(t => [t.id, t.name]));

        return Object.entries(counts)
            .map(([typeId, value]) => ({ name: typeMap.get(typeId) || 'Desconhecido', value }))
            .sort((a,b) => b.value - a.value)
            .slice(0, 5);
    }, [equipment, equipmentTypes]);
    
    const recentActivity = useMemo(() => {
        const equipmentMap = new Map(equipment.map(e => [e.id, e.description]));
        const collaboratorMap = new Map(collaborators.map(c => [c.id, c.fullName]));

        const recentAssignments = assignments
            .sort((a, b) => new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime())
            .slice(0, 5)
            .map(a => ({
                type: 'assignment',
                date: a.assignedDate,
                text: `Equipamento <strong>${equipmentMap.get(a.equipmentId) || 'N/A'}</strong> atribuído a <strong>${collaboratorMap.get(a.collaboratorId!) || 'uma localização'}</strong>.`
            }));

        const recentTickets = tickets
            .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime())
            .slice(0, 5)
            .map(t => ({
                type: 'ticket',
                date: t.requestDate,
                text: `Novo ticket aberto por <strong>${collaboratorMap.get(t.collaboratorId) || 'N/A'}</strong>: <em>"${t.description.substring(0, 40)}..."</em>`
            }));
        
        return [...recentAssignments, ...recentTickets]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);
    }, [assignments, tickets, equipment, collaborators]);


    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-xl font-bold text-white mb-4">Estado do Inventário</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Operacional" value={stats.operational} icon={<FaCheckCircle className="h-6 w-6 text-white" />} color="bg-green-600" onClick={() => onViewItem('equipment.inventory', { status: EquipmentStatus.Operational })} />
                    <StatCard title="Em Stock" value={stats.stock} icon={<FaWarehouse className="h-6 w-6 text-white" />} color="bg-indigo-500" onClick={() => onViewItem('equipment.inventory', { status: EquipmentStatus.Stock })} />
                    <StatCard title="Em Garantia" value={stats.warranty} icon={<FaTools className="h-6 w-6 text-white" />} color="bg-blue-500" onClick={() => onViewItem('equipment.inventory', { status: EquipmentStatus.Warranty })} />
                    <StatCard title="Abatidos" value={stats.decommissioned} icon={<FaTimesCircle className="h-6 w-6 text-white" />} color="bg-gray-600" onClick={() => onViewItem('equipment.inventory', { status: EquipmentStatus.Decommissioned })} />
                </div>
            </div>

            <div>
                 <h2 className="text-xl font-bold text-white mb-4">Saúde e Suporte</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Tickets Abertos" value={ticketStats.open} icon={<FaTicketAlt className="h-6 w-6 text-white" />} color={ticketStats.open > 0 ? "bg-red-600" : "bg-green-600"} onClick={() => onViewItem('tickets', { status: [TicketStatus.Requested, TicketStatus.InProgress] })} />
                    <StatCard title="Garantias a Expirar" value={healthStats.expiringWarranties} icon={<FaShieldAlt className="h-6 w-6 text-white" />} color="bg-yellow-600" onClick={() => onViewItem('equipment.inventory', {})} subtext="Próximos 30 dias"/>
                    <StatCard title="Licenças a Expirar" value={healthStats.expiringLicenses} icon={<FaExclamationTriangle className="h-6 w-6 text-white" />} color="bg-orange-600" onClick={() => onViewItem('licensing', {})} subtext="Próximos 30 dias"/>
                    <AvailableLicensesCard licenses={availableLicensesData} onViewAll={() => onViewItem('licensing', { status: 'available' })} />
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2">
                    <BarChart title="Equipamentos por Antiguidade" data={equipmentByAge} icon={<FaCalendarAlt />}/>
                </div>
                <div>
                     <BarChart title="Top 5 Tipos de Equipamento" data={top5EquipmentTypes} icon={<FaLaptop />}/>
                </div>
                 <div className="xl:col-span-2">
                    <BarChart title="Tickets por Equipa" data={ticketsByTeam} icon={<FaUsers />}/>
                </div>
                 <div>
                    <div className="bg-surface-dark p-6 rounded-lg shadow-lg h-full">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><FaHistory /> Atividade Recente</h3>
                        <div className="space-y-4">
                             {recentActivity.length > 0 ? recentActivity.map((activity, index) => (
                                <RecentActivityItem 
                                    key={index} 
                                    activity={activity}
                                    icon={activity.type === 'assignment' ? <FaLaptop className="h-4 w-4 text-green-400"/> : <FaTicketAlt className="h-4 w-4 text-yellow-400" />}
                                />
                            )) : <p className="text-on-surface-dark-secondary text-sm">Nenhuma atividade recente.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OverviewDashboard;