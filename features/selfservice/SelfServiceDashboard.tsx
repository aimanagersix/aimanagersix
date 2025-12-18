
import React, { useMemo } from 'react';
import { Collaborator, Equipment, SoftwareLicense, SecurityTrainingRecord, Assignment, LicenseAssignment, Brand, EquipmentType } from '../../types';
import { FaLaptop, FaKey, FaGraduationCap, FaInfoCircle, FaCalendarCheck, FaShieldAlt, FaExclamationTriangle } from 'react-icons/fa';

interface SelfServiceDashboardProps {
    currentUser: Collaborator;
    equipment: Equipment[];
    assignments: Assignment[];
    softwareLicenses: SoftwareLicense[];
    licenseAssignments: LicenseAssignment[];
    trainings: SecurityTrainingRecord[];
    brands: Brand[];
    types: EquipmentType[];
}

const SelfServiceDashboard: React.FC<SelfServiceDashboardProps> = ({ 
    currentUser, equipment, assignments, softwareLicenses, licenseAssignments, trainings, brands, types 
}) => {
    const brandMap = useMemo(() => new Map(brands.map(b => [b.id, b.name])), [brands]);
    const typeMap = useMemo(() => new Map(types.map(t => [t.id, t.name])), [types]);

    // 1. Filtrar Meus Equipamentos
    const myEquipment = useMemo(() => {
        const activeIds = assignments
            .filter(a => a.collaboratorId === currentUser.id && !a.returnDate)
            .map(a => a.equipmentId);
        return equipment.filter(e => activeIds.includes(e.id));
    }, [assignments, equipment, currentUser.id]);

    // 2. Filtrar Minhas Licenças (via equipamento)
    const myLicenses = useMemo(() => {
        const myEqIds = new Set(myEquipment.map(e => e.id));
        const licenseIds = licenseAssignments
            .filter(la => myEqIds.has(la.equipmentId) && !la.returnDate)
            .map(la => la.softwareLicenseId);
        return softwareLicenses.filter(l => licenseIds.includes(l.id));
    }, [myEquipment, licenseAssignments, softwareLicenses]);

    // 3. Filtrar Minhas Formações
    const myTrainings = useMemo(() => {
        return trainings.filter(t => t.collaborator_id === currentUser.id)
            .sort((a, b) => new Date(b.completion_date).getTime() - new Date(a.completion_date).getTime());
    }, [trainings, currentUser.id]);

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <header className="border-b border-gray-700 pb-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <span className="p-2 bg-brand-primary/20 rounded-lg text-brand-secondary">👋</span>
                    A Minha Área
                </h2>
                <p className="text-gray-400 text-sm mt-1">Consulte os seus ativos atribuídos e o seu registo de formação.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Meus Equipamentos */}
                <section className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
                    <div className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
                        <h3 className="font-bold text-white flex items-center gap-2"><FaLaptop className="text-blue-400"/> Equipamentos em Posse</h3>
                        <span className="bg-blue-900/50 text-blue-300 text-xs px-2 py-1 rounded-full border border-blue-500/30">{myEquipment.length}</span>
                    </div>
                    <div className="p-4 space-y-3">
                        {myEquipment.length > 0 ? myEquipment.map(eq => (
                            <div key={eq.id} className="bg-gray-900/50 p-3 rounded border border-gray-700 flex justify-between items-center">
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

                {/* Minhas Formações */}
                <section className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
                    <div className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
                        <h3 className="font-bold text-white flex items-center gap-2"><FaGraduationCap className="text-green-400"/> Formação de Cibersegurança</h3>
                        <span className="bg-green-900/50 text-green-300 text-xs px-2 py-1 rounded-full border border-green-500/30">{myTrainings.length}</span>
                    </div>
                    <div className="p-4 space-y-3">
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
                        )) : <div className="bg-red-900/20 p-4 rounded border border-red-500/30 text-center">
                                <FaExclamationTriangle className="text-red-400 mx-auto mb-2"/>
                                <p className="text-xs text-red-200 font-bold uppercase">Formação Necessária</p>
                                <p className="text-[10px] text-red-300 mt-1">Ainda não completou nenhuma formação de segurança NIS2.</p>
                             </div>}
                    </div>
                </section>
            </div>

            {/* Minhas Licenças */}
            <section className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
                <div className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="font-bold text-white flex items-center gap-2"><FaKey className="text-yellow-500"/> Licenças de Software</h3>
                    <span className="bg-yellow-900/50 text-yellow-300 text-xs px-2 py-1 rounded-full border border-yellow-500/30">{myLicenses.length}</span>
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {myLicenses.length > 0 ? myLicenses.map(lic => (
                        <div key={lic.id} className="bg-gray-900/50 p-3 rounded border border-gray-700">
                            <p className="font-bold text-white text-sm">{lic.productName}</p>
                            <p className="text-[10px] text-gray-500 font-mono mt-1 truncate">{lic.licenseKey}</p>
                            <div className="mt-2 flex justify-between items-center border-t border-gray-700 pt-2">
                                <span className="text-[10px] text-gray-400 flex items-center gap-1"><FaShieldAlt className="text-[9px]"/> Autorizada</span>
                            </div>
                        </div>
                    )) : <p className="col-span-full text-gray-500 text-sm italic text-center py-4">Sem licenças individuais atribuídas.</p>}
                </div>
            </section>

            <div className="bg-blue-900/10 border border-blue-500/20 p-4 rounded-lg flex items-start gap-3">
                <FaInfoCircle className="text-blue-400 mt-1 flex-shrink-0"/>
                <p className="text-xs text-gray-400">
                    A informação aqui apresentada reflete os registos oficiais do Departamento de TI. Se detetar alguma incoerência nos equipamentos em sua posse, por favor abra um ticket de suporte.
                </p>
            </div>
        </div>
    );
};

export default SelfServiceDashboard;
