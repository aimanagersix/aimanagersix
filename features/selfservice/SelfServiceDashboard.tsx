
import React, { useMemo } from 'react';
import { 
    Collaborator, Equipment, SoftwareLicense, SecurityTrainingRecord, 
    Assignment, LicenseAssignment, Brand, EquipmentType, 
    Policy, PolicyAcceptance, Ticket 
} from '../../types';
import { 
    FaLaptop, FaKey, FaGraduationCap, FaInfoCircle, FaCalendarCheck, 
    FaShieldAlt, FaExclamationTriangle, FaFileSignature, FaTicketAlt, FaClock, FaCheck 
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
}

const SelfServiceDashboard: React.FC<SelfServiceDashboardProps> = ({ 
    currentUser, equipment, assignments, softwareLicenses, licenseAssignments, 
    trainings, brands, types, policies, acceptances, tickets,
    onViewTicket, onViewPolicy
}) => {
    const brandMap = useMemo(() => new Map(brands.map(b => [b.id, b.name])), [brands]);
    const typeMap = useMemo(() => new Map(types.map(t => [t.id, t.name])), [types]);

    // 1. Meus Equipamentos - Robusto para snake_case/camelCase
    const myEquipment = useMemo(() => {
        const activeIds = assignments
            .filter(a => {
                const collabId = (a as any).collaboratorId || (a as any).collaborator_id;
                return collabId === currentUser.id && !a.returnDate;
            })
            .map(a => a.equipmentId);
        return equipment.filter(e => activeIds.includes(e.id));
    }, [assignments, equipment, currentUser.id]);

    // 2. Minhas Licenças - Robusto para snake_case/camelCase
    const myLicenses = useMemo(() => {
        const myEqIds = new Set(myEquipment.map(e => e.id));
        const licenseIds = licenseAssignments
            .filter(la => {
                const eqId = (la as any).equipmentId || (la as any).equipment_id;
                return myEqIds.has(eqId) && !la.returnDate;
            })
            .map(la => (la as any).softwareLicenseId || (la as any).software_license_id);
        return softwareLicenses.filter(l => licenseIds.includes(l.id));
    }, [myEquipment, licenseAssignments, softwareLicenses]);

    // 3. Minhas Formações - Robusto para collaborator_id
    const myTrainings = useMemo(() => {
        return trainings.filter(t => {
            const collabId = (t as any).collaborator_id || (t as any).collaboratorId;
            return collabId === currentUser.id;
        }).sort((a, b) => new Date(b.completion_date).getTime() - new Date(a.completion_date).getTime());
    }, [trainings, currentUser.id]);

    // 4. Minhas Políticas Aceites - Robusto para policy_id e collaborator_id
    const myAcceptedPolicies = useMemo(() => {
        const myAcceptanceMap = new Map();
        acceptances.forEach(a => {
            const cId = (a as any).collaborator_id || (a as any).collaboratorId;
            const pId = (a as any).policy_id || (a as any).policyId;
            if (cId === currentUser.id) {
                myAcceptanceMap.set(pId, a);
            }
        });
        
        return policies.map(p => ({
            ...p,
            acceptance: myAcceptanceMap.get(p.id)
        })).sort((a, b) => (a.acceptance ? 0 : 1) - (b.acceptance ? 0 : 1));
    }, [policies, acceptances, currentUser.id]);

    // 5. Meus Tickets Ativos - Robusto para collaboratorId
    const myActiveTickets = useMemo(() => {
        return tickets.filter(t => {
            const cId = (t as any).collaboratorId || (t as any).collaborator_id;
            return cId === currentUser.id && t.status !== 'Finalizado' && t.status !== 'Cancelado';
        }).sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
    }, [tickets, currentUser.id]);

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <header className="border-b border-gray-700 pb-4 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <span className="p-2 bg-brand-primary/20 rounded-lg text-brand-secondary">👋</span>
                        A Minha Área
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">Olá, {currentUser.fullName}. Aqui estão os seus ativos e obrigações de TI.</p>
                </div>
                <div className="text-right text-xs text-gray-500 font-mono">
                    ID: {currentUser.numeroMecanografico || 'N/A'}
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Meus Equipamentos */}
                <section className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden shadow-lg">
                    <div className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
                        <h3 className="font-bold text-white flex items-center gap-2"><FaLaptop className="text-blue-400"/> Equipamentos em Posse</h3>
                        <span className="bg-blue-900/50 text-blue-300 text-xs px-2 py-1 rounded-full border border-blue-500/30">{myEquipment.length}</span>
                    </div>
                    <div className="p-4 space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                        {myEquipment.length > 0 ? myEquipment.map(eq => (
                            <div key={eq.id} className="bg-gray-900/50 p-3 rounded border border-gray-700 flex justify-between items-center hover:border-blue-500/50 transition-colors">
                                <div>
                                    <p className="font-bold text-white text-sm">{eq.description}</p>
                                    <p className="text-[10px] text-gray-500 font-mono">S/N: {eq.serialNumber} | {brandMap.get(eq.brandId)} {typeMap.get(eq.typeId)}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-green-900/30 text-green-400 border border-green-500/30">Operacional</span>
                                </div>
                            </div>
                        )) : <p className="text-gray-500 text-sm italic text-center py-4">Sem equipamentos atribuídos.</p>}
                    </div>
                </section>

                {/* Pedidos de Suporte Ativos */}
                <section className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden shadow-lg">
                    <div className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
                        <h3 className="font-bold text-white flex items-center gap-2"><FaTicketAlt className="text-purple-400"/> Meus Pedidos Ativos</h3>
                        <span className="bg-purple-900/50 text-purple-300 text-xs px-2 py-1 rounded-full border border-purple-500/30">{myActiveTickets.length}</span>
                    </div>
                    <div className="p-4 space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                        {myActiveTickets.length > 0 ? myActiveTickets.map(t => (
                            <button 
                                key={t.id} 
                                onClick={() => onViewTicket?.(t)}
                                className="w-full text-left bg-gray-900/50 p-3 rounded border border-gray-700 hover:border-purple-500/50 hover:bg-gray-800 transition-colors group"
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <p className="font-bold text-white text-sm truncate pr-2 group-hover:text-purple-300">{t.title}</p>
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-900/30 text-blue-300 border border-blue-500/30 uppercase">{t.status}</span>
                                </div>
                                <p className="text-[10px] text-gray-500 flex items-center gap-1"><FaClock/> Aberto em {new Date(t.requestDate).toLocaleDateString()}</p>
                            </button>
                        )) : <p className="text-gray-500 text-sm italic text-center py-4">Não tem nenhum ticket em aberto.</p>}
                    </div>
                </section>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Políticas de Segurança */}
                <section className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden shadow-lg">
                    <div className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
                        <h3 className="font-bold text-white flex items-center gap-2"><FaFileSignature className="text-yellow-500"/> Políticas & Normas</h3>
                    </div>
                    <div className="p-4 space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                        {myAcceptedPolicies.map(p => (
                            <button 
                                key={p.id} 
                                onClick={() => onViewPolicy?.(p)}
                                className={`w-full text-left p-3 rounded border flex justify-between items-center transition-colors hover:brightness-110 ${p.acceptance ? 'bg-green-900/10 border-green-500/20' : 'bg-red-900/10 border-red-500/30'}`}
                            >
                                <div>
                                    <p className="font-bold text-white text-sm">{p.title}</p>
                                    <p className="text-[10px] text-gray-500">Versão {p.version} {p.is_mandatory && <span className="text-red-400 font-bold ml-1">• Obrigatória</span>}</p>
                                </div>
                                <div className="text-right">
                                    {p.acceptance ? (
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] text-green-400 font-bold flex items-center gap-1"><FaCheck/> Aceite</span>
                                            <span className="text-[9px] text-gray-500">{new Date(p.acceptance.accepted_at).toLocaleDateString()}</span>
                                        </div>
                                    ) : (
                                        <span className="text-[10px] text-red-400 font-bold animate-pulse flex items-center gap-1"><FaExclamationTriangle/> Leitura Pendente</span>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Formações */}
                <section className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden shadow-lg">
                    <div className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
                        <h3 className="font-bold text-white flex items-center gap-2"><FaGraduationCap className="text-green-400"/> Plano de Formação</h3>
                        <span className="bg-green-900/50 text-green-300 text-xs px-2 py-1 rounded-full border border-green-500/30">{myTrainings.length}</span>
                    </div>
                    <div className="p-4 space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                        {myTrainings.length > 0 ? myTrainings.map(t => (
                            <div key={t.id} className="bg-gray-900/50 p-3 rounded border border-gray-700 flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-white text-sm">{t.training_type}</p>
                                    <p className="text-[10px] text-gray-500 flex items-center gap-1"><FaCalendarCheck/> Concluído em {new Date(t.completion_date).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                    <span className={`font-bold text-sm ${t.score && t.score >= 70 ? 'text-green-400' : 'text-yellow-400'}`}>{t.score}%</span>
                                </div>
                            </div>
                        )) : (
                            <div className="bg-red-900/20 p-4 rounded border border-red-500/30 text-center">
                                <FaExclamationTriangle className="text-red-400 mx-auto mb-2"/>
                                <p className="text-xs text-red-200 font-bold uppercase">Formação Obrigatória</p>
                                <p className="text-[10px] text-red-300 mt-1">Deve completar a formação NIS2 anual.</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* Licenças de Software */}
            <section className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden shadow-lg">
                <div className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="font-bold text-white flex items-center gap-2"><FaKey className="text-yellow-500"/> Softwares & Licenças Autorizadas</h3>
                    <span className="bg-yellow-900/50 text-yellow-300 text-xs px-2 py-1 rounded-full border border-yellow-500/30">{myLicenses.length}</span>
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {myLicenses.length > 0 ? myLicenses.map(lic => (
                        <div key={lic.id} className="bg-gray-900/50 p-3 rounded border border-gray-700">
                            <p className="font-bold text-white text-sm">{lic.productName}</p>
                            <p className="text-[10px] text-gray-500 font-mono mt-1 truncate">{lic.licenseKey}</p>
                            <div className="mt-2 flex justify-between items-center border-t border-gray-700 pt-2">
                                <span className="text-[10px] text-gray-400 flex items-center gap-1"><FaShieldAlt className="text-[9px]"/> Autorizada pela TI</span>
                            </div>
                        </div>
                    )) : <p className="col-span-full text-gray-500 text-sm italic text-center py-4">Não possui licenças individuais atribuídas.</p>}
                </div>
            </section>

            <div className="bg-blue-900/10 border border-blue-500/20 p-4 rounded-lg flex items-start gap-3 shadow-md">
                <FaInfoCircle className="text-blue-400 mt-1 flex-shrink-0"/>
                <p className="text-xs text-gray-400 leading-relaxed">
                    <strong>Nota de Transparência:</strong> Esta área exibe os dados recolhidos pelo Departamento de Sistemas de Informação para efeitos de inventário, conformidade NIS2 e DORA. Se detetar ativos em sua posse que não constam desta lista, ou se a informação estiver incorreta, por favor contacte o suporte.
                </p>
            </div>
        </div>
    );
};

export default SelfServiceDashboard;
