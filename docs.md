
# 📘 AIManager - Documentação Técnica & Funcional

## 1. Visão Geral
Aplicação web para Gestão de Ativos de TI (ITAM), Service Desk e Compliance (NIS2/DORA), focada na automação via IA (Gemini) e integração com Supabase.
Stack: React (Vite), TypeScript, Tailwind CSS, Supabase (Backend/Auth/DB), Google Gemini (AI).

## 2. Estrutura de Ficheiros e Responsabilidades

### 🧠 Núcleo (Core)
*   **`App.tsx`**: O "cérebro" da aplicação. Gere o encaminhamento (navegação por abas/hash), verifica permissões (RBAC), gere o estado global de autenticação e decide qual "Manager" carregar.
*   **`types.ts`**: A "verdade" dos dados. Define todas as interfaces (Equipamento, Ticket, Colaborador, Supplier, etc.) e Enums. Agora inclui tipos para **Contabilidade (CIBE)** e **Estados de Conservação**.
*   **`index.tsx` / `index.html`**: Ponto de entrada, configuração de imports e Error Boundary global.

### 🗄️ Serviços (Backend & Lógica)
*   **`services/dataService.ts`**: A ponte com o Supabase. Contém todas as funções CRUD, logs de auditoria e chamadas RPC. Atualizado para carregar as novas tabelas de configuração (`config_accounting_categories`, `config_conservation_states`).
*   **`services/geminiService.ts`**: A inteligência. Contém lógica para OCR, categorização de tickets, relatórios executivos, scan de vulnerabilidades e comandos de voz.
*   **`services/supabaseClient.ts`**: Singleton para a conexão à base de dados.
*   **`services/automationService.ts`**: Lógica para correr scans automáticos de segurança.
*   **`hooks/useAppData.ts`**: Hook principal que carrega TODOS os dados para a memória (Polling de 30s), incluindo as novas configurações legais.

### 📦 Funcionalidades (Features/Modules)
Estes componentes atuam como "controladores" de cada módulo principal:
*   **`features/inventory/InventoryManager.tsx`**: Gere Equipamentos, Licenças e Aquisições. Passa os novos dados de contabilidade para os modais.
*   **`features/organization/OrganizationManager.tsx`**: Gere Instituições, Entidades, Colaboradores, Equipas e Fornecedores.
*   **`features/tickets/TicketManager.tsx`**: Gere a lista de Tickets e atividades.
*   **`features/compliance/ComplianceManager.tsx`**: Gere BIA, Vulnerabilidades, Backups, Resiliência, Formação e Políticas.
*   **`features/settings/SettingsManager.tsx`**: Painel de controlo Admin. Gere tabelas auxiliares, incluindo as novas tabelas de CIBE e Estados de Conservação.

### 📊 Dashboards (Visualização)
*   **`OverviewDashboard.tsx`**: Ecrã inicial operacional (KPIs, Alertas, Gráficos).
*   **`SmartDashboard.tsx`**: Dashboard C-Level para a Administração (Score NIS2, Risco Financeiro).
*   **`MapDashboard.tsx`**: Visualização geográfica de ativos e entidades.
*   **`BIReportDashboard.tsx`**: Relatórios financeiros (FinOps).
*   **`AgendaDashboard.tsx`**: Diretório global de contactos.
*   **`CollaboratorDashboard.tsx`**: Listagem de colaboradores.
*   **`EquipmentDashboard.tsx`**: Listagem principal de inventário com suporte a filtros avançados.
*   **`TicketDashboard.tsx`**: Gestão de fila de espera de suporte.
*   **`ServiceDashboard.tsx`**: Gestão de serviços de negócio (BIA).
*   **`VulnerabilityDashboard.tsx`**: Gestão de CVEs.
*   **`BackupDashboard.tsx`**: Registo de testes de restauro.
*   **`SupplierDashboard.tsx`**: Gestão de risco de terceiros.
*   **`TrainingDashboard.tsx`**: Registo de ações de formação.
*   **`PolicyDashboard.tsx`**: Gestão de políticas de segurança.
*   **`components/settings/SoftwareProductDashboard.tsx`**: Gestão específica de catálogo de software.

