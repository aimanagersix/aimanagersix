
# 📘 AIManager - Documentação Técnica & Funcional

## 1. Visão Geral
O **AIManager** é uma plataforma empresarial para Gestão de Ativos de TI (ITAM), Service Desk e Compliance (NIS2/DORA). A aplicação foca-se na automação de processos através de IA (Google Gemini) e na centralização de dados organizacionais com segurança robusta ao nível da base de dados.

---

## 2. Regras de Negócio: Módulo de Tickets

### Fluxo de Criação (Utilizador Comum)
Para garantir a padronização e triagem eficiente, utilizadores sem perfil técnico/admin têm restrições na abertura de tickets:
*   **Categoria:** Fixa em "Geral" (alterável apenas pela equipa de Triagem).
*   **Estado:** Inicializa sempre como "Pedido".
*   **Equipa:** Atribuído automaticamente à equipa de **Triagem**.
*   **Técnico:** "Não Atribuído" na fase inicial.

### Sistema de Notificações & Automação
1.  **Triagem Inicial:** Ao abrir um ticket, todos os membros da equipa "Triagem" recebem notificação no sistema (Sino) e uma mensagem no Chat Interno.
2.  **Atribuição:** Quando a Triagem move o ticket para uma equipa especializada:
    *   O estado muda automaticamente para **"Em progresso"**.
    *   Todos os membros da nova equipa são notificados via Chat e Sistema.
3.  **Feedback ao Utilizador:** Qualquer registo de atividade técnica dispara uma mensagem automática para o requerente, garantindo transparência no processo.

---

## 3. Histórico de Versões e Changelog

### **Versão 3.6 (Ticket Automation & Notifications)**
*   **🤖 Auto-Triagem:** Atribuição automática à equipa "Triagem" na criação.
*   **📧 Mensagens Internas:** Disparo de alertas no chat para mudanças de equipa e novas atividades.
*   **🔄 Workflow de Estados:** Transição automática de "Pedido" para "Em progresso" na atribuição de equipa.

... (restante do documento preservado) ...
