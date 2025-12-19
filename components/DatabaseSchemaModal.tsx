
import React, { useState } from 'react';
import Modal from './common/Modal';
import { FaDatabase, FaCheck, FaCopy, FaBolt, FaShieldAlt } from 'react-icons/fa';

interface DatabaseSchemaModalProps {
    onClose: () => void;
}

const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ onClose }) => {
    const [copied, setCopied] = useState<string | null>(null);
    
    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const repairScript = `-- ==================================================================================
-- SCRIPT DE REPARAÇÃO v9.0 (Passwords & Isolação NIS2)
-- ==================================================================================

-- 1. ADICIONAR CAMPOS DE SEGURANÇA SE NÃO EXISTIREM
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborators' AND column_name='password_updated_at') THEN
        ALTER TABLE "collaborators" ADD COLUMN "password_updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='returnDate') THEN
        ALTER TABLE "assignments" ADD COLUMN "returnDate" DATE;
    END IF;
END $$;

-- 2. LIMPAR POLÍTICAS ANTIGAS (EVITAR CONFLITOS)
DROP POLICY IF EXISTS "Enable all for authenticated users" ON "equipment";
DROP POLICY IF EXISTS "Enable all for authenticated users" ON "software_licenses";

-- 3. ISOLAÇÃO DE DADOS RIGOROSA (RLS)
-- Nota: Admin vê tudo, Utilizador vê apenas o que lhe está atribuído

-- EQUIPAMENTOS
ALTER TABLE "equipment" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "RLS_Equipment_Isolation" ON "equipment" 
FOR SELECT TO authenticated 
USING (
  (SELECT role FROM collaborators WHERE email = auth.jwt()->>'email') IN ('Admin', 'SuperAdmin', 'Técnico')
  OR 
  id IN (SELECT "equipmentId" FROM assignments WHERE "collaboratorId" = (SELECT id FROM collaborators WHERE email = auth.jwt()->>'email') AND "returnDate" IS NULL)
);

-- LICENÇAS
ALTER TABLE "software_licenses" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "RLS_License_Isolation" ON "software_licenses" 
FOR SELECT TO authenticated 
USING (
  (SELECT role FROM collaborators WHERE email = auth.jwt()->>'email') IN ('Admin', 'SuperAdmin', 'Técnico')
  OR 
  id IN (SELECT "softwareLicenseId" FROM license_assignments WHERE "equipmentId" IN (
    SELECT "equipmentId" FROM assignments WHERE "collaboratorId" = (SELECT id FROM collaborators WHERE email = auth.jwt()->>'email') AND "returnDate" IS NULL
  ))
);

-- 4. GRANT TOTAL PARA ADMINS
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
`;

    return (
        <Modal title="Configuração Avançada de Base de Dados" onClose={onClose} maxWidth="max-w-4xl">
            <div className="space-y-4">
                <div className="bg-blue-900/20 border border-blue-500/50 p-4 rounded-lg text-sm text-blue-200">
                    <h3 className="font-bold flex items-center gap-2 mb-2"><FaShieldAlt /> Isolação de Dados NIS2 (v9.0)</h3>
                    <p>Este script configura o PostgreSQL para que utilizadores sem perfil Admin <strong>nunca</strong> consigam ler equipamentos ou licenças que não lhes pertençam, mesmo que tentem contornar a UI.</p>
                </div>

                <div className="relative bg-gray-900 border border-gray-700 rounded-lg overflow-hidden flex flex-col h-[50vh]">
                    <div className="absolute top-2 right-2 z-10">
                        <button onClick={() => handleCopy(repairScript, 'rep')} className="flex items-center gap-2 px-3 py-1.5 bg-brand-primary text-white text-xs font-bold rounded shadow-lg">
                            {copied === 'rep' ? <FaCheck /> : <FaCopy />} Copiar SQL v9.0
                        </button>
                    </div>
                    <pre className="p-4 text-xs font-mono text-green-400 overflow-auto custom-scrollbar">{repairScript}</pre>
                </div>
                <div className="flex justify-end"><button onClick={onClose} className="px-6 py-2 bg-gray-600 text-white rounded">Fechar</button></div>
            </div>
        </Modal>
    );
};

export default DatabaseSchemaModal;
