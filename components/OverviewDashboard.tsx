import React, { useMemo, useState, useEffect } from 'react';
import { Equipment, Instituicao, Entidade, Assignment, EquipmentStatus, EquipmentType, Ticket, TicketStatus, Collaborator, Team, SoftwareLicense, LicenseAssignment, LicenseStatus, CriticalityLevel, BusinessService, Vulnerability, VulnerabilityStatus, TicketCategoryItem, ProcurementRequest, ModuleKey, PermissionAction } from '../types';
// FIX: Added FaClock to imports
import { FaCheckCircle, FaTools, FaTimesCircle, FaWarehouse, FaTicketAlt, FaShieldAlt, FaKey, FaBoxOpen, FaHistory, FaUsers, FaCalendarAlt, FaExclamationTriangle, FaLaptop, FaDesktop, FaUserShield, FaNetworkWired, FaChartPie, FaSkull, FaChartLine, FaStopwatch, FaSync, FaEuroSign, FaServer, FaClock } from './common/Icons';
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

const StatCard = ({ title, value, icon, color, onClick, subtext, className }: any) => (
    <div className={`bg-surface-dark p-4 rounded-lg shadow-lg flex items-center space-x-4 border border-gray-800 relative overflow-hidden ${onClick ? 'cursor-pointer hover:bg-gray-800/50 transition-colors' : ''} ${className || ''}`} onClick={onClick}>
        <div className={`p-3 rounded-full ${color} text-white shadow-lg z-10`}>{icon}</div>
        <div className="z-10">
            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
            {subtext && <p className="text-[10px] text-gray-500 mt-0.5">{subtext}</p>}
        </div>
        <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-10 ${color}`}></div>
    </div>
);

const BarChart = ({ title, data, icon, colorBar = "bg-brand-secondary" }: any) => {
    const maxValue = useMemo(() => Math.max(...data.map((item: any) => item.value), 0), [data]);
    return (
        <div className="bg-surface-dark p-5 rounded-lg shadow-lg h-full border border-gray-800 flex flex-col">
            <div className="flex justify-between items-center mb-4"><h3 className="text-md font-bold text-white flex items-center gap-2">{icon}{title}</h3></div>
            <div className="space-y-3 flex-grow overflow-y-auto max-h-64 pr-2 custom-scrollbar">
                {data.length > 0 ? data.map((item: any, index: number) => (
                    <div key={index} className="flex items-center group">
                        <div className="w-1/3 text-xs text-gray-400 truncate pr-2 group-hover:text-white transition-colors">{item.name}</div>
                        <div className="w-2/3 flex items-center">
                            <div className="w-full bg-gray-700/50 rounded-full h-2"><div className={`${colorBar} h-2 rounded-full transition-all duration-500`} style={{ width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%` }}></div></div>
                            <span className="ml-3 font-mono font-bold text-white text-xs w-8 text-right">{item.value}</span>
                        </div>
                    </div>
                )) : <div className="text-gray-500 text-sm italic">Sem atividade.</div>}
            </div>
        </div>
    );
};

const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ 
    equipment, instituicoes, entidades, assignments, tickets, collaborators, teams,
    softwareLicenses, licenseAssignments, businessServices = [], vulnerabilities = [], onRefresh, checkPermission, onViewItem
}) => {
    const { t, language } = useLanguage();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefreshClick = async () => {
        if (onRefresh) { setIsRefreshing(true); await onRefresh(); setIsRefreshing(false); }
    };

    const equipmentStatusData = useMemo(() => {
        const counts: Record<string, number> = {};
        let totalValue = 0;
        equipment.forEach(item => {
            const status = item.status || 'Desconhecido';
            counts[status] = (counts[status] || 0) + 1;
            // FIX: Updated property names to snake_case
            if (item.status !== EquipmentStatus.Abate && item.status !== EquipmentStatus.Retirado) totalValue += (item.acquisition_cost || 0);
        });
        return { chartData: Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value), totalValue };
    }, [equipment]);

    const ticketStats = useMemo(() => {
        const open = tickets.filter(t => t.status !== TicketStatus.Finished && t.status !== TicketStatus.Cancelled).length;
        const securityIncidents = tickets.filter(t => (t.category || '').toLowerCase().includes('segurança') || !!t.security_incident_type).length;
        return { open, securityIncidents };
    }, [tickets]);

    const healthStats = useMemo(() => {
        const now = new Date();
        const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        // FIX: Updated property names to snake_case
        const warranties = equipment.filter(e => e.warranty_end_date && new Date(e.warranty_end_date) <= nextMonth).length;
        const licenses = softwareLicenses.filter(l => l.expiry_date && new Date(l.expiry_date) <= nextMonth).length;
        return { expiringWarranties: warranties, expiringLicenses: licenses };
    }, [equipment, softwareLicenses]);

    const recentActivity = useMemo(() => {
        const equipmentMap = new Map(equipment.map(e => [e.id, e.description]));
        // FIX: Updated property names to snake_case
        const collaboratorMap = new Map(collaborators.map(c => [c.id, c.full_name]));
        // FIX: Updated property names to snake_case
        const recentAssignments = assignments.sort((a, b) => new Date(b.assigned_date).getTime() - new Date(a.assigned_date).getTime()).slice(0, 4).map(a => ({
            type: 'assignment', date: a.assigned_date, text: `Ativo <strong class="text-white">${equipmentMap.get(a.equipment_id)}</strong> &rarr; <strong class="text-brand-secondary">${collaboratorMap.get(a.collaborator_id!) || 'Stock'}</strong>.`
        }));
        return recentAssignments;
    }, [assignments, equipment, collaborators]);

    return (
        <div className="space-y-8 pb-10">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold text-white">{t('overview.operational_dashboard')}</h1>
                <button onClick={handleRefreshClick} disabled={isRefreshing} className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors text-sm">
                    <FaSync className={isRefreshing ? 'animate-spin' : ''} /> Sync
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Tickets Abertos" value={ticketStats.open} icon={<FaTicketAlt size={20}/>} color="bg-blue-600" onClick={() => onViewItem('tickets.list', {})} />
                <StatCard title="Incidentes Seg." value={ticketStats.securityIncidents} icon={<FaShieldAlt size={20}/>} color={ticketStats.securityIncidents > 0 ? "bg-red-600 animate-pulse" : "bg-green-600"} />
                <StatCard title="Expira 30d (Garantia)" value={healthStats.expiringWarranties} icon={<FaClock size={20}/>} color="bg-yellow-600" />
                <StatCard title="Valor do Parque" value={equipmentStatusData.totalValue.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })} icon={<FaEuroSign size={20}/>} color="bg-purple-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2"><BarChart title="Estado do Inventário" data={equipmentStatusData.chartData} icon={<FaChartPie/>} colorBar="bg-indigo-500"/></div>
                <div className="bg-surface-dark p-6 rounded-lg border border-gray-800">
                    <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2"><FaHistory/> Atividade</h3>
                    <div className="space-y-4">
                        {recentActivity.map((act, i) => (
                            <div key={i} className="text-sm text-gray-400 border-l-2 border-brand-secondary pl-3 py-1">
                                <p dangerouslySetInnerHTML={{ __html: act.text }}></p>
                                <span className="text-[10px] text-gray-600">{new Date(act.date).toLocaleDateString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OverviewDashboard;