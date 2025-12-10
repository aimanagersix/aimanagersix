
# 📘 AIManager - Documentação Técnica & Funcional

## 1. Visão Geral
O **AIManager** é uma plataforma empresarial para Gestão de Ativos de TI (ITAM), Service Desk e Compliance (NIS2/DORA). A aplicação foca-se na automação de processos através de IA (Google Gemini) e na centralização de dados organizacionais com segurança robusta ao nível da base de dados.

**Tech Stack:**
*   **Frontend:** React 19, Vite, TypeScript, Tailwind CSS.
*   **Backend:** Supabase (PostgreSQL, Auth, Storage, Edge Functions).
*   **Segurança:** RLS (Row Level Security) nativo do PostgreSQL com RBAC dinâmico via JSON.
*   **IA:** Google Gemini API (Multimodal: Texto e Visão).
*   **Relatórios:** PDFMe (Geração de PDF), Recharts/HTML (Dashboards).

---

## 2. Histórico de Versões e Changelog

### **Versão 3.0 (Atual - Security Hardening & Cleanup)**
*   **🔐 RBAC v5.0 (Limpeza Total):** Implementação de um script de "vassourada" que remove todas as políticas RLS antigas e conflituosas antes de aplicar as novas regras granulares baseadas em JSON.
*   **🛡️ Hardening v4.0:** Extensão da segurança RLS a todas as tabelas de configuração (listas, tipos, categorias), garantindo que apenas Admins podem escrever, enquanto todos os autenticados podem ler.
*   **🧹 Auditoria de Base de Dados:** Introdução de scripts SQL de diagnóstico para listar triggers, funções e políticas ativas, permitindo detetar "lixo" legado.
*   **📱 Melhorias Mobile:** Ajustes na barra de navegação e menu de perfil para melhor experiência em telemóveis.

### Versão 2.0
*   **Novo Módulo de Onboarding:** Criação de colaboradores e tickets automáticos de aprovisionamento.
*   **Refatorização de Tipos:** Suporte a configurações dinâmicas de hardware (CPUs, RAM, Discos).
*   **Correção de RPC:** Resolução de ambiguidades em funções PL/pgSQL.

### Versão 1.5
*   Módulo de Contabilidade (CIBE) e Estados de Conservação.
*   Dashboards de Compliance (NIS2) e BIA.

---

## 3. Arquitetura de Segurança (RBAC)

A segurança do AIManager não depende apenas do Frontend. Ela é imposta diretamente no motor da base de dados.

### Mecanismo de Permissões
1.  **Tabela `config_custom_roles`:** Armazena um objeto JSONB com a matriz de permissões (ex: `{ "equipment": { "view": true, "edit": false } }`).
2.  **Função `public.has_permission()`:** Esta função SQL é chamada por cada *Policy* de segurança. Ela verifica o papel do utilizador atual, consulta o JSON e retorna `true/false`.
3.  **Imediatez:** Alterações aos perfis têm efeito imediato no backend.

---

## 4. Estrutura do Projeto

### 🧠 Core (Núcleo)
*   **`App.tsx`**: Orquestrador principal e routing.
*   **`types.ts`**: Definição de tipos TypeScript (A fonte da verdade dos dados).

### 🗄️ Camada de Dados (`/services`)
*   **`dataService.ts`**: Abstração do Supabase Client. Gere CRUD e Logs de Auditoria.
*   **`automationService.ts`**: Lógica de scans de vulnerabilidade.

### 📦 Módulos Funcionais (`/features`)
*   **InventoryManager:** Equipamentos, Licenças, Aquisições.
*   **OrganizationManager:** RH, Entidades, Fornecedores, Onboarding.
*   **TicketManager:** Service Desk, SLAs.
*   **ComplianceManager:** NIS2, BIA, Riscos, Backups.
*   **SettingsManager:** Configurações globais, Automação, RBAC.

---

## 5. Ferramentas de Sistema
Localizadas no componente `DatabaseSchemaModal.tsx`, estas ferramentas são críticas para a manutenção:
*   **Segurança (RLS):** Aplica regras de acesso a tabelas de configuração.
*   **Reparação:** Corrige funções RPC (ex: aniversários).
*   **RBAC (v5.0):** Limpa e reaplica regras de acesso operacionais.
*   **Auditoria DB:** Gera relatórios SQL sobre o estado atual do esquema do banco de dados (Triggers, Policies, Functions).
