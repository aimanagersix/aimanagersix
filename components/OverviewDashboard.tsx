
import React, { useMemo, useState, useEffect } from 'react';
import { Equipment, Instituicao, Entidade, Assignment, EquipmentStatus, EquipmentType, Ticket, TicketStatus, Collaborator, Team, SoftwareLicense, LicenseAssignment, LicenseStatus, CriticalityLevel, BusinessService, Vulnerability, VulnerabilityStatus, TicketCategory, ProcurementRequest, ModuleKey, PermissionAction } from '../types';
import { FaCheckCircle, FaTools, FaTimesCircle, FaWarehouse, FaTicketAlt, FaShieldAlt, FaKey, FaBoxOpen, FaHistory, FaUsers, FaCalendarAlt, FaExclamationTriangle, FaLaptop, FaDesktop, FaUserShield, FaNetworkWired, FaChartPie, FaSkull, FaChartLine, FaStopwatch, FaSync, FaEuroSign, FaServer } from './common/Icons';
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
    businessServices?: BusinessService[];
    vulnerabilities?: Vulnerability[];
    procurementRequests?: ProcurementRequest[];
    onViewItem: (tab: string, filter: any) => void;
    onGenerateComplianceReport: () => void;
    onRefresh?: () => void;
    checkPermission: (module: ModuleKey, action: PermissionAction) => boolean;
}

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    onClick?: () => void;
    subtext?: string;
    className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, onClick, subtext, className }) => (
    <div 
        className={`bg-surface-dark p-4 rounded-lg shadow-lg flex items-center space-x-4 border border-gray-800 relative overflow-hidden ${onClick ? 'cursor-pointer hover:bg-gray-800/50 transition-colors' : ''} ${className || ''}`}
        onClick={onClick}
    >
        <div className={`p-3 rounded-full ${color} text-white shadow-lg z-10`}>
            {icon}
        </div>
        <div className="z-10">
            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
            {subtext && <p className="text-[10px] text-gray-500 mt-0.5">{subtext}</p>}
        </div>
        <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-10 ${color}`}></div>
    </div>
);

const BarChart: React.FC<{ title: string; data: { name: string; value: number }[], icon?: React.ReactNode, extraAction?: React.ReactNode, colorBar?: string }> = ({ title, data, icon, extraAction, colorBar = "bg-brand-secondary" }) => {
    const { t } = useLanguage();
    const maxValue = useMemo(() => Math.max(...data.map(item => item.value), 0), [data]);

    return (
        <div className="bg-surface-dark p-5 rounded-lg shadow-lg h-full border border-gray-800 flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-md font-bold text-white flex items-center gap-2">
                    {icon}
                    {title}
                </h3>
                {extraAction}
            </div>
            <div className="space-y-3 flex-grow overflow-y-auto max-h-64 pr-2 custom-scrollbar">
                {data.length > 0 ? data.map((item, index) => (
                    <div key={index} className="flex items-center group" title={`${item.name}: ${item.value}`}>
                        <div className="w-1/3 text-xs text-gray-400 truncate pr-2 group-hover:text-white transition-colors">{item.name}</div>
                        <div className="w-2/3 flex items-center">
                            <div className="w-full bg-gray-700/50 rounded-full h-2">
                                <div
                                    className={`${colorBar} h-2 rounded-full transition-all duration-500 ease-out`}
                                    style={{ width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%` }}
                                ></div>
                            </div>
                            <span className="ml-3 font-mono font-bold text-white text-xs w-8 text-right">{item.value}</span>
                        </div>
                    </div>
                )) : <div className="flex items-center justify-center h-full text-gray-500 text-sm italic">{t('overview.no_activity')}</div>}
            </div>
        </div>
    );
};

const RecentActivityItem: React.FC<{ activity: any, icon: React.ReactNode }> = ({ activity, icon }) => (
    <div className="flex items-start gap-3 p-3 rounded-md hover:bg-gray-800/30 transition-colors border-l-2 border-transparent hover:border-brand-secondary">
        <div className="p-2 bg-gray-800 rounded-full mt-1 shadow-sm shrink-0">
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-300 leading-snug" dangerouslySetInnerHTML={{ __html: activity.text }}></p>
            <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                <FaCalendarAlt className="h-2 w-2" />
                {new Date(activity.date).toLocaleString()}
            </p>
        </div>
    </div>
);

