# 🛡️ AIManager - Fonte da Verdade (Database Schema)

Este documento é a referência oficial para o schema de base de dados. Utilize o **Script de Inspeção** disponível na consola de Base de Dados (Aba Funções) para validar a sua instância atual.

---

## 📋 Como Gerar a Documentação Atualizada
Execute o seguinte script no SQL Editor do Supabase para obter a lista exata de campos:

```sql
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM 
    information_schema.columns 
WHERE 
    table_schema = 'public'
ORDER BY 
    table_name, ordinal_position;
```

---

## 🏗️ Estrutura de Tabelas (Referência V3.5)

### 👥 Organização & RH
- **institutions**: Unidades administrativas de topo (ex: Empresas do grupo).
- **entities**: Subunidades, departamentos ou locais físicos.
- **collaborators**: Cadastro central de pessoas, utilizadores e técnicos.
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