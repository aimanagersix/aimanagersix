

import React, { useMemo, useState, useEffect } from 'react';
import { Equipment, Instituicao, Entidade, Assignment, EquipmentStatus, EquipmentType, Ticket, TicketStatus, Collaborator, Team, SoftwareLicense, LicenseAssignment, LicenseStatus, CriticalityLevel, AuditAction } from '../types';
import { FaCheckCircle, FaTools, FaTimesCircle, FaWarehouse, FaTicketAlt, FaShieldAlt, FaKey, FaBoxOpen, FaHistory, FaUsers, FaCalendarAlt, FaExclamationTriangle, FaLaptop, FaDesktop, FaUserShield } from './common/Icons';
import { useLanguage } from '../contexts/LanguageContext';
import * as dataService from '../services/dataService';

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
    onGenerateComplianceReport: () => void;
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

const BarChart: React.FC<{ title: string; data: { name: string; value: number }[], icon?: React.ReactNode, extraAction?: React.ReactNode }> = ({ title, data, icon, extraAction }) => {
    const { t } = useLanguage();
    const maxValue = useMemo(() => Math.max(...data.map(item => item.value), 0), [data]);

    return (
        <div className="bg-surface-dark p-6 rounded-lg shadow-lg h-full">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    {icon}
                    {title}
                </h3>
                {extraAction}
            </div>
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
                )) : <p className="text-on-surface-dark-secondary text-sm">{t('overview.no_activity')}</p>}
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
    const { t } = useLanguage();
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
                    <p className="text-sm text-on-surface-dark-secondary font-medium">{t('overview.available_licenses')}</p>
                    <p className="text-2xl font-bold text-white">{totalAvailable}</p>
                    <p className="text-xs text-gray-400">{t('overview.total_seats')}</p>
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
                        <p className="text-center text-gray-400 text-xs">{t('overview.none_available')}</p>
                    </div>
                )}
            </div>
            {licenses.length > 0 && (
                 <button onClick={onViewAll} className="mt-auto pt-2 text-center text-sm text-brand-secondary hover:underline w-full">
                    {licenses.length > 3 ? t('overview.view_all') : t('overview.view_licenses')}
                </button>
            )}
        </div>
    );
};


