import React, { useState } from 'react';
import Modal from './common/Modal';
import { Ticket, TicketActivity } from '../types';
import { FaLandmark, FaCopy, FaDownload, FaMagic, FaCheck, FaExclamationTriangle, FaClock, FaShieldAlt, FaSpinner } from './common/Icons';
import { generateNis2Notification, isAiConfigured } from '../services/geminiService';

interface RegulatoryNotificationModalProps {
    ticket: Ticket;
    activities: TicketActivity[];
    onClose: () => void;
}

const RegulatoryNotificationModal: React.FC<RegulatoryNotificationModalProps> = ({ ticket, activities, onClose }) => {
    const [reportJson, setReportJson] = useState<string>('');
    const [reportSummary, setReportSummary] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);
    const aiConfigured = isAiConfigured();

    const requestDate = new Date(ticket.request_date);
    const deadline24h = new Date(requestDate.getTime() + 24 * 60 * 60 * 1000);
    const deadline72h = new Date(requestDate.getTime() + 72 * 60 * 60 * 1000);
    const now = new Date();

    const getDeadlineStatus = (deadline: Date) => {
        const diffMs = deadline.getTime() - now.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        
        if (diffMs < 0) {
            return { 
                text: `Expirado há ${Math.abs(diffHours)}h`, 
                color: 'text-red-500 font-bold',
                bg: 'bg-red-900/20 border-red-500/50'
            };
        } else if (diffHours < 4) {
            return { 
                text: `${diffHours}h restantes`, 
                color: 'text-red-400 font-bold animate-pulse',
                bg: 'bg-red-900/10 border-red-500/30'
            };
        } else {
            return { 
                text: `${diffHours}h restantes`, 
                color: 'text-green-400',
                bg: 'bg-green-900/10 border-green-500/30'
            };
        }
    };

    const status24h = getDeadlineStatus(deadline24h);
    const status72h = getDeadlineStatus(deadline72h);

    const handleGenerate = async () => {
        if (!aiConfigured) return;
        setIsGenerating(true);
        try {
            const result = await generateNis2Notification(ticket, activities);
            setReportJson(result.report_json);
            setReportSummary(result.report_summary_html);
        } catch (error) {
            console.error(error);
            alert("Erro ao gerar relatório.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(reportJson);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const blob = new Blob([reportJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `NIS2_Notification_${ticket.id.substring(0, 8)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <Modal title="Notificação Regulatória (NIS2 / DORA)" onClose={onClose} maxWidth="max-w-4xl">
            <div className="space-y-6">
                <div className="bg-blue-900/20 border border-blue-900/50 p-4 rounded-lg text-sm text-blue-200">
                    <div className="flex items-center gap-2 font-bold mb-2">
                        <FaLandmark /> Artigo 23º - Prazos de Notificação
                    </div>
                    <p>Incidentes significativos devem ser notificados à autoridade nacional (CSIRT/CNCS). Este assistente gera o JSON oficial.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`p-4 rounded-lg border ${status24h.bg} flex justify-between items-center`}>
                        <div>
                            <h4 className="text-white font-bold flex items-center gap-2"><FaExclamationTriangle /> Alerta Precoce (24h)</h4>
                        </div>
                        <div className={`text-xl ${status24h.color}`}>{status24h.text}</div>
                    </div>
                    <div className={`p-4 rounded-lg border ${status72h.bg} flex justify-between items-center`}>
                        <div>
                            <h4 className="text-white font-bold flex items-center gap-2"><FaClock /> Notificação Incidente (72h)</h4>
                        </div>
                        <div className={`text-xl ${status72h.color}`}>{status72h.text}</div>
                    </div>
                </div>

                {!reportJson && (
                    <div className="flex justify-center py-8">
                        <button onClick={handleGenerate} disabled={isGenerating || !aiConfigured} className="flex items-center gap-3 px-6 py-3 bg-brand-primary text-white rounded-full hover:bg-brand-secondary transition-all shadow-lg font-bold">
                            {isGenerating ? <FaSpinner className="animate-spin text-xl" /> : <FaMagic className="text-xl" />}
                            {isGenerating ? 'A gerar com IA...' : 'Gerar Notificação Oficial (JSON)'}
                        </button>
                    </div>
                )}

                {reportJson && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                        <div className="flex flex-col h-96">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-sm font-bold text-gray-300">JSON Output</h4>
                                <div className="flex gap-2">
                                    <button onClick={handleCopy} className="text-xs bg-gray-700 px-2 py-1 rounded hover:bg-gray-600 text-white">{copied ? <FaCheck className="text-green-400"/> : <FaCopy />} Copiar</button>
                                    <button onClick={handleDownload} className="text-xs bg-gray-700 px-2 py-1 rounded hover:bg-gray-600 text-white"><FaDownload /> Download</button>
                                </div>
                            </div>
                            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs font-mono overflow-auto flex-grow custom-scrollbar border border-gray-700">{JSON.stringify(JSON.parse(reportJson), null, 2)}</pre>
                        </div>
                        <div className="flex flex-col h-96">
                            <h4 className="text-sm font-bold text-gray-300 mb-2">Resumo</h4>
                            <div className="bg-gray-800 p-4 rounded-lg text-sm text-gray-300 overflow-auto flex-grow custom-scrollbar border border-gray-700 prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: reportSummary }} />
                        </div>
                    </div>
                )}

                <div className="flex justify-end pt-4 border-t border-gray-700">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Fechar</button>
                </div>
            </div>
        </Modal>
    );
};

export default RegulatoryNotificationModal;