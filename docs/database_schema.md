# 🛡️ AIManager - Fonte da Verdade (Database Schema)

Este documento é a referência oficial para o schema de base de dados. Utilize o **Script de Inspeção** disponível na consola de Base de Dados (Aba Funções) para validar a sua instância atual.

---

## 📋 Como Gerar a Documentação Atualizada
Execute o seguinte script no SQL Editor do Supabase para obter a lista exata de todos os metadados (Tabelas, Triggers, Funções e Políticas RLS):

```sql
-- SCRIPT DE INSPEÇÃO DE METADADOS COMPLETO (V3.6)
SELECT 'TABELA' as tipo, table_name as nome, column_name as detalhe, data_type as extra, is_nullable as opcional 
FROM information_schema.columns 
WHERE table_schema = 'public'
UNION ALL
SELECT 'TRIGGER' as tipo, trigger_name as nome, event_object_table as detalhe, event_manipulation as extra, 'N/A' as opcional 
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
UNION ALL
SELECT 'FUNÇÃO' as tipo, routine_name as nome, routine_type as detalhe, data_type as extra, 'N/A' as opcional 
FROM information_schema.routines 
WHERE routine_schema = 'public'
UNION ALL
SELECT 'RLS_POLICY' as tipo, policyname as nome, tablename as detalhe, cmd as extra, roles::text as opcional 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tipo, nome;
```

---

## 🏗️ Estrutura de Tabelas (Referência V3.6)

### 👥 Organização & RH
- **institutions**: Unidades administrativas de topo.
- **entities**: Subunidades, departamentos ou locais físicos.
- **collaborators**: Cadastro central de pessoas e técnicos.
- **config_job_titles**: Dicionário de cargos profissionais.
- **contact_titles**: Tratos honoríficos (Sr., Dr., Prof., etc).
- **contact_roles**: Papéis de contacto externo.
- **config_collaborator_deactivation_reasons**: Motivos de saída de RH.

### 💻 Ativos & Inventário
- **brands**: Fabricantes de Hardware e Software (com Risco NIS2).
- **equipment_types**: Categorias de hardware e seus requisitos de campo.
- **equipment**: Ativos físicos (S/N, Specs, Localização).
- **software_licenses**: Chaves, subscrições e contagem de seats.
- **config_software_categories**: Agrupadores do catálogo de software.
- **config_software_products**: Nomes padrão de produtos para normalização.

### 🎫 Suporte & NIS2
- **teams**: Equipas de Service Desk e Segurança.
- **team_members**: Associação N-para-N entre técnicos e equipas.
- **ticket_categories**: Árvore de categorias, SLAs e flag de segurança.
- **security_incident_types**: Tipos de ataque para conformidade NIS2.
- **tickets**: Registo central de ocorrências.
- **ticket_activities**: Notas técnicas e intervenções.

### ⚙️ Sistema & Compliance
- **global_settings**: Variáveis de ambiente e chaves de integração.
- **audit_log**: Rasto completo de operações (Segurança).
- **config_custom_roles**: Definições de permissões RBAC.
- **automation_rules**: Motores de workflow (Se... Então...).
- **backup_executions**: Evidências de testes de restauro.
- **resilience_tests**: Pentests e DRP logs.

---

