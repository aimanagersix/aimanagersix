
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

### **Versão 3.5 (PWA & RBAC Correction)**
*   **🔐 RBAC v6.0 (Widget Granularity):** Retificação dos perfis de acesso para permitir a seleção individual de widgets de dashboard (`widget_financial`, `widget_inventory_charts`, etc.), garantindo que a gestão pode restringir métricas financeiras ou operacionais por perfil.
*   **🛠️ Tools Menu Fix:** Correção da visibilidade do menu "Ferramentas" e submenus para o SuperAdmin e perfis autorizados.
*   **📱 Mobile Navigation:** Reestruturação do menu mobile para incluir todos os módulos (Organização, Ativos, Compliance, Relatórios).
*   **🌍 Dashboard I18n:** Implementação total de chaves de tradução nos dashboards operacionais e C-Level para suporte a Inglês (EN).

### Versão 3.0 (Security Hardening & Cleanup)
*   **🔐 RBAC v4.5:** Implementação de um script de limpeza profunda que remove políticas RLS antigas antes de aplicar as novas regras granulares.
*   **🛡️ Hardening v5.0:** Extensão da segurança RLS a todas as tabelas de configuração.

---

## 3. Arquitetura de Segurança (RBAC)

A segurança do AIManager é imposta diretamente no motor da base de dados (PostgreSQL).

### Mecanismo de Permissões
1.  **Tabela `config_custom_roles`:** Armazena um objeto JSONB com a matriz de permissões.
2.  **Função `public.has_permission()`:** Verifica o papel do utilizador atual (via `auth.uid()`), consulta o JSON e retorna `true/false`.
3.  **Widgets:** O dashboard é composto por widgets independentes cuja visibilidade é controlada pelas chaves `widget_*` no RBAC.

---

## 4. Estrutura do Projeto

### 🧠 Core (Núcleo)
*   **`App.tsx`**: Orquestrador principal e routing.
*   **`types.ts`**: Definição de tipos TypeScript.

### 📦 Módulos Funcionais
*   **InventoryManager:** Equipamentos, Licenças, Aquisições.
*   **OrganizationManager:** RH, Entidades, Fornecedores, Onboarding.
*   **TicketManager:** Service Desk, SLAs.
*   **ComplianceManager:** NIS2, BIA, Riscos, Backups.
*   **SettingsManager:** Configurações globais, Automação, RBAC.

---

## 5. Localização e Idioma
A aplicação utiliza um `LanguageContext` que suporta PT e EN. Os dashboards foram convertidos para utilizar chaves dinâmicas, permitindo uma transição fluida entre idiomas sem recarregamento da página.
