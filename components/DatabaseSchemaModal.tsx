import React, { useState } from 'react';
import Modal from './common/Modal';
import { FaCopy, FaCheck } from 'react-icons/fa';

interface DatabaseSchemaModalProps {
    onClose: () => void;
}

const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ onClose }) => {
    const [copied, setCopied] = useState(false);

    const sqlScript = `-- MIGRAÇÃO DE PERFIS ANTIGOS PARA A NOVA TABELA
-- Admin (Acesso Total)
INSERT INTO config_custom_roles (name, is_system, permissions) 
VALUES ('Admin', true, '{
    "inventory": {"view":true,"create":true,"edit":true,"delete":true},
    "equipment": {"view":true,"create":true,"edit":true,"delete":true},
    "licensing": {"view":true,"create":true,"edit":true,"delete":true},
    "tickets": {"view":true,"create":true,"edit":true,"delete":true},
    "organization": {"view":true,"create":true,"edit":true,"delete":true},
    "suppliers": {"view":true,"create":true,"edit":true,"delete":true},
    "compliance": {"view":true,"create":true,"edit":true,"delete":true},
    "reports": {"view":true,"create":true,"edit":true,"delete":true},
    "settings": {"view":true,"create":true,"edit":true,"delete":true},
    "brands": {"view":true,"create":true,"edit":true,"delete":true},
    "equipment_types": {"view":true,"create":true,"edit":true,"delete":true},
    "config_equipment_statuses": {"view":true,"create":true,"edit":true,"delete":true},
    "config_software_categories": {"view":true,"create":true,"edit":true,"delete":true},
    "ticket_categories": {"view":true,"create":true,"edit":true,"delete":true},
    "security_incident_types": {"view":true,"create":true,"edit":true,"delete":true},
    "contact_roles": {"view":true,"create":true,"edit":true,"delete":true},
    "contact_titles": {"view":true,"create":true,"edit":true,"delete":true},
    "config_custom_roles": {"view":true,"create":true,"edit":true,"delete":true},
    "config_automation": {"view":true,"create":true,"edit":true,"delete":true},
    "config_criticality_levels": {"view":true,"create":true,"edit":true,"delete":true},
    "config_cia_ratings": {"view":true,"create":true,"edit":true,"delete":true},
    "config_service_statuses": {"view":true,"create":true,"edit":true,"delete":true},
    "config_backup_types": {"view":true,"create":true,"edit":true,"delete":true},
    "config_training_types": {"view":true,"create":true,"edit":true,"delete":true},
    "config_resilience_test_types": {"view":true,"create":true,"edit":true,"delete":true}
}')
ON CONFLICT (name) DO NOTHING;

-- Técnico (Pode gerir tickets e inventário, mas não configurações ou apagar organização)
INSERT INTO config_custom_roles (name, is_system, permissions) 
VALUES ('Técnico', false, '{
    "inventory": {"view":true,"create":true,"edit":true,"delete":false},
    "equipment": {"view":true,"create":true,"edit":true,"delete":false},
    "licensing": {"view":true,"create":true,"edit":true,"delete":false},
    "tickets": {"view":true,"create":true,"edit":true,"delete":false},
    "organization": {"view":true,"create":false,"edit":false,"delete":false},
    "suppliers": {"view":true,"create":true,"edit":true,"delete":false},
    "compliance": {"view":true,"create":true,"edit":true,"delete":false},
    "reports": {"view":true,"create":true,"edit":true,"delete":false},
    "settings": {"view":false,"create":false,"edit":false,"delete":false}
}')
ON CONFLICT (name) DO NOTHING;

-- Utilizador (Apenas ver e abrir tickets)
INSERT INTO config_custom_roles (name, is_system, permissions) 
VALUES ('Utilizador', false, '{
    "inventory": {"view":true,"create":false,"edit":false,"delete":false},
    "equipment": {"view":true,"create":false,"edit":false,"delete":false},
    "licensing": {"view":false,"create":false,"edit":false,"delete":false},
    "tickets": {"view":true,"create":true,"edit":false,"delete":false},
    "organization": {"view":false,"create":false,"edit":false,"delete":false},
    "settings": {"view":false,"create":false,"edit":false,"delete":false}
}')
ON CONFLICT (name) DO NOTHING;`;

    const handleCopy = () => {
        navigator.clipboard.writeText(sqlScript);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Modal title="Configuração da Base de Dados (SQL)" onClose={onClose} maxWidth="max-w-4xl">
            <div className="space-y-4">
                <div className="bg-blue-900/20 border border-blue-900/50 p-4 rounded-lg text-sm text-blue-200">
                    <p>Execute o seguinte script no <strong>SQL Editor</strong> do Supabase para criar as tabelas de perfis e permissões necessárias para o RBAC.</p>
                </div>
                
                <div className="relative">
                    <pre className="bg-gray-900 p-4 rounded-lg text-xs font-mono text-green-400 border border-gray-700 overflow-auto max-h-96 custom-scrollbar whitespace-pre-wrap">
                        {sqlScript}
                    </pre>
                    <button 
                        onClick={handleCopy} 
                        className="absolute top-4 right-4 p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md shadow transition-colors"
                        title="Copiar SQL"
                    >
                        {copied ? <FaCheck className="text-green-400" /> : <FaCopy />}
                    </button>
                </div>

                <div className="flex justify-end pt-2">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">
                        Fechar
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default DatabaseSchemaModal;