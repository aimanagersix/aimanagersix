import React, { useMemo } from 'react';
import { Equipment, Instituicao, Entidade, Assignment, EquipmentStatus, EquipmentType, Ticket, TicketStatus } from '../types';
import { FaCheckCircle, FaTools, FaTimesCircle, FaWarehouse, FaLaptop, FaDesktop, FaPrint, FaHdd, FaTicketAlt } from 'react-icons/fa';

interface OverviewDashboardProps {
    equipment: Equipment[];
    instituicoes: Instituicao[];
    entidades: Entidade[];
    assignments: Assignment[];
    equipmentTypes: EquipmentType[];
    tickets: Ticket[];
    onViewItem: (tab: string, filter: any) => void;
}

interface StatCardProps {
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, onClick }) => (
    <div 
        className={`bg-surface-dark p-6 rounded-lg shadow-lg flex items-center space-x-4 ${onClick ? 'cursor-pointer hover:bg-gray-800/50 transition-colors' : ''}`}
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
        </div>
    </div>
);

const BarChart: React.FC<{ title: string; data: { name: string; value: number }[] }> = ({ title, data }) => {
    const maxValue = useMemo(() => Math.max(...data.map(item => item.value), 0), [data]);

    return (
        <div className="bg-surface-dark p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
            <div className="space-y-3">
                {data.length > 0 ? data.map((item, index) => (
                    <div key={index} className="flex items-center">
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

const getEquipmentTypeIcon = (typeName: string) => {
    const name = typeName.toLowerCase();
    if (name.includes('laptop') || name.includes('portátil')) return <FaLaptop className="h-6 w-6 text-white" />;
    if (name.includes('desktop')) return <FaDesktop className="h-6 w-6 text-white" />;
    if (name.includes('monitor')) return <FaDesktop className="h-6 w-6 text-white" />;
    if (name.includes('impressora')) return <FaPrint className="h-6 w-6 text-white" />;
    return <FaHdd className="h-6 w-6 text-white" />;
};


const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ equipment, instituicoes, entidades, assignments, equipmentTypes, tickets, onViewItem }) => {
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
        return {
            open: tickets.filter(t => t.status === TicketStatus.Requested || t.status === TicketStatus.InProgress).length,
            closed: tickets.filter(t => t.status === TicketStatus.Finished).length,
        };
    }, [tickets]);

    const equipmentByType = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const item of equipment) {
            counts[item.typeId] = (counts[item.typeId] || 0) + 1;
        }

        return equipmentTypes.map(type => ({
            id: type.id,
            name: type.name,
            value: counts[type.id] || 0,
        })).sort((a,b) => b.value - a.value);

    }, [equipment, equipmentTypes]);
    
    const equipmentByEntidade = useMemo(() => {
        const activeAssignments = assignments.filter(a => !a.returnDate);
        const counts: Record<string, number> = {};
        for (const assignment of activeAssignments) {
            counts[assignment.entidadeId] = (counts[assignment.entidadeId] || 0) + 1;
        }

        const entidadeMap = new Map(entidades.map(e => [e.id, e.name]));

        return Object.entries(counts)
            .map(([entidadeId, value]) => ({
                name: entidadeMap.get(entidadeId) || 'Desconhecido',
                value,
            }))
            .sort((a, b) => b.value - a.value);
    }, [assignments, entidades]);
    
    const equipmentByInstituicao = useMemo(() => {
        const activeAssignments = assignments.filter(a => !a.returnDate);
        const entidadeInstituicaoMap = new Map(entidades.map(e => [e.id, e.instituicaoId]));
        const instituicaoMap = new Map(instituicoes.map(e => [e.id, e.name]));

        const counts = activeAssignments.reduce((acc, assignment) => {
            const instituicaoId = entidadeInstituicaoMap.get(assignment.entidadeId);
            if (instituicaoId) {
                const instituicaoName = instituicaoMap.get(instituicaoId) || 'Desconhecido';
                acc.set(instituicaoName, (acc.get(instituicaoName) || 0) + 1);
            }
            return acc;
        }, new Map<string, number>());

        return Array.from(counts.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

    }, [assignments, entidades, instituicoes]);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Visão Geral do Inventário</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {equipmentByType.map(type => (
                    <StatCard 
                        key={type.name}
                        title={type.name}
                        value={type.value}
                        icon={getEquipmentTypeIcon(type.name)}
                        color="bg-purple-500"
                        onClick={() => onViewItem('equipment.inventory', { typeId: type.id })}
                    />
                ))}
            </div>

            <h3 className="text-xl font-semibold text-white pt-4">Estado dos Equipamentos</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Operacional" value={stats.operational} icon={<FaCheckCircle className="h-6 w-6 text-white" />} color="bg-green-500" onClick={() => onViewItem('equipment.inventory', { status: EquipmentStatus.Operational })} />
                <StatCard title="Em Stock" value={stats.stock} icon={<FaWarehouse className="h-6 w-6 text-white" />} color="bg-indigo-500" onClick={() => onViewItem('equipment.inventory', { status: EquipmentStatus.Stock })} />
                <StatCard title="Em Garantia" value={stats.warranty} icon={<FaTools className="h-6 w-6 text-white" />} color="bg-yellow-500" onClick={() => onViewItem('equipment.inventory', { status: EquipmentStatus.Warranty })} />
                <StatCard title="Abatidos" value={stats.decommissioned} icon={<FaTimesCircle className="h-6 w-6 text-white" />} color="bg-red-500" onClick={() => onViewItem('equipment.inventory', { status: EquipmentStatus.Decommissioned })} />
            </div>

            <h3 className="text-xl font-semibold text-white pt-4">Tickets de Suporte</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Tickets Abertos" value={ticketStats.open} icon={<FaTicketAlt className="h-6 w-6 text-white" />} color={ticketStats.open > 0 ? "bg-red-500" : "bg-green-500"} onClick={() => onViewItem('tickets', { status: [TicketStatus.Requested, TicketStatus.InProgress] })} />
                <StatCard title="Tickets Fechados" value={ticketStats.closed} icon={<FaCheckCircle className="h-6 w-6 text-white" />} color="bg-gray-500" onClick={() => onViewItem('tickets', { status: TicketStatus.Finished })} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6">
                <BarChart title="Equipamentos Ativos por Entidade" data={equipmentByEntidade} />
                <BarChart title="Equipamentos Ativos por Instituição" data={equipmentByInstituicao} />
            </div>
        </div>
    );
};

export default OverviewDashboard;