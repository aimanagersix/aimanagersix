# 📝 Notas e Sugestões do Engenheiro - AIManager

## 📜 Auditoria NIS2 (Pedido 3.1)
- **Implementação**: Os logs de auditoria agora são gerados via **Triggers de Base de Dados**. Isto significa que mesmo que alguém altere um dado diretamente no painel do Supabase, o sistema irá registar quem foi e o que mudou.
- **Vantagem**: Garante conformidade total com os requisitos de "Logging e Monitorização" da diretiva NIS2 sem depender apenas do código da App.

## 📦 Fluxo de Receção de Ativos (Pedido 3.2)
- **Problema**: O `cleanPayload` estava a ser muito agressivo ou a falhar na normalização de nomes de campos em massa.
- **Solução**: Centralizei a limpeza de dados dentro da função `addMultipleEquipment` no serviço. Agora, ao dar entrada de 10 portáteis de uma vez, cada um é validado individualmente antes do Insert.

## ⚖️ Governança de Aquisições (Pedido 3.3)
- **Equipa de Aprovação**: A sugestão de usar equipas é excelente. Evita a complexidade de perfis (Roles) para algo que pode ser rotativo.
- **Configuração**: Adicionei um campo em **Definições -> Geral** para escolher a equipa de aprovação. O sistema agora consulta se o utilizador pertence a essa equipa para exibir os botões de decisão.

---
*Documento gerado em conformidade com as instruções do utilizador (Freeze UI / Zero Refactoring).*
