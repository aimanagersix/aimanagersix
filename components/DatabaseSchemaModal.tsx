
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
-- SCRIPT DE MIGRAÇÃO IDEMPOTENTE v29.0
-- Finalidade: Migração Global de camelCase para snake_case com proteção de conflito.
-- ==================================================================================

DO $$ 
BEGIN
    -- 1. MIGRAÇÃO DA TABELA: equipment
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='serialNumber') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='serial_number') THEN ALTER TABLE public.equipment RENAME COLUMN "serialNumber" TO serial_number; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='brandId') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='brand_id') THEN ALTER TABLE public.equipment RENAME COLUMN "brandId" TO brand_id; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='typeId') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='type_id') THEN ALTER TABLE public.equipment RENAME COLUMN "typeId" TO type_id; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='inventoryNumber') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='inventory_number') THEN ALTER TABLE public.equipment RENAME COLUMN "inventoryNumber" TO inventory_number; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='purchaseDate') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='purchase_date') THEN ALTER TABLE public.equipment RENAME COLUMN "purchaseDate" TO purchase_date; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='warrantyEndDate') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='warranty_end_date') THEN ALTER TABLE public.equipment RENAME COLUMN "warrantyEndDate" TO warranty_end_date; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='invoiceNumber') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='invoice_number') THEN ALTER TABLE public.equipment RENAME COLUMN "invoiceNumber" TO invoice_number; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='requisitionNumber') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='requisition_number') THEN ALTER TABLE public.equipment RENAME COLUMN "requisitionNumber" TO requisition_number; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='acquisitionCost') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='acquisition_cost') THEN ALTER TABLE public.equipment RENAME COLUMN "acquisitionCost" TO acquisition_cost; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='nomeNaRede') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='nome_na_rede') THEN ALTER TABLE public.equipment RENAME COLUMN "nomeNaRede" TO nome_na_rede; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='macAddressWIFI') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='mac_address_wifi') THEN ALTER TABLE public.equipment RENAME COLUMN "macAddressWIFI" TO mac_address_wifi; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='macAddressCabo') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='mac_address_cabo') THEN ALTER TABLE public.equipment RENAME COLUMN "macAddressCabo" TO mac_address_cabo; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='lastSecurityUpdate') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='last_security_update') THEN ALTER TABLE public.equipment RENAME COLUMN "lastSecurityUpdate" TO last_security_update; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='embeddedLicenseKey') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='embedded_license_key') THEN ALTER TABLE public.equipment RENAME COLUMN "embeddedLicenseKey" TO embedded_license_key; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='isLoan') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='is_loan') THEN ALTER TABLE public.equipment RENAME COLUMN "isLoan" TO is_loan; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='parentEquipmentId') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='parent_equipment_id') THEN ALTER TABLE public.equipment RENAME COLUMN "parentEquipmentId" TO parent_equipment_id; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='procurementRequestId') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='procurement_request_id') THEN ALTER TABLE public.equipment RENAME COLUMN "procurementRequestId" TO procurement_request_id; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='accountingCategoryId') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='accounting_category_id') THEN ALTER TABLE public.equipment RENAME COLUMN "accountingCategoryId" TO accounting_category_id; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='conservationStateId') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='conservation_state_id') THEN ALTER TABLE public.equipment RENAME COLUMN "conservationStateId" TO conservation_state_id; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='decommissionReasonId') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='decommission_reason_id') THEN ALTER TABLE public.equipment RENAME COLUMN "decommissionReasonId" TO decommission_reason_id; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='residualValue') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='residual_value') THEN ALTER TABLE public.equipment RENAME COLUMN "residualValue" TO residual_value; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='lastInventoryScan') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='last_inventory_scan') THEN ALTER TABLE public.equipment RENAME COLUMN "lastInventoryScan" TO last_inventory_scan; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='creationDate') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='creation_date') THEN ALTER TABLE public.equipment RENAME COLUMN "creationDate" TO creation_date; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='modifiedDate') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipment' AND column_name='modified_date') THEN ALTER TABLE public.equipment RENAME COLUMN "modifiedDate" TO modified_date; END IF;

    -- 2. MIGRAÇÃO DA TABELA: collaborators
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborators' AND column_name='fullName') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborators' AND column_name='full_name') THEN ALTER TABLE public.collaborators RENAME COLUMN "fullName" TO full_name; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborators' AND column_name='numeroMecanografico') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborators' AND column_name='numero_mecanografico') THEN ALTER TABLE public.collaborators RENAME COLUMN "numeroMecanografico" TO numero_mecanografico; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborators' AND column_name='canLogin') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborators' AND column_name='can_login') THEN ALTER TABLE public.collaborators RENAME COLUMN "canLogin" TO can_login; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborators' AND column_name='receivesNotifications') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborators' AND column_name='receives_notifications') THEN ALTER TABLE public.collaborators RENAME COLUMN "receivesNotifications" TO receives_notifications; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborators' AND column_name='entidadeId') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborators' AND column_name='entidade_id') THEN ALTER TABLE public.collaborators RENAME COLUMN "entidadeId" TO entidade_id; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborators' AND column_name='instituicaoId') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborators' AND column_name='instituicao_id') THEN ALTER TABLE public.collaborators RENAME COLUMN "instituicaoId" TO instituicao_id; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborators' AND column_name='jobTitleId') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborators' AND column_name='job_title_id') THEN ALTER TABLE public.collaborators RENAME COLUMN "jobTitleId" TO job_title_id; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborators' AND column_name='telefoneInterno') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborators' AND column_name='telefone_interno') THEN ALTER TABLE public.collaborators RENAME COLUMN "telefoneInterno" TO telefone_interno; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborators' AND column_name='addressLine') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborators' AND column_name='address_line') THEN ALTER TABLE public.collaborators RENAME COLUMN "addressLine" TO address_line; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborators' AND column_name='postalCode') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborators' AND column_name='postal_code') THEN ALTER TABLE public.collaborators RENAME COLUMN "postalCode" TO postal_code; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborators' AND column_name='dateOfBirth') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborators' AND column_name='date_of_birth') THEN ALTER TABLE public.collaborators RENAME COLUMN "dateOfBirth" TO date_of_birth; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborators' AND column_name='admissionDate') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborators' AND column_name='admission_date') THEN ALTER TABLE public.collaborators RENAME COLUMN "admissionDate" TO admission_date; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborators' AND column_name='photoUrl') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborators' AND column_name='photo_url') THEN ALTER TABLE public.collaborators RENAME COLUMN "photoUrl" TO photo_url; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborators' AND column_name='passwordUpdatedAt') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborators' AND column_name='password_updated_at') THEN ALTER TABLE public.collaborators RENAME COLUMN "passwordUpdatedAt" TO password_updated_at; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborators' AND column_name='deactivationReasonId') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collaborators' AND column_name='deactivation_reason_id') THEN ALTER TABLE public.collaborators RENAME COLUMN "deactivationReasonId" TO deactivation_reason_id; END IF;

    -- 3. MIGRAÇÃO DA TABELA: assignments
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='equipmentId') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='equipment_id') THEN ALTER TABLE public.assignments RENAME COLUMN "equipmentId" TO equipment_id; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='collaboratorId') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='collaborator_id') THEN ALTER TABLE public.assignments RENAME COLUMN "collaboratorId" TO collaborator_id; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='entidadeId') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='entidade_id') THEN ALTER TABLE public.assignments RENAME COLUMN "entidadeId" TO entidade_id; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='instituicaoId') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='instituicao_id') THEN ALTER TABLE public.assignments RENAME COLUMN "instituicaoId" TO instituicao_id; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='assignedDate') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='assigned_date') THEN ALTER TABLE public.assignments RENAME COLUMN "assignedDate" TO assigned_date; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='returnDate') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assignments' AND column_name='return_date') THEN ALTER TABLE public.assignments RENAME COLUMN "returnDate" TO return_date; END IF;

    -- 4. MIGRAÇÃO DA TABELA: software_licenses
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='software_licenses' AND column_name='productName') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='software_licenses' AND column_name='product_name') THEN ALTER TABLE public.software_licenses RENAME COLUMN "productName" TO product_name; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='software_licenses' AND column_name='licenseKey') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='software_licenses' AND column_name='license_key') THEN ALTER TABLE public.software_licenses RENAME COLUMN "licenseKey" TO license_key; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='software_licenses' AND column_name='totalSeats') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='software_licenses' AND column_name='total_seats') THEN ALTER TABLE public.software_licenses RENAME COLUMN "totalSeats" TO total_seats; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='software_licenses' AND column_name='purchaseDate') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='software_licenses' AND column_name='purchase_date') THEN ALTER TABLE public.software_licenses RENAME COLUMN "purchaseDate" TO purchase_date; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='software_licenses' AND column_name='expiryDate') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='software_licenses' AND column_name='expiry_date') THEN ALTER TABLE public.software_licenses RENAME COLUMN "expiryDate" TO expiry_date; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='software_licenses' AND column_name='purchaseEmail') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='software_licenses' AND column_name='purchase_email') THEN ALTER TABLE public.software_licenses RENAME COLUMN "purchaseEmail" TO purchase_email; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='software_licenses' AND column_name='invoiceNumber') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='software_licenses' AND column_name='invoice_number') THEN ALTER TABLE public.software_licenses RENAME COLUMN "invoiceNumber" TO invoice_number; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='software_licenses' AND column_name='unitCost') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='software_licenses' AND column_name='unit_cost') THEN ALTER TABLE public.software_licenses RENAME COLUMN "unitCost" TO unit_cost; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='software_licenses' AND column_name='isOem') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='software_licenses' AND column_name='is_oem') THEN ALTER TABLE public.software_licenses RENAME COLUMN "isOem" TO is_oem; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='software_licenses' AND column_name='categoryId') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='software_licenses' AND column_name='category_id') THEN ALTER TABLE public.software_licenses RENAME COLUMN "categoryId" TO category_id; END IF;

    -- 5. REPARAÇÃO DE ÍNDICE ÚNICO CONDICIONAL
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
        <Modal title="Database Migration Tool v29.0" onClose={onClose} maxWidth="max-w-4xl">
            <div className="space-y-4">
                <div className="bg-blue-900/20 border border-blue-500/50 p-4 rounded-lg text-sm text-blue-200">
                    <h3 className="font-bold flex items-center gap-2 mb-2"><FaDatabase className="text-blue-400" /> Conversor Global de Schema (Idempotente)</h3>
                    <p>Este script resolve o erro de colunas já existentes verificando se o destino já foi criado antes de tentar renomear. Pode ser executado múltiplas vezes sem erros.</p>
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
