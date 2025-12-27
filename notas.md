# 📝 Notas e Sugestões do Engenheiro - AIManager

## 🛠️ Concluído no Pedido 3 (Restauração Supplier Modal)

### 1. Reestruturação Visual (Suppliers)
- **Ações:** O modal de fornecedores foi reconstruído com base no layout de alta performance do projeto anterior.
- **Destaque:** Implementação de **Cards de Contexto** (Identificação, Canais, Localização, Risco) para reduzir a carga cognitiva do utilizador.
- **NIS2/DORA:** Reforço do bloco de conformidade com dropdowns coloridos para níveis de risco e campos obrigatórios para validade de certificados ISO.

### 2. Gestão de Contratos (DORA Art. 28º)
- **Melhoria:** O formulário de contratos agora inclui explicitamente o mapeamento de **Serviços Críticos Suportados** e **Estratégias de Saída**.
- **UX:** Adicionada transição visual nas abas (Abas Responsivas) para melhorar a navegação em dispositivos móveis e ecrãs pequenos.

---

## ☁️ Sugestões do Engenheiro

### 3. Automatização de NIF (Aviso)
- Notei que a consulta de NIF via API externa (`nif.pt`) utiliza uma chave de demonstração. Para produção, recomendo que o cliente obtenha uma chave Pro para evitar limites de taxa (rate limiting) durante auditorias massivas.

### 4. Gestão de Documentos (Attachments)
- O sistema atual armazena arquivos como `base64` no JSON (coluna `attachments`). Para o projeto `yyiw...`, sugiro migrar futuramente para o **Supabase Storage** (Bucket `supplier-documents`) para garantir performance ao carregar fichas de fornecedores com muitos anexos.

---
*Documento gerado em conformidade com as instruções do utilizador (Freeze UI / Zero Refactoring).*
