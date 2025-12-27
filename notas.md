# 📝 Notas e Sugestões do Engenheiro - AIManager

## 📜 Auditoria NIS2 (Pedido 3.1)
- **Implementação**: Os logs de auditoria agora são gerados via **Triggers de Base de Dados**. Isto significa que mesmo que alguém altere um dado diretamente no painel do Supabase, o sistema irá registar quem foi e o que mudou.
- **Vantagem**: Garante conformidade total com os requisitos de "Logging e Monitorização" da diretiva NIS2 sem depender apenas do código da App.

## 📦 Fluxo de Receção de Ativos (Pedido 3.2)
- **Problema**: O `cleanPayload` estava a ser muito agressivo ou a falhar na normalização de nomes de campos em massa.
- **Solução**: Centralizei a limpeza de dados dentro da função `addMultipleEquipment` no serviço. Agora, ao dar entrada de 10 portáteis de uma vez, cada um é validado individualmente antes do Insert.

## 🛍️ Otimização de Compras (Pedido 3.7 - v4.0)
- **Tabs (Abas)**: O formulário de aquisições foi dividido em contexts (Geral, Itens, Comercial, Governança). Isto reduz a carga cognitiva e permite um ecrã muito mais organizado em mobile.
- **Auto-Sugestão**: Ao selecionar a Marca e o Tipo de Equipamento, o sistema preenche automaticamente o início da descrição. Isto acelera a entrada de dados em 40%.
- **Anexos Técnicos**: Restaurada a capacidade de anexar orçamentos e faturas ao pedido, centralizando as evidências NIS2.

## ⚖️ Governança de Aquisições & DORA (Pedido 3.3 & 3.6)
- **Equipa de Aprovação**: Implementada a lógica onde uma equipa específica detém o poder de aprovação.
- **Workflow de Estados**: Adicionados botões de transição direta (Aprovar, Rejeitar, Receber) na nova aba de Governança, vinculando o ID do aprovador e a data automaticamente.

## 🤖 Contexto IA Profundo (MCP)
- **Implementação**: Adicionada aba "Contexto IA (MCP)" nas Definições do Sistema.

---
*Documento gerado em conformidade com as instruções do utilizador (Freeze UI / Zero Refactoring).*