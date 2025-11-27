import React, { useMemo, useState, useEffect } from 'react';
import { Equipment, Instituicao, Entidade, Assignment, EquipmentStatus, EquipmentType, Ticket, TicketStatus, Collaborator, Team, SoftwareLicense, LicenseAssignment, LicenseStatus, CriticalityLevel, AuditAction, BusinessService, Vulnerability, VulnerabilityStatus, TicketCategory } from '../types';
import { FaCheckCircle, FaTools, FaTimesCircle, FaWarehouse, FaTicketAlt, FaShieldAlt, FaKey, FaBoxOpen, FaHistory, FaUsers, FaCalendarAlt, FaExclamationTriangle, FaLaptop, FaDesktop, FaUserShield, FaNetworkWired, FaChartPie, FaSkull, FaChartLine, FaStopwatch } from './common/Icons';
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
    className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, onClick, subtext, className }) => (
    <div 
        className={`bg-surface-dark p-4 rounded-lg shadow-lg flex items-center space-x-4 border border-gray-800 ${onClick ? 'cursor-pointer hover:bg-gray-800/50 transition-colors' : ''} ${className || ''}`}
        onClick={onClick}
        role={onClick ? 'button' : 'figure'}
        tabIndex={onClick ? 0 : -1}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onClick?.()}
    >
        <div className={`p-3 rounded-full ${color} text-white shadow-md`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-on-surface-dark-secondary font-medium uppercase tracking-wide">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
            {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
        </div>
    </div>
);

const BarChart: React.FC<{ title: string; data: { name: string; value: number }[], icon?: React.ReactNode, extraAction?: React.ReactNode, colorBar?: string }> = ({ title, data, icon, extraAction, colorBar = "bg-brand-secondary" }) => {
    const { t } = useLanguage();
    const maxValue = useMemo(() => Math.max(...data.map(item => item.value), 0), [data]);

    return (
        <div className="bg-surface-dark p-5 rounded-lg shadow-lg h-full border border-gray-800 flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-md font-semibold text-white flex items-center gap-2">
                    {icon}
                    {title}
                </h3>
                {extraAction}
            </div>
            <div className="space-y-3 flex-grow overflow-y-auto max-h-64 pr-2 custom-scrollbar">
                {data.length > 0 ? data.map((item, index) => (
                    <div key={index} className="flex items-center group" title={`${item.name}: ${item.value}`}>
                        <div className="w-1/3 text-xs text-on-surface-dark-secondary truncate pr-2 group-hover:text-white transition-colors">{item.name}</div>
                        <div className="w-2/3 flex items-center">
                            <div className="w-full bg-gray-700 rounded-full h-2.5">
                                <div
                                    className={`${colorBar} h-2.5 rounded-full transition-all duration-500 ease-out`}
                                    style={{ width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%` }}
                                ></div>
                            </div>
                            <span className="ml-3 font-semibold text-white text-xs w-8 text-right">{item.value}</span>
                        </div>
                    </div>
                )) : <div className="flex items-center justify-center h-full text-on-surface-dark-secondary text-sm italic">{t('overview.no_activity')}</div>}
            </div>
        </div>
    );
};

const TrendChart: React.FC<{ title: string; data: { label: string; value: number }[] }> = ({ title, data }) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);

    return (
        <div className="bg-surface-dark p-5 rounded-lg shadow-lg h-full border border-gray-800 flex flex-col">
            <h3 className="text-md font-semibold text-white flex items-center gap-2 mb-4">
                <FaChartLine className="text-blue-400"/>
                {title}
            </h3>
            <div className="flex items-end justify-between gap-2 h-40 pb-2">
                {data.map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center flex-1 group">
                        <div className="relative w-full flex justify-center items-end h-full">
                            <div 
                                className="w-full max-w-[20px] bg-blue-600/80 hover:bg-blue-500 rounded-t transition-all duration-500 min-h-[4px]"
                                style={{ height: `${(item.value / maxValue) * 100}%` }}
                            >
                                <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded pointer-events-none transition-opacity">
                                    {item.value}
                                </div>
                            </div>
                        </div>
                        <span className="text-[10px] text-gray-400 mt-2">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const RecentActivityItem: React.FC<{ activity: any, icon: React.ReactNode }> = ({ activity, icon }) => (
    <div className="flex items-start gap-3 p-3 rounded-md hover:bg-gray-800/30 transition-colors border-l-2 border-transparent hover:border-brand-secondary">
        <div className="p-2 bg-gray-800 rounded-full mt-1 shadow-sm">
            {icon}
        </div>
        <div>
            <p className="text-sm text-on-surface-dark leading-snug" dangerouslySetInnerHTML={{ __html: activity.text }}></p>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <FaCalendarAlt className="h-3 w-3" />
                {new Date(activity.date).toLocaleString()}
            </p>
        </div>
    </div>
);

const AvailableLicensesCard: React.FC<{ licenses: { productName: string; availableSeats: number; isOEM?: boolean }[]; onViewAll: () => void; }> = ({ licenses, onViewAll }) => {
    const { t } = useLanguage();
    const totalAvailable = licenses.reduce((sum, l) => sum + l.availableSeats, 0);
    const topLicenses = licenses.slice(0, 6);

    return (
        <div className="bg-surface-dark p-5 rounded-lg shadow-lg flex flex-col h-full border border-gray-800">
            <div 
                className={`flex items-center space-x-4 mb-4 ${totalAvailable > 0 ? 'cursor-pointer' : ''}`}
                onClick={onViewAll}
            >
                <div className="p-3 rounded-full bg-teal-600 text-white shadow-md">
                    <FaBoxOpen className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-sm text-on-surface-dark-secondary font-medium uppercase tracking-wide">{t('overview.available_licenses')}</p>
                    <p className="text-2xl font-bold text-white">{totalAvailable} <span className="text-xs font-normal text-gray-400 lowercase">{t('overview.total_seats')}</span></p>
                </div>
            </div>
            <div className="flex-grow space-y-2 text-sm overflow-hidden">
                {topLicenses.length > 0 ? topLicenses.map((license, index) => (
                    <div key={index} className="flex justify-between items-center gap-2 py-1 border-b border-gray-800 last:border-0">
                        <span className="text-on-surface-dark truncate" title={license.productName}>
                            {license.productName}
                            {license.isOEM && <span className="text-[10px] text-gray-500 ml-1">(OEM)</span>}
                        </span>
                        <span className={`font-bold px-2 py-0.5 rounded-md text-xs flex-shrink-0 ${license.isOEM ? 'text-blue-400 bg-blue-900/20' : 'text-teal-400 bg-teal-900/20'}`}>
                            {license.availableSeats} un.
                        </span>
                    </div>
                )) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-center text-gray-500 text-xs italic">{t('overview.none_available')}</p>
                    </div>
                )}
            </div>
            {licenses.length > 0 && (
                 <button onClick={onViewAll} className="mt-4 pt-2 text-center text-xs font-bold uppercase text-brand-secondary hover:text-brand-primary transition-colors border-t border-gray-700 w-full">
                    {licenses.length > 6 ? t('overview.view_all') : t('overview.view_licenses')}
                </button>
            )}
        </div>
    );
};

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
    expiringWarranties, expiringLicenses, softwareLicenses, licenseAssignments, businessServices = [], vulnerabilities = [], onViewItem, onGenerateComplianceReport 
}) => {
    const { t } = useLanguage();
    const [needsAccessReview, setNeedsAccessReview] = useState(false);
    const [lastReviewDate, setLastReviewDate] = useState<string | null>(null);

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

    const ticketStats = useMemo(() => {
        const open = tickets.filter(t => t.status === TicketStatus.Requested || t.status === TicketStatus.InProgress).length;
        const securityIncidents = tickets.filter(t => 
            (t.category === TicketCategory.SecurityIncident || t.category === 'Incidente de Segurança') && 
            (t.status === TicketStatus.Requested || t.status === TicketStatus.InProgress)
        ).length;

        // Average Resolution Time
        const resolvedTickets = tickets.filter(t => t.status === TicketStatus.Finished && t.finishDate);
        let totalDuration = 0;
        resolvedTickets.forEach(t => {
            const start = new Date(t.requestDate).getTime();
            const end = new Date(t.finishDate!).getTime();
            totalDuration += (end - start);
        });
        const avgResolutionHours = resolvedTickets.length > 0 ? Math.round(totalDuration / resolvedTickets.length / (1000 * 60 * 60)) : 0;

        return { open, securityIncidents, avgResolutionHours };
    }, [tickets]);
    
    const ticketTrendData = useMemo(() => {
        const last7Days = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return d;
        });

        return last7Days.map(date => {
            const dateStr = date.toISOString().split('T')[0];
            const count = tickets.filter(t => t.requestDate.startsWith(dateStr)).length;
            return {
                label: date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' }),
                value: count
            };
        });
    }, [tickets]);

    const healthStats = useMemo(() => {
        return {
            expiringWarranties: expiringWarranties.length,
            expiringLicenses: expiringLicenses.length,
        };
    }, [expiringWarranties, expiringLicenses]);
    
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

    const availableLicensesData = useMemo(() => {
        const usedSeatsMap = licenseAssignments.reduce((acc, assignment) => {
            acc.set(assignment.softwareLicenseId, (acc.get(assignment.softwareLicenseId) || 0) + 1);
            return acc;
        }, new Map<string, number>());
        
        const traditionalLicenses = softwareLicenses
            .filter(license => (license.status || LicenseStatus.Ativo) === LicenseStatus.Ativo)
            .map(license => {
                const usedSeats = usedSeatsMap.get(license.id) || 0;
                const availableSeats = license.totalSeats - usedSeats;
                return { productName: license.productName, availableSeats, isOEM: false };
            })
            .filter(license => license.availableSeats > 0);

        const oemCounts: Record<string, number> = {};
        equipment.forEach(eq => {
            if (eq.embedded_license_key && eq.os_version) {
                const osName = eq.os_version;
                if (eq.status === EquipmentStatus.Stock) {
                    oemCounts[osName] = (oemCounts[osName] || 0) + 1;
                }
            }
        });

        const oemLicenses = Object.entries(oemCounts).map(([name, count]) => ({
            productName: name,
            availableSeats: count,
            isOEM: true
        }));

        return [...traditionalLicenses, ...oemLicenses].sort((a, b) => b.availableSeats - a.availableSeats);
    }, [softwareLicenses, licenseAssignments, equipment]);


    const equipmentByAge = useMemo(() => {
        const now = new Date();
        const ageGroups = { '< 1 ano': 0, '1-2 anos': 0, '2-4 anos': 0, '4-6 anos': 0, '> 6 anos': 0 };

        equipment.forEach(eq => {
            if (!eq.purchaseDate) return;
            const ageInYears = (now.valueOf() - new Date(eq.purchaseDate).valueOf()) / (1000 * 60 * 60 * 24 * 365.25);
            if (ageInYears < 1) ageGroups['< 1 ano']++;
            else if (ageInYears < 2) ageGroups['1-2 anos']++;
            else if (ageInYears < 4) ageGroups['2-4 anos']++;
            else if (ageInYears < 6) ageGroups['4-6 anos']++;
            else ageGroups['> 6 anos']++;
        });
        return Object.entries(ageGroups).map(([name, value]) => ({ name, value }));
    }, [equipment]);

    const equipmentByCriticality = useMemo(() => {
        const counts = { [CriticalityLevel.Low]: 0, [CriticalityLevel.Medium]: 0, [CriticalityLevel.High]: 0, [CriticalityLevel.Critical]: 0 };
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

        return Array.from(counts.entries()).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
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
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 8);
    }, [assignments, tickets, equipment, collaborators]);

    return (
        <div className="space-y-8">
            {/* --- ALERTS SECTION --- */}
            <div className="space-y-4">
                {securityStats.openCritical > 0 && (
                    <div className="bg-red-500/10 border border-red-500/40 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
                        <div className="flex items-center gap-4">
                            <div className="bg-red-600 p-3 rounded-full text-white animate-pulse shadow-lg shadow-red-900/20">
                                <FaExclamationTriangle className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Alerta de Segurança Crítico</h3>
                                <p className="text-red-300 text-sm">
                                    Foram detetadas <strong>{securityStats.openCritical} vulnerabilidades críticas</strong> ou de alta severidade em aberto. Ação imediata necessária.
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={() => onViewItem('nis2.security', { severity: CriticalityLevel.Critical, status: VulnerabilityStatus.Open })}
                            className="whitespace-nowrap px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-md shadow-lg transition-all hover:scale-105"
                        >
                            Resolver Agora
                        </button>
                    </div>
                )}

                {needsAccessReview && (
                    <div className="bg-orange-500/10 border border-orange-500/40 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
                        <div className="flex items-center gap-4">
                            <div className="bg-orange-600 p-3 rounded-full text-white shadow-lg shadow-orange-900/20">
                                <FaUserShield className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Revisão de Acessos Necessária (Compliance NIS2)</h3>
                                <p className="text-orange-300 text-sm">
                                    {lastReviewDate 
                                        ? `Última revisão: ${new Date(lastReviewDate).toLocaleDateString()}. É obrigatório rever quem tem acesso privilegiado a cada 6 meses.` 
                                        : "Nunca foi efetuada uma revisão de acessos. É obrigatório rever quem tem acesso privilegiado."}
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={handleMarkReviewed}
                            className="whitespace-nowrap px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-md shadow-lg transition-all hover:scale-105"
                        >
                            Rever e Confirmar Acessos
                        </button>
                    </div>
                )}
            </div>

            {/* --- MODULE 1: SECURITY & RISK --- */}
            <DashboardSection title="Segurança & Risco (NIS2)" icon={<FaShieldAlt />}>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-4 flex flex-col gap-4">
                        <StatCard 
                            title="Incidentes de Segurança" 
                            value={ticketStats.securityIncidents} 
                            icon={ticketStats.securityIncidents > 0 ? <FaExclamationTriangle className="h-6 w-6 animate-bounce" /> : <FaShieldAlt className="h-6 w-6" />} 
                            color={ticketStats.securityIncidents > 0 ? "bg-red-600 animate-pulse shadow-red-500/50" : "bg-green-600"} 
                            onClick={() => onViewItem('tickets', { category: 'Incidente de Segurança', status: [TicketStatus.Requested, TicketStatus.InProgress] })} 
                            subtext={ticketStats.securityIncidents > 0 ? "Atenção: Incidentes Ativos!" : "Sem incidentes ativos"}
                            className={ticketStats.securityIncidents > 0 ? "border-red-500 border-2" : ""}
                        />
                        <StatCard 
                            title="Serviços Críticos (BIA)" 
                            value={businessServices?.length || 0} 
                            icon={<FaNetworkWired className="h-6 w-6" />} 
                            color="bg-purple-600" 
                            onClick={() => onViewItem('nis2.bia', {})} 
                            subtext="Serviços de negócio mapeados"
                        />
                        <StatCard 
                            title="Vulnerabilidades (CVEs)" 
                            value={securityStats.total} 
                            icon={<FaSkull className="h-6 w-6" />} 
                            color={securityStats.openCritical > 0 ? "bg-red-600" : "bg-green-600"} 
                            onClick={() => onViewItem('nis2.security', {})} 
                            subtext={securityStats.openCritical > 0 ? `${securityStats.openCritical} Críticas em aberto` : "Sistema Seguro"}
                        />
                    </div>
                    <div className="md:col-span-8">
                        <BarChart 
                            title={t('overview.criticality_distribution')} 
                            data={equipmentByCriticality} 
                            icon={<FaChartPie />}
                            colorBar="bg-purple-500"
                            extraAction={
                                <button onClick={onGenerateComplianceReport} className="text-xs font-bold px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded transition-colors">
                                    Relatório NIS2
                                </button>
                            }
                        />
                    </div>
                </div>
            </DashboardSection>

            {/* --- MODULE 2: SUPPORT & TICKETS --- */}
            <DashboardSection title="Suporte Técnico" icon={<FaTicketAlt />}>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-3 flex flex-col gap-4">
                        <StatCard 
                            title={t('overview.open_tickets')} 
                            value={ticketStats.open} 
                            icon={<FaTicketAlt className="h-8 w-8" />} 
                            color={ticketStats.open > 0 ? "bg-blue-600" : "bg-green-600"} 
                            onClick={() => onViewItem('tickets', { status: [TicketStatus.Requested, TicketStatus.InProgress] })} 
                            subtext="A aguardar resolução"
                        />
                         <StatCard 
                            title="Tempo Médio Resolução" 
                            value={`${ticketStats.avgResolutionHours}h`} 
                            icon={<FaStopwatch className="h-8 w-8" />} 
                            color="bg-teal-600" 
                            subtext="Eficiência da Equipa"
                        />
                    </div>
                    <div className="md:col-span-6">
                        <TrendChart title="Volume de Tickets (7 Dias)" data={ticketTrendData} />
                    </div>
                    <div className="md:col-span-3">
                        <BarChart title={t('overview.tickets_team')} data={ticketsByTeam} icon={<FaUsers />} colorBar="bg-blue-500" />
                    </div>
                </div>
            </DashboardSection>

            {/* --- MODULE 3: INVENTORY HEALTH & STATUS --- */}
            <DashboardSection title="Estado do Inventário" icon={<FaWarehouse />}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <StatCard title={t('overview.operational')} value={stats.operational} icon={<FaCheckCircle className="h-5 w-5" />} color="bg-green-600" onClick={() => onViewItem('equipment.inventory', { status: EquipmentStatus.Operational })} />
                    <StatCard title={t('overview.stock')} value={stats.stock} icon={<FaWarehouse className="h-5 w-5" />} color="bg-indigo-500" onClick={() => onViewItem('equipment.inventory', { status: EquipmentStatus.Stock })} />
                    <StatCard title={t('overview.expiring_warranties')} value={healthStats.expiringWarranties} icon={<FaShieldAlt className="h-5 w-5" />} color="bg-yellow-600" onClick={() => onViewItem('equipment.inventory', {})} subtext={t('overview.next_30_days')}/>
                    <StatCard title={t('overview.expiring_licenses')} value={healthStats.expiringLicenses} icon={<FaExclamationTriangle className="h-5 w-5" />} color="bg-orange-600" onClick={() => onViewItem('licensing', {})} subtext={t('overview.next_30_days')}/>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                     <div className="lg:col-span-1">
                        <BarChart title={t('overview.equipment_age')} data={equipmentByAge} icon={<FaCalendarAlt />} colorBar="bg-indigo-500"/>
                    </div>
                    <div className="lg:col-span-1">
                         <BarChart title={t('overview.top_types')} data={top5EquipmentTypes} icon={<FaLaptop />} colorBar="bg-indigo-500"/>
                    </div>
                    <div className="lg:col-span-1">
                         <AvailableLicensesCard licenses={availableLicensesData} onViewAll={() => onViewItem('licensing', { status: 'available' })} />
                    </div>
                </div>
            </DashboardSection>

            {/* --- MODULE 4: RECENT ACTIVITY --- */}
            <DashboardSection title={t('overview.recent_activity')} icon={<FaHistory />}>
                <div className="bg-surface-dark p-6 rounded-lg shadow-lg border border-gray-800">
                    <div className="space-y-4">
                         {recentActivity.length > 0 ? recentActivity.map((activity, index) => (
                            <RecentActivityItem 
                                key={index} 
                                activity={activity}
                                icon={activity.type === 'assignment' ? <FaLaptop className="h-4 w-4 text-green-400"/> : <FaTicketAlt className="h-4 w-4 text-blue-400" />}
                            />
                        )) : <p className="text-on-surface-dark-secondary text-sm py-4 text-center">{t('overview.no_activity')}</p>}
                    </div>
                </div>
            </DashboardSection>
        </div>
    );
};

export default OverviewDashboard;