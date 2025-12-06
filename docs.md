
# 📘 AIManager - Documentação Técnica & Funcional

## 1. Visão Geral
O **AIManager** é uma plataforma empresarial para Gestão de Ativos de TI (ITAM), Service Desk e Compliance (NIS2/DORA). A aplicação foca-se na automação de processos através de IA (Google Gemini) e na centralização de dados organizacionais.

**Tech Stack:**
*   **Frontend:** React 19, Vite, TypeScript, Tailwind CSS.
*   **Backend:** Supabase (PostgreSQL, Auth, Storage, Edge Functions).
*   **AI:** Google Gemini API (Multimodal: Texto e Visão).
*   **Relatórios:** PDFMe (Geração de PDF), Recharts/HTML (Dashboards).

---

## 2. Histórico de Versões e Changelog

### **Versão 2.0 (Atual - Stable)**
*   **✨ Novo Módulo de Onboarding:** Implementação do `OnboardingModal.tsx` e lógica associada em `OrganizationManager.tsx`. Permite criar colaboradores com estado "Onboarding" e gerar automaticamente tickets de aprovisionamento de TI com requisitos de hardware/software.
*   **🛡️ Correção Crítica de Base de Dados:** Atualização dos scripts em `DatabaseSchemaModal.tsx` para corrigir o erro `column reference "trigger_name" is ambiguous` nas funções RPC e reforço das políticas RLS (Row Level Security) para tabelas de configuração (Cargos, Hardware).
*   **⚙️ Configuração Dinâmica:** Introdução da tabela `config_job_titles` e gestão de cargos via `RoleManager.tsx` e `SettingsManager.tsx`.
*   **🔧 Refatorização de Tipos:** Atualização global de `types.ts` para suportar os novos estados e configurações.

### Versão 1.5
*   Módulo de Contabilidade (CIBE) e Estados de Conservação.
*   Gestão de Produtos de Software.
*   Dashboards de Compliance (NIS2) e BIA.

---

## 3. Arquitetura do Projeto

A aplicação segue uma arquitetura modular baseada em "Features" para separar a lógica de negócio da interface do utilizador.

### 🧠 Core (Núcleo)
*   **`App.tsx`**: O orquestrador principal. Gere o encaminhamento (baseado em hash `#`), estado de autenticação global, inicialização de serviços e renderização condicional dos "Feature Managers".
*   **`index.tsx`**: Ponto de entrada React, contendo o `ErrorBoundary` global e os Providers de Contexto (`Layout`, `Language`).
*   **`types.ts`**: Definição de tipos TypeScript (Interfaces e Enums). É a "fonte da verdade" para o modelo de dados.

### 🗄️ Camada de Dados e Serviços (`/services`)
*   **`dataService.ts`**: Camada de abstração para o Supabase. Contém todas as operações CRUD, chamadas RPC e lógica de logs de auditoria.
*   **`geminiService.ts`**: Integração com IA. Gere OCR (leitura de s/n), classificação de tickets, geração de relatórios executivos e comandos de voz (`MagicCommandBar`).
*   **`supabaseClient.ts`**: Singleton para a conexão à base de dados.
*   **`automationService.ts`**: Lógica para scans automáticos de vulnerabilidades (cruzamento de inventário com CVEs via IA).

### 🎣 Hooks e Estado (`/hooks`)
*   **`useAppData.ts`**: Hook vital que carrega e armazena em cache *toda* a informação necessária para o funcionamento da app. Utiliza um padrão de *polling* (30s) para manter os dados frescos sem sobrecarregar a base de dados com subscrições realtime excessivas.

### 📦 Feature Managers (Controladores)
Localizados em `features/`, estes componentes atuam como controladores, ligando os dados (`appData`) aos componentes visuais (Modais e Dashboards) e gerindo a lógica de negócio específica:
*   **`InventoryManager.tsx`**: Gere Equipamentos, Licenças, Kits e Aquisições.
*   **`OrganizationManager.tsx`**: Gere a estrutura hierárquica (Instituições -> Entidades -> Colaboradores) e o novo fluxo de Onboarding.
*   **`TicketManager.tsx`**: Gere o ciclo de vida dos pedidos de suporte e atividades.
*   **`ComplianceManager.tsx`**: Gere os módulos de BIA, Vulnerabilidades, Backups, Resiliência e Políticas.
*   **`SettingsManager.tsx`**: Painel de administração para configurações globais e tabelas auxiliares.

### 🧩 Componentes UI (`/components`)
*   **Dashboards:** Componentes de visualização de dados (`OverviewDashboard`, `SmartDashboard`, `EquipmentDashboard`, etc.).
*   **Modais de Ação:** Formulários para criação/edição (`AddEquipmentModal`, `AddTicketModal`, `OnboardingModal`, `OffboardingModal`).
*   **Ferramentas de Sistema:**
    *   **`DatabaseSchemaModal.tsx`**: **CRÍTICO**. Contém os scripts SQL para reparação automática da base de dados, criação de tabelas e correção de permissões.
    *   **`SystemDiagnosticsModal.tsx`**: Executa testes E2E simulados para validar a integridade do sistema.

---

## 4. Fluxos de Trabalho Principais

### Gestão de Inventário
1.  **Entrada:** Via compra (`AddProcurementModal` -> `ReceiveAssetsModal`) ou registo manual/IA (`AddEquipmentModal`, `ImportModal`).
2.  **Ciclo de Vida:** O ativo passa de `Stock` para `Operacional` ao ser atribuído (`AssignEquipmentModal`).
3.  **Manutenção:** Registo de peças e custos adicionais no TCO.
4.  **Abate:** Processo final de vida com justificação legal.

### Gestão de Pessoas (Onboarding/Offboarding)
1.  **Onboarding:** O `OnboardingModal` cria o registo do colaborador (sem login) e abre automaticamente um ticket para a equipa de TI preparar os equipamentos.
2.  **Gestão:** O colaborador recebe ativos e licenças.
3.  **Offboarding:** O `OffboardingModal` automatiza a recolha de ativos, revogação de licenças e inativação da conta.

### Suporte Inteligente
1.  **Criação:** O utilizador reporta um problema.
2.  **Triagem IA:** O sistema analisa a descrição, sugere a categoria/prioridade e procura soluções em tickets passados similares.
3.  **Resolução:** O técnico regista atividades (`TicketActivitiesModal`) e fecha o ticket, gerando base de conhecimento para a IA.

### Compliance NIS2 & DORA
1.  **Governance:** A Administração visualiza o risco no `SmartDashboard` e assina a "Tomada de Conhecimento".
2.  **Supply Chain:** Gestão de risco de fornecedores e contratos (`SupplierDashboard`).
3.  **Resiliência:** Registo de backups e testes de recuperação (`BackupDashboard`, `ResilienceDashboard`).
4.  **Notificação:** Em caso de incidente grave, o sistema gera o JSON oficial para notificação ao CSIRT (`RegulatoryNotificationModal`).

---

## 5. Segurança e Auditoria
*   **RBAC (Role-Based Access Control):** Gerido em `RoleManager.tsx` e aplicado em `App.tsx` e `SettingsManager.tsx`.
*   **RLS (Row Level Security):** Políticas aplicadas ao nível da base de dados (Supabase) para garantir isolamento de dados.
*   **Audit Logs:** Todas as ações críticas (Login, Criação, Edição, Apagar) são registadas imutavelmente na tabela `audit_logs` via `dataService.logAction`.
