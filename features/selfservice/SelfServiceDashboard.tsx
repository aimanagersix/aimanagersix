
import React, { useMemo } from 'react';
import { 
    Collaborator, Equipment, SoftwareLicense, SecurityTrainingRecord, 
    Assignment, LicenseAssignment, Brand, EquipmentType, 
    Policy, PolicyAcceptance, Ticket 
} from '../../types';
import { 
    FaLaptop, FaKey, FaGraduationCap, FaInfoCircle, FaCalendarCheck, 
    FaShieldAlt, FaExclamationTriangle, FaFileSignature, FaTicketAlt, FaClock, FaCheck, FaExternalLinkAlt, FaTools, FaCheckCircle
} from 'react-icons/fa';

interface SelfServiceDashboardProps {
    currentUser: Collaborator;
    equipment: Equipment[];
    assignments: Assignment[];
    softwareLicenses: SoftwareLicense[];
    licenseAssignments: LicenseAssignment[];
    trainings: SecurityTrainingRecord[];
    brands: Brand[];
    types: EquipmentType[];
    policies: Policy[];
    acceptances: PolicyAcceptance[];
    tickets: Ticket[];
    onViewTicket?: (ticket: Ticket) => void;
    onViewPolicy?: (policy: Policy) => void;
    onViewEquipment?: (equipment: Equipment) => void;
    onViewTraining?: (training: SecurityTrainingRecord) => void;
    onViewLicense?: (license: SoftwareLicense) => void;
}

