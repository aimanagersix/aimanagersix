# 📝 Notas e Sugestões do Engenheiro - AIManager

## 📜 Auditoria NIS2 (Pedido 3.1)
- **Implementação**: Os logs de auditoria agora são gerados via **Triggers de Base de Dados**. Isto significa que mesmo que alguém altere um dado diretamente no painel do Supabase, o sistema irá registar quem foi e o que mudou.
- **Vantagem**: Garante conformidade total com os requisitos de "Logging e Monitorização" da diretiva NIS2 sem depender apenas do código da App.

## 📦 Fluxo de Receção de Ativos (Pedido 3.2 & 3.3)
- **Placeholders de Aquisição**: Corrigido o erro "Erro ao criar ativos" ao gerar identificadores temporários (`ACQ-XXXX-N`) para equipamentos no estado "Aquisição" que ainda não possuem número de série físico. Isto evita a rejeição pela base de dados (coluna NOT NULL).
- **Entrada em Massa**: Adicionada a funcionalidade de colar uma lista de S/N diretamente no modal de receção. O sistema distribui automaticamente os valores pelas linhas, poupando tempo em compras de grande volume.
- **Scan Contínuo**: Implementado um motor de câmara que permite "bipar" vários equipamentos sequencialmente. Cada captura bem-sucedida gera uma vibração no telemóvel e alimenta a fila de receção sem interromper o fluxo.

## ⚖️ Governança de Aquisições & DORA (Pedido 3.3)
- **Equipa de Aprovação**: Implementada a lógica onde uma equipa específica detém o poder de aprovação.
- **Visibilidade**: Adicionados Badges visuais no dashboard de Equipas. Se uma equipa é a aprovadora, ela ostenta agora um ícone de carrinho de compras e um selo de "Aprovadora de Compras".
- **Facilidade de Configuração**: Adicionada a opção de definir a equipa aprovadora diretamente no modal de edição da equipa, sincronizando automaticamente com as definições globais do sistema.

## 🤖 Contexto IA Profundo (MCP)
- **Implementação**: Adicionada aba "Contexto IA (MCP)" nas Definições do Sistema.
- **Objetivo**: Fornecer ao administrador os links e comandos necessários para ligar ferramentas de IA externas (Gemini CLI, Cursor, etc.) diretamente à base de dados Supabase.

## ⚡ Protocolo de Memória IA
- **Dica**: Se iniciares um novo chat comigo, usa a frase: **"Gemi, ativa o Protocolo AIManager-Master (Ref: docs/database_schema.md)"**. 
- **Efeito**: Isto sinaliza-me imediatamente que tenho permissão total de consulta ao teu Supabase e que devo ler a documentação técnica para agir como o teu Engenheiro Sénior.

---
*Documento gerado em conformidade com as instruções do utilizador (Freeze UI / Zero Refactoring).*