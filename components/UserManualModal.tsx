
import React, { useState } from 'react';
import Modal from './common/Modal';
import { FaBook, FaChartBar, FaSitemap, FaBoxOpen, FaTicketAlt, FaShieldAlt, FaUsers, FaCalendarAlt, FaRobot, FaSearch, FaCheckCircle, FaExclamationTriangle, FaCamera, FaDownload, FaPrint } from 'react-icons/fa';

interface UserManualModalProps {
    onClose: () => void;
}

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
                    ul, ol { margin-bottom: 20px; padding-left: 20px; }
                    li { margin-bottom: 5px; }
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
                            O <strong>AIManager</strong> é uma plataforma integrada para a gestão inteligente de ativos de TI, suporte técnico e conformidade regulatória (NIS2/DORA). O seu objetivo é centralizar a informação, automatizar processos e fornecer visibilidade de alto nível para a gestão.
                        </p>
                        <p className="text-gray-300">
                            Este manual fornece uma visão geral de todas as funcionalidades para o ajudar a tirar o máximo partido da ferramenta. Utilize o menu à esquerda para navegar pelas secções.
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                            <div className="bg-gray-800/50 p-4 rounded border border-gray-700">
                                <h4 className="font-bold text-white mb-2 flex items-center gap-2"><FaBoxOpen className="text-blue-400"/> Inventário</h4>
                                <p className="text-sm text-gray-400">Gestão do ciclo de vida de equipamentos e licenças, desde a aquisição ao abate.</p>
                            </div>
                            <div className="bg-gray-800/50 p-4 rounded border border-gray-700">
                                <h4 className="font-bold text-white mb-2 flex items-center gap-2"><FaTicketAlt className="text-green-400"/> Suporte</h4>
                                <p className="text-sm text-gray-400">Sistema de tickets com triagem por IA, gestão de SLAs e notificações automáticas.</p>
                            </div>
                            <div className="bg-gray-800/50 p-4 rounded border border-gray-700">
                                <h4 className="font-bold text-white mb-2 flex items-center gap-2"><FaShieldAlt className="text-red-400"/> Compliance</h4>
                                <p className="text-sm text-gray-400">Módulos dedicados à NIS2/DORA: BIA, gestão de vulnerabilidades, backups e risco de fornecedores.</p>
                            </div>
                            <div className="bg-gray-800/50 p-4 rounded border border-gray-700">
                                <h4 className="font-bold text-white mb-2 flex items-center gap-2"><FaUsers className="text-purple-400"/> Organização</h4>
                                <p className="text-sm text-gray-400">Estrutura hierárquica de instituições, entidades, colaboradores e equipas de suporte.</p>
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
                                A página inicial oferece uma visão 360º do estado do seu parque informático. É o ponto central para monitorizar a saúde dos ativos e a carga de trabalho do suporte.
                            </p>
                            <ul className="list-disc list-inside text-sm text-gray-400 space-y-2">
                                <li><strong>KPIs de Estado:</strong> Contagem de equipamentos por estado (Operacional, Stock, etc.). Clicar nestes cartões filtra a lista de inventário.</li>
                                <li><strong>Alertas de Saúde:</strong> Destaque para garantias e licenças que expiram nos próximos 30 dias.</li>
                                <li><strong>Gráficos:</strong> Análise visual da distribuição de ativos por idade, tipo e risco.</li>
                                <li><strong>Atividade Recente:</strong> Log das últimas ações no sistema, como novas atribuições e tickets.</li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-purple-400 mb-2">Dashboard C-Level (NIS2)</h4>
                            <p className="text-sm text-gray-300 mb-4">
                                Este dashboard é focado na governança e é destinado à Administração (visível apenas para perfis Admin). O seu objetivo é cumprir o <strong>Artigo 20º da NIS2</strong>, que responsabiliza os órgãos de gestão pela supervisão da cibersegurança.
                            </p>
                            <ol className="list-decimal list-inside text-sm text-gray-400 space-y-2">
                                <li><strong>Score de Conformidade:</strong> Um algoritmo que calcula em tempo real o nível de risco da organização, com base em incidentes abertos, vulnerabilidades, backups e formação.</li>
                                <li><strong>KPIs de Risco:</strong> Métricas chave como "Incidentes Críticos Abertos", "Vulnerabilidades por Mitigar", etc.</li>
                                <li><strong>Tomada de Conhecimento:</strong> Funcionalidade que permite à gestão registar formalmente que tomou conhecimento do estado de risco da organização. Esta ação é registada nos logs de auditoria e serve como evidência de supervisão.</li>
                            </ol>
                        </div>
                    </div>
                );

            case 'inventory':
                return (
                    <div className="space-y-6 animate-fade-in">
                        <h3 className="text-xl font-bold text-white border-b border-gray-700 pb-2">Gestão de Inventário</h3>
                        
                        <div>
                            <h4 className="font-bold text-white mb-2">Adicionar Equipamentos</h4>
                            <p className="text-sm text-gray-300 mb-2">
                                Para adicionar um novo equipamento, navegue para <strong>Ativos &rarr; Equipamentos</strong> e clique em "Adicionar".
                            </p>
                            <ul className="list-disc list-inside text-sm text-gray-400 space-y-2">
                                <li><strong>Manualmente:</strong> Preencha todos os campos do formulário.</li>
                                <li><strong>Com IA (Câmera):</strong> Clique no ícone da câmera no campo "Número de Série" para usar a câmera do seu dispositivo para ler o número de série de uma etiqueta.</li>
                                <li><strong>Com IA (Pesquisa):</strong> Após inserir um número de série, clique no ícone de pesquisa para que a IA tente identificar a marca e o tipo do equipamento.</li>
                                <li><strong>Magic Command Bar (Ctrl+K):</strong> Use linguagem natural, como "adicionar portátil HP para a Maria Silva com série X" para a IA pré-preencher o formulário.</li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-white mb-2">Atribuições e Ciclo de Vida</h4>
                            <p className="text-sm text-gray-300 mb-2">
                                O ciclo de vida de um equipamento é gerido através dos seus estados e atribuições:
                            </p>
                             <ol className="list-decimal list-inside text-sm text-gray-400 space-y-1">
                                <li>Um novo equipamento entra em estado de <strong>"Stock"</strong>.</li>
                                <li>Pode ser atribuído a uma <strong>Entidade</strong> (localização física, ex: Sala 101) ou diretamente a um <strong>Colaborador</strong>.</li>
                                <li>Ao ser atribuído, o seu estado muda para <strong>"Operacional"</strong> (ou "Empréstimo" se for um equipamento de substituição).</li>
                                <li>Ao ser desassociado, volta a <strong>"Stock"</strong>.</li>
                                <li>Pode ser enviado para <strong>"Garantia"</strong> ou, no fim de vida, para <strong>"Abate"</strong>.</li>
                            </ol>
                        </div>

                        <div>
                            <h4 className="font-bold text-white mb-2">Licenciamento</h4>
                            <p className="text-sm text-gray-300">
                                No menu <strong>Ativos &rarr; Licenças</strong>, pode gerir as suas chaves de software. Ao associar uma licença a um equipamento (através do detalhe do equipamento), o sistema controla o número de "seats" em uso, alertando quando as licenças estão a esgotar.
                            </p>
                        </div>
                    </div>
                );

            case 'tickets':
                return (
                    <div className="space-y-6 animate-fade-in">
                        <h3 className="text-xl font-bold text-white border-b border-gray-700 pb-2">Tickets e Suporte</h3>
                        
                        <div>
                            <h4 className="font-bold text-white mb-2">Criação e Triagem por IA</h4>
                            <p className="text-sm text-gray-300 mb-2">
                                Qualquer utilizador com login pode criar um ticket. Ao descrever o problema, pode usar o botão <strong>"Triagem IA"</strong>.
                            </p>
                             <ul className="list-disc list-inside text-sm text-gray-400 space-y-2">
                                <li>A IA sugere a <strong>Categoria</strong> e <strong>Prioridade</strong> corretas.</li>
                                <li>Procura em tickets passados por problemas semelhantes e, se encontrar, apresenta a <strong>solução que foi aplicada anteriormente</strong>, acelerando a resolução.</li>
                                <li>Identifica se o problema é um potencial <strong>Incidente de Segurança</strong> e classifica-o como tal.</li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-white mb-2">Gestão de SLA e Prazos NIS2</h4>
                            <p className="text-sm text-gray-300 mb-2">
                                Para incidentes de segurança, a diretiva NIS2 exige prazos de notificação rigorosos. O sistema exibe um temporizador regressivo para os prazos de <strong>24h (Alerta Precoce)</strong> e <strong>72h (Notificação de Incidente)</strong>.
                            </p>
                            <p className="text-sm text-gray-400">
                                Para outros tickets, pode configurar SLAs (Service Level Agreements) personalizados por categoria em <strong>Configurações &rarr; Categorias de Tickets</strong>, definindo tempos de alerta e de resolução.
                            </p>
                        </div>
                    </div>
                );

            case 'compliance':
                return (
                    <div className="space-y-6 animate-fade-in">
                        <h3 className="text-xl font-bold text-white border-b border-gray-700 pb-2">Compliance (NIS2 & DORA)</h3>
                        
                        <div>
                            <h4 className="font-bold text-white mb-2">Análise de Impacto no Negócio (BIA)</h4>
                            <p className="text-sm text-gray-300 mb-2">
                                O módulo BIA permite mapear os seus serviços de negócio críticos (ex: Email, ERP) e as suas dependências técnicas (servidores, licenças, etc.). Esta análise é fundamental para o plano de recuperação de desastres (DRP) e para perceber o impacto real de uma falha de um ativo.
                            </p>
                        </div>

                        <div>
                            <h4 className="font-bold text-white mb-2">Vulnerabilidades e Backups</h4>
                            <p className="text-sm text-gray-300">
                                <strong>Vulnerabilidades (CVE):</strong> Registe vulnerabilidades conhecidas ou utilize o <strong>"Auto Scan"</strong> para que a IA analise o seu inventário de software e hardware em busca de riscos. A partir de uma vulnerabilidade, pode criar um ticket de mitigação.
                            </p>
                            <p className="text-sm text-gray-300 mt-2">
                                <strong>Backups:</strong> A NIS2 exige que se evidencie que os backups são testados regularmente. Utilize este módulo para registar os testes de restauro, indicando o tempo de recuperação (RTO) e anexando evidências (logs, screenshots).
                            </p>
                        </div>

                        <div>
                            <h4 className="font-bold text-white mb-2">Risco de Fornecedores (Supply Chain)</h4>
                            <p className="text-sm text-gray-300">
                                A segurança da cadeia de abastecimento é um pilar da NIS2 e DORA. Neste módulo, pode avaliar o risco de cada fornecedor, registar certificados de segurança (como ISO 27001) e gerir os contratos, incluindo cláusulas de saída (exit strategy).
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
