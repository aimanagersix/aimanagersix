
import React, { useMemo, useState, useEffect } from 'react';
import { Ticket, TicketStatus, CriticalityLevel, Vulnerability, VulnerabilityStatus, BackupExecution, SecurityTrainingRecord, Collaborator, UserRole } from '../types';
import { FaShieldAlt, FaTachometerAlt, FaExclamationTriangle, FaCheckCircle, FaUserShield, FaFileSignature, FaSpinner } from './common/Icons';
import { fetchLastRiskAcknowledgement, logAction } from '../services/dataService';

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

    useEffect(() => {
        const loadAck = async () => {
            const data = await fetchLastRiskAcknowledgement();
            setLastAckData(data);
        };
        loadAck();
    }, []);

    // --- CALCULATE METRICS ---

    // 1. Incident Response
    const openCriticalIncidents = useMemo(() => tickets.filter(t => 
        (t.category === 'Incidente de Segurança' || t.securityIncidentType) && 
        t.impactCriticality === CriticalityLevel.Critical &&
        t.status !== TicketStatus.Finished
    ).length, [tickets]);

    // 2. Vulnerability Status
    const unmitigatedCriticalVulns = useMemo(() => vulnerabilities.filter(v => 
        v.severity === CriticalityLevel.Critical && 
        v.status !== VulnerabilityStatus.Resolved && 
        v.status !== VulnerabilityStatus.Mitigated
    ).length, [vulnerabilities]);

    // 3. Backup Health (Last 30 days success rate)
    const backupSuccessRate = useMemo(() => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentBackups = backups.filter(b => new Date(b.test_date) >= thirtyDaysAgo);
        if (recentBackups.length === 0) return 0;
        const successes = recentBackups.filter(b => b.status === 'Sucesso').length;
        return Math.round((successes / recentBackups.length) * 100);
    }, [backups]);

    // 4. Training Coverage (Users with recent training)
    const trainingCoverage = useMemo(() => {
        if (collaborators.length === 0) return 0;
        const trainedUserIds = new Set(trainings.map(t => t.collaborator_id));
        return Math.round((trainedUserIds.size / collaborators.length) * 100);
    }, [collaborators, trainings]);

    // --- COMPLIANCE SCORE ALGORITHM ---
    const complianceScore = useMemo(() => {
        let score = 100;
        
        // Penalties
        if (openCriticalIncidents > 0) score -= 30;
        if (unmitigatedCriticalVulns > 0) score -= 20;
        if (backupSuccessRate < 90) score -= (90 - backupSuccessRate); // 1 point per % under 90
        if (trainingCoverage < 80) score -= ((80 - trainingCoverage) / 2); // 0.5 point per % under 80

        return Math.max(0, Math.round(score));
    }, [openCriticalIncidents, unmitigatedCriticalVulns, backupSuccessRate, trainingCoverage]);

    const scoreColor = complianceScore >= 85 ? 'text-green-500' : complianceScore >= 60 ? 'text-yellow-500' : 'text-red-500';
    const scoreMessage = complianceScore >= 85 ? 'Conformidade Saudável' : complianceScore >= 60 ? 'Risco Moderado - Ação Necessária' : 'Risco Crítico - Intervenção Imediata';

    // --- ACKNOWLEDGEMENT LOGIC ---
    const currentMonthStr = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    const isAckedThisMonth = lastAckData && new Date(lastAckData.timestamp).getMonth() === new Date().getMonth();

    const handleAcknowledge = async () => {
        setIsAcknowledging(true);
        try {
            await logAction(
                'RISK_ACKNOWLEDGE', 
                'Compliance', 
                `Administração tomou conhecimento do Score: ${complianceScore}% | Incidentes Críticos: ${openCriticalIncidents}`
            );
            // Refresh Ack Data
            const data = await fetchLastRiskAcknowledgement();
            setLastAckData(data);
        } catch (e) {
            alert("Erro ao registar reconhecimento.");
        } finally {
            setIsAcknowledging(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-gray-700 pb-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <FaTachometerAlt className="text-purple-500" />
                        C-Level Dashboard (NIS2)
                    </h2>
                    <p className="text-on-surface-dark-secondary text-sm mt-1">
                        Visão executiva para a Administração (Artigo 20º NIS2 - Governance).
                    </p>
                </div>
            </div>

            {/* Main Score */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-gray-800/50 border border-gray-700 rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"></div>
                    <h3 className="text-gray-400 uppercase tracking-widest text-xs mb-4">Score de Conformidade Hoje</h3>
                    <div className={`text-6xl font-black ${scoreColor} mb-2`}>
                        {complianceScore}%
                    </div>
                    <div className={`text-lg font-bold ${scoreColor}`}>
                        {scoreMessage}
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Incident Risk */}
                    <div className={`p-4 rounded-lg border ${openCriticalIncidents > 0 ? 'bg-red-900/20 border-red-500/50' : 'bg-green-900/20 border-green-500/50'}`}>
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-400 text-xs uppercase">Incidentes Críticos Abertos</p>
                                <p className={`text-2xl font-bold ${openCriticalIncidents > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                    {openCriticalIncidents}
                                </p>
                            </div>
                            <FaExclamationTriangle className={openCriticalIncidents > 0 ? 'text-red-500' : 'text-green-500'} />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">KPI: 0 Incidentes</p>
                    </div>

                    {/* Vulnerability Risk */}
                    <div className={`p-4 rounded-lg border ${unmitigatedCriticalVulns > 0 ? 'bg-orange-900/20 border-orange-500/50' : 'bg-green-900/20 border-green-500/50'}`}>
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-400 text-xs uppercase">Vulnerabilidades Críticas</p>
                                <p className={`text-2xl font-bold ${unmitigatedCriticalVulns > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                                    {unmitigatedCriticalVulns}
                                </p>
                            </div>
                            <FaShieldAlt className={unmitigatedCriticalVulns > 0 ? 'text-orange-500' : 'text-green-500'} />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">KPI: 0 CVEs Abertos</p>
                    </div>

                    {/* Backup Resilience */}
                    <div className={`p-4 rounded-lg border ${backupSuccessRate < 90 ? 'bg-yellow-900/20 border-yellow-500/50' : 'bg-green-900/20 border-green-500/50'}`}>
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-400 text-xs uppercase">Sucesso Backups (30d)</p>
                                <p className={`text-2xl font-bold ${backupSuccessRate < 90 ? 'text-yellow-400' : 'text-green-400'}`}>
                                    {backupSuccessRate}%
                                </p>
                            </div>
                            <FaUserShield className="text-blue-400" />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">KPI: &gt; 90%</p>
                    </div>

                    {/* Training Awareness */}
                    <div className={`p-4 rounded-lg border ${trainingCoverage < 80 ? 'bg-blue-900/20 border-blue-500/50' : 'bg-green-900/20 border-green-500/50'}`}>
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-400 text-xs uppercase">Colaboradores Formados</p>
                                <p className={`text-2xl font-bold ${trainingCoverage < 80 ? 'text-blue-400' : 'text-green-400'}`}>
                                    {trainingCoverage}%
                                </p>
                            </div>
                            <FaUserShield className="text-purple-400" />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">KPI: &gt; 80%</p>
                    </div>
                </div>
            </div>

            {/* Governance & Acknowledgement */}
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <FaFileSignature className="text-brand-secondary" />
                        Supervisão da Gestão
                    </h3>
                    <div className="text-right">
                        <p className="text-sm text-gray-400">Mês de Referência</p>
                        <p className="text-lg font-bold text-white capitalize">{currentMonthStr}</p>
                    </div>
                </div>

                <div className="bg-black/30 p-4 rounded border border-gray-800 mb-6">
                    <p className="text-sm text-gray-300 mb-2">
                        De acordo com a diretiva NIS2, os órgãos de gestão são obrigados a aprovar as medidas de gestão de riscos de cibersegurança e a supervisionar a sua implementação, podendo ser responsabilizados pelo incumprimento.
                    </p>
                    <p className="text-xs text-gray-500">
                        Ao clicar em "Tomar Conhecimento", está a confirmar que analisou o painel de risco acima. Esta ação é registada para efeitos de auditoria.
                    </p>
                </div>

                {isAckedThisMonth ? (
                    <div className="flex items-center justify-center gap-4 p-4 bg-green-900/20 border border-green-500/50 rounded-lg">
                        <FaCheckCircle className="text-green-500 text-3xl" />
                        <div className="text-left">
                            <p className="text-green-400 font-bold text-lg">Supervisão Registada</p>
                            <p className="text-sm text-green-300">
                                Assinado por {lastAckData?.user_email} em {new Date(lastAckData!.timestamp).toLocaleDateString()} às {new Date(lastAckData!.timestamp).toLocaleTimeString()}.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center">
                        <button 
                            onClick={handleAcknowledge}
                            disabled={isAcknowledging}
                            className="bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-all transform hover:scale-105 flex items-center gap-2 mx-auto disabled:opacity-50 disabled:scale-100"
                        >
                            {isAcknowledging ? <FaSpinner className="animate-spin" /> : <FaFileSignature />}
                            Tomar Conhecimento dos Riscos
                        </button>
                        <p className="text-xs text-red-400 mt-3 font-medium">
                            Atenção: A supervisão deste mês ainda está pendente.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SmartDashboard;
