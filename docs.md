# 📘 AIManager - Documentação Técnica & Funcional

## 1. Visão Geral
Aplicação web para Gestão de Ativos de TI (ITAM), Service Desk e Compliance (NIS2/DORA), focada na automação via IA (Gemini) e integração com Supabase.
Stack: React (Vite), TypeScript, Tailwind CSS, Supabase (Backend/Auth/DB), Google Gemini (AI).

## 2. Estrutura de Ficheiros e Responsabilidades

### 🧠 Núcleo (Core)
*   **`App.tsx`**: O "cérebro" da aplicação. Gere o encaminhamento (navegação por abas/hash), verifica permissões (RBAC), gere o estado global de autenticação e decide qual "Manager" carregar.
*   **`types.ts`**: A "verdade" dos dados. Define todas as interfaces (Equipamento, Ticket, Colaborador, Supplier, etc.) e Enums.
*   **`index.tsx` / `index.html`**: Ponto de entrada, configuração de imports e Error Boundary global.

### 🗄️ Serviços (Backend & Lógica)
*   **`services/dataService.ts`**: A ponte com o Supabase. Contém todas as funções CRUD (create, read, update, delete), logs de auditoria e chamadas RPC.
*   **`services/geminiService.ts`**: A inteligência. Contém lógica para OCR (ler serial numbers), categorizar tickets, gerar relatórios executivos, scan de vulnerabilidades e comandos de voz (Magic Bar).
*   **`services/supabaseClient.ts`**: Singleton para a conexão à base de dados.
*   **`services/automationService.ts`**: Lógica para correr scans automáticos de segurança (cruzamento de dados NIST/IA).
*   **`hooks/useAppData.ts`**: Hook principal que carrega TODOS os dados da aplicação para a memória no início (Polling de 30s).

### 📦 Funcionalidades (Features/Modules)
Estes componentes atuam como "controladores" de cada módulo principal:
*   **`features/inventory/InventoryManager.tsx`**: Gere Equipamentos, Licenças e Aquisições (Procurement).
*   **`features/organization/OrganizationManager.tsx`**: Gere Instituições, Entidades, Colaboradores, Equipas e Fornecedores.
*   **`features/tickets/TicketManager.tsx`**: Gere a lista de Tickets e atividades.
*   **`features/compliance/ComplianceManager.tsx`**: Gere BIA, Vulnerabilidades, Backups, Resiliência, Formação e Políticas.
*   **`features/settings/SettingsManager.tsx`**: O painel de controlo do Admin. Gere tabelas auxiliares, conexões, automação e logs.

### 📊 Dashboards (Visualização)
*   **`OverviewDashboard.tsx`**: Ecrã inicial operacional (KPIs, Alertas, Gráficos, Licenças a expirar).
*   **`SmartDashboard.tsx`**: Dashboard C-Level para a Administração (Score NIS2, Risco Financeiro, Supervisão).
*   **`MapDashboard.tsx`**: Visualização geográfica de ativos e entidades (Leaflet).
*   **`BIReportDashboard.tsx`**: Relatórios financeiros (FinOps), custos por entidade e estado.
*   **`AgendaDashboard.tsx`**: Diretório global de contactos.
*   **`CollaboratorDashboard.tsx`**: Listagem de colaboradores com filtros e ações rápidas.
*   **`EquipmentDashboard.tsx`**: Listagem principal de inventário.
*   **`TicketDashboard.tsx`**: Gestão de fila de espera de suporte (SLA, Prazos NIS2).
*   **`ServiceDashboard.tsx`**: Gestão de serviços de negócio (BIA).
*   **`VulnerabilityDashboard.tsx`**: Gestão de CVEs.
*   **`BackupDashboard.tsx`**: Registo de testes de restauro.
*   **`SupplierDashboard.tsx`**: Gestão de risco de terceiros (Supply Chain).
*   **`TrainingDashboard.tsx`**: Registo de ações de formação.
*   **`PolicyDashboard.tsx`**: Gestão de políticas de segurança e aceitação.

