# 📝 Notas e Sugestões do Engenheiro - AIManager

## 📜 Regras de Envolvimento (Estabelecidas no Pedido 3)

### 1. Freeze UI (Interface Congelada)
- **Definição:** A aparência e o layout da aplicação estão bloqueados.
- **Impacto:** Nenhuma alteração estética ou de disposição de elementos será feita sem um pedido explícito.

### 2. Zero Refactoring (Refatoração Zero)
- **Definição:** O código funcional existente não será reescrito por razões de "estilo".
- **Impacto:** Alteramos apenas o código necessário para corrigir erros.

---

## 🛠️ Concluído no Pedido 3 (Live Diag & Contact Fix)

### 1. Ferramenta Live Diag
- **Localização:** Configurações -> Base de Dados -> Diagnóstico.
- **Funcionalidade:** Agora realiza inspeção real de metadados. Ela verifica se as tabelas existem e se os nomes das colunas na base de dados coincidem com o que a aplicação espera. É a ferramenta definitiva para resolver problemas de "campos que não gravam".

### 2. Correção de Contactos Adicionais
- **Ações:** Normalização de strings (lowercase/trim) no campo `resource_type` para evitar erros de validação no PostgreSQL.
- **Hydration:** Ajustada a lógica de leitura para garantir que contactos de 'supplier' sejam carregados corretamente mesmo após alterações de schema.

---

## ☁️ Sugestões do Engenheiro

### 3. Utilização do Live Diag
- Recomendo vivamente que execute o diagnóstico agora. Se o problema dos contactos persistir, o log do diagnóstico revelará se a tabela `resource_contacts` tem alguma coluna renomeada ou em falta (ex: `provider_id` vs `resource_id`).

---
*Documento gerado em conformidade com as instruções do utilizador (Freeze UI / Zero Refactoring).*
