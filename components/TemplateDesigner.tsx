
import React, { useRef, useEffect, useState } from 'react';
import { Designer } from '@pdfme/ui';
import { Template, BLANK_PDF } from '@pdfme/common';
import { text, image, barcodes } from '@pdfme/schemas';
import { DocumentTemplate } from '../types';
import Modal from './common/Modal';
import { FaSave, FaSpinner, FaTimes } from 'react-icons/fa';

// A simple base64 blank PDF (A4 portrait) to use as a base
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
                        "a": {
                            type: 'text',
                            position: { x: 20, y: 20 },
                            width: 100,
                            height: 10,
                            content: 'Título do Documento'
                        }
                    }
                ]
            };

            // Initialize with plugins to ensure Text/Image work correctly
            designerInstance.current = new Designer({
                domContainer: designerRef.current,
                template,
                plugins: {
                    text,
                    image,
                    qrcode: barcodes.qrcode,
                }
            });
        }
        
        return () => {
             if (designerInstance.current) {
                 // Clean up if the library supports it, otherwise let ref unmount
                 // designerInstance.current.destroy(); 
             }
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
            alert("Erro ao gravar template. Verifique a consola.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal title="Editor Visual de Documentos" onClose={onClose} maxWidth="max-w-[98vw]">
            <div className="flex flex-col h-[90vh]">
                {/* Header Toolbar */}
                <div className="flex flex-wrap gap-4 mb-2 items-center bg-gray-900/80 p-3 rounded border border-gray-700">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-[10px] text-gray-400 uppercase mb-1">Nome do Modelo</label>
                        <input 
                            type="text" 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm text-white focus:border-brand-secondary"
                            placeholder="Ex: Termo de Entrega"
                        />
                    </div>
                    <div className="min-w-[150px]">
                        <label className="block text-[10px] text-gray-400 uppercase mb-1">Contexto</label>
                        <select 
                            value={type} 
                            onChange={e => setType(e.target.value as any)}
                            className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm text-white"
                        >
                            <option value="generic">Genérico</option>
                            <option value="equipment">Equipamento</option>
                            <option value="collaborator">Colaborador</option>
                        </select>
                    </div>
                    <div className="flex items-end gap-2">
                        <button 
                            onClick={handleSave} 
                            disabled={isSaving}
                            className="bg-brand-primary text-white px-6 py-2 rounded hover:bg-brand-secondary flex items-center gap-2 disabled:opacity-50 font-bold shadow-lg"
                        >
                            {isSaving ? <FaSpinner className="animate-spin"/> : <FaSave />} Guardar
                        </button>
                        <button 
                             onClick={onClose}
                             className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600"
                        >
                             Cancelar
                        </button>
                    </div>
                </div>
                
                <div className="flex-grow bg-gray-200 rounded-lg overflow-hidden relative shadow-inner border border-gray-600">
                     {/* Ensure container has explicit height for the canvas */}
                    <div ref={designerRef} style={{ width: '100%', height: '100%' }} />
                </div>
                
                <div className="mt-2 text-xs text-gray-400 bg-black/20 p-2 rounded">
                    <strong>Dica:</strong> Para usar campos variáveis, insira texto com chaves duplas. Ex: <code>{'{{serialNumber}}'}</code>, <code>{'{{description}}'}</code>, <code>{'{{assignedTo}}'}</code>.
                </div>
            </div>
        </Modal>
    );
};

export default TemplateDesigner;
