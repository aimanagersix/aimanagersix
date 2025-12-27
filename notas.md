# 📝 Notas e Sugestões do Engenheiro - AIManager

## 📜 Regras de Envolvimento

### 1. Freeze UI (Interface Congelada)
- **Status:** Ativo. Nenhuma alteração estética realizada, apenas adição funcional do botão de estado na lista de fornecedores.

### 2. Zero Refactoring (Refatoração Zero)
- **Status:** Ativo. Foco exclusivo na adição do campo `is_active`.

---

## 🛠️ Sugestão Técnica: Estados de Fornecedores (Pedido 3)

### 1. Importância NIS2 / DORA
José, a sua observação é extremamente pertinente. De acordo com as diretivas **NIS2** e **DORA**, a gestão da cadeia de abastecimento não termina na contratação. 
- Precisamos de saber se um fornecedor está **Suspenso** por falhas de segurança.
- Não podemos apagar o fornecedor da BD se houver ativos (PCs, Licenças) associados a ele, por motivos de auditoria forense.
- **Solução:** Implementei o campo `is_active` (Ativo/Inativo). Quando inativo, o fornecedor fica a cinzento na lista, sinalizando que não deve ser usado para novas aquisições, mas preservando todo o histórico.

### 2. SQL Patch v47.0
Adicionei o comando SQL necessário no modal de gestão de base de dados. Por favor, execute-o para que a coluna seja criada no seu projeto Supabase.

---
*Documento gerado em conformidade com as instruções do utilizador (Freeze UI / Zero Refactoring).*
