
import React, { useState } from 'react';
import Modal from './common/Modal';
import { FaBook, FaChartBar, FaSitemap, FaBoxOpen, FaTicketAlt, FaShieldAlt, FaUsers, FaCalendarAlt, FaRobot, FaSearch, FaCheckCircle, FaExclamationTriangle, FaCamera, FaDownload, FaPrint } from 'react-icons/fa';

interface UserManualModalProps {
    onClose: () => void;
}

// Component to act as a placeholder for screenshots
const ScreenshotPlaceholder: React.FC<{ text: string }> = ({ text }) => (
    <div className="w-full h-48 bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center mb-4 text-gray-500">
        <FaCamera className="h-8 w-8 mb-2" />
        <span className="text-sm font-medium uppercase">{text}</span>
        <span className="text-xs italic">(Inserir Print Aqui)</span>
    </div>
);

const UserManualModal: React.FC<UserManualModalProps> = ({ onClose }) => {
    const [activeSection, setActiveSection] = useState('intro');

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const content = document.getElementById('manual-content')?.innerHTML;
        
        printWindow.document.write(`
            <html>
            <head>
                <title>Manual de Utilizador - AIManager</title>
                <style>
                    body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; }
                    h3 { color: #0D47A1; border-bottom: 2px solid #0D47A1; padding-bottom: 10px; margin-top: 30px; }
                    h4 { color: #333; margin-top: 20px; font-size: 16px; font-weight: bold; }
                    p { line-height: 1.6; font-size: 14px; margin-bottom: 10px; }
                    ul { margin-bottom: 20px; }
                    li { margin-bottom: 5px; }
                    .screenshot-placeholder { 
                        background-color: #f0f0f0; border: 2px dashed #ccc; 
                        padding: 40px; text-align: center; margin: 20px 0; color: #777; font-style: italic; 
                    }
                    .note { background-color: #e3f2fd; padding: 10px; border-left: 4px solid #2196F3; font-size: 12px; margin-top: 10px; }
                </style>
            </head>
            <body>
                <h1 style="text-align: center; margin-bottom: 40px;">AIManager - Manual de Utilizador</h1>
                ${content}
                <script>window.onload = function() { window.print(); }</script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    const renderContent = () => {
        switch (activeSection) {
            case 'intro':
                return (
                    <div className="space-y-4 animate-fade-in">
                        <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                            <FaBook className="text-brand-secondary" /> Bem-vindo ao AIManager
                        </h3>
                        <p className="text-gray-300">
                            O <strong>AIManager</strong> é uma plataforma integrada para a gestão inteligente de ativos de TI, suporte técnico e conformidade regulatória (NIS2/DORA).
                        </p>
                        <p className="text-gray-300">
                            Este manual fornece uma visão geral de todas as funcionalidades para o ajudar a tirar o máximo partido da ferramenta.
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                            <div className="bg-gray-800/50 p-4 rounded border border-gray-700">
                                <h4 className="font-bold text-white mb-2 flex items-center gap-2"><FaBoxOpen className="text-blue-400"/> Inventário</h4>
                                <p className="text-sm text-gray-400">Gestão do ciclo de vida de equipamentos e licenças.</p>
                            </div>
                            <div className="bg-gray-800/50 p-4 rounded border border-gray-700">
                                <h4 className="font-bold text-white mb-2 flex items-center gap-2"><FaTicketAlt className="text-green-400"/> Suporte</h4>
                                <p className="text-sm text-gray-400">Sistema de tickets com IA e gestão de SLAs.</p>
                            </div>
                            <div className="bg-gray-800/50 p-4 rounded border border-gray-700">
                                <h4 className="font-bold text-white mb-2 flex items-center gap-2"><FaShieldAlt className="text-red-400"/> Compliance</h4>
                                <p className="text-sm text-gray-400">Gestão de riscos, vulnerabilidades e backups (NIS2).</p>
                            </div>
                            <div className="bg-gray-800/50 p-4 rounded border border-gray-700">
                                <h4 className="font-bold text-white mb-2 flex items-center gap-2"><FaUsers className="text-purple-400"/> Organização</h4>
                                <p className="text-sm text-gray-400">Gestão de entidades, colaboradores e equipas.</p>
                            </div>
                        </div>
                    </div>
                );
            
            case 'overview':
                return (
                    <div className="space-y-6 animate-fade-in">
                        <h3 className="text-xl font-bold text-white border-b border-gray-700 pb-2">Visão Geral e Dashboards</h3>
                        
                        <div>
                            <h4 className="font-bold text-brand-secondary mb-2">Dashboard Operacional</h4>
                            <p className="text-sm text-gray-300 mb-4">
                                A página inicial oferece uma visão rápida do estado do seu parque informático. Aqui pode ver alertas sobre garantias, licenças a expirar e tickets abertos.
                            </p>
                            <ScreenshotPlaceholder text="Print do Dashboard Geral" />
                            <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                                <li><strong>KPIs:</strong> Contagem rápida de equipamentos por estado.</li>
                                <li><strong>Gráficos:</strong> Distribuição por idade e tipo.</li>
                                <li><strong>Atividade Recente:</strong> Log das últimas ações no sistema.</li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-purple-400 mb-2">Smart Dashboard (C-Level)</h4>
                            <p className="text-sm text-gray-300 mb-4">
                                Exclusivo para perfis de Administrador. Focado na governança e conformidade NIS2.
                            </p>
                            <ScreenshotPlaceholder text="Print do Smart Dashboard" />
                            <p className="text-sm text-gray-400">
                                Inclui o <strong>Score de Conformidade</strong> em tempo real e o botão de "Tomada de Conhecimento" para evidência legal de supervisão da gestão.
                            </p>
                        </div>
                    </div>
                );

            case 'inventory':
                return (
                    <div className="space-y-6 animate-fade-in">
                        <h3 className="text-xl font-bold text-white border-b border-gray-700 pb-2">Gestão de Inventário</h3>
                        
                        <div>
                            <h4 className="font-bold text-white mb-2">Adicionar Equipamento</h4>
                            <p className="text-sm text-gray-300 mb-2">
                                Pode adicionar equipamentos manualmente ou usar a IA para preencher dados a partir de uma foto ou número de série.
                            </p>
                            <ScreenshotPlaceholder text="Modal de Adicionar Equipamento" />
                            <div className="bg-blue-900/20 p-3 rounded border border-blue-500/30 text-xs text-blue-200">
                                <FaRobot className="inline mr-1"/> <strong>Dica IA:</strong> Use a "Magic Command Bar" (Ctrl+K) para dizer "Adicionar portátil Dell para o João" e o sistema pré-preenche o formulário.
                            </div>
                        </div>

                        <div>
                            <h4 className="font-bold text-white mb-2">Atribuições e Ciclo de Vida</h4>
                            <p className="text-sm text-gray-300 mb-2">
                                Associe equipamentos a colaboradores ou entidades (salas/departamentos). O sistema mantém um histórico completo de quem usou o quê.
                            </p>
                            <ScreenshotPlaceholder text="Lista de Equipamentos e Ações" />
                        </div>

                        <div>
                            <h4 className="font-bold text-white mb-2">Licenciamento</h4>
                            <p className="text-sm text-gray-300">
                                Controle o número de instalações de software. Associe licenças a equipamentos específicos para garantir que não excede o número de "seats" comprados.
                            </p>
                        </div>
                    </div>
                );

            case 'tickets':
                return (
                    <div className="space-y-6 animate-fade-in">
                        <h3 className="text-xl font-bold text-white border-b border-gray-700 pb-2">Tickets e Suporte</h3>
                        
                        <div>
                            <h4 className="font-bold text-white mb-2">Criação e Triagem IA</h4>
                            <p className="text-sm text-gray-300 mb-2">
                                Ao criar um ticket, o sistema utiliza Inteligência Artificial para sugerir a categoria, prioridade e até soluções baseadas em tickets anteriores.
                            </p>
                            <ScreenshotPlaceholder text="Modal de Novo Ticket com IA" />
                        </div>

                        <div>
                            <h4 className="font-bold text-white mb-2">Gestão de SLA e Alertas</h4>
                            <p className="text-sm text-gray-300 mb-2">
                                Os tickets têm temporizadores baseados na criticidade.
                            </p>
                            <div className="flex gap-2 mb-2">
                                <span className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded text-xs border border-orange-500/50">Alerta (Warning)</span>
                                <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded text-xs border border-red-500/50">Crítico (SLA Breach)</span>
                            </div>
                            <p className="text-sm text-gray-400">
                                Para incidentes de segurança (NIS2), existem prazos legais de notificação (24h/72h) destacados no dashboard.
                            </p>
                        </div>
                    </div>
                );

            case 'compliance':
                return (
                    <div className="space-y-6 animate-fade-in">
                        <h3 className="text-xl font-bold text-white border-b border-gray-700 pb-2">Compliance (NIS2 & DORA)</h3>
                        
                        <div>
                            <h4 className="font-bold text-white mb-2">Análise de Impacto (BIA)</h4>
                            <p className="text-sm text-gray-300 mb-2">
                                Mapeie os seus serviços de negócio críticos (ex: Email, ERP) e as suas dependências (Servidores, Licenças).
                            </p>
                            <ScreenshotPlaceholder text="Dashboard BIA" />
                        </div>

                        <div>
                            <h4 className="font-bold text-white mb-2">Vulnerabilidades e Backups</h4>
                            <p className="text-sm text-gray-300">
                                <strong>Vulnerabilidades:</strong> Registe CVEs manualmente ou use o "Auto Scan" para que a IA verifique o seu inventário contra bases de dados de risco conhecidas.
                            </p>
                            <p className="text-sm text-gray-300 mt-2">
                                <strong>Backups:</strong> Registe os testes de restauro. É obrigatório evidenciar que os backups funcionam. Pode anexar "prints" de sucesso.
                            </p>
                        </div>

                        <div>
                            <h4 className="font-bold text-white mb-2">Gestão de Fornecedores (Supply Chain)</h4>
                            <p className="text-sm text-gray-300">
                                Avalie o risco dos fornecedores, registe certificados ISO 27001 e contratos com cláusulas de saída (DORA).
                            </p>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    const menuItems = [
        { id: 'intro', label: 'Introdução', icon: <FaBook /> },
        { id: 'overview', label: 'Visão Geral', icon: <FaChartBar /> },
        { id: 'inventory', label: 'Inventário', icon: <FaBoxOpen /> },
        { id: 'tickets', label: 'Tickets & Suporte', icon: <FaTicketAlt /> },
        { id: 'compliance', label: 'NIS2 & Compliance', icon: <FaShieldAlt /> },
    ];

    return (
        <Modal title="Manual de Utilizador" onClose={onClose} maxWidth="max-w-6xl">
            <div className="absolute top-5 right-16 no-print">
                <button 
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-3 py-1 bg-gray-700 text-white text-sm rounded hover:bg-gray-600 transition-colors"
                    title="Imprimir ou Guardar como PDF"
                >
                    <FaPrint /> Imprimir / Guardar PDF
                </button>
            </div>
            <div className="flex flex-col md:flex-row h-[70vh]">
                {/* Sidebar Navigation */}
                <div className="w-full md:w-64 bg-gray-900/50 border-r border-gray-700 flex flex-col p-2 overflow-y-auto no-print">
                    {menuItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveSection(item.id)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors mb-1 text-left ${
                                activeSection === item.id 
                                ? 'bg-brand-primary text-white shadow-md' 
                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                            }`}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div id="manual-content" className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-surface-dark">
                    {renderContent()}
                </div>
            </div>
        </Modal>
    );
};

export default UserManualModal;