### 🧩 Modais (Formulários & Ações)
*   **`AddEquipmentModal.tsx`**: Criação/Edição de equipamentos. **Atualizado:** Inclui secção de "Contabilidade & Património" (Classificador CIBE, Estado de Conservação, Valor Residual).
*   **`AddEquipmentKitModal.tsx`**: Criação de múltiplos ativos (Kits).
*   **`AssignEquipmentModal.tsx`**: Lógica de atribuição.
*   **`AddTicketModal.tsx`**: Criação de tickets.
*   **`CloseTicketModal.tsx`**: Finalização de tickets.
*   **`TicketActivitiesModal.tsx`**: Registo de intervenções.
*   **`RegulatoryNotificationModal.tsx`**: Geração de JSON para notificação CSIRT.
*   **`AddCollaboratorModal.tsx`**: Gestão de utilizadores.
*   **`OffboardingModal.tsx`**: Assistente de saída.
*   **`EquipmentHistoryModal.tsx`**: Ficha detalhada do ativo.
*   **`CollaboratorDetailModal.tsx`**: Ficha 360º do colaborador.
*   **`DatabaseSchemaModal.tsx`**: **(Crítico)** Scripts SQL atualizados com **correções de RLS (Row Level Security)** para garantir permissões de escrita nas novas tabelas.
*   **`AddProcurementModal.tsx`** & **`ReceiveAssetsModal.tsx`**: Fluxo de compras.
*   **`SystemDiagnosticsModal.tsx`**: Testes E2E automáticos.
*   **`ImportModal.tsx`**: Importação de Excel.

### ⚙️ Configurações Específicas
*   **`settings/AgentsTab.tsx`**: Script PowerShell.
*   **`settings/WebhooksTab.tsx`**: Simulador de alertas SIEM.
*   **`settings/CronJobsTab.tsx`**: Relatórios automáticos.
*   **`settings/ConnectionsTab.tsx`**: Chaves de API.
*   **`settings/GenericConfigDashboard.tsx`**: Gestão genérica de tabelas auxiliares (utilizado agora para CIBE e Estados de Conservação).

## 3. Funcionalidades Chave Implementadas

### ✅ Inventário & Património (Atualizado)
*   CRUD completo com suporte a fotos e anexos.
*   **Novidade:** Gestão de dados contabilísticos (Classificador CIBE / SNC-AP).
*   **Novidade:** Registo do Estado de Conservação e Valor Residual.
*   Leitura de código de barras via câmara.
*   IA para extrair dados e preencher especificações.
*   Kits de Equipamento.
*   Licenciamento de Software.
*   Aquisições e aprovações.

### ✅ Organização & Pessoas
*   Hierarquia: Instituição -> Entidade -> Colaborador.
*   RBAC Granular.
*   Autenticação (Login, MFA, Reset).
*   Offboarding.

### ✅ Suporte (Helpdesk)
*   Tickets com SLA e Triagem IA.
*   Prazos legais NIS2 (24h/72h).
*   Base de Conhecimento.

### ✅ Compliance (NIS2 & DORA)
*   BIA (Serviços Críticos).
*   Vulnerabilidades (Auto-Scan).
*   Backups (Evidências).
*   Supply Chain (Risco Fornecedores).
*   Governança (Dashboard C-Level).
*   Políticas e Continuidade.

### ✅ Segurança & Infraestrutura
*   **RLS (Row Level Security):** Políticas de base de dados reforçadas para garantir que apenas Admins/Técnicos podem editar tabelas de configuração sensíveis, enquanto utilizadores podem ler.
*   **Auditoria:** Logs imutáveis de todas as ações críticas.
