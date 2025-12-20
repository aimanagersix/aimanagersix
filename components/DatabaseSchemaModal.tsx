
import React, { useState } from 'react';
import Modal from './common/Modal';
import { FaDatabase, FaCheck, FaCopy, FaShieldAlt, FaStar, FaExclamationTriangle } from 'react-icons/fa';

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

    const migrationScript = `-- ==================================================================================
-- SCRIPT DE MIGRAÇÃO ABSOLUTE INTEGRITY v28.0
-- Finalidade: Migração Global de camelCase para snake_case e Reparação de Índices.
-- ==================================================================================

DO $$ 
BEGIN
    -- 1. MIGRAÇÃO DA TABELA: equipment
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='serialNumber') THEN ALTER TABLE public.equipment RENAME COLUMN "serialNumber" TO serial_number; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='brandId') THEN ALTER TABLE public.equipment RENAME COLUMN "brandId" TO brand_id; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='typeId') THEN ALTER TABLE public.equipment RENAME COLUMN "typeId" TO type_id; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='inventoryNumber') THEN ALTER TABLE public.equipment RENAME COLUMN "inventoryNumber" TO inventory_number; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='purchaseDate') THEN ALTER TABLE public.equipment RENAME COLUMN "purchaseDate" TO purchase_date; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='warrantyEndDate') THEN ALTER TABLE public.equipment RENAME COLUMN "warrantyEndDate" TO warranty_end_date; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='invoiceNumber') THEN ALTER TABLE public.equipment RENAME COLUMN "invoiceNumber" TO invoice_number; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='requisitionNumber') THEN ALTER TABLE public.equipment RENAME COLUMN "requisitionNumber" TO requisition_number; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='acquisitionCost') THEN ALTER TABLE public.equipment RENAME COLUMN "acquisitionCost" TO acquisition_cost; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='nomeNaRede') THEN ALTER TABLE public.equipment RENAME COLUMN "nomeNaRede" TO nome_na_rede; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='macAddressWIFI') THEN ALTER TABLE public.equipment RENAME COLUMN "macAddressWIFI" TO mac_address_wifi; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='macAddressCabo') THEN ALTER TABLE public.equipment RENAME COLUMN "macAddressCabo" TO mac_address_cabo; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='lastSecurityUpdate') THEN ALTER TABLE public.equipment RENAME COLUMN "lastSecurityUpdate" TO last_security_update; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='embeddedLicenseKey') THEN ALTER TABLE public.equipment RENAME COLUMN "embeddedLicenseKey" TO embedded_license_key; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='isLoan') THEN ALTER TABLE public.equipment RENAME COLUMN "isLoan" TO is_loan; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='parentEquipmentId') THEN ALTER TABLE public.equipment RENAME COLUMN "parentEquipmentId" TO parent_equipment_id; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='procurementRequestId') THEN ALTER TABLE public.equipment RENAME COLUMN "procurementRequestId" TO procurement_request_id; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='accountingCategoryId') THEN ALTER TABLE public.equipment RENAME COLUMN "accountingCategoryId" TO accounting_category_id; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='conservationStateId') THEN ALTER TABLE public.equipment RENAME COLUMN "conservationStateId" TO conservation_state_id; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='decommissionReasonId') THEN ALTER TABLE public.equipment RENAME COLUMN "decommissionReasonId" TO decommission_reason_id; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='residualValue') THEN ALTER TABLE public.equipment RENAME COLUMN "residualValue" TO residual_value; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='lastInventoryScan') THEN ALTER TABLE public.equipment RENAME COLUMN "lastInventoryScan" TO last_inventory_scan; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='creationDate') THEN ALTER TABLE public.equipment RENAME COLUMN "creationDate" TO creation_date; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='modifiedDate') THEN ALTER TABLE public.equipment RENAME COLUMN "modifiedDate" TO modified_date; END IF;

    -- 2. MIGRAÇÃO DA TABELA: collaborators
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborators' AND column_name='fullName') THEN ALTER TABLE public.collaborators RENAME COLUMN "fullName" TO full_name; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborators' AND column_name='numeroMecanografico') THEN ALTER TABLE public.collaborators RENAME COLUMN "numeroMecanografico" TO numero_mecanografico; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborators' AND column_name='canLogin') THEN ALTER TABLE public.collaborators RENAME COLUMN "canLogin" TO can_login; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborators' AND column_name='receivesNotifications') THEN ALTER TABLE public.collaborators RENAME COLUMN "receivesNotifications" TO receives_notifications; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborators' AND column_name='entidadeId') THEN ALTER TABLE public.collaborators RENAME COLUMN "entidadeId" TO entidade_id; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborators' AND column_name='instituicaoId') THEN ALTER TABLE public.collaborators RENAME COLUMN "instituicaoId" TO instituicao_id; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborators' AND column_name='jobTitleId') THEN ALTER TABLE public.collaborators RENAME COLUMN "jobTitleId" TO job_title_id; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborators' AND column_name='telefoneInterno') THEN ALTER TABLE public.collaborators RENAME COLUMN "telefoneInterno" TO telefone_interno; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborators' AND column_name='addressLine') THEN ALTER TABLE public.collaborators RENAME COLUMN "addressLine" TO address_line; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborators' AND column_name='postalCode') THEN ALTER TABLE public.collaborators RENAME COLUMN "postalCode" TO postal_code; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborators' AND column_name='dateOfBirth') THEN ALTER TABLE public.collaborators RENAME COLUMN "dateOfBirth" TO date_of_birth; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborators' AND column_name='admissionDate') THEN ALTER TABLE public.collaborators RENAME COLUMN "admissionDate" TO admission_date; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborators' AND column_name='photoUrl') THEN ALTER TABLE public.collaborators RENAME COLUMN "photoUrl" TO photo_url; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborators' AND column_name='passwordUpdatedAt') THEN ALTER TABLE public.collaborators RENAME COLUMN "passwordUpdatedAt" TO password_updated_at; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborators' AND column_name='deactivationReasonId') THEN ALTER TABLE public.collaborators RENAME COLUMN "deactivationReasonId" TO deactivation_reason_id; END IF;

    -- 3. MIGRAÇÃO DA TABELA: assignments
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='equipmentId') THEN ALTER TABLE public.assignments RENAME COLUMN "equipmentId" TO equipment_id; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='collaboratorId') THEN ALTER TABLE public.assignments RENAME COLUMN "collaboratorId" TO collaborator_id; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='entidadeId') THEN ALTER TABLE public.assignments RENAME COLUMN "entidadeId" TO entidade_id; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='instituicaoId') THEN ALTER TABLE public.assignments RENAME COLUMN "instituicaoId" TO instituicao_id; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='assignedDate') THEN ALTER TABLE public.assignments RENAME COLUMN "assignedDate" TO assigned_date; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='returnDate') THEN ALTER TABLE public.assignments RENAME COLUMN "returnDate" TO return_date; END IF;

    -- 4. MIGRAÇÃO DA TABELA: software_licenses
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='software_licenses' AND column_name='productName') THEN ALTER TABLE public.software_licenses RENAME COLUMN "productName" TO product_name; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='software_licenses' AND column_name='licenseKey') THEN ALTER TABLE public.software_licenses RENAME COLUMN "licenseKey" TO license_key; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='software_licenses' AND column_name='totalSeats') THEN ALTER TABLE public.software_licenses RENAME COLUMN "totalSeats" TO total_seats; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='software_licenses' AND column_name='purchaseDate') THEN ALTER TABLE public.software_licenses RENAME COLUMN "purchaseDate" TO purchase_date; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='software_licenses' AND column_name='expiryDate') THEN ALTER TABLE public.software_licenses RENAME COLUMN "expiryDate" TO expiry_date; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='software_licenses' AND column_name='purchaseEmail') THEN ALTER TABLE public.software_licenses RENAME COLUMN "purchaseEmail" TO purchase_email; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='software_licenses' AND column_name='invoiceNumber') THEN ALTER TABLE public.software_licenses RENAME COLUMN "invoiceNumber" TO invoice_number; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='software_licenses' AND column_name='unitCost') THEN ALTER TABLE public.software_licenses RENAME COLUMN "unitCost" TO unit_cost; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='software_licenses' AND column_name='isOem') THEN ALTER TABLE public.software_licenses RENAME COLUMN "isOem" TO is_oem; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='software_licenses' AND column_name='categoryId') THEN ALTER TABLE public.software_licenses RENAME COLUMN "categoryId" TO category_id; END IF;

    -- 5. REPARAÇÃO DE ÍNDICE ÚNICO CONDICIONAL (AGORA COM NOMES CORRETOS)
    DROP INDEX IF EXISTS idx_unique_serial_operational;
    CREATE UNIQUE INDEX idx_unique_serial_operational ON public.equipment (serial_number) 
    WHERE (
        status != 'Aquisição' 
        AND serial_number IS NOT NULL 
        AND serial_number != '' 
        AND serial_number != 'Pendente'
    );

    -- 6. PERMISSÕES GLOBAIS
    GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
    GRANT USAGE ON SCHEMA public TO authenticated;

END $$;
`;

    return (
        <Modal title="Database Migration Tool v28.0" onClose={onClose} maxWidth="max-w-4xl">
            <div className="space-y-4">
                <div className="bg-blue-900/20 border border-blue-500/50 p-4 rounded-lg text-sm text-blue-200">
                    <h3 className="font-bold flex items-center gap-2 mb-2"><FaDatabase className="text-blue-400" /> Conversor Global de Schema</h3>
                    <p>Este script resolve o erro de colunas inexistentes convertendo automaticamente o nome das colunas de <strong>camelCase</strong> (ex: serialNumber) para <strong>snake_case</strong> (ex: serial_number).</p>
                    <div className="mt-3 p-2 bg-black/30 rounded flex items-center gap-2 text-xs">
                        <FaExclamationTriangle className="text-amber-500" />
                        <span>Execute este script no SQL Editor do Supabase para sincronizar a BD com a nova versão da App.</span>
                    </div>
                </div>

                <div className="relative bg-gray-900 border border-gray-700 rounded-lg overflow-hidden flex flex-col h-[55vh]">
                    <div className="absolute top-2 right-2 z-10">
                        <button onClick={() => handleCopy(migrationScript, 'mig')} className="flex items-center gap-2 px-3 py-1.5 bg-brand-primary text-white text-xs font-bold rounded shadow-lg hover:bg-brand-secondary transition-all">
                            {copied === 'mig' ? <FaCheck /> : <FaCopy />} Copiar Script de Migração
                        </button>
                    </div>
                    <pre className="p-4 text-[10px] font-mono text-blue-400 overflow-auto custom-scrollbar">{migrationScript}</pre>
                </div>

                <div className="flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Fechar</button>
                </div>
            </div>
        </Modal>
    );
};

export default DatabaseSchemaModal;
