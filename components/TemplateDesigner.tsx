
import React, { useRef, useEffect, useState } from 'react';
import { Designer } from '@pdfme/ui';
import { Template, BLANK_PDF } from '@pdfme/common';
import { DocumentTemplate } from '../types';
import Modal from './common/Modal';
import { FaSave, FaSpinner } from 'react-icons/fa';

// A simple base64 blank PDF (A4 portrait) to use as a base
// In a real app, users could upload their own base PDF.
const BASE_PDF = BLANK_PDF;

interface TemplateDesignerProps {
    onClose: () => void;
    onSave: (template: Omit<DocumentTemplate, 'id' | 'created_at'> | DocumentTemplate) => Promise<void>;
    templateToEdit?: DocumentTemplate | null;
}

const TemplateDesigner: React.FC<TemplateDesignerProps> = ({ onClose, onSave, templateToEdit }) => {
    const designerRef = useRef<HTMLDivElement>(null);
    const designerInstance = useRef<Designer | null>(null);
    const [name, setName] = useState(templateToEdit?.name || '');
    const [type, setType] = useState<'equipment' | 'collaborator' | 'generic'>(templateToEdit?.type || 'generic');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (designerRef.current && !designerInstance.current) {
            const template: Template = templateToEdit?.template_json || {
                basePdf: BASE_PDF,
                schemas: [
                    {
                        title: {
                            type: 'text',
                            position: { x: 20, y: 20 },
                            width: 100,
                            height: 10,
                            content: 'Título do Documento'
                        }
                    }
                ]
            };

            designerInstance.current = new Designer({
                domContainer: designerRef.current,
                template
            });
        }
    }, [templateToEdit]);

    const handleSave = async () => {
        if (!name.trim()) {
            alert('O nome do template é obrigatório.');
            return;
        }
        if (!designerInstance.current) return;

        setIsSaving(true);
        try {
            const templateJson = designerInstance.current.getTemplate();
            
            const dataToSave = {
                name,
                type,
                template_json: templateJson,
                is_active: true
            };

            if (templateToEdit) {
                await onSave({ ...templateToEdit, ...dataToSave });
            } else {
                await onSave(dataToSave as any);
            }
            onClose();
        } catch (e) {
            console.error(e);
            alert("Erro ao gravar template.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal title="Editor Visual de Documentos" onClose={onClose} maxWidth="max-w-[90vw]">
            <div className="flex flex-col h-[80vh]">
                <div className="flex gap-4 mb-4 items-center bg-gray-900/50 p-3 rounded border border-gray-700">
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Nome do Modelo</label>
                        <input 
                            type="text" 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            className="bg-gray-800 border border-gray-600 rounded p-2 text-sm text-white w-64"
                            placeholder="Ex: Termo de Entrega"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Contexto (Dados Disponíveis)</label>
                        <select 
                            value={type} 
                            onChange={e => setType(e.target.value as any)}
                            className="bg-gray-800 border border-gray-600 rounded p-2 text-sm text-white w-48"
                        >
                            <option value="generic">Genérico (Sem auto-fill)</option>
                            <option value="equipment">Equipamento (S/N, Marca...)</option>
                            <option value="collaborator">Colaborador (Nome, Email...)</option>
                        </select>
                    </div>
                    <div className="flex-grow"></div>
                    <button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="bg-brand-primary text-white px-6 py-2 rounded hover:bg-brand-secondary flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSaving ? <FaSpinner className="animate-spin"/> : <FaSave />} Guardar Modelo
                    </button>
                </div>
                
                <div className="flex-grow bg-gray-200 rounded overflow-hidden relative">
                    <div ref={designerRef} className="absolute inset-0" />
                </div>
                
                <div className="mt-2 text-xs text-gray-500">
                    Dica: Use chaves duplas {'{{campo}}'} no conteúdo para campos variáveis que serão preenchidos automaticamente (Ex: {'{{serialNumber}}'}).
                </div>
            </div>
        </Modal>
    );
};

export default TemplateDesigner;
