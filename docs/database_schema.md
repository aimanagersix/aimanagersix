# Documentação do Schema de Base de Dados AIManager

Este documento serve de referência para todos os scripts SQL da consola interna.

## Tabelas de Organização e RH
- **institutions**: Dados das instituições sede. (id, name, codigo, email, nif, etc)
- **entities**: Departamentos ou locais físicos. (id, instituicao_id, codigo, name, email, responsavel, etc)
- **collaborators**: Funcionários e utilizadores. (id, full_name, email, role, status, instituicao_id, entidade_id, job_title_id, etc)
- **config_job_titles**: Catálogo de cargos profissionais. (id, name)
- **contact_titles**: Tratos honoríficos (Sr., Dr., etc). (id, name)
- **contact_roles**: Papéis de contacto externo (Comercial, Técnico, etc). (id, name)

## Tabelas de Inventário
- **brands**: Fabricantes de hardware e software. (id, name, risk_level, is_iso27001_certified)
- **equipment_types**: Categorias de hardware. (id, name, requirements...)
- **equipment**: Ativos físicos. (id, brand_id, type_id, serial_number, status, nome_na_rede, etc)
- **software_licenses**: Chaves e subscrições. (id, product_name, license_key, total_seats, status, etc)
- **config_software_categories**: Categorias de catálogo de software. (id, name)
- **config_software_products**: Nomes padrão de produtos. (id, name, category_id)

## Tabelas de Suporte
- **teams**: Equipas técnicas. (id, name, description, is_active)
- **team_members**: Vínculo entre colaboradores e equipas. (id, team_id, collaborator_id)
- **ticket_categories**: Categorias de helpdesk e SLAs. (id, name, is_active, is_security, sla...)
- **security_incident_types**: Tipos de ataque (Ransomware, Phishing, etc). (id, name, description)
- **tickets**: Registo de incidentes e pedidos. (id, title, description, status, category, equipment_id, etc)
- **messages**: Chat interno e notificações de sistema. (id, sender_id, receiver_id, content, read)

## Tabelas de Configuração (Standard)
- **config_equipment_statuses**: Estados de vida do ativo.
- **config_ticket_statuses**: Estados do fluxo de suporte.
- **config_license_statuses**: Estados de subscrição.
- **config_cpus / config_ram_sizes / config_storage_types**: Mapeamento de hardware.
- **config_decommission_reasons**: Motivos de abate/saída de ativos.
- **config_accounting_categories**: Classificadores CIBE/SNC-AP.
- **config_conservation_states**: Estado físico do material.
- **config_collaborator_deactivation_reasons**: Motivos de saída de funcionários.

## Sistema e Segurança
- **config_custom_roles**: Perfis RBAC personalizados.
- **global_settings**: Chaves de API, webhooks e configurações de sistema.
- **audit_log**: Registo de todas as operações CRUD e segurança.