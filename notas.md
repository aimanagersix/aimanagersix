# 📝 Notas e Sugestões do Engenheiro - AIManager

## 🛠️ Concluído no Pedido 3 (Supplier Management Core)

### 1. Resiliência DORA (Digital Operational Resilience Act)
- **Dashboard:** Reinstalação do **Widget de Concentração**. Este cálculo é vital para conformidade financeira/bancária em Portugal, alertando quando a operação depende excessivamente de um único fornecedor externo.
- **Contratos:** Adição obrigatória de campos de **Estratégia de Saída (Exit Strategy)**. Na auditoria NIS2, não basta ter o contrato; é preciso provar que a empresa consegue sobreviver se o fornecedor falir ou for atacado.

### 2. Automação e UI/UX
- **NIF & CP:** Restaurada a lógica de "Lookup" automático. 
- **Layout:** O modal agora utiliza cartões técnicos para separar responsabilidades, reduzindo a fadiga do utilizador ao preencher fichas complexas.

---

## ☁️ Sugestões do Engenheiro

### 3. Gestão de Contratos (Assinatura Digital)
- Notei que o sistema aceita referências a contratos. No futuro, seria interessante integrar um campo de **Hash SHA-256** do PDF assinado, para garantir a integridade do documento face a auditorias forenses.

### 4. Geolocalização Automática
- O sistema já preenche a morada. Sugiro que, ao gravar, a aplicação converta o Código Postal em coordenadas (Lat/Long) para que o fornecedor apareça automaticamente no **Mapa de Ativos**, permitindo visualizar a proximidade geográfica de fornecedores críticos em caso de catástrofe regional.

---
*Documento gerado em conformidade com as instruções do utilizador (Freeze UI / Zero Refactoring).*
