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

## 🔒 Políticas RLS Sugeridas (Fix V3.7)
Se os dados semeados não aparecem no sistema, execute o seguinte bloco para garantir visibilidade aos utilizadores autenticados:

```sql
-- ATIVAR RLS E DEFINIR LEITURA GLOBAL PARA CONFIGURAÇÕES
DO $$ 
DECLARE 
    t text;
    tables_to_policy text[] := ARRAY[
        'config_custom_roles', 'config_job_titles', 'contact_titles', 'contact_roles', 
        'config_collaborator_deactivation_reasons', 'config_equipment_statuses', 
        'config_ticket_statuses', 'config_license_statuses', 'config_cpus', 
        'config_ram_sizes', 'config_storage_types', 'config_decommission_reasons', 
        'config_accounting_categories', 'config_conservation_states', 
        'config_software_categories', 'config_software_products', 'brands', 
        'equipment_types', 'ticket_categories', 'security_incident_types', 
        'teams', 'team_members', 'institutions', 'entities', 'collaborators', 'equipment', 'tickets'
    ];
BEGIN
    FOREACH t IN ARRAY tables_to_policy LOOP
        EXECUTE format('ALTER TABLE IF EXISTS %I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow read for authenticated users" ON %I', t);
        EXECUTE format('CREATE POLICY "Allow read for authenticated users" ON %I FOR SELECT TO authenticated USING (true)', t);
    END LOOP;
END $$;
```

---

## 🧪 Histórico de Triggers & Funções (Abaixo cole o resultado do script)

*(Aguardando colagem de resultados do Script de Inspeção v3.6...)*
