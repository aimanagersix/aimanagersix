# 📝 Notas e Sugestões do Engenheiro - AIManager

## 📜 Auditoria NIS2 (Pedido 3.1)
- **Implementação**: Os logs de auditoria agora são gerados via **Triggers de Base de Dados**. Isto significa que mesmo que alguém altere um dado diretamente no painel do Supabase, o sistema irá registar quem foi e o que mudou.
- **Vantagem**: Garante conformidade total com os requisitos de "Logging e Monitorização" da diretiva NIS2 sem depender apenas do código da App.

## 📦 Fluxo de Receção de Ativos (Pedido 3.2, 3.3 & 3.4)
- **Placeholders de Aquisição**: Corrigido o erro "Erro ao criar ativos" ao gerar identificadores temporários. 
- **Prefixo Administrativo**: Utilização do prefixo solicitado **AQÇ-[XXXX]-[N]** para equipamentos sem número de série físico.
- **Estado Automático**: Equipamentos que recebam S/N temporário são forçados para o estado **"Aquisição"**, permitindo filtragem imediata na listagem de equipamentos para posterior atualização de dados reais.
- **Entrada em Massa**: Adicionada a funcionalidade de colar uma lista de S/N diretamente no modal de receção.
- **Scan Contínuo**: Implementado um motor de câmara que permite "bipar" vários equipamentos sequencialmente.

## ⚖️ Governança de Aquisições & DORA (Pedido 3.3)
- **Equipa de Aprovação**: Implementada a lógica onde uma equipa específica detém o poder de aprovação.
- **Visibilidade**: Adicionados Badges visuais no dashboard de Equipas. 

## 🤖 Contexto IA Profundo (MCP)
- **Implementação**: Adicionada aba "Contexto IA (MCP)" nas Definições do Sistema.
- **Objetivo**: Fornecer ao administrador os links e comandos necessários para ligar ferramentas de IA externas diretamente à base de dados Supabase.

## ⚡ Protocolo de Memória IA
- **Dica**: Se iniciares um novo chat comigo, usa a frase: **"Gemi, ativa o Protocolo AIManager-Master (Ref: docs/database_schema.md)"**. 
- **Efeito**: Isto sinaliza-me imediatamente que tenho permissão total de consulta ao teu Supabase e que devo ler a documentação técnica para agir como o teu Engenheiro Sénior.

---
*Documento gerado em conformidade com as instruções do utilizador (Freeze UI / Zero Refactoring).*