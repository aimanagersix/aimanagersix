import React from 'react';
import { 
    FaHeartbeat, FaTags, FaShapes, FaList, FaShieldAlt, FaTicketAlt, FaServer, 
    FaPalette, FaRobot, FaKey, FaNetworkWired, FaClock,
    // Added missing FaMicrochip, FaMemory, FaHdd imports
    FaBroom, FaCompactDisc, FaLandmark, FaUserTie, FaBolt, FaUsers, FaUserTag, FaMicrochip, FaMemory, FaHdd
} from 'react-icons/fa';

interface SettingsSidebarProps {
    selectedMenuId: string;
    onSelect: (id: string) => void;
}

const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ selectedMenuId, onSelect }) => {
    const menuStructure = [
        {
            group: "Sistema & Automação",
            items: [
                { id: 'general', label: 'Geral & Scans', icon: <FaRobot /> },
                { id: 'config_automation', label: 'Regras de Automação', icon: <FaBolt /> },
                { id: 'connections', label: 'Conexões & APIs', icon: <FaKey /> },
                { id: 'agents', label: 'Agentes (PowerShell)', icon: <FaRobot /> },
                { id: 'webhooks', label: 'Webhooks (SIEM)', icon: <FaNetworkWired /> },
                { id: 'cronjobs', label: 'Tarefas Agendadas', icon: <FaClock /> },
                { id: 'branding', label: 'Branding', icon: <FaPalette /> },
                { id: 'diagnostics', label: 'Diagnóstico', icon: <FaHeartbeat /> },
            ]
        },
        {
            group: "Segurança & Acessos",
            items: [
                { id: 'roles', label: 'Perfis de Acesso (RBAC)', icon: <FaShieldAlt /> },
                { id: 'teams', label: 'Equipas de Suporte', icon: <FaUsers /> },
            ]
        },
        {
            group: "Tabelas Auxiliares",
            items: [
                { id: 'brands', label: 'Marcas', icon: <FaTags /> },
                { id: 'equipment_types', label: 'Tipos de Equipamento', icon: <FaShapes /> },
                { id: 'config_equipment_statuses', label: 'Estados Ativos', icon: <FaList /> },
                { id: 'config_ticket_statuses', label: 'Estados de Tickets', icon: <FaTicketAlt /> },
                { id: 'config_license_statuses', label: 'Estados de Licenças', icon: <FaKey /> },
                { id: 'config_decommission_reasons', label: 'Motivos de Abate', icon: <FaBroom /> },
                { id: 'ticket_categories', label: 'Categorias de Tickets', icon: <FaTicketAlt /> },
                { id: 'security_incident_types', label: 'Tipos de Incidente', icon: <FaShieldAlt /> },
                { id: 'config_job_titles', label: 'Cargos / Funções', icon: <FaUserTie /> },
                { id: 'config_software_products', label: 'Produtos Software', icon: <FaCompactDisc /> },
                { id: 'config_accounting_categories', label: 'Classificador CIBE', icon: <FaLandmark /> },
                { id: 'config_cpus', label: 'CPUs', icon: <FaMicrochip /> },
                { id: 'config_ram_sizes', label: 'RAM', icon: <FaMemory /> },
                { id: 'config_storage_types', label: 'Discos', icon: <FaHdd /> },
                { id: 'contact_roles', label: 'Papéis de Contacto', icon: <FaUserTag /> },
                { id: 'contact_titles', label: 'Tratos / Títulos', icon: <FaUserTag /> },
            ]
        }
    ];

    return (
        <div className="flex-grow overflow-y-auto custom-scrollbar p-2">
            {menuStructure.map((group, gIdx) => (
                <div key={gIdx} className="mb-6">
                    <h3 className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">{group.group}</h3>
                    <div className="space-y-0.5">
                        {group.items.map(item => (
                            <button
                                key={item.id}
                                onClick={() => onSelect(item.id)}
                                className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-3 transition-colors ${selectedMenuId === item.id ? 'bg-brand-primary text-white font-bold' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                            >
                                <span className="text-base">{item.icon}</span>
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SettingsSidebar;