const DashboardSection: React.FC<{ title: string; icon?: React.ReactNode; children: React.ReactNode; className?: string }> = ({ title, icon, children, className }) => (
    <section className={`space-y-4 ${className || ''}`}>
        <div className="flex items-center gap-2 border-b border-gray-700 pb-2 mb-4">
            {icon && <span className="text-brand-secondary">{icon}</span>}
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">{title}</h2>
        </div>
        {children}
    </section>
);


const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ 
    equipment, instituicoes, entidades, assignments, equipmentTypes, tickets, collaborators, teams,
    expiringWarranties, expiringLicenses, softwareLicenses, licenseAssignments, businessServices = [], vulnerabilities = [], procurementRequests = [], onViewItem, onGenerateComplianceReport, onRefresh, checkPermission
}) => {
    // Fix: extract language from useLanguage hook
    const { t, language } = useLanguage();
    const [needsAccessReview, setNeedsAccessReview] = useState(false);
    const [lastReviewDate, setLastReviewDate] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const handleRefreshClick = async () => {
        if (onRefresh) {
            setIsRefreshing(true);
            await onRefresh();
            setLastUpdated(new Date());
            setTimeout(() => setIsRefreshing(false), 500);
        }
    };

    useEffect(() => {
        const checkAccessReview = async () => {
            const date = await dataService.fetchLastAccessReviewDate();
            setLastReviewDate(date);
            if (date) {
                const diff = new Date().getTime() - new Date(date).getTime();
                const days = diff / (1000 * 3600 * 24);
                if (days > 180) setNeedsAccessReview(true);
            } else {
                setNeedsAccessReview(true);
            }
        };
        checkAccessReview();
    }, []);

    const handleMarkReviewed = async () => {
        await dataService.logAction('ACCESS_REVIEW', 'System', 'Admin manually marked access review as complete.');
        setNeedsAccessReview(false);
        setLastReviewDate(new Date().toISOString());
        onViewItem('collaborators', { role: 'Admin' });
    };

    const equipmentStatusData = useMemo(() => {
        const counts: Record<string, number> = {};
        let totalValue = 0;

        equipment.forEach(item => {
            const status = item.status || 'Desconhecido';
            counts[status] = (counts[status] || 0) + 1;
            
            if (item.status !== EquipmentStatus.Abate && item.status !== EquipmentStatus.Retirado) {
                totalValue += (item.acquisitionCost || 0);
            }
        });

        const chartData = Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        return { chartData, totalValue };
    }, [equipment]);

    const ticketStats = useMemo(() => {
        const open = tickets.filter(t => t.status !== TicketStatus.Finished && t.status !== TicketStatus.Cancelled).length;
        
        const securityIncidents = tickets.filter(t => {
            const isActive = t.status !== TicketStatus.Finished && t.status !== TicketStatus.Cancelled;
            const cat = (t.category || '').toLowerCase();
            const isSecurityCat = cat.includes('segurança') || cat.includes('security') || cat.includes('ciber') || cat.includes('ataque') || cat.includes('vírus') || cat.includes('phishing');
            const hasType = !!t.securityIncidentType;
            return isActive && (isSecurityCat || hasType);
        }).length;

        const resolvedTickets = tickets.filter(t => t.status === TicketStatus.Finished && t.finishDate);
        let totalDuration = 0;
        resolvedTickets.forEach(t => {
            const start = new Date(t.requestDate).getTime();
            const end = new Date(t.finishDate!).getTime();
            if (!isNaN(start) && !isNaN(end)) {
                totalDuration += (end - start);
            }
        });
        const avgResolutionHours = resolvedTickets.length > 0 ? Math.round(totalDuration / resolvedTickets.length / (1000 * 60 * 60)) : 0;

        return { open, securityIncidents, avgResolutionHours };
    }, [tickets]);
    
    const healthStats = useMemo(() => {
        const now = new Date();
        const nextMonth = new Date();
        nextMonth.setDate(now.getDate() + 30);
        
        const warranties = equipment.filter(e => e.warrantyEndDate && new Date(e.warrantyEndDate) >= now && new Date(e.warrantyEndDate) <= nextMonth).length;
        const licenses = softwareLicenses.filter(l => l.expiryDate && new Date(l.expiryDate) >= now && new Date(l.expiryDate) <= nextMonth).length;

        return {
            expiringWarranties: warranties,
            expiringLicenses: licenses,
        };
    }, [equipment, softwareLicenses]);
    
    const securityStats = useMemo(() => {
        const openCritical = vulnerabilities.filter(v => 
            (v.status === VulnerabilityStatus.Open || v.status === VulnerabilityStatus.InProgress) &&
            (v.severity === CriticalityLevel.Critical || v.severity === CriticalityLevel.High)
        ).length;
        
        return {
            openCritical,
            total: vulnerabilities.length
        };
    }, [vulnerabilities]);

    const equipmentByAge = useMemo(() => {
        const now = new Date();
        const ageGroups = { '< 1 ano': 0, '1-3 anos': 0, '3-5 anos': 0, '> 5 anos': 0 };

        equipment.forEach(eq => {
            if (!eq.purchaseDate) return;
            const pDate = new Date(eq.purchaseDate);
            if (isNaN(pDate.getTime())) return;
            
            const ageInYears = (now.valueOf() - pDate.valueOf()) / (1000 * 60 * 60 * 24 * 365.25);
            if (ageInYears < 1) ageGroups['< 1 ano']++;
            else if (ageInYears < 3) ageGroups['1-3 anos']++;
            else if (ageInYears < 5) ageGroups['3-5 anos']++;
            else ageGroups['> 5 anos']++;
        });
        return Object.entries(ageGroups).map(([name, value]) => ({ name, value }));
    }, [equipment]);

    const ticketsByTeam = useMemo(() => {
        const teamMap = new Map(teams.map(t => [t.id, t.name]));
        const counts = tickets.reduce((acc, ticket) => {
            if (ticket.team_id && ticket.status !== TicketStatus.Finished) {
                const teamName = teamMap.get(ticket.team_id) || 'Equipa Desconhecida';
                acc.set(teamName, (acc.get(teamName) || 0) + 1);
            }
            return acc;
        }, new Map<string, number>());

        return Array.from(counts.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a,b) => b.value - a.value);
    }, [tickets, teams]);
    
    const recentActivity = useMemo(() => {
        const equipmentMap = new Map(equipment.map(e => [e.id, e.description]));
        const collaboratorMap = new Map(collaborators.map(c => [c.id, c.fullName]));

        const recentAssignments = assignments
            .sort((a, b) => new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime())
            .slice(0, 6)
            .map(a => ({
                type: 'assignment',
                date: a.assignedDate,
                text: `Equipamento <strong class="text-white">${equipmentMap.get(a.equipmentId) || 'N/A'}</strong> atribuído a <strong class="text-brand-secondary">${collaboratorMap.get(a.collaboratorId!) || 'uma localização'}</strong>.`
            }));

        const recentTickets = tickets
            .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime())
            .slice(0, 6)
            .map(t => ({
                type: 'ticket',
                date: t.requestDate,
                text: `Ticket <strong class="text-white">#${t.id.substring(0,4)}</strong> por <strong class="text-brand-secondary">${collaboratorMap.get(t.collaboratorId) || 'N/A'}</strong>: <em>"${t.description.substring(0, 40)}..."</em>`
            }));
        
        return [...recentAssignments, ...recentTickets]
            .sort((a, b) => {
                const dateA = new Date(a.date).getTime();
                const dateB = new Date(b.date).getTime();
                return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
            })
            .slice(0, 8);
    }, [assignments, tickets, equipment, collaborators]);

    return (
        <div className="space-y-8 pb-10">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold text-white hidden md:block">{t('overview.operational_dashboard')}</h1>
                <div className="flex items-center gap-3 ml-auto">
                    <span className="text-[10px] text-gray-500">Last sync: {lastUpdated.toLocaleTimeString()}</span>
                    {onRefresh && (
                        <button 
                            onClick={handleRefreshClick}
                            disabled={isRefreshing}
                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors text-sm"
                        >
                            <FaSync className={isRefreshing ? 'animate-spin' : ''} /> 
                            {isRefreshing ? t('login.verifying') : t('nav.dashboard') + ' Sync'}
                        </button>
                    )}
                </div>
            </div>

            {/* --- ALERTS SECTION --- */}
            {checkPermission('widget_alerts', 'view') && (
            <div className="space-y-4">
                {securityStats.openCritical > 0 && (
                    <div className="bg-red-500/10 border border-red-500/40 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in shadow-lg shadow-red-900/10">
                        <div className="flex items-center gap-4">
                            <div className="bg-red-600 p-3 rounded-full text-white animate-pulse shadow-lg shadow-red-900/30">
                                <FaExclamationTriangle className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">{t('overview.security_risk')}</h3>
                                <p className="text-red-300 text-sm">
                                    {t('overview.vulnerabilities')}: <strong>{securityStats.openCritical}</strong>
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={() => onViewItem('nis2.security', { severity: 'Crítica', status: 'Open' })}
                            className="w-full sm:w-auto whitespace-nowrap px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-md shadow-lg transition-all hover:scale-105"
                        >
                            {t('login.login_button')}
                        </button>
                    </div>
                )}
            </div>
            )}

            {/* --- MODULE 1: SECURITY & RISK (KPI CARDS) --- */}
            {checkPermission('widget_kpi_cards', 'view') && (
            <DashboardSection title={t('overview.security_risk')} icon={<FaShieldAlt />}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                     <StatCard 
                        title={t('overview.sec_incidents')} 
                        value={ticketStats.securityIncidents} 
                        icon={ticketStats.securityIncidents > 0 ? <FaExclamationTriangle className="h-6 w-6 animate-bounce" /> : <FaShieldAlt className="h-6 w-6" />} 
                        color={ticketStats.securityIncidents > 0 ? "bg-red-600 animate-pulse shadow-red-500/50" : "bg-green-600"} 
                        onClick={() => onViewItem('tickets', { category: 'Incidente de Segurança' })} 
                        subtext={ticketStats.securityIncidents > 0 ? "Alert!" : "Secure"}
                        className={ticketStats.securityIncidents > 0 ? "border-red-500 border-2" : ""}
                    />
                    <StatCard 
                        title={t('overview.critical_services')} 
                        value={businessServices?.length || 0} 
                        icon={<FaNetworkWired className="h-6 w-6" />} 
                        color="bg-purple-600" 
                        onClick={() => onViewItem('nis2.bia', {})} 
                        subtext="BIA"
                    />
                    <StatCard 
                        title={t('overview.vulnerabilities')} 
                        value={securityStats.total} 
                        icon={<FaSkull className="h-6 w-6" />} 
                        color={securityStats.openCritical > 0 ? "bg-red-600" : "bg-green-600"} 
                        onClick={() => onViewItem('nis2.security', {})} 
                        subtext={securityStats.openCritical > 0 ? `Critical: ${securityStats.openCritical}` : "Zero Critical"}
                    />
                     <StatCard 
                        title={t('overview.pending_tickets')} 
                        value={ticketStats.open} 
                        icon={<FaTicketAlt className="h-6 w-6" />} 
                        color={ticketStats.open > 5 ? "bg-yellow-600" : "bg-blue-600"} 
                        onClick={() => onViewItem('tickets', { status: ['Pedido', 'Em progresso'] })} 
                        subtext="Waitlist"
                    />
                </div>
            </DashboardSection>
            )}

            {/* --- MODULE 2: INVENTORY STATUS (Dynamic) --- */}
            {(checkPermission('widget_inventory_charts', 'view') || checkPermission('widget_financial', 'view')) && (
            <DashboardSection title={t('overview.inventory_status')} icon={<FaWarehouse />}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-8">
                    {checkPermission('widget_inventory_charts', 'view') && (
                        <BarChart 
                            title={t('overview.inventory_status')} 
                            data={equipmentStatusData.chartData} 
                            icon={<FaChartPie />}
                            colorBar="bg-blue-500"
                        />
                    )}
                    </div>
                    <div className="lg:col-span-4 flex flex-col gap-4">
                        {checkPermission('widget_financial', 'view') && (
                         <div className="bg-surface-dark p-5 rounded-lg shadow-lg border border-gray-800 flex flex-col justify-center items-center text-center h-full">
                            <div className="p-3 bg-green-900/30 text-green-400 rounded-full mb-2">
                                <FaEuroSign className="h-6 w-6" />
                            </div>
                            <p className="text-sm text-gray-400 uppercase font-bold">{t('overview.asset_value')}</p>
                            <p className="text-2xl font-mono text-white mt-1">
                                {equipmentStatusData.totalValue.toLocaleString(language === 'pt' ? 'pt-PT' : 'en-US', { style: 'currency', currency: 'EUR' })}
                            </p>
                            <p className="text-[10px] text-gray-500">CAPEX</p>
                        </div>
                        )}
                        
                        {checkPermission('widget_inventory_charts', 'view') && (
                        <>
                        <StatCard 
                            title={t('overview.expiring_warranties')} 
                            value={healthStats.expiringWarranties} 
                            icon={<FaShieldAlt className="h-5 w-5" />} 
                            color={healthStats.expiringWarranties > 0 ? "bg-yellow-600" : "bg-gray-600"} 
                            onClick={() => onViewItem('equipment.inventory', { serialNumber: '' })} 
                            subtext="30 days"
                        />
                        <StatCard 
                            title={t('overview.expiring_licenses')} 
                            value={healthStats.expiringLicenses} 
                            icon={<FaKey className="h-5 w-5" />} 
                            color={healthStats.expiringLicenses > 0 ? "bg-orange-600" : "bg-gray-600"} 
                            onClick={() => onViewItem('licensing', {})} 
                            subtext="30 days"
                        />
                        </>
                        )}
                    </div>
                </div>
            </DashboardSection>
            )}

            {/* --- MODULE 3: OPERATIONAL INSIGHTS --- */}
            {checkPermission('widget_operational_charts', 'view') && (
            <DashboardSection title={t('overview.operational_insights')} icon={<FaChartLine />}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     <div className="h-64">
                        <BarChart title="Equipments by Age" data={equipmentByAge} icon={<FaCalendarAlt />} colorBar="bg-indigo-500"/>
                    </div>
                    <div className="h-64">
                         <BarChart title="Tickets by Team" data={ticketsByTeam} icon={<FaUsers />} colorBar="bg-purple-500" />
                    </div>
                    <div className="h-64 bg-surface-dark p-4 rounded-lg shadow-lg border border-gray-800 flex flex-col justify-center items-center text-center">
                         <div className="p-4 bg-teal-900/20 rounded-full mb-3">
                            <FaStopwatch className="h-8 w-8 text-teal-400" />
                         </div>
                         <h3 className="text-white font-bold text-lg">{t('overview.avg_resolution')}</h3>
                         <p className="text-4xl font-black text-teal-400 my-2">{ticketStats.avgResolutionHours}<span className="text-sm font-normal text-gray-400 ml-1">{t('overview.hours')}</span></p>
                    </div>
                </div>
            </DashboardSection>
            )}

            {/* --- MODULE 4: RECENT ACTIVITY --- */}
            {checkPermission('widget_activity', 'view') && (
            <DashboardSection title={t('overview.recent_activity')} icon={<FaHistory />}>
                <div className="bg-surface-dark p-6 rounded-lg shadow-lg border border-gray-800">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {recentActivity.length > 0 ? recentActivity.map((activity, index) => (
                            <RecentActivityItem 
                                key={index} 
                                activity={activity}
                                icon={activity.type === 'assignment' ? <FaLaptop className="h-4 w-4 text-green-400"/> : <FaTicketAlt className="h-4 w-4 text-blue-400" />}
                            />
                        )) : <p className="text-gray-500 text-sm py-4 text-center w-full col-span-2">{t('overview.no_activity')}</p>}
                    </div>
                </div>
            </DashboardSection>
            )}
        </div>
    );
};

export default OverviewDashboard;
