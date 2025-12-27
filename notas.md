# 📝 Notas e Sugestões do Engenheiro - AIManager

## 📜 Auditoria NIS2 (Pedido 3.1)
- **Implementação**: Os logs de auditoria agora são gerados via **Triggers de Base de Dados**. Isto significa que mesmo que alguém altere um dado diretamente no painel do Supabase, o sistema irá registar quem foi e o que mudou.
- **Vantagem**: Garante conformidade total com os requisitos de "Logging e Monitorização" da diretiva NIS2 sem depender apenas do código da App.

## 📦 Fluxo de Receção de Ativos (Pedido 3.2, 3.3, 3.4, 3.5 & 3.6)
- **Placeholders de Aquisição**: Corrigido o erro "Erro ao criar ativos" ao gerar identificadores temporários. 
- **Prefixo Administrativo**: Utilização do prefixo solicitado **AQÇ-[XXXX]-[N]** para equipamentos sem número de série físico.
- **Estado Automático**: Equipamentos que recebam S/N temporário são forçados para o estado **"Aquisição"**, permitindo filtragem imediata na listagem de equipamentos para posterior atualização de dados reais.
- **Entrada em Massa**: Adicionada a funcionalidade de colar uma lista de S/N diretamente no modal de receção.
- **Scan Contínuo**: Implementado um motor de câmara que permite "bipar" vários equipamentos sequencialmente.

## 🛍️ Otimização de Compras (Pedido 3.7 - v4.1)
- **Correção Crítica (Schema Cache)**: Resolvido o erro `Could not find column...` ao gravar aquisições. O sistema agora isola corretamente o array de itens antes de submeter o pedido principal à base de dados.
- **Revelação Progressiva**: O formulário de aquisições foi simplificado. Agora, primeiro escolhes a Marca e o Tipo, e a IA do frontend sugere a descrição.
- **Grelha de Itens**: Implementada uma lista compacta para os itens já adicionados. Isto remove o "scroll infinito" e permite gerir compras complexas com dezenas de itens de forma organizada.
- **Validação Inteligente**: Corrigido o erro de gravação onde o sistema exigia dados repetitivos. Títulos e Justificações são herdados do cabeçalho se não forem especificados no item.

## ⚖️ Governança de Aquisições & DORA (Pedido 3.3, 3.6 & 4.0)
- **Equipa de Aprovação**: Implementada a lógica onde uma equipa específica detém o poder de aprovação.
- **Arquitetura Master-Detail**: Conforme decidido, o sistema de aquisições foi elevado a um padrão ERP. Agora, um único pedido de compra pode conter múltiplos itens (ex: 5 Portáteis + 5 Monitores + 5 Licenças Office). 

## 🤖 Contexto IA Profundo (MCP)
- **Implementação**: Adicionada aba "Contexto IA (MCP)" nas Definições do Sistema.

---
*Documento gerado em conformidade com as instruções do utilizador (Freeze UI / Zero Refactoring).*