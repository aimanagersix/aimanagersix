# 📝 Notas e Sugestões do Engenheiro - AIManager

## 📜 Auditoria NIS2 (Pedido 3.1)
- **Implementação**: Os logs de auditoria agora são gerados via **Triggers de Base de Dados**. Isto significa que mesmo que alguém altere um dado diretamente no painel do Supabase, o sistema irá registar quem foi e o que mudou.
- **Vantagem**: Garante conformidade total com os requisitos de "Logging e Monitorização" da diretiva NIS2 sem depender apenas do código da App.

## 📦 Fluxo de Receção de Ativos (Pedido 3.2)
- **Problema**: O `cleanPayload` estava a ser muito agressivo ou a falhar na normalização de nomes de campos em massa.
- **Solução**: Centralizei a limpeza de dados dentro da função `addMultipleEquipment` no serviço. Agora, ao dar entrada de 10 portáteis de uma vez, cada um é validado individualmente antes do Insert.

## ⚖️ Governança de Aquisições & DORA (Pedido 3.3)
- **Equipa de Aprovação**: Implementada a lógica onde uma equipa específica detém o poder de aprovação.
- **Visibilidade**: Adicionados Badges visuais no dashboard de Equipas. Se uma equipa é a aprovadora, ela ostenta agora um ícone de carrinho de compras e um selo de "Aprovadora de Compras".
- **Facilidade de Configuração**: Adicionada a opção de definir a equipa aprovadora diretamente no modal de edição da equipa, sincronizando automaticamente com as definições globais do sistema.
- **Sugestão de Continuidade**: Recomendo que a equipa aprovadora seja composta por perfis com "Budget Authority" para que o fluxo DORA seja juridicamente vinculativo dentro da app.

## 🤖 Contexto IA Profundo (MCP)
- **Implementação**: Adicionada aba "Contexto IA (MCP)" nas Definições do Sistema.
- **Objetivo**: Fornecer ao administrador os links e comandos necessários para ligar ferramentas de IA externas (Gemini CLI, Cursor, etc.) diretamente à base de dados Supabase.
- **Sugestão do Engenheiro**: Ao configurar o MCP no seu ambiente local, poderá pedir à IA para "Analisar tendências de avarias nos últimos 6 meses" e ela terá acesso direto aos dados reais para gerar o relatório, sem que tenha de exportar CSVs.

---
*Documento gerado em conformidade com as instruções do utilizador (Freeze UI / Zero Refactoring).*