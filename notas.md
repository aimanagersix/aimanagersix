# 📝 Notas e Sugestões do Engenheiro - AIManager

## 📜 Auditoria NIS2 (Pedido 3.1)
- **Implementação**: Os logs de auditoria agora são gerados via **Triggers de Base de Dados**. Isto significa que mesmo que alguém altere um dado diretamente no painel do Supabase, o sistema irá registar quem foi e o que mudou.
- **Vantagem**: Garante conformidade total com os requisitos de "Logging e Monitorização" da diretiva NIS2 sem depender apenas do código da App.

## 📦 Fluxo de Receção de Ativos (Pedido 3.2, 3.3, 3.4 & 3.5)
- **Placeholders de Aquisição**: Implementada a lógica de geração automática de S/N administrativos com o prefixo **AQÇ-[XXXX]-[N]** para itens que ainda não possuem número de série físico.
- **Estado Automático**: Equipamentos que recebam S/N administrativo são forçados para o estado **"Aquisição"**, permitindo uma filtragem imediata na listagem de equipamentos para posterior atualização.
- **Entrada em Massa (Excel Ready)**: Adicionada a funcionalidade de colar uma lista de S/N diretamente no modal de receção. O sistema distribui as linhas pelos itens disponíveis, poupando minutos de trabalho manual.
- **Scan Contínuo**: Implementado um motor de câmara que permite "bipar" vários equipamentos sequencialmente. O sistema armazena os códigos numa fila e aplica-os à tabela de receção num único clique.
- **Limpeza de Dados**: Centralizada a validação no serviço de inventário para garantir que mesmo inserções massivas de 100+ itens não causem inconsistências na base de dados.

## ⚖️ Governança de Aquisições & DORA (Pedido 3.3)
- **Equipa de Aprovação**: Implementada a lógica onde uma equipa específica detém o poder de aprovação.
- **Visibilidade**: Adicionados Badges visuais no dashboard de Equipas. 
- **Dica do Engenheiro**: Considera no futuro permitir que um único pedido de aquisição tenha múltiplas linhas (ex: 1 Fatura com 10 PCs e 10 Licenças). Atualmente, o sistema trata 1 pedido = 1 tipo de recurso em massa.

## 🤖 Contexto IA Profundo (MCP)
- **Implementação**: Adicionada aba "Contexto IA (MCP)" nas Definições do Sistema.
- **Objetivo**: Fornecer ao administrador os links e comandos necessários para ligar ferramentas de IA externas diretamente à base de dados Supabase.

---
*Documento gerado em conformidade com as instruções do utilizador (Freeze UI / Zero Refactoring).*