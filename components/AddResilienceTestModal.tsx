import React, { useState, useEffect, useRef } from 'react';
import Modal from './common/Modal';
import { ResilienceTest, ResilienceTestType, Ticket, TicketStatus, CriticalityLevel } from '../types';
import { FaShieldAlt, FaFilePdf, FaMagic, FaSpinner, FaCheck, FaTicketAlt } from './common/Icons';
import { extractFindingsFromReport, isAiConfigured } from '../services/geminiService';

interface AddResilienceTestModalProps {
    onClose: () => void;
    onSave: (test: Omit<ResilienceTest, 'id'> | ResilienceTest) => Promise<void>;
    testToEdit?: ResilienceTest | null;
    onCreateTicket?: (ticket: Partial<Ticket>) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB for PDF reports

const AddResilienceTestModal: React.FC<AddResilienceTestModalProps> = ({ onClose, onSave, testToEdit, onCreateTicket }) => {
    const [formData, setFormData] = useState<Partial<ResilienceTest>>({
        title: '',
        test_type: ResilienceTestType.VulnerabilityScan,
        planned_date: new Date().toISOString().split('T')[0],
        status: 'Planeado',
        auditor_entity: '',
        summary_findings: '',
        attachments: []
    });
    const [attachment, setAttachment] = useState<{ name: string; dataUrl: string } | null>(null);
    
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
        }
    }, [testToEdit]);

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
        // Simple check for supported types by Gemini (Images/PDF)
        if (!mimeType.includes('image') && !mimeType.includes('pdf')) {
            alert("A análise IA suporta imagens e PDFs.");
            // Note: Gemini API direct PDF support might need specific handling or beta access, defaulting to standard image/text prompts.
            // For this demo, we assume the service handles it or user uploads images of pages.
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
            securityIncidentType: 'Exploração de Vulnerabilidade',
            impactCriticality: severityMap[finding.severity] || CriticalityLevel.Medium,
            status: TicketStatus.Requested,
            requestDate: new Date().toISOString()
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
        onClose();
    };

    return (
        <Modal title={testToEdit ? "Editar Teste de Resiliência" : "Agendar Teste de Resiliência"} onClose={onClose} maxWidth="max-w-4xl">
            <div className="flex flex-col md:flex-row gap-6 h-[70vh]">
                {/* Form Side */}
                <form onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto pr-2">
