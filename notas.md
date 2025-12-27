# 📝 Notas e Sugestões do Engenheiro - AIManager

## 📜 Auditoria NIS2 (Pedido 3.1)
- **Implementação**: Os logs de auditoria agora são gerados via **Triggers de Base de Dados**. Isto significa que mesmo que alguém altere um daddo diretamente no painel do Supabase, o sistema irá registar quem foi e o que mudou.
- **Vantagem**: Garante conformidade total com os requisitos de "Logging e Monitorização" da diretiva NIS2 sem depender apenas do código da App.

## 📦 Fluxo de Receção de Ativos (Pedido 3.2)
- **Problema**: O `cleanPayload` estava a ser muito agressivo ou a falhar na normalização de nomes de campos em massa.
- **Solução**: Centralizei a limpeza de dados dentro da função `addMultipleEquipment` no serviço. Agora, ao dar entrada de 10 portáteis de uma vez, cada um é validado individualmente antes do Insert.

## 🛍️ Otimização de Compras (Pedido 3.7 - v5.1)
- **Ficha de Consulta**: Implementado o `ProcurementDetailModal.tsx`. Agora, ao clicar numa aquisição, o utilizador vê primeiro um resumo profissional e limpo, podendo daí imprimir ou editar.
- **Motor de Impressão**: Criado um layout específico para impressão de pedidos de compra, ideal para submeter a assinaturas físicas ou arquivo digital com logótipo institucional.
- **Normalização de Labels**: As colunas de seleção agora adaptam-se ao contexto:
    - **Categoria**: Reflete o Tipo (HW) ou Categoria (SW).
    - **Tipo/Marca**: Reflete a Marca (HW) ou Produto Standard (SW).

## ⚖️ Governança de Aquisições & DORA (Pedido 3.3 & 3.6)
- **Equipa de Aprovação**: Implementada a lógica onde uma equipa específica detém o poder de aprovação.
- **Workflow de Estados**: Adicionados botões de transição direta (Aprovar, Rejeitar, Receber) na nova aba de Governança, vinculando o ID do aprovador e a data automaticamente.

## 🎨 Padronização Estética (v5.1)
- **Fornecedores**: Reduzida a escala visual do dashboard e modais para alinhar com o aspeto profissional e compacto dos outros módulos.
- **Freeze UI**: Mantida a integridade funcional de todos os outros menus enquanto se corrigiam as proporções dos fornecedores.

## 🤖 Contexto IA Profundo (MCP)
- **Implementação**: Adicionada aba "Contexto IA (MCP)" nas Definições do Sistema.

---
*Documento gerado em conformidade com as instruções do utilizador (Freeze UI / Zero Refactoring).*