### 🧩 Modais (Formulários & Ações)
*   **`AddEquipmentModal.tsx`**: Criação/Edição de equipamentos (scanner de câmara, IA auto-fill).
*   **`AddEquipmentKitModal.tsx`**: Criação de múltiplos ativos (Kits) de uma vez.
*   **`AssignEquipmentModal.tsx`** / **`AssignMultipleEquipmentModal.tsx`**: Lógica de atribuição.
*   **`AddTicketModal.tsx`**: Criação de tickets (Triagem IA, Anexos).
*   **`CloseTicketModal.tsx`**: Finalização de tickets com resumo IA para KB.
*   **`TicketActivitiesModal.tsx`**: Registo de intervenções técnicas.
*   **`RegulatoryNotificationModal.tsx`**: Geração de JSON para notificação CSIRT (NIS2).
*   **`AddCollaboratorModal.tsx`**: Gestão de utilizadores (foto, password reset).
*   **`OffboardingModal.tsx`**: Assistente de saída (checklist devolução, inativação).
*   **`EquipmentHistoryModal.tsx`**: Ficha detalhada do ativo (Histórico, FinOps, Licenças).
*   **`CollaboratorDetailModal.tsx`**: Ficha 360º do colaborador.
*   **`DatabaseSchemaModal.tsx`**: **(Crítico)** Scripts SQL para criar/atualizar BD, Seed e Triggers.
*   **`AddProcurementModal.tsx`** & **`ReceiveAssetsModal.tsx`**: Fluxo de compras e entrada em stock.
*   **`SystemDiagnosticsModal.tsx`**: Testes E2E automáticos do sistema.
*   **`ImportModal.tsx`**: Importação de Excel.

### ⚙️ Configurações Específicas
*   **`settings/AgentsTab.tsx`**: Script PowerShell para inventário automático.
*   **`settings/WebhooksTab.tsx`**: Simulador de alertas de segurança (SIEM).
*   **`settings/CronJobsTab.tsx`**: Configuração de relatórios automáticos por email (Edge Functions).
*   **`settings/ConnectionsTab.tsx`**: Gestão de chaves de API (Supabase, Resend, Slack).
*   **`settings/GenericConfigDashboard.tsx`**: Componente reutilizável para tabelas simples (Marcas, Tipos, etc.).

## 3. Funcionalidades Chave Implementadas

### ✅ Inventário & Ativos
*   CRUD completo com suporte a fotos e anexos.
*   Leitura de código de barras/QR via câmara.
*   IA para extrair dados de fotos e preencher especificações.
*   Kits de Equipamento (criação em lote).
*   Gestão de Licenças (Contagem de instalações, OEM).
*   Aquisições (Workflow: Pedido -> Aprovação -> Encomenda -> Receção -> Ativo).

### ✅ Organização & Pessoas
*   Hierarquia: Instituição -> Entidade -> Colaborador.
*   RBAC Granular (Perfis de acesso customizáveis).
*   Autenticação (Login, MFA/2FA, Reset Password).
*   Gestão de Equipas de Suporte.
*   Processo de Offboarding com checklist.

### ✅ Suporte (Helpdesk)
*   Tickets com categorias, prioridades e SLAs.
*   Triagem automática por IA (Sugestão de solução).
*   Chat em tempo real.
*   Notificações visuais de prazos legais (NIS2 24h/72h).
*   Base de Conhecimento automática (Resumos de resolução).

### ✅ Compliance (NIS2 & DORA)
*   **BIA**: Mapeamento de serviços críticos e dependências (Ativos/Licenças).
*   **Segurança**: Registo de CVEs e Auto-Scan de inventário.
*   **Backups**: Registo de testes de restauro com evidências (análise IA de screenshots).
*   **Supply Chain**: Avaliação de risco de fornecedores e gestão de contratos (Exit Strategy).
*   **Governança**: Dashboard C-Level com assinatura digital de supervisão.
*   **Políticas**: Distribuição e aceitação obrigatória de políticas.
*   **Continuidade**: Gestão de planos BCP/DRP.

### ✅ Automação
*   Agente PowerShell para Windows.
*   Webhooks para ingestão de alertas SIEM.
*   Relatórios semanais automáticos.
*   Logs de Auditoria imutáveis.
