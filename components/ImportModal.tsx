
import React, { useState, useCallback } from 'react';
import Modal from './common/Modal';
import { SpinnerIcon } from './common/Icons';
import * as XLSX from 'xlsx';

export interface ImportConfig {
    dataType: 'instituicoes' | 'entidades' | 'collaborators' | 'equipment';
    title: string;
    columnMap: Record<string, string>;
    templateFileName: string;
}

interface ImportModalProps {
    onClose: () => void;
    onImport: (dataType: ImportConfig['dataType'], data: any[]) => Promise<{ success: boolean; message: string }>;
    config: ImportConfig;
}

const ImportModal: React.FC<ImportModalProps> = ({ onClose, onImport, config }) => {
    const { title, columnMap, templateFileName, dataType } = config;

    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setImportResult(null); // Reset result on new file selection
        }
    };

    const handleDownloadTemplate = () => {
        const headers = Object.values(columnMap);
        const worksheet = XLSX.utils.aoa_to_sheet([headers]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
        XLSX.writeFile(workbook, templateFileName);
    };

    const handleImport = useCallback(async () => {
        if (!file) {
            alert("Por favor, selecione um ficheiro.");
            return;
        }

        setIsProcessing(true);
        setImportResult(null);

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json<any>(worksheet);

                if (json.length === 0) {
                     setImportResult({ success: false, message: 'O ficheiro está vazio ou tem um formato incorreto.' });
                     setIsProcessing(false);
                     return;
                }
                const invertedColumnMap = Object.entries(columnMap).reduce((acc: Record<string, string>, [key, value]) => {
                    acc[value as string] = key;
                    return acc;
                }, {} as Record<string, string>);

                const mappedData = json.map((row: any) => {
                    const newRow: Record<string, any> = {};
                    if (row && typeof row === 'object' && !Array.isArray(row)) {
                        for (const [colName, value] of Object.entries(row)) {
                            const trimmedColName = String(colName).trim();
                            const internalKey = invertedColumnMap[trimmedColName];
                            if (internalKey) {
                                newRow[internalKey] = value;
                            }
                        }
                    }
                    return newRow;
                });
                
                const result = await onImport(dataType, mappedData);
                setImportResult(result);

            } catch (error) {
                console.error("Error processing file:", error);
                setImportResult({ success: false, message: 'Ocorreu um erro ao processar o ficheiro. Verifique se o formato está correto.' });
            } finally {
                setIsProcessing(false);
            }
        };
        reader.readAsArrayBuffer(file);
    }, [file, onImport, columnMap, dataType]);
    
    return (
        <Modal title={title} onClose={onClose}>
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-medium text-on-surface-dark mb-2">Instruções</h3>
                    <p className="text-sm text-on-surface-dark-secondary mb-3">
                        Para importar, crie um ficheiro Excel (.xlsx) com as seguintes colunas. A ordem não importa, mas os nomes devem ser exatos.
                    </p>
                    <ul className="list-disc list-inside bg-gray-900/50 p-4 rounded-md text-sm text-on-surface-dark-secondary space-y-1">
                        {Object.values(columnMap).map(col => <li key={col}><code>{col}</code></li>)}
                    </ul>
                     <p className="text-sm text-on-surface-dark-secondary mt-3">
                        Dica: Descarregue o nosso template para começar.
                    </p>
                </div>

                <div className="flex items-center justify-center gap-4">
                     <button
                        onClick={handleDownloadTemplate}
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors"
                    >
                        Descarregar Template
                    </button>
                    <label className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary cursor-pointer transition-colors">
                        <span>Selecionar Ficheiro</span>
                        <input type="file" className="hidden" onChange={handleFileChange} accept=".xlsx, .xls" />
                    </label>
                </div>
                {file && (
                     <p className="text-center text-sm text-green-400">Ficheiro selecionado: {file.name}</p>
                )}

                {importResult && (
                    <div className={`p-4 rounded-md text-sm whitespace-pre-wrap ${importResult.success ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                        {importResult.message}
                    </div>
                )}
                
                <div className="flex justify-end gap-4 pt-4 border-t border-gray-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">
                        {importResult?.success ? 'Fechar' : 'Cancelar'}
                    </button>
                    <button 
                        type="button" 
                        onClick={handleImport} 
                        disabled={!file || isProcessing}
                        className="px-4 py-2 w-32 bg-brand-primary text-white rounded-md hover:bg-brand-secondary disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                    >
                        {isProcessing ? <SpinnerIcon /> : 'Importar Dados'}
                    </button>
                </div>
            </div>
        </Modal>
    )
};

export default ImportModal;

