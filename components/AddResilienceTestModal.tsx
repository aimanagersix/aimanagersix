
import React, { useState, useEffect, useRef } from 'react';
import Modal from './common/Modal';
import { ResilienceTest, ResilienceTestType, Ticket, TicketStatus, CriticalityLevel, Entidade, Supplier } from '../types';
import { FaShieldAlt, FaFilePdf, FaMagic, FaSpinner, FaCheck, FaTicketAlt, FaCalendarPlus, FaDownload } from './common/Icons';
import { extractFindingsFromReport, isAiConfigured } from '../services/geminiService';

interface AddResilienceTestModalProps {
    onClose: () => void;
    onSave: (test: Omit<ResilienceTest, 'id'> | ResilienceTest) => Promise<void>;
    testToEdit?: ResilienceTest | null;
    onCreateTicket?: (ticket: Partial<Ticket>) => void;
    entidades?: Entidade[];
    suppliers?: Supplier[];
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB for PDF reports

const AddResilienceTestModal: React.FC<AddResilienceTestModalProps> = ({ onClose, onSave, testToEdit, onCreateTicket, entidades = [], suppliers = [] }) => {
    const [formData, setFormData] = useState<Partial<ResilienceTest>>({
        title: '',
        test_type: ResilienceTestType.VulnerabilityScan,
        planned_date: new Date().toISOString().split('T')[0],
        status: 'Planeado',
        auditor_entity: '',
        auditor_supplier_id: '',
        auditor_internal_entidade_id: '',
        summary_findings: '',
        attachments: []
    });
    const [attachment, setAttachment] = useState<{ name: string; dataUrl: string } | null>(null);
    
    // Auditor Source State
    const [auditorSource, setAuditorSource] = useState<'internal' | 'external' | 'manual'>('manual');

    // Next Test Scheduling
    const [scheduleNext, setScheduleNext] = useState(false);
    const [nextTestMonths, setNextTestMonths] = useState<number>(12);

    // AI Parsing State
    const [isParsing, setIsParsing] = useState(false);
    const [extractedFindings, setExtractedFindings] = useState<any[]>([]);
    const aiConfigured = isAiConfigured();
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (testToEdit) {
            setFormData({ ...testToEdit });
            if (testToEdit.attachments && testToEdit.attachments.length > 0) {
                setAttachment(testToEdit.attachments[0]);
            }
            if (testToEdit.auditor_supplier_id) setAuditorSource('external');
            else if (testToEdit.auditor_internal_entidade_id) setAuditorSource('internal');
            else setAuditorSource('manual');
        }
    }, [testToEdit]);

    // Update auditor_entity text when selection changes
    useEffect(() => {
        if (auditorSource === 'external' && formData.auditor_supplier_id) {
            const sup = suppliers.find(s => s.id === formData.auditor_supplier_id);
            if (sup) setFormData(prev => ({ ...prev, auditor_entity: sup.name, auditor_internal_entidade_id: undefined }));
        } else if (auditorSource === 'internal' && formData.auditor_internal_entidade_id) {
            const ent = entidades.find(e => e.id === formData.auditor_internal_entidade_id);
            if (ent) setFormData(prev => ({ ...prev, auditor_entity: ent.name, auditor_supplier_id: undefined }));
        } else if (auditorSource === 'manual') {
             setFormData(prev => ({ ...prev, auditor_supplier_id: undefined, auditor_internal_entidade_id: undefined }));
        }
    }, [auditorSource, formData.auditor_supplier_id, formData.auditor_internal_entidade_id, suppliers, entidades]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > MAX_FILE_SIZE) {
                alert("Ficheiro demasiado grande (Max 10MB)");
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                const dataUrl = event.target?.result as string;
                setAttachment({ name: file.name, dataUrl });
                // Optionally auto-parse if AI enabled
            };
            reader.readAsDataURL(file);
        }
    };

    const handleParseReport = async () => {
        if (!attachment || !aiConfigured) return;
        
        const mimeType = attachment.dataUrl.split(';')[0].split(':')[1];
        if (!mimeType.includes('image') && !mimeType.includes('pdf')) {
            alert("A análise IA suporta imagens e PDFs.");
        }

        setIsParsing(true);
        try {
            const base64 = attachment.dataUrl.split(',')[1];
            const findings = await extractFindingsFromReport(base64, mimeType);
            setExtractedFindings(findings);
            
            if (findings.length > 0) {
                setFormData(prev => ({
                    ...prev,
                    summary_findings: prev.summary_findings || `Análise IA detetou ${findings.length} vulnerabilidades críticas.`
                }));
            }
        } catch (error) {
            console.error(error);
            alert("Erro ao analisar relatório.");
        } finally {
            setIsParsing(false);
        }
    };

    const handleCreateTicketFromFinding = (finding: any) => {
        if (!onCreateTicket) return;
        
        const severityMap: Record<string, CriticalityLevel> = {
            'Crítica': CriticalityLevel.Critical,
            'Alta': CriticalityLevel.High,
            'Média': CriticalityLevel.Medium,
            'Baixa': CriticalityLevel.Low
        };

        onCreateTicket({
            title: `Vuln: ${finding.title}`,
            description: `Detetado em Teste de Resiliência (${formData.title}).\n\nDescrição: ${finding.description}\n\nRemediação Sugerida: ${finding.remediation}`,
            category: 'Incidente de Segurança',
            // Fix: securityIncidentType to security_incident_type
            security_incident_type: 'Exploração de Vulnerabilidade',
            // Fix: impactCriticality to impact_criticality
            impact_criticality: severityMap[finding.severity] || CriticalityLevel.Medium,
            status: TicketStatus.Requested,
            // Fix: requestDate to request_date
            request_date: new Date().toISOString()
        });
        alert("Ticket criado com sucesso!");
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSave = {
            ...formData,
            attachments: attachment ? [attachment] : []
        };
        
        if (testToEdit) {
            onSave({ ...testToEdit, ...dataToSave } as ResilienceTest);
        } else {
            onSave(dataToSave as ResilienceTest);
        }

        // Create Next Test Ticket
        if (scheduleNext && onCreateTicket) {
            const nextDate = new Date(formData.planned_date || new Date());
            nextDate.setMonth(nextDate.getMonth() + nextTestMonths);
            
            onCreateTicket({
                title: `Agendamento: ${formData.title} (Recorrência)`,
                description: `Agendamento automático do próximo teste de resiliência (${formData.test_type}).\nBaseado no teste realizado em ${formData.planned_date}.`,
                // Fix: requestDate to request_date
                request_date: nextDate.toISOString().split('T')[0],
                category: 'Manutenção',
                status: TicketStatus.Requested,
                team_id: undefined // Can be set if known
            });
        }

        onClose();
    };

    return (
        <Modal title={testToEdit ? "Editar Teste de Resiliência" : "Agendar Teste de Resiliência"} onClose={onClose} maxWidth="max-w-4xl">
            <div className="flex flex-col md:flex-row gap-6 h-[70vh]">
                {/* Form Side */}
                <form onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                    <div>
                        <label className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Título do Teste</label>
                        <input 
                            type="text" 
                            name="title" 
                            value={formData.title} 
                            onChange={handleChange} 
                            className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"
                            placeholder="Ex: Pentest Anual 2024"
                            required 
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Tipo</label>
                            <select name="test_type" value={formData.test_type} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2">
                                {Object.values(ResilienceTestType).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Estado</label>
                            <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2">
                                <option value="Planeado">Planeado</option>
                                <option value="Em Execução">Em Execução</option>
                                <option value="Concluído">Concluído</option>
                                <option value="Cancelado">Cancelado</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Data Planeada</label>
                            <input type="date" name="planned_date" value={formData.planned_date} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Data Execução</label>
                            <input type="date" name="executed_date" value={formData.executed_date || ''} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" />
                        </div>
                    </div>
                    
                    {/* Auditor Selection */}
                    <div className="bg-gray-800/50 p-3 rounded border border-gray-600">
                        <label className="block text-sm font-medium text-on-surface-dark-secondary mb-2">Entidade Auditora</label>
                        <div className="flex gap-2 mb-3 text-sm">
                            <label className="flex items-center cursor-pointer">
                                <input type="radio" name="auditorSource" value="manual" checked={auditorSource === 'manual'} onChange={() => setAuditorSource('manual')} className="mr-2"/>
                                Texto Livre
                            </label>
                            <label className="flex items-center cursor-pointer">
                                <input type="radio" name="auditorSource" value="internal" checked={auditorSource === 'internal'} onChange={() => setAuditorSource('internal')} className="mr-2"/>
                                Interno (Entidade)
                            </label>
                            <label className="flex items-center cursor-pointer">
                                <input type="radio" name="auditorSource" value="external" checked={auditorSource === 'external'} onChange={() => setAuditorSource('external')} className="mr-2"/>
                                Fornecedor
                            </label>
                        </div>

                        {auditorSource === 'manual' && (
                            <input 
                                type="text" 
                                name="auditor_entity" 
                                value={formData.auditor_entity} 
                                onChange={handleChange} 
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"
                                placeholder="Interno ou Nome da Empresa Externa"
                            />
                        )}
                        {auditorSource === 'internal' && (
                            <select 
                                name="auditor_internal_entidade_id" 
                                value={formData.auditor_internal_entidade_id} 
                                onChange={handleChange} 
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"
                            >
                                <option value="">Selecione Entidade Interna</option>
                                {entidades.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                            </select>
                        )}
                        {auditorSource === 'external' && (
                            <select 
                                name="auditor_supplier_id" 
                                value={formData.auditor_supplier_id} 
                                onChange={handleChange} 
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"
                            >
                                <option value="">Selecione Fornecedor</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        )}
                    </div>
                    
                    {/* Schedule Next Test */}
                    {!testToEdit && onCreateTicket && (
                        <div className="bg-blue-900/20 p-3 rounded border border-blue-500/30">
                            <div className="flex items-center mb-2">
                                <input 
                                    type="checkbox" 
                                    id="scheduleNext" 
                                    checked={scheduleNext} 
                                    onChange={(e) => setScheduleNext(e.target.checked)} 
                                    className="h-4 w-4 rounded bg-gray-700 text-brand-primary"
                                />
                                <label htmlFor="scheduleNext" className="ml-2 text-sm font-bold text-blue-200 flex items-center gap-2">
                                    <FaCalendarPlus /> Agendar Próximo Teste (Criar Ticket)
                                </label>
                            </div>
                            {scheduleNext && (
                                <div className="ml-6 flex gap-2">
                                    {[1, 3, 6, 12].map(months => (
                                        <button 
                                            key={months}
                                            type="button"
                                            onClick={() => setNextTestMonths(months)}
                                            className={`px-3 py-1 rounded text-xs border ${nextTestMonths === months ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-800 text-gray-300 border-gray-600'}`}
                                        >
                                            {months} Meses
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* File Upload */}
                    <div className="bg-gray-800 p-3 rounded border border-gray-700">
                        <label className="block text-sm font-medium text-white mb-2">Relatório / Evidência</label>
                        <div className="flex items-center gap-2">
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept=".pdf,image/*"
                            />
                            <button 
                                type="button" 
                                onClick={() => fileInputRef.current?.click()}
                                className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded transition-colors"
                            >
                                {attachment ? 'Substituir Ficheiro' : 'Carregar Relatório'}
                            </button>
                            {attachment && (
                                <div className="flex items-center gap-2 text-xs text-gray-300 truncate">
                                    <span>{attachment.name}</span>
                                    {attachment.dataUrl && (
                                        <a href={attachment.dataUrl} download={attachment.name} className="text-blue-400 hover:text-blue-300" title="Download">
                                            <FaDownload />
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                        {attachment && (
                            <button 
                                type="button" 
                                onClick={handleParseReport}
                                disabled={isParsing || !aiConfigured}
                                className={`mt-2 w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-purple-600/20 text-purple-300 border border-purple-500/50 rounded hover:bg-purple-600/30 transition-colors text-sm ${!aiConfigured ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isParsing ? <FaSpinner className="animate-spin"/> : <FaMagic/>} 
                                Analisar Relatório com IA
                            </button>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-on-surface-dark-secondary mb-1">Resumo de Conclusões</label>
                        <textarea 
                            name="summary_findings" 
                            value={formData.summary_findings} 
                            onChange={handleChange} 
                            rows={4} 
                            className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm"
                            placeholder="Principais descobertas e recomendações..."
                        ></textarea>
                    </div>
                </form>

                {/* AI Findings Side (If extracted) */}
                {extractedFindings.length > 0 && (
                    <div className="w-1/3 bg-gray-900/50 border-l border-gray-700 p-4 overflow-y-auto custom-scrollbar">
                        <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                            <FaShieldAlt className="text-red-400"/> Vulnerabilidades Detetadas
                        </h3>
                        <div className="space-y-3">
                            {extractedFindings.map((finding, idx) => (
                                <div key={idx} className="bg-gray-800 p-3 rounded border border-gray-600 text-xs">
                                    <div className="flex justify-between mb-1">
                                        <span className="font-bold text-white">{finding.title}</span>
                                        <span className="text-red-400">{finding.severity}</span>
                                    </div>
                                    <p className="text-gray-400 mb-2 line-clamp-2">{finding.description}</p>
                                    <button 
                                        type="button"
                                        onClick={() => handleCreateTicketFromFinding(finding)} 
                                        className="w-full flex items-center justify-center gap-1 bg-red-900/30 text-red-300 border border-red-500/30 py-1 rounded hover:bg-red-900/50"
                                    >
                                        <FaTicketAlt/> Criar Ticket
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-gray-700 mt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Cancelar</button>
                <button type="button" onClick={handleSubmit} className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary">Salvar</button>
            </div>
        </Modal>
    );
};

export default AddResilienceTestModal;
