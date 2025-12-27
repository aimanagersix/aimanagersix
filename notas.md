# 📝 Notas e Sugestões do Engenheiro - AIManager

Este documento regista sugestões técnicas e observações de UX/UI para análise futura, mantendo as diretrizes de *Zero Refactoring* no código principal.

---

## 🛠️ Sugestões para Fornecedores (Pedido 3)

### 1. Integração com API de Moradas
**Observação:** Atualmente o utilizador preenche manualmente a localidade e cidade após o código postal.
**Sugestão:** Implementar o preenchimento automático via GeoAPI (já utilizado em outros módulos) para o formulário de fornecedores, reduzindo erros de digitação.

### 2. Validação de NIF em Tempo Real
**Observação:** A busca por NIF preenche os dados, mas não valida a estrutura se o utilizador digitar manualmente e saltar o campo.
**Sugestão:** Adicionar uma pequena badge visual (Check verde / Cross vermelho) ao lado do campo NIF para validar o algoritmo de Luhn (módulo 11) sem necessidade de chamada à API.

### 3. Layout de Detalhes Gerais
**Observação:** Com a adição do telefone, a grelha está a tornar-se densa.
**Sugestão:** Em ecrãs pequenos, poderíamos agrupar "Contactos de Negócio" (Email/Telefone) numa sub-secção visualmente distinta da "Identificação Fiscal" (NIF/Nome).

### 4. Gestão de Documentos (Attachments)
**Observação:** O limite de 3 ficheiros é rígido.
**Sugestão:** Considerar a criação de uma pasta específica no bucket do Supabase por fornecedor (`suppliers/{id}/*`) para permitir a gestão de documentos de conformidade (certificados ISO scanneados, termos de responsabilidade) sem sobrecarregar o registo da base de dados.

## 📱 Sugestões de UX Mobile (Pedido 3 - Parte 2)

### 5. Responsive Tabs Pattern
**Estado:** Implementado em Modais de Fornecedores, Equipamentos e Colaboradores.
**Sugestão:** Estender este padrão para as tabelas principais. Em dispositivos móveis, as tabelas com mais de 5 colunas devem ser renderizadas como "Cards" individuais para evitar scroll horizontal infinito.

### 6. Progressive Disclosure (Formulários Complexos)
**Estado:** Implementado nos Certificados de Fornecedores.
**Sugestão:** Aplicar este conceito no formulário de Equipamentos. Campos como "Rede" ou "Financeiro" só devem expandir se forem relevantes para o utilizador no momento da inserção.

---

## ☁️ Notas de Infraestrutura (yyiwkrkuhlkqibhowdmq)

### 7. Monitorização de Deploys
**Nota:** Como a IA não tem acesso ao dashboard do Vercel/GitHub, sugere-se a implementação de um **Health Check Endpoint** no Supabase. Uma função que devolve o status do sistema e pode ser consultada pela app para avisar o utilizador de manutenções ou falhas de deploy em tempo real.

### 8. Python & Mobile Apps
**Nota:** O script Python fornecido em "Configurações -> Agentes" é um ponto de partida. Para uma app de telemóvel real (Android/iOS), o uso de **Kivy** ou **Flutter** comunicando com a API REST do Supabase é o caminho recomendado para manter a integridade dos dados sem refactorizar o backend atual.

---
*Documento gerado em conformidade com as instruções do utilizador.*
