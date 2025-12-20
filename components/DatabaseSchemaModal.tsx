
import React, { useState } from 'react';
import Modal from './common/Modal';
import { FaDatabase, FaCheck, FaCopy, FaExclamationTriangle, FaSearch } from 'react-icons/fa';

interface DatabaseSchemaModalProps {
    onClose: () => void;
}

const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ onClose }) => {
    const [copied, setCopied] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'migration' | 'inspect'>('migration');
    
    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const migrationScript = `-- ==================================================================================
-- SCRIPT DE MIGRAÇÃO IDEMPOTENTE v29.0
-- ==================================================================================
DO $$ 
BEGIN
    -- [EQUIPMENT]
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='serialNumber') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='serial_number') THEN ALTER TABLE public.equipment RENAME COLUMN "serialNumber" TO serial_number; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='brandId') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='brand_id') THEN ALTER TABLE public.equipment RENAME COLUMN "brandId" TO brand_id; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='typeId') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='type_id') THEN ALTER TABLE public.equipment RENAME COLUMN "typeId" TO type_id; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='purchaseDate') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='purchase_date') THEN ALTER TABLE public.equipment RENAME COLUMN "purchaseDate" TO purchase_date; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='isLoan') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='is_loan') THEN ALTER TABLE public.equipment RENAME COLUMN "isLoan" TO is_loan; END IF;

    -- [COLLABORATORS]
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborators' AND column_name='fullName') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborators' AND column_name='full_name') THEN ALTER TABLE public.collaborators RENAME COLUMN "fullName" TO full_name; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborators' AND column_name='numeroMecanografico') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborators' AND column_name='numero_mecanografico') THEN ALTER TABLE public.collaborators RENAME COLUMN "numeroMecanografico" TO numero_mecanografico; END IF;

    -- [ASSIGNMENTS]
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='equipmentId') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='equipment_id') THEN ALTER TABLE public.assignments RENAME COLUMN "equipmentId" TO equipment_id; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='collaboratorId') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='collaborator_id') THEN ALTER TABLE public.assignments RENAME COLUMN "collaboratorId" TO collaborator_id; END IF;

    -- INDEX REPAIR
    DROP INDEX IF EXISTS idx_unique_serial_operational;
    CREATE UNIQUE INDEX idx_unique_serial_operational ON public.equipment (serial_number) WHERE (status != 'Aquisição' AND serial_number IS NOT NULL AND serial_number != '' AND serial_number != 'Pendente');

END $$;`;

    const inspectScript = `-- ==================================================================================
-- SCRIPT DE INSPEÇÃO DE INTEGRIDADE (Dump Schema Info)
-- Execute este script e envie o resultado para o suporte IA.
-- ==================================================================================
SELECT 
    'COLUMNS' as type,
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_schema = 'public'
ORDER BY table_name, column_name;

SELECT 
    'FUNCTIONS' as type,
    routine_name as name,
    'N/A' as extra
FROM information_schema.routines 
WHERE routine_schema = 'public';

SELECT 
    'TRIGGERS' as type,
    trigger_name as name,
    event_object_table as table
FROM information_schema.triggers;`;

    return (
        <Modal title="Database Integrity Tools v31.0" onClose={onClose} maxWidth="max-w-4xl">
            <div className="space-y-4">
                <div className="flex border-b border-gray-700">
                    <button onClick={() => setActiveTab('migration')} className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'migration' ? 'border-brand-primary text-white' : 'border-transparent text-gray-500 hover:text-white'}`}>Migração de Schema</button>
                    <button onClick={() => setActiveTab('inspect')} className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'inspect' ? 'border-brand-primary text-white' : 'border-transparent text-gray-500 hover:text-white'}`}>Inspeção (Diagnóstico)</button>
                </div>

                {activeTab === 'migration' ? (
                    <>
                        <div className="bg-blue-900/20 border border-blue-500/50 p-4 rounded-lg text-sm text-blue-200">
                            <h3 className="font-bold flex items-center gap-2 mb-2"><FaDatabase className="text-blue-400" /> Conversor Global</h3>
                            <p>Resolve conflitos de nomenclatura entre camelCase e snake_case.</p>
                        </div>
                        <div className="relative bg-gray-900 border border-gray-700 rounded-lg h-[45vh]">
                            <button onClick={() => handleCopy(migrationScript, 'mig')} className="absolute top-2 right-2 z-10 px-3 py-1.5 bg-brand-primary text-white text-xs font-bold rounded shadow-lg">
                                {copied === 'mig' ? <FaCheck /> : <FaCopy />} Copiar Migração
                            </button>
                            <pre className="p-4 text-[10px] font-mono text-blue-400 overflow-auto h-full custom-scrollbar">{migrationScript}</pre>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="bg-amber-900/20 border border-amber-500/50 p-4 rounded-lg text-sm text-amber-200">
                            <h3 className="font-bold flex items-center gap-2 mb-2"><FaSearch className="text-amber-400" /> Schema Inspector</h3>
                            <p>Execute este script e partilhe o resultado para que eu possa mapear as funcionalidades exatamente como estão na sua BD.</p>
                        </div>
                        <div className="relative bg-gray-900 border border-gray-700 rounded-lg h-[45vh]">
                            <button onClick={() => handleCopy(inspectScript, 'ins')} className="absolute top-2 right-2 z-10 px-3 py-1.5 bg-amber-600 text-white text-xs font-bold rounded shadow-lg">
                                {copied === 'ins' ? <FaCheck /> : <FaCopy />} Copiar Inspeção
                            </button>
                            <pre className="p-4 text-[10px] font-mono text-amber-400 overflow-auto h-full custom-scrollbar">{inspectScript}</pre>
                        </div>
                    </>
                )}

                <div className="flex justify-end pt-2">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Fechar</button>
                </div>
            </div>
        </Modal>
    );
};

export default DatabaseSchemaModal;
