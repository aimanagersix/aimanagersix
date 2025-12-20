
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

    const myEquipment = useMemo(() => {
        // FIX: collaborator_id, return_date, assigned_date, equipment_id
        const activeIds = assignments
            .filter(a => (a.collaborator_id === currentUser.id) && !a.return_date)
            .sort((a,b) => new Date(b.assigned_date).getTime() - new Date(a.assigned_date).getTime())
            .map(a => a.equipment_id);
        return equipment.filter(e => activeIds.includes(e.id));
    }, [assignments, equipment, currentUser.id]);

    const myLicenses = useMemo(() => {
        const myEqIds = new Set(myEquipment.map(e => e.id));
        // FIX: equipment_id, return_date, software_license_id
        const licenseIds = licenseAssignments
            .filter(la => myEqIds.has(la.equipment_id) && !la.return_date)
            .map(la => la.software_license_id);
        return softwareLicenses.filter(l => licenseIds.includes(l.id));
    }, [myEquipment, licenseAssignments, softwareLicenses]);

    const myTrainings = useMemo(() => {
        return trainings.filter(t => t.collaborator_id === currentUser.id)
            .sort((a, b) => new Date(b.completion_date).getTime() - new Date(a.completion_date).getTime());
    }, [trainings, currentUser.id]);

    const myApplicablePolicies = useMemo(() => {
        const myAcceptanceMap = new Map();
        acceptances.forEach(a => {
            // FIX: collaborator_id
            const cid = a.collaborator_id;
            if (cid === currentUser.id) myAcceptanceMap.set(a.policy_id, a);
        });
        return policies.filter(p => {
            if (!p.is_active) return false;
            const targetType = p.target_type || 'Global';
            if (targetType === 'Global') return true;
            // FIX: instituicao_id, entidade_id
            if (targetType === 'Instituicao' && currentUser.instituicao_id) return (p.target_instituicao_ids || []).includes(currentUser.instituicao_id);
            if (targetType === 'Entidade' && currentUser.entidade_id) return (p.target_entidade_ids || []).includes(currentUser.entidade_id);
            return false;
        }).map(p => ({ ...p, acceptance: myAcceptanceMap.get(p.id) }))
          .sort((a, b) => (a.acceptance ? 0 : 1) - (b.acceptance ? 0 : 1));
    }, [policies, acceptances, currentUser]);

    const myActiveTickets = useMemo(() => {
        // FIX: collaborator_id, request_date
        return tickets.filter(t => t.collaborator_id === currentUser.id && t.status !== 'Finalizado' && t.status !== 'Cancelado')
            .sort((a, b) => new Date(b.request_date).getTime() - new Date(a.request_date).getTime());
    }, [tickets, currentUser.id]);

    const CardContainer = ({ title, icon, children, count }: { title: string, icon: React.ReactNode, children: React.ReactNode, count?: number }) => (
        <section className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden shadow-lg flex flex-col h-[400px]">
            <div className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
                <h3 className="font-bold text-white flex items-center gap-2">{icon} {title}</h3>
                {count !== undefined && <span className="bg-gray-700 px-2 py-0.5 rounded text-xs text-gray-400 font-mono">{count}</span>}
            </div>
            <div className="p-4 space-y-3 overflow-y-auto custom-scrollbar flex-grow">
                {children}
            </div>
        </section>
    );

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <header className="border-b border-gray-700 pb-4 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <span className="p-2 bg-brand-primary/20 rounded-lg text-brand-secondary">👋</span>
                        A Minha Área
                    </h2>
                    {/* FIX: full_name */}
                    <p className="text-gray-400 text-sm mt-1">Olá, {currentUser.full_name}. Central de ativos e conformidade pessoal.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <CardContainer title="Equipamentos" icon={<FaLaptop className="text-blue-400"/>} count={myEquipment.length}>
                    {myEquipment.length > 0 ? myEquipment.map(eq => (
                        <div key={eq.id} onClick={() => onViewEquipment?.(eq)} className="bg-gray-900/50 p-3 rounded border border-gray-700 hover:border-blue-500/50 transition-colors cursor-pointer group">
                            <div className="flex justify-between items-start">
                                <p className="font-bold text-white text-sm group-hover:text-blue-300">{eq.description}</p>
                                <FaExternalLinkAlt className="text-[10px] text-gray-600 group-hover:text-blue-400" />
                            </div>
                            {/* FIX: serial_number */}
                            <p className="text-[10px] text-gray-500 font-mono mt-1 uppercase">S/N: {eq.serial_number}</p>
                        </div>
                    )) : <p className="text-gray-500 text-sm italic text-center py-4">Nenhum equipamento atribuído.</p>}
                </CardContainer>

                <CardContainer title="Pedidos de Suporte" icon={<FaTicketAlt className="text-purple-400"/>} count={myActiveTickets.length}>
                    {myActiveTickets.length > 0 ? myActiveTickets.map(t => (
                        <div key={t.id} onClick={() => onViewTicket?.(t)} className="w-full text-left bg-gray-900/50 p-3 rounded border border-gray-700 hover:border-purple-500/50 hover:bg-gray-800 transition-all cursor-pointer group">
                            <div className="flex justify-between items-start mb-1">
                                <p className="font-bold text-white text-sm truncate pr-2 group-hover:text-purple-300">{t.title}</p>
                                <FaExternalLinkAlt className="text-[10px] text-gray-600 group-hover:text-purple-400" />
                            </div>
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-900/30 text-blue-300 border border-blue-500/30 uppercase">{t.status}</span>
                                {/* FIX: request_date */}
                                <p className="text-[9px] text-gray-500 flex items-center gap-1"><FaClock/> {new Date(t.request_date).toLocaleDateString()}</p>
                            </div>
                        </div>
                    )) : <p className="text-gray-500 text-sm italic text-center py-4">Não tem tickets em aberto.</p>}
                </CardContainer>

                <CardContainer title="Licenças de Software" icon={<FaKey className="text-yellow-400"/>} count={myLicenses.length}>
                    {myLicenses.length > 0 ? myLicenses.map(lic => (
                        <div key={lic.id} onClick={() => onViewLicense?.(lic)} className="bg-gray-900/50 p-3 rounded border border-gray-700 hover:border-yellow-500/50 transition-colors cursor-pointer group">
                            <div className="flex justify-between items-start">
                                {/* FIX: product_name */}
                                <p className="font-bold text-white text-sm group-hover:text-yellow-300">{lic.product_name}</p>
                                <FaExternalLinkAlt className="text-[10px] text-gray-600 group-hover:text-yellow-400" />
                            </div>
                            {/* FIX: license_key */}
                            <p className="text-[10px] text-gray-500 font-mono mt-1 truncate uppercase">{lic.license_key}</p>
                        </div>
                    )) : <p className="text-gray-500 text-sm italic text-center py-4">Sem licenças associadas.</p>}
                </CardContainer>

                <CardContainer title="Formações" icon={<FaGraduationCap className="text-green-400"/>} count={myTrainings.length}>
                    {myTrainings.length > 0 ? myTrainings.map(train => (
                        <div key={train.id} onClick={() => onViewTraining?.(train)} className="bg-gray-900/50 p-3 rounded border border-gray-700 hover:border-green-500/50 transition-colors cursor-pointer group">
                            <div className="flex justify-between items-start">
                                <p className="font-bold text-white text-sm group-hover:text-green-300">{train.training_type}</p>
                                <FaExternalLinkAlt className="text-[10px] text-gray-600 group-hover:text-green-400" />
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1">Concluído em: {new Date(train.completion_date).toLocaleDateString()}</p>
                        </div>
                    )) : <p className="text-gray-500 text-sm italic text-center py-4">Sem registos de formação.</p>}
                </CardContainer>

                <CardContainer title="Governança & Políticas" icon={<FaFileSignature className="text-yellow-500"/>} count={myApplicablePolicies.length}>
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
                </CardContainer>
            </div>
        </div>
    );
};

export default SelfServiceDashboard;
