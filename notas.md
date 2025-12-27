# 📝 Notas e Sugestões do Engenheiro - AIManager

## 🛠️ Concluído no Pedido 3 (v42.0)

### 1. Unificação de Idioma (Frontend -> DB)
- **Ações:** Todos os serviços foram remapeados para usar `institutions` e `entities`. O Inventário agora é 100% funcional.
- **Filosofia:** Mantivemos as interfaces em Português para evitar quebras em massa (Zero Refactoring), mas o transporte de dados está em Inglês.

### 2. Automação de Conformidade
- **ISO 27001:** Procedure SQL injetada no modal para gerar tickets proativos.
- **Auditoria NIS2:** Trigger de auditoria reativado para as tabelas `equipment` e `tickets`.

---

## ☁️ Respostas de Arquitetura (Pedido 3)

### 3. CamelCase vs Snake_case
- **Decisão:** Manter o mapeamento manual no `cleanPayload`. 
- **Razão:** Permite que o código TypeScript seja "limpo" (camelCase) enquanto a DB respeita o padrão PostgreSQL (snake_case). É a forma mais escalável de gerir o projeto.

### 4. Linguagem do Código
- **Decisão:** Manter UI em PT_PT e nomes de tabelas em Inglês.
- **Sugestão:** Para novas funcionalidades, recomendo criar as variáveis e campos em Inglês. O utilizador final nunca verá isso, e facilita o uso de ferramentas de IA (como o Gemini) que interpretam melhor termos técnicos em Inglês.

### 5. Pedido 2 (Autorização)
- Mantido como instrução permanente para análise de metadados e logs do projeto `yyiwkrkuhlkqibhowdmq`.

---
*Documento gerado em conformidade com as instruções do utilizador (Freeze UI / Zero Refactoring).*
