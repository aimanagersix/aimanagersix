
import React, { useState, useEffect, useRef } from 'react';
import Modal from './common/Modal';
import { DocumentTemplate } from '../types';
import { generate } from '@pdfme/generator';
import { FaPrint, FaSpinner } from 'react-icons/fa';

interface DocumentGeneratorModalProps {
    onClose: () => void;
    templates: DocumentTemplate[];
    dataContext: any; // The data object (equipment, collaborator, etc.)
    contextType: 'equipment' | 'collaborator';
}

const DocumentGeneratorModal: React.FC<DocumentGeneratorModalProps> = ({ onClose, templates, dataContext, contextType }) => {
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Filter relevant templates
    const availableTemplates = templates.filter(t => t.type === contextType || t.type === 'generic');

    useEffect(() => {
        if (availableTemplates.length > 0) {
            setSelectedTemplateId(availableTemplates[0].id);
        }
    }, [templates, contextType]);

    useEffect(() => {
        const generatePdf = async () => {
            if (!selectedTemplateId) return;
            setIsGenerating(true);
            
            try {
                const template = templates.find(t => t.id === selectedTemplateId);
                if (!template) return;

                // Flatten data context for easier mapping
                // e.g. equipment.serialNumber -> input "serialNumber"
                const inputs = [{} as Record<string, string>];
                
                // Simple flattening logic (can be improved for deep objects)
                Object.keys(dataContext).forEach(key => {
                    const val = dataContext[key];
                    if (typeof val === 'string' || typeof val === 'number') {
                        inputs[0][key] = String(val);
                    } else if (val && typeof val === 'object' && !Array.isArray(val)) {
                         // Flatten one level deep (e.g. brand.name -> brandName)
                         // This depends on how the user named fields in the designer. 
                         // Ideally, we provide a list of available keys.
                         // For now, we just put the object stringified or specific keys if known
                         if(key === 'brand') inputs[0]['brandName'] = val.name || '';
                         if(key === 'type') inputs[0]['typeName'] = val.name || '';
                    }
                });
                
                // Also add raw keys just in case
                 Object.keys(dataContext).forEach(key => {
                     if (typeof dataContext[key] === 'string') {
                         inputs[0][key] = dataContext[key];
                     }
                 });

                const pdf = await generate({ template: template.template_json, inputs });
                const blob = new Blob([pdf], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                setPdfUrl(url);

            } catch (e) {
                console.error("Generation failed:", e);
                alert("Erro ao gerar documento.");
            } finally {
                setIsGenerating(false);
            }
        };

        if (selectedTemplateId) {
            const timeout = setTimeout(generatePdf, 500); // Debounce slightly
            return () => clearTimeout(timeout);
        }
    }, [selectedTemplateId, dataContext, templates]);

    return (
        <Modal title="Gerar Documento" onClose={onClose} maxWidth="max-w-5xl">
            <div className="flex flex-col h-[80vh]">
                <div className="flex gap-4 mb-4 items-center">
                    <label className="text-sm text-gray-400">Selecionar Modelo:</label>
                    <select 
                        value={selectedTemplateId} 
                        onChange={e => setSelectedTemplateId(e.target.value)}
                        className="bg-gray-700 border border-gray-600 rounded p-2 text-white flex-grow max-w-md"
                    >
                        {availableTemplates.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex-grow bg-gray-800 rounded border border-gray-700 overflow-hidden relative flex items-center justify-center">
                    {isGenerating && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                            <FaSpinner className="animate-spin text-4xl text-brand-secondary"/>
                        </div>
                    )}
                    
                    {pdfUrl ? (
                        <iframe src={pdfUrl} className="w-full h-full" title="Preview" />
                    ) : (
                        <p className="text-gray-500">Selecione um modelo para pré-visualizar.</p>
                    )}
                </div>
                
                <div className="mt-4 flex justify-end gap-4">
                    <button onClick={onClose} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500">Fechar</button>
                </div>
            </div>
        </Modal>
    );
};

export default DocumentGeneratorModal;