## 🧪 Histórico de Triggers & Funções (Abaixo cole o resultado do script)
[
  {
    "tipo": "FUNÇÃO",
    "nome": "cleanup_old_messages",
    "detalhe": "FUNCTION",
    "extra": "void",
    "opcional": "N/A"
  },
  {
    "tipo": "FUNÇÃO",
    "nome": "get_sophos_config",
    "detalhe": "FUNCTION",
    "extra": "record",
    "opcional": "N/A"
  },
  {
    "tipo": "FUNÇÃO",
    "nome": "log_changes",
    "detalhe": "FUNCTION",
    "extra": "trigger",
    "opcional": "N/A"
  },
  {
    "tipo": "FUNÇÃO",
    "nome": "update_modified_column",
    "detalhe": "FUNCTION",
    "extra": "trigger",
    "opcional": "N/A"
  },
  {
    "tipo": "RLS_POLICY",
    "nome": "Allow read access for authenticated users",
    "detalhe": "institutions",
    "extra": "SELECT",
    "opcional": "{authenticated}"
  },
  {
    "tipo": "RLS_POLICY",
    "nome": "Allow read access for authenticated users",
    "detalhe": "tickets",
    "extra": "SELECT",
    "opcional": "{authenticated}"
  },
  {
    "tipo": "RLS_POLICY",
    "nome": "Allow read access for authenticated users",
    "detalhe": "equipment",
    "extra": "SELECT",
    "opcional": "{authenticated}"
  },
  {
    "tipo": "RLS_POLICY",
    "nome": "Allow read access for authenticated users",
    "detalhe": "collaborators",
    "extra": "SELECT",
    "opcional": "{authenticated}"
  },
  {
    "tipo": "RLS_POLICY",
    "nome": "Allow read access for authenticated users",
    "detalhe": "entities",
    "extra": "SELECT",
    "opcional": "{authenticated}"
  },
  {
    "tipo": "RLS_POLICY",
    "nome": "Message Privacy",
    "detalhe": "messages",
    "extra": "SELECT",
    "opcional": "{authenticated}"
  },
  {
    "tipo": "TABELA",
    "nome": "audit_log",
    "detalhe": "action",
    "extra": "text",
    "opcional": "NO"
  },
  {
    "tipo": "TABELA",
    "nome": "audit_log",
    "detalhe": "user_email",
    "extra": "text",
    "opcional": "YES"
  },
  {
    "tipo": "TABELA",
    "nome": "audit_log",
    "detalhe": "details",
    "extra": "text",
    "opcional": "YES"
  },
  {
    "tipo": "TABELA",
    "nome": "audit_log",
    "detalhe": "timestamp",
    "extra": "timestamp with time zone",
    "opcional": "YES"
  },
  {
    "tipo": "TABELA",
    "nome": "audit_log",
    "detalhe": "resource_type",
    "extra": "text",
    "opcional": "YES"
  },
  {
    "tipo": "TABELA",
    "nome": "audit_log",
    "detalhe": "id",
    "extra": "uuid",
    "opcional": "NO"
  },
  {
    "tipo": "TABELA",
    "nome": "brands",
    "detalhe": "security_contact_email",
    "extra": "text",
    "opcional": "YES"
  },
  {
    "tipo": "TABELA",
    "nome": "brands",
    "detalhe": "risk_level",
    "extra": "text",
    "opcional": "YES"
  },
  {
    "tipo": "TABELA",
    "nome": "brands",
    "detalhe": "name",
    "extra": "text",
    "opcional": "NO"
  },
  {
    "tipo": "TABELA",
    "nome": "brands",
    "detalhe": "is_iso27001_certified",
    "extra": "boolean",
    "opcional": "YES"
  },
  {
    "tipo": "TABELA",
    "nome": "brands",
    "detalhe": "id",
    "extra": "uuid",
    "opcional": "NO"
  },
  {
    "tipo": "TABELA",
    "nome": "collaborators",
    "detalhe": "email",
    "extra": "text",
    "opcional": "NO"
  },
  {
    "tipo": "TABELA",
    "nome": "collaborators",
    "detalhe": "entidade_id",
    "extra": "uuid",
    "opcional": "YES"
  },
  {
    "tipo": "TABELA",
    "nome": "collaborators",
    "detalhe": "job_title_id",
    "extra": "uuid",
    "opcional": "YES"
  },
  {
    "tipo": "TABELA",
    "nome": "collaborators",
    "detalhe": "admission_date",
    "extra": "date",
    "opcional": "YES"
  },
  {
    "tipo": "TABELA",
    "nome": "collaborators",
    "detalhe": "password_updated_at",
    "extra": "timestamp with time zone",
    "opcional": "YES"
  },
  {
    "tipo": "TABELA",
    "nome": "collaborators",
    "detalhe": "created_at",
    "extra": "timestamp with time zone",
    "opcional": "YES"
  },
  {
    "tipo": "TABELA",
    "nome": "collaborators",
    "detalhe": "photo_url",
    "extra": "text",
    "opcional": "YES"
  },
  {
    "tipo": "TABELA",
    "nome": "collaborators",
    "detalhe": "telefone_interno",
    "extra": "text",
    "opcional": "YES"
  },
  {
    "tipo": "TABELA",
    "nome": "collaborators",
    "detalhe": "telemovel",
    "extra": "text",
    "opcional": "YES"
  },
  {
    "tipo": "TABELA",
    "nome": "collaborators",
    "detalhe": "status",
    "extra": "text",
    "opcional": "YES"
  },
  {
    "tipo": "TABELA",
    "nome": "collaborators",
    "detalhe": "role",
    "extra": "text",
    "opcional": "YES"
  },
  {
    "tipo": "TABELA",
    "nome": "collaborators",
    "detalhe": "numero_mecanografico",
    "extra": "text",
    "opcional": "YES"
  },
  {
    "tipo": "TABELA",
    "nome": "collaborators",
    "detalhe": "id",
    "extra": "uuid",
    "opcional": "NO"
  },
  {
    "tipo": "TABELA",
    "nome": "collaborators",
    "detalhe": "full_name",
    "extra": "text",
    "opcional": "NO"
  },
  {
    "tipo": "TABELA",
    "nome": "collaborators",
    "detalhe": "instituicao_id",
    "extra": "uuid",
    "opcional": "YES"
  },
  {
    "tipo": "TABELA",
    "nome": "collaborators",
    "detalhe": "receives_notifications",
    "extra": "boolean",
    "opcional": "YES"
  },
  {
    "tipo": "TABELA",
    "nome": "collaborators",
    "detalhe": "can_login",
    "extra": "boolean",
    "opcional": "YES"
  },
  {
    "tipo": "TABELA",
    "nome": "config_accounting_categories",
    "detalhe": "name",
    "extra": "text",
    "opcional": "NO"
  },
  {
    "tipo": "TABELA",
    "nome": "config_accounting_categories",
    "detalhe": "id",
    "extra": "uuid",
    "opcional": "NO"
  },
  {
    "tipo": "TABELA",
    "nome": "config_collaborator_deactivation_reasons",
    "detalhe": "id",
    "extra": "uuid",
    "opcional": "NO"
  },
  {
    "tipo": "TABELA",
    "nome": "config_collaborator_deactivation_reasons",
    "detalhe": "name",
    "extra": "text",
    "opcional": "NO"
  },
  {
    "tipo": "TABELA",
    "nome": "config_conservation_states",
    "detalhe": "name",
    "extra": "text",
    "opcional": "NO"
  },
  {
    "tipo": "TABELA",
    "nome": "config_conservation_states",
    "detalhe": "color",
    "extra": "text",
    "opcional": "YES"
  },
  {
    "tipo": "TABELA",
    "nome": "config_conservation_states",
    "detalhe": "id",
    "extra": "uuid",
    "opcional": "NO"
  },
  {
    "tipo": "TABELA",
    "nome": "config_cpus",
    "detalhe": "name",
    "extra": "text",
    "opcional": "NO"
  },
  {
    "tipo": "TABELA",
    "nome": "config_cpus",
    "detalhe": "id",
    "extra": "uuid",
    "opcional": "NO"
  },
  {
    "tipo": "TABELA",
    "nome": "config_custom_roles",
    "detalhe": "description",
    "extra": "text",
    "opcional": "YES"
  },
  {
    "tipo": "TABELA",
    "nome": "config_custom_roles",
    "detalhe": "id",
    "extra": "uuid",
    "opcional": "NO"
  },
  {
    "tipo": "TABELA",
    "nome": "config_custom_roles",
    "detalhe": "created_at",
    "extra": "timestamp with time zone",
    "opcional": "YES"
  },
  {
    "tipo": "TABELA",
    "nome": "config_custom_roles",
    "detalhe": "permissions",
    "extra": "jsonb",
    "opcional": "YES"
  },
  {
    "tipo": "TABELA",
    "nome": "config_custom_roles",
    "detalhe": "name",
    "extra": "text",
    "opcional": "NO"
  },
  {
    "tipo": "TABELA",
    "nome": "config_decommission_reasons",
    "detalhe": "id",
    "extra": "uuid",
    "opcional": "NO"
  },
  {
    "tipo": "TABELA",
    "nome": "config_decommission_reasons",
    "detalhe": "name",
    "extra": "text",
    "opcional": "NO"
  },
  {
    "tipo": "TABELA",
    "nome": "config_equipment_statuses",
    "detalhe": "name",
    "extra": "text",
    "opcional": "NO"
  },
  {
    "tipo": "TABELA",
    "nome": "config_equipment_statuses",
    "detalhe": "color",
    "extra": "text",
    "opcional": "YES"
  },
  {
    "tipo": "TABELA",
    "nome": "config_equipment_statuses",
    "detalhe": "id",
    "extra": "uuid",
    "opcional": "NO"
  },
  {
    "tipo": "TABELA",
    "nome": "config_job_titles",
    "detalhe": "id",
    "extra": "uuid",
    "opcional": "NO"
  },
  {
    "tipo": "TABELA",
    "nome": "config_job_titles",
    "detalhe": "name",
    "extra": "text",
    "opcional": "NO"
  },
  {
    "tipo": "TABELA",
    "nome": "config_license_statuses",
    "detalhe": "color",
    "extra": "text",
    "opcional": "YES"
  },
  {
    "tipo": "TABELA",
    "nome": "config_license_statuses",
    "detalhe": "id",
    "extra": "uuid",
    "opcional": "NO"
  },
  {
    "tipo": "TABELA",
    "nome": "config_license_statuses",
    "detalhe": "name",
    "extra": "text",
    "opcional": "NO"
  },
  {
    "tipo": "TABELA",
    "nome": "config_ram_sizes",
    "detalhe": "name",
    "extra": "text",
    "opcional": "NO"
  },
  {
    "tipo": "TABELA",
    "nome": "config_ram_sizes",
    "detalhe": "id",
    "extra": "uuid",
    "opcional": "NO"
  },
  {
    "tipo": "TABELA",
    "nome": "config_software_categories",
    "detalhe": "id",
    "extra": "uuid",
    "opcional": "NO"
  },
  {
    "tipo": "TABELA",
    "nome": "config_software_categories",
    "detalhe": "name",
    "extra": "text",
    "opcional": "NO"
  },
  {
    "tipo": "TABELA",
    "nome": "config_software_products",
    "detalhe": "category_id",
    "extra": "uuid",
    "opcional": "YES"
  },
  {
    "tipo": "TABELA",
    "nome": "config_software_products",
    "detalhe": "id",
    "extra": "uuid",
    "opcional": "NO"
  },
  {
    "tipo": "TABELA",
    "nome": "config_software_products",
    "detalhe": "name",
    "extra": "text",
    "opcional": "NO"
  },
  {
    "tipo": "TABELA",
    "nome": "config_storage_types",
    "detalhe": "name",
    "extra": "text",
    "opcional": "NO"
  },
  {
    "tipo": "TABELA",
    "nome": "config_storage_types",
    "detalhe": "id",
    "extra": "uuid",
    "opcional": "NO"
  },
  {
    "tipo": "TABELA",
    "nome": "config_ticket_statuses",
    "detalhe": "name",
    "extra": "text",
    "opcional": "NO"
  },
  {
    "tipo": "TABELA",
    "nome": "config_ticket_statuses",
    "detalhe": "color",
    "extra": "text",
    "opcional": "YES"
  },
  {
    "tipo": "TABELA",
    "nome": "config_ticket_statuses",
    "detalhe": "id",
    "extra": "uuid",
    "opcional": "NO"
  },
  {
    "tipo": "TABELA",
    "nome": "contact_roles",
    "detalhe": "name",
    "extra": "text",
    "opcional": "NO"
  },
  {
    "tipo": "TABELA",
    "nome": "contact_roles",
    "detalhe": "id",
    "extra": "uuid",
    "opcional": "NO"
  },
  {
    "tipo": "TABELA",
    "nome": "contact_titles",
    "detalhe": "id",
    "extra": "uuid",
    "opcional": "NO"
  },
  {
    "tipo": "TABELA",
    "nome": "contact_titles",
    "detalhe": "name",
    "extra": "text",
    "opcional": "NO"
  },
  {
    "tipo": "TABELA",
    "nome": "entities",
    "detalhe": "city",
    "extra": "text",
    "opcional": "YES"
  },
  {
    "tipo": "TABELA",
    "nome": "entities",
    "detalhe": "id",
    "extra": "uuid",
    "opcional": "NO"
  },
  {
    "tipo": "TABELA",
    "nome": "entities",
    "detalhe": "instituicao_id",
    "extra": "uuid",
    "opcional": "YES"
  },
  {
    "tipo": "TABELA",
    "nome": "entities",
    "detalhe": "created_at",
    "extra": "timestamp with time zone",
    "opcional": "YES"
  },
  {
    "tipo": "TABELA",
    "nome": "entities",
    "detalhe": "codigo",
    "extra": "text",
    "opcional": "YES"
  },
  {
    "tipo": "TABELA",
    "nome": "entities",
    "detalhe": "name",
    "extra": "text",
    "opcional": "NO"
  },
  {
    "tipo": "TABELA",
    "nome": "entities",
    "detalhe": "description",
    "extra": "text",
    "opcional": "YES"
  },
  {
    "tipo": "TABELA",
    "nome": "entities",
    "detalhe": "email",
    "extra": "text",
    "opcional": "YES"
  },
  {
    "tipo": "TABELA",
    "nome": "entities",
    "detalhe": "nif",
    "extra": "text",
    "opcional": "YES"
  },
  {
    "tipo": "TABELA",
    "nome": "entities",
    "detalhe": "website",
    "extra": "text",
    "opcional": "YES"
  },
  {
    "tipo": "TABELA",
    "nome": "entities",
    "detalhe": "responsavel",
    "extra": "text",
    "opcional": "YES"
  },
  {
    "tipo": "TABELA",
    "nome": "entities",
    "detalhe": "telefone",
    "extra": "text",
    "opcional": "YES"
  },
  {
    "tipo": "TABELA",
    "nome": "entities",
    "detalhe": "status",
    "extra": "text",
    "opcional": "YES"
  },
  {
    "tipo": "TABELA",
    "nome": "entities",
    "detalhe": "address_line",
    "extra": "text",
    "opcional": "YES"
  },
  {
    "tipo": "TABELA",
    "nome": "entities",
    "detalhe": "postal_code",
    "extra": "text",
    "opcional": "YES"
  },
  {
    "tipo": "TABELA",
    "nome": "entities",
    "detalhe": "locality",
    "extra": "text",
    "opcional": "YES"
  },
  {
    "tipo": "TABELA",
    "nome": "equipment",
    "detalhe": "brand_id",
    "extra": "uuid",
    "opcional": "YES"
  },
  {
    "tipo": "TABELA",
    "nome": "equipment",
    "detalhe": "conservation_state_id",
    "extra": "uuid",
    "opcional": "YES"
  },
  {
    "tipo": "TABELA",
    "nome": "equipment",
    "detalhe": "id",
    "extra": "uuid",
    "opcional": "NO"
  },
  {
    "tipo": "TABELA",
    "nome": "equipment",
    "detalhe": "inventory_number",
    "extra": "text",
    "opcional": "YES"
  },
  {
    "tipo": "TABELA",
    "nome": "equipment",
    "detalhe": "decommission_reason_id",
    "extra": "uuid",
    "opcional": "YES"
  },
  {
    "tipo": "TABELA",
    "nome": "equipment",
    "detalhe": "created_at",
    "extra": "timestamp with time zone",
    "opcional": "YES"
  }
]