const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ 
    equipment, instituicoes, entidades, assignments, equipmentTypes, tickets, collaborators, teams,
    expiringWarranties, expiringLicenses, softwareLicenses, licenseAssignments, onViewItem, onGenerateComplianceReport 
}) => {
    const { t } = useLanguage();
    const [needsAccessReview, setNeedsAccessReview] = useState(false);
    const [lastReviewDate, setLastReviewDate] = useState<string | null>(null);

    // Access Review Logic (NIS2) - Database backed
    useEffect(() => {
        const checkAccessReview = async () => {
            const date = await dataService.fetchLastAccessReviewDate();
            setLastReviewDate(date);

            if (date) {
                const diff = new Date().getTime() - new Date(date).getTime();
                const days = diff / (1000 * 3600 * 24);
                if (days > 180) { // 6 months
                    setNeedsAccessReview(true);
                }
            } else {
                // First time / never reviewed in DB
                setNeedsAccessReview(true);
            }
        };
        checkAccessReview();
    }, []);

    const handleMarkReviewed = async () => {
        await dataService.logAction('ACCESS_REVIEW', 'System', 'Admin manually marked access review as complete.');
        setNeedsAccessReview(false);
        setLastReviewDate(new Date().toISOString());
        // Open the view as confirmation
        onViewItem('collaborators', { role: 'Admin' });
    };

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

    const equipmentByCriticality = useMemo(() => {
        const counts = {
            [CriticalityLevel.Low]: 0,
            [CriticalityLevel.Medium]: 0,
            [CriticalityLevel.High]: 0,
            [CriticalityLevel.Critical]: 0,
        };
        equipment.forEach(eq => {
            const level = eq.criticality || CriticalityLevel.Low;
            counts[level] = (counts[level] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
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
            {/* NIS2 Alert */}
            {needsAccessReview && (
                <div className="bg-orange-500/20 border border-orange-500/50 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-orange-500 p-3 rounded-full text-white">
                            <FaUserShield className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Revisão de Acessos Necessária (Compliance NIS2)</h3>
                            <p className="text-orange-200 text-sm">
                                {lastReviewDate 
                                    ? `Última revisão: ${new Date(lastReviewDate).toLocaleDateString()}. É obrigatório rever quem tem acesso privilegiado a cada 6 meses.` 
                                    : "Nunca foi efetuada uma revisão de acessos. É obrigatório rever quem tem acesso privilegiado."}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={handleMarkReviewed}
                        className="whitespace-nowrap px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-md shadow-lg transition-colors"
                    >
                        Rever e Confirmar Acessos
                    </button>
                </div>
            )}

            <div>
                <h2 className="text-xl font-bold text-white mb-4">{t('overview.inventory_status')}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title={t('overview.operational')} value={stats.operational} icon={<FaCheckCircle className="h-6 w-6 text-white" />} color="bg-green-600" onClick={() => onViewItem('equipment.inventory', { status: EquipmentStatus.Operational })} />
                    <StatCard title={t('overview.stock')} value={stats.stock} icon={<FaWarehouse className="h-6 w-6 text-white" />} color="bg-indigo-500" onClick={() => onViewItem('equipment.inventory', { status: EquipmentStatus.Stock })} />
                    <StatCard title={t('overview.warranty')} value={stats.warranty} icon={<FaTools className="h-6 w-6 text-white" />} color="bg-blue-500" onClick={() => onViewItem('equipment.inventory', { status: EquipmentStatus.Warranty })} />
                    <StatCard title={t('overview.decommissioned')} value={stats.decommissioned} icon={<FaTimesCircle className="h-6 w-6 text-white" />} color="bg-gray-600" onClick={() => onViewItem('equipment.inventory', { status: EquipmentStatus.Decommissioned })} />
                </div>
            </div>

            <div>
                 <h2 className="text-xl font-bold text-white mb-4">{t('overview.health_support')}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title={t('overview.open_tickets')} value={ticketStats.open} icon={<FaTicketAlt className="h-6 w-6 text-white" />} color={ticketStats.open > 0 ? "bg-red-600" : "bg-green-600"} onClick={() => onViewItem('tickets', { status: [TicketStatus.Requested, TicketStatus.InProgress] })} />
                    <StatCard title={t('overview.expiring_warranties')} value={healthStats.expiringWarranties} icon={<FaShieldAlt className="h-6 w-6 text-white" />} color="bg-yellow-600" onClick={() => onViewItem('equipment.inventory', {})} subtext={t('overview.next_30_days')}/>
                    <StatCard title={t('overview.expiring_licenses')} value={healthStats.expiringLicenses} icon={<FaExclamationTriangle className="h-6 w-6 text-white" />} color="bg-orange-600" onClick={() => onViewItem('licensing', {})} subtext={t('overview.next_30_days')}/>
                    <AvailableLicensesCard licenses={availableLicensesData} onViewAll={() => onViewItem('licensing', { status: 'available' })} />
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2">
                    <BarChart title={t('overview.equipment_age')} data={equipmentByAge} icon={<FaCalendarAlt />}/>
                </div>
                <div>
                     <BarChart 
                        title={t('overview.criticality_distribution')} 
                        data={equipmentByCriticality} 
                        icon={<FaShieldAlt />}
                        extraAction={
                            <button onClick={onGenerateComplianceReport} className="text-xs px-2 py-1 bg-brand-primary hover:bg-brand-secondary text-white rounded">
                                Relatório NIS2
                            </button>
                        }
                    />
                </div>
                <div>
                     <BarChart title={t('overview.top_types')} data={top5EquipmentTypes} icon={<FaLaptop />}/>
                </div>
                 <div className="xl:col-span-2">
                    <BarChart title={t('overview.tickets_team')} data={ticketsByTeam} icon={<FaUsers />}/>
                </div>
                 <div>
                    <div className="bg-surface-dark p-6 rounded-lg shadow-lg h-full">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><FaHistory /> {t('overview.recent_activity')}</h3>
                        <div className="space-y-4">
                             {recentActivity.length > 0 ? recentActivity.map((activity, index) => (
                                <RecentActivityItem 
                                    key={index} 
                                    activity={activity}
                                    icon={activity.type === 'assignment' ? <FaLaptop className="h-4 w-4 text-green-400"/> : <FaTicketAlt className="h-4 w-4 text-yellow-400" />}
                                />
                            )) : <p className="text-on-surface-dark-secondary text-sm">{t('overview.no_activity')}</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OverviewDashboard;