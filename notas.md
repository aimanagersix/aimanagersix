# 📝 Notas e Sugestões do Engenheiro - AIManager

## 📜 Auditoria NIS2 (Pedido 3.1)
- **Implementação**: Os logs de auditoria agora são gerados via **Triggers de Base de Dados**. Isto significa que mesmo que alguém altere um daddo diretamente no painel do Supabase, o sistema irá registar quem foi e o que mudou.
- **Vantagem**: Garante conformidade total com os requisitos de "Logging e Monitorização" da diretiva NIS2 sem depender apenas do código da App.

## 📦 Fluxo de Receção de Ativos (Pedido 3.2)
- **Problema**: O `cleanPayload` estava a ser muito agressivo ou a falhar na normalização de nomes de campos em massa.
- **Solução**: Centralizei a limpeza de dados dentro da função `addMultipleEquipment` no serviço. Agora, ao dar entrada de 10 portáteis de uma vez, cada um é validado individualmente antes do Insert.

## 🛍️ Otimização de Compras (Pedido 3.7 - v5.0)
- **Layout Eficiente**: Restaurada a UI baseada em linhas para a composição do pedido. Isto permite uma visão em grelha muito mais próxima de um ERP profissional, facilitando a gestão de 10-20 itens por compra.
- **Normalização de Labels**: As colunas de seleção agora adaptam-se ao contexto:
    - **Categoria**: Reflete o Tipo (HW) ou Categoria (SW).
    - **Tipo/Marca**: Reflete a Marca (HW) ou Produto Standard (SW).
- **Catálogo de Software**: A coluna "Tipo/Marca" para itens de software agora consome o catálogo padrão, garantindo que as aquisições usem nomes normalizados para facilitar o inventário futuro.

## ⚖️ Governança de Aquisições & DORA (Pedido 3.3 & 3.6)
- **Equipa de Aprovação**: Implementada a lógica onde uma equipa específica detém o poder de aprovação.
- **Workflow de Estados**: Adicionados botões de transição direta (Aprovar, Rejeitar, Receber) na nova aba de Governança, vinculando o ID do aprovador e a data automaticamente.
- **Preparação para Notificações**: A estrutura por equipa permite que, numa fase seguinte, possamos isolar os destinatários dos alertas apenas para os membros desse grupo DORA.

## 🐛 Bug Fix: Schema Cache Items (v5.1)
- **Problema**: A aplicação tentava gravar o array `items` diretamente na tabela `procurement_requests`, causando erro de coluna inexistente.
- **Solução**: Atualizada a `blackList` do `cleanPayload` para ignorar `items`. O serviço agora separa corretamente a gravação do cabeçalho da gravação dos detalhes (`procurement_items`).
- **Nº de Requisição**: Reconfirmado que o campo `order_reference` mapeia para esta necessidade funcional, sendo propagado para os equipamentos no ato da receção.

## 🤖 Contexto IA Profundo (MCP)
- **Implementação**: Adicionada aba "Contexto IA (MCP)" nas Definições do Sistema.

---
*Documento gerado em conformidade com as instruções do utilizador (Freeze UI / Zero Refactoring).*