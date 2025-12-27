import React from 'react';
import { 
    FaHeartbeat, FaTags, FaShapes, FaList, FaShieldAlt, FaTicketAlt, FaServer, 
    FaPalette, FaRobot, FaKey, FaNetworkWired, FaClock, FaBroom, FaCompactDisc, 
    FaLandmark, FaUserTie, FaBolt, FaUsers, FaUserTag, FaMicrochip, FaMemory, FaHdd,
    FaBoxOpen, FaUserSlash, FaLeaf, FaCalendarAlt, FaBrain
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
                { id: 'ai_context', label: 'Contexto IA (MCP)', icon: <FaBrain className="text-purple-400" /> },
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
            group: "Ativos (Inventário)",
            items: [
                { id: 'brands', label: 'Marcas / Fabricantes', icon: <FaTags /> },
                { id: 'equipment_types', label: 'Tipos de Equipamento', icon: <FaShapes /> },
                { id: 'config_equipment_statuses', label: 'Estados de Ativo', icon: <FaList /> },
                { id: 'config_decommission_reasons', label: 'Motivos de Abate', icon: <FaBroom /> },
                { id: 'config_accounting_categories', label: 'Classificador CIBE', icon: <FaLandmark /> },
                { id: 'config_conservation_states', label: 'Estados Conservação', icon: <FaLeaf /> },
                { id: 'config_cpus', label: 'Tipos de CPU', icon: <FaMicrochip /> },
                { id: 'config_ram_sizes', label: 'Tamanhos RAM', icon: <FaMemory /> },
                { id: 'config_storage_types', label: 'Tipos de Disco', icon: <FaHdd /> },
                { id: 'config_software_categories', label: 'Categorias de Software', icon: <FaTags /> },
                { id: 'config_software_products', label: 'Catálogo Software', icon: <FaCompactDisc /> },
            ]
        },
        {
            group: "Suporte (Ticketing)",
            items: [
                { id: 'ticket_categories', label: 'Categorias Tickets', icon: <FaTicketAlt /> },
                { id: 'security_incident_types', label: 'Tipos Incid. NIS2', icon: <FaShieldAlt /> },
                { id: 'config_ticket_statuses', label: 'Estados de Tickets', icon: <FaList /> },
                { id: 'config_license_statuses', label: 'Estados Licenças', icon: <FaKey /> },
            ]
        },
        {
            group: "Pessoas & RH",
            items: [
                { id: 'config_job_titles', label: 'Cargos / Funções', icon: <FaUserTie /> },
                { id: 'config_collaborator_deactivation_reasons', label: 'Motivos de Saída', icon: <FaUserSlash /> },
                { id: 'holidays', label: 'Feriados & Ausências', icon: <FaCalendarAlt /> }, 
                { id: 'config_holiday_types', label: 'Tipos de Ausência', icon: <FaTags /> },
                { id: 'contact_roles', label: 'Papéis Contacto', icon: <FaUserTag /> },
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