const SelfServiceDashboard: React.FC<SelfServiceDashboardProps> = ({ 
    currentUser, equipment, assignments, softwareLicenses, licenseAssignments, 
    trainings, brands, types, policies, acceptances, tickets,
    onViewTicket, onViewPolicy, onViewEquipment, onViewTraining, onViewLicense
}) => {
    const brandMap = useMemo(() => new Map(brands.map(b => [b.id, b.name])), [brands]);
    const typeMap = useMemo(() => new Map(types.map(t => [t.id, t.name])), [types]);

    // 1. Meus Equipamentos (Limitado a 5, mais recentes)
    const myEquipment = useMemo(() => {
        const activeIds = assignments
            .filter(a => (a.collaboratorId === currentUser.id || (a as any).collaborator_id === currentUser.id) && !a.returnDate)
            .sort((a,b) => new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime())
            .map(a => a.equipmentId || (a as any).equipment_id);
        return equipment.filter(e => activeIds.includes(e.id)).slice(0, 5);
    }, [assignments, equipment, currentUser.id]);

    // 2. Minhas Licenças
    const myLicenses = useMemo(() => {
        const myEqIds = new Set(myEquipment.map(e => e.id));
        const licenseIds = licenseAssignments
            .filter(la => myEqIds.has(la.equipmentId || (la as any).equipment_id) && !la.returnDate)
            .map(la => la.softwareLicenseId || (la as any).software_license_id);
        return softwareLicenses.filter(l => licenseIds.includes(l.id)).slice(0, 5);
    }, [myEquipment, licenseAssignments, softwareLicenses]);

    // 3. Minhas Formações
    const myTrainings = useMemo(() => {
        return trainings.filter(t => t.collaborator_id === currentUser.id)
            .sort((a, b) => new Date(b.completion_date).getTime() - new Date(a.completion_date).getTime())
            .slice(0, 5);
    }, [trainings, currentUser.id]);

    // 4. Políticas Aplicáveis
    const myApplicablePolicies = useMemo(() => {
        const myAcceptanceMap = new Map();
        acceptances.forEach(a => {
            const cid = (a as any).collaboratorId || a.collaborator_id;
            if (cid === currentUser.id) myAcceptanceMap.set(a.policy_id, a);
        });
        return policies.filter(p => {
            if (!p.is_active) return false;
            const targetType = p.target_type || 'Global';
            if (targetType === 'Global') return true;
            if (targetType === 'Instituicao' && currentUser.instituicaoId) return (p.target_instituicao_ids || []).includes(currentUser.instituicaoId);
            if (targetType === 'Entidade' && currentUser.entidadeId) return (p.target_entidade_ids || []).includes(currentUser.entidadeId);
            return false;
        }).map(p => ({ ...p, acceptance: myAcceptanceMap.get(p.id) }))
          .sort((a, b) => (a.acceptance ? 0 : 1) - (b.acceptance ? 0 : 1))
          .slice(0, 10);
    }, [policies, acceptances, currentUser]);

    // 5. Meus Tickets Ativos
    const myActiveTickets = useMemo(() => {
        return tickets.filter(t => t.collaboratorId === currentUser.id && t.status !== 'Finalizado' && t.status !== 'Cancelado')
            .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime())
            .slice(0, 5);
    }, [tickets, currentUser.id]);

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <header className="border-b border-gray-700 pb-4 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <span className="p-2 bg-brand-primary/20 rounded-lg text-brand-secondary">👋</span>
                        A Minha Área
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">Olá, {currentUser.fullName}. Central de ativos e conformidade pessoal.</p>
                </div>
                <div className="text-right text-[10px] text-gray-500 font-mono">
                    ÚLTIMO SYNC: {new Date().toLocaleTimeString()}
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <section className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden shadow-lg flex flex-col max-h-[400px]">
                    <div className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
                        <h3 className="font-bold text-white flex items-center gap-2"><FaLaptop className="text-blue-400"/> Equipamentos</h3>
                    </div>
                    <div className="p-4 space-y-3 overflow-y-auto custom-scrollbar flex-grow">
                        {myEquipment.length > 0 ? myEquipment.map(eq => (
                            <div key={eq.id} onClick={() => onViewEquipment?.(eq)} className="bg-gray-900/50 p-3 rounded border border-gray-700 hover:border-blue-500/50 transition-colors cursor-pointer group">
                                <div className="flex justify-between items-start">
                                    <p className="font-bold text-white text-sm group-hover:text-blue-300">{eq.description}</p>
                                    <FaExternalLinkAlt className="text-[10px] text-gray-600 group-hover:text-blue-400" />
                                </div>
                                <p className="text-[10px] text-gray-500 font-mono mt-1 uppercase">S/N: {eq.serialNumber}</p>
                            </div>
                        )) : <p className="text-gray-500 text-sm italic text-center py-4">Nenhum equipamento atribuído.</p>}
                    </div>
                </section>

                <section className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden shadow-lg flex flex-col max-h-[400px]">
                    <div className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
                        <h3 className="font-bold text-white flex items-center gap-2"><FaTicketAlt className="text-purple-400"/> Pedidos de Suporte</h3>
                    </div>
                    <div className="p-4 space-y-3 overflow-y-auto custom-scrollbar flex-grow">
                        {myActiveTickets.length > 0 ? myActiveTickets.map(t => (
                            <div key={t.id} onClick={() => onViewTicket?.(t)} className="w-full text-left bg-gray-900/50 p-3 rounded border border-gray-700 hover:border-purple-500/50 hover:bg-gray-800 transition-all cursor-pointer group">
                                <div className="flex justify-between items-start mb-1">
                                    <p className="font-bold text-white text-sm truncate pr-2 group-hover:text-purple-300">{t.title}</p>
                                    <FaExternalLinkAlt className="text-[10px] text-gray-600 group-hover:text-purple-400" />
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-900/30 text-blue-300 border border-blue-500/30 uppercase">{t.status}</span>
                                    <p className="text-[9px] text-gray-500 flex items-center gap-1"><FaClock/> {new Date(t.requestDate).toLocaleDateString()}</p>
                                </div>
                            </div>
                        )) : <p className="text-gray-500 text-sm italic text-center py-4">Não tem tickets em aberto.</p>}
                    </div>
                </section>

                <section className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden shadow-lg flex flex-col max-h-[400px]">
                    <div className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
                        <h3 className="font-bold text-white flex items-center gap-2"><FaFileSignature className="text-yellow-500"/> Governança & Políticas</h3>
                    </div>
                    <div className="p-4 space-y-3 overflow-y-auto custom-scrollbar flex-grow">
                        {myApplicablePolicies.map(p => (
                            <button key={p.id} onClick={() => onViewPolicy?.(p)} className={`w-full text-left p-3 rounded border flex flex-col transition-all hover:scale-[1.02] ${p.acceptance ? 'bg-green-900/10 border-green-500/20' : 'bg-red-900/10 border-red-500/30 shadow-lg shadow-red-900/10'}`}>
                                <div className="flex justify-between items-start w-full">
                                    <p className="font-bold text-white text-sm line-clamp-1">{p.title}</p>
                                    {!p.acceptance && <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span></span>}
                                </div>
                                <div className="mt-2 flex justify-between items-center w-full">
                                    <span className="text-[9px] text-gray-500 uppercase font-bold">V{p.version}</span>
                                    {p.acceptance ? <span className="text-[10px] text-green-400 font-bold flex items-center gap-1"><FaCheckCircle/> Aceite</span> : <span className="text-[10px] text-red-400 font-black animate-pulse">Obrigatória</span>}
                                </div>
                            </button>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default SelfServiceDashboard;
