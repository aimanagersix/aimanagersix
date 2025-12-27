# 📝 Notas e Sugestões do Engenheiro - AIManager

## 📜 Regras de Envolvimento (Estabelecidas no Pedido 3)

### 1. Freeze UI (Interface Congelada)
- **Definição:** A aparência e o layout da aplicação estão bloqueados.
- **Impacto:** Nenhuma alteração estética ou de disposição de elementos será feita sem um pedido explícito. Preservamos a familiaridade do utilizador com o sistema.

### 2. Zero Refactoring (Refatoração Zero)
- **Definição:** O código funcional existente não será reescrito por razões de "estilo" ou "limpeza".
- **Impacto:** Alteramos apenas o código necessário para corrigir erros ou adicionar funcionalidades. Se o código antigo funciona, ele permanece intocado para garantir a máxima compatibilidade e evitar a introdução de novos bugs em sistemas estáveis.

### 3. Autorização de Acesso à Base de Dados
- **Projeto:** `yyiwkrkuhlkqibhowdmq`
- **Permissão:** Consulta permanente de documentação, schema (tabelas, colunas), funções e triggers para garantir integridade técnica.

---

## 🛠️ Concluído no Pedido 3 (Restauração Supplier Modal)

### 1. Reestruturação Visual (Suppliers)
- **Ações:** O modal de fornecedores foi reconstruído com base no layout de alta performance do projeto anterior.
- **Destaque:** Implementação de **Cards de Contexto** (Identificação, Canais, Localização, Risco) para reduzir a carga cognitiva do utilizador.
- **NIS2/DORA:** Reforço do bloco de conformidade com dropdowns coloridos para níveis de risco e campos obrigatórios para validade de certificados ISO.

### 2. Correção de Visibilidade
- **Problema:** As abas de navegação internas da ficha técnica estavam a ser cortadas ou omitidas em resoluções menores ou durante a edição.
- **Solução:** Otimização do contentor flexível e restauração do seletor responsivo para mobile.

---

## ☁️ Sugestões do Engenheiro

### 3. Automatização de NIF (Aviso)
- Notei que a consulta de NIF via API externa (`nif.pt`) utiliza uma chave de demonstração. Para produção, recomendo que o cliente obtenha uma chave Pro para evitar limites de taxa (rate limiting) durante auditorias massivas.

### 4. Gestão de Documentos (Attachments)
- O sistema atual armazena arquivos como `base64` no JSON (coluna `attachments`). Para o projeto `yyiw...`, sugiro migrar futuramente para o **Supabase Storage** (Bucket `supplier-documents`) para garantir performance ao carregar fichas de fornecedores com muitos anexos.

---
*Documento gerado em conformidade com as instruções do utilizador (Freeze UI / Zero Refactoring).*
