
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
-- SCRIPT DE REPARAÇÃO v13.0 (Esquema Explícito & Prioridade DDL)
-- ==================================================================================

-- 1. ASSEGURAR EXISTÊNCIA DAS TABELAS AUXILIARES (DEFINIÇÃO PRIMÁRIA)
CREATE TABLE IF NOT EXISTS public.config_ticket_statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    color TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.config_license_statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    color TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ASSEGURAR CAMPOS EM TABELAS EXISTENTES
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='collaborators' AND column_name='password_updated_at') THEN
        ALTER TABLE public.collaborators ADD COLUMN password_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='collaborators' AND column_name='admissionDate') THEN
        ALTER TABLE public.collaborators ADD COLUMN "admissionDate" DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='assignments' AND column_name='returnDate') THEN
        ALTER TABLE public.assignments ADD COLUMN "returnDate" DATE;
    END IF;
END $$;

-- 3. SEEDING DE DADOS (AGORA SEGURO POIS AS TABELAS JÁ EXISTEM)
INSERT INTO public.config_ticket_statuses (name, color)
VALUES 
    ('Pedido', '#3B82F6'),
    ('Em progresso', '#F59E0B'),
    ('Finalizado', '#10B981'),
    ('Cancelado', '#EF4444')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.config_license_statuses (name, color)
VALUES 
    ('Ativo', '#10B981'),
    ('Inativo', '#9CA3AF')
ON CONFLICT (name) DO NOTHING;

-- 4. GESTÃO DE POLÍTICAS (RLS)
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.equipment;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.software_licenses;
DROP POLICY IF EXISTS "RLS_Equipment_Isolation" ON public.equipment;
DROP POLICY IF EXISTS "RLS_License_Isolation" ON public.software_licenses;
DROP POLICY IF EXISTS "RLS_Ticket_Activities_Requester" ON public.ticket_activities;

ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "RLS_Equipment_Isolation" ON public.equipment 
FOR SELECT TO authenticated 
USING (
  (SELECT role FROM public.collaborators WHERE email = auth.jwt()->>'email') IN ('Admin', 'SuperAdmin', 'Técnico')
  OR 
  id IN (SELECT "equipmentId" FROM public.assignments WHERE "collaboratorId" = (SELECT id FROM public.collaborators WHERE email = auth.jwt()->>'email') AND "returnDate" IS NULL)
);

ALTER TABLE public.software_licenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "RLS_License_Isolation" ON public.software_licenses 
FOR SELECT TO authenticated 
USING (
  (SELECT role FROM public.collaborators WHERE email = auth.jwt()->>'email') IN ('Admin', 'SuperAdmin', 'Técnico')
  OR 
  id IN (SELECT "softwareLicenseId" FROM public.license_assignments WHERE "equipmentId" IN (
    SELECT "equipmentId" FROM public.assignments WHERE "collaboratorId" = (SELECT id FROM public.collaborators WHERE email = auth.jwt()->>'email') AND "returnDate" IS NULL
  ))
);

ALTER TABLE public.ticket_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "RLS_Ticket_Activities_Requester" ON public.ticket_activities
FOR SELECT TO authenticated
USING (
  (SELECT role FROM public.collaborators WHERE email = auth.jwt()->>'email') IN ('Admin', 'SuperAdmin', 'Técnico')
  OR
  "ticketId" IN (SELECT id FROM public.tickets WHERE "collaboratorId" = (SELECT id FROM public.collaborators WHERE email = auth.jwt()->>'email'))
);

-- 5. PERMISSÕES FINAIS
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
`;

    return (
        <Modal title="Configuração Avançada de Base de Dados" onClose={onClose} maxWidth="max-w-4xl">
            <div className="space-y-4">
                <div className="bg-blue-900/20 border border-blue-500/50 p-4 rounded-lg text-sm text-blue-200">
                    <h3 className="font-bold flex items-center gap-2 mb-2"><FaShieldAlt /> Definição & Seeding (v13.0)</h3>
                    <p>Este script utiliza referências explícitas ao esquema <strong>public</strong> e garante a criação das tabelas antes da inserção dos dados padrão, corrigindo o erro 42P01.</p>
                </div>

                <div className="relative bg-gray-900 border border-gray-700 rounded-lg overflow-hidden flex flex-col h-[50vh]">
                    <div className="absolute top-2 right-2 z-10">
                        <button onClick={() => handleCopy(repairScript, 'rep')} className="flex items-center gap-2 px-3 py-1.5 bg-brand-primary text-white text-xs font-bold rounded shadow-lg hover:bg-brand-secondary transition-all">
                            {copied === 'rep' ? <FaCheck /> : <FaCopy />} Copiar SQL v13.0
                        </button>
                    </div>
                    <pre className="p-4 text-xs font-mono text-green-400 overflow-auto custom-scrollbar">{repairScript}</pre>
                </div>
                <div className="flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-600 transition-colors">Fechar</button>
                </div>
            </div>
        </Modal>
    );
};

export default DatabaseSchemaModal;
