
import React, { useMemo, useState, useEffect } from 'react';
import { Ticket, TicketStatus, CriticalityLevel, Vulnerability, VulnerabilityStatus, BackupExecution, SecurityTrainingRecord, Collaborator, UserRole, Equipment, EquipmentStatus } from '../types';
import { FaShieldAlt, FaTachometerAlt, FaExclamationTriangle, FaCheckCircle, FaUserShield, FaFileSignature, FaSpinner, FaEuroSign, FaChartLine, FaServer, FaGraduationCap } from './common/Icons';
import { fetchLastRiskAcknowledgement, logAction, fetchAllData } from '../services/dataService';

interface SmartDashboardProps {
    tickets: Ticket[];
    vulnerabilities: Vulnerability[];
    backups: BackupExecution[];
    trainings: SecurityTrainingRecord[];
    collaborators: Collaborator[];
    currentUser: Collaborator;
}

const SmartDashboard: React.FC<SmartDashboardProps> = ({ tickets, vulnerabilities, backups, trainings, collaborators, currentUser }) => {
    const [isAcknowledging, setIsAcknowledging] = useState(false);
    const [lastAckData, setLastAckData] = useState<{ timestamp: string, user_email: string } | null>(null);
    const [equipment, setEquipment] = useState<Equipment[]>([]);

    useEffect(() => {
        const loadAck = async () => {
            const data = await fetchLastRiskAcknowledgement();
            setLastAckData(data);
        };
        const loadExtraData = async () => {
            const allData = await fetchAllData();
            setEquipment(allData.equipment);
        };
        loadAck();
        loadExtraData();
    }, []);

    // 1. Incident Response
    const openCriticalIncidents = useMemo(() => tickets.filter(t => 
        (t.category === 'Incidente de Segurança' || t.securityIncidentType) && 
        (t.impactCriticality === CriticalityLevel.Critical || t.impactCriticality === CriticalityLevel.High) &&
        t.status !== TicketStatus.Finished
    ).length, [tickets]);

    // 2. Vulnerability Status
    const unmitigatedCriticalVulns = useMemo(() => vulnerabilities.filter(v => 
        v.severity === CriticalityLevel.Critical && 
        v.status !== VulnerabilityStatus.Resolved && 
        v.status !== VulnerabilityStatus.Mitigated
    ).length, [vulnerabilities]);

    // 3. Backup Health
    const backupSuccessRate = useMemo(() => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentBackups = backups.filter(b => new Date(b.test_date) >= thirtyDaysAgo);
        if (recentBackups.length === 0) return 0;
        const successes = recentBackups.filter(b => b.status === 'Sucesso').length;
        return Math.round((successes / recentBackups.length) * 100);
    }, [backups]);

    // 4. Training Coverage
    const trainingCoverage = useMemo(() => {
        if (collaborators.length === 0) return 0;
        const trainedUserIds = new Set(trainings.map(t => t.collaborator_id));
        return Math.round((trainedUserIds.size / collaborators.length) * 100);
    }, [collaborators, trainings]);

    // 5. FinOps Data
    const finOpsData = useMemo(() => {
        let totalAcquisition = 0;
        let totalCurrentValue = 0;

        equipment.forEach(eq => {
            const cost = eq.acquisitionCost || 0;
            totalAcquisition += cost;
            
            if (eq.status !== EquipmentStatus.Retirado && eq.status !== EquipmentStatus.Abate && eq.purchaseDate) {
                const purchaseDate = new Date(eq.purchaseDate);
                const ageInYears = (new Date().getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
                const lifespan = eq.expectedLifespanYears || 4;
                const annualDepreciation = cost / lifespan;
                const accumulatedDepreciation = Math.min(annualDepreciation * ageInYears, cost);
                totalCurrentValue += Math.max(cost - accumulatedDepreciation, 0);
            }
        });

        return { capex: totalAcquisition, currentValue: totalCurrentValue };
    }, [equipment]);

    const complianceScore = useMemo(() => {
        let score = 100;
        if (openCriticalIncidents > 0) score -= 30;
        if (unmitigatedCriticalVulns > 0) score -= 20;
        if (backupSuccessRate < 90) score -= (90 - backupSuccessRate); 
        if (trainingCoverage < 80) score -= ((80 - trainingCoverage) / 2); 
        return Math.max(0, Math.round(score));
    }, [openCriticalIncidents, unmitigatedCriticalVulns, backupSuccessRate, trainingCoverage]);

    const handleAcknowledge = async () => {
        setIsAcknowledging(true);
        try {
            await logAction('RISK_ACKNOWLEDGE', 'Compliance', `Governance review: ${complianceScore}% score acknowledged.`);
            setLastAckData(await fetchLastRiskAcknowledgement());
        } finally { setIsAcknowledging(false); }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center border-b border-gray-700 pb-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3"><FaTachometerAlt className="text-purple-500" /> C-Level Dashboard</h2>
                    <p className="text-on-surface-dark-secondary text-sm mt-1">Supervisão Executiva NIS2 / Governance.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden">
                    <h3 className="text-gray-400 uppercase tracking-widest text-xs mb-4">Compliance Score</h3>
                    <div className={`text-6xl font-black mb-2 ${complianceScore >= 80 ? 'text-green-500' : 'text-yellow-500'}`}>{complianceScore}%</div>
                    <p className="text-xs text-gray-500 mt-2">Algoritmo de Risco Dinâmico</p>
                </div>

                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg border bg-gray-800/30 border-gray-700">
                        <p className="text-gray-400 text-xs uppercase">Incid. Críticos</p>
                        <p className={`text-2xl font-bold ${openCriticalIncidents > 0 ? 'text-red-400' : 'text-green-400'}`}>{openCriticalIncidents}</p>
                    </div>
                    <div className="p-4 rounded-lg border bg-gray-800/30 border-gray-700">
                        <p className="text-gray-400 text-xs uppercase">Vuln. Críticas</p>
                        <p className={`text-2xl font-bold ${unmitigatedCriticalVulns > 0 ? 'text-orange-400' : 'text-green-400'}`}>{unmitigatedCriticalVulns}</p>
                    </div>
                    <div className="p-4 rounded-lg border bg-gray-800/30 border-gray-700">
                        <p className="text-gray-400 text-xs uppercase">Sucesso Backups (30d)</p>
                        <div className="flex items-center gap-2">
                            <FaServer className={backupSuccessRate >= 90 ? 'text-green-400' : 'text-yellow-400'} />
                            <p className={`text-2xl font-bold ${backupSuccessRate >= 90 ? 'text-green-400' : 'text-yellow-400'}`}>{backupSuccessRate}%</p>
                        </div>
                    </div>
                    <div className="p-4 rounded-lg border bg-gray-800/30 border-gray-700">
                        <p className="text-gray-400 text-xs uppercase">Cobertura Formação</p>
                        <div className="flex items-center gap-2">
                            <FaGraduationCap className={trainingCoverage >= 80 ? 'text-green-400' : 'text-yellow-400'} />
                            <p className={`text-2xl font-bold ${trainingCoverage >= 80 ? 'text-green-400' : 'text-yellow-400'}`}>{trainingCoverage}%</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Financial Overview Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded-lg border bg-gray-800/30 border-gray-700 flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-xs uppercase font-bold tracking-wider">CAPEX (Aquisição Total)</p>
                        <p className="text-3xl font-black text-white mt-1">
                            {finOpsData.capex.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                        </p>
                    </div>
                    <div className="p-3 bg-blue-900/30 text-blue-400 rounded-full">
                        <FaEuroSign className="text-2xl" />
                    </div>
                </div>
                <div className="p-5 rounded-lg border bg-gray-800/30 border-gray-700 flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-xs uppercase font-bold tracking-wider">Valor Atual (Depreciado)</p>
                        <p className="text-3xl font-black text-green-400 mt-1">
                            {finOpsData.currentValue.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                        </p>
                    </div>
                    <div className="p-3 bg-green-900/30 text-green-400 rounded-full">
                        <FaChartLine className="text-2xl" />
                    </div>
                </div>
            </div>

            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6"><FaFileSignature className="text-brand-secondary" /> Supervisão da Gestão</h3>
                <div className="flex items-center justify-center p-6 bg-black/30 rounded-lg border border-gray-800">
                    {lastAckData ? (
                        <div className="text-center"><FaCheckCircle className="text-green-500 text-3xl mx-auto mb-2"/><p className="text-green-400 font-bold">Revisão Registada</p><p className="text-xs text-gray-500">Por {lastAckData.user_email} em {new Date(lastAckData.timestamp).toLocaleString()}</p></div>
                    ) : (
                        <button onClick={handleAcknowledge} disabled={isAcknowledging} className="bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-8 rounded-lg transition-all flex items-center gap-2">
                            {isAcknowledging ? <FaSpinner className="animate-spin" /> : <FaFileSignature />} Tomar Conhecimento dos Riscos
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SmartDashboard;
