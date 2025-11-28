import { test, expect } from '@playwright/test';

const TEST_USER = {
    email: 'josefsmoreira@outlook.com', 
    password: 'QSQmZf62!' 
};

test.describe('Inventory Management', () => {

  // Login antes de cada teste
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('input[name="email"]').fill(TEST_USER.email);
    await page.locator('input[name="password"]').fill(TEST_USER.password);
    await page.getByRole('button', { name: 'Entrar' }).click();
    // Esperar que o dashboard carregue
    await expect(page.getByText('Visão Geral').first()).toBeVisible({ timeout: 15000 });
  });

  test('should create a new equipment item successfully', async ({ page }) => {
    // 1. Navegar para Inventário (Clicar no menu lateral/topo)
    // Usamos getByRole para ser mais específico ou texto
    await page.click('text=Inventário'); 
    
    // Verificar se estamos na página certa
    await expect(page.getByRole('heading', { name: 'Inventário de Equipamentos' })).toBeVisible();

    // 2. Abrir Modal de Adicionar
    await page.getByRole('button', { name: 'Adicionar' }).first().click();
    await expect(page.getByRole('heading', { name: 'Adicionar Novo Equipamento' })).toBeVisible();

    // 3. Preencher Formulário
    const uniqueSerial = `E2E-${Date.now()}`;
    await page.locator('input[name="serialNumber"]').fill(uniqueSerial);
    
    // Selecionar a primeira opção disponível para Marca e Tipo
    // Nota: index 0 é geralmente o placeholder "-- Selecione --", por isso usamos index 1
    await page.locator('select[name="brandId"]').selectOption({ index: 1 });
    await page.locator('select[name="typeId"]').selectOption({ index: 1 });
    
    await page.locator('textarea[name="description"]').fill('Automated Test Asset via Playwright');
    await page.locator('input[name="purchaseDate"]').fill('2024-01-01');

    // 4. Submeter
    await page.getByRole('button', { name: 'Adicionar Equipamento' }).click();

    // 5. Verificação
    // O modal deve fechar
    await expect(page.getByRole('heading', { name: 'Adicionar Novo Equipamento' })).not.toBeVisible();
    
    // O novo serial deve aparecer na tabela (pode ser necessário filtrar se houver muitos items, 
    // mas como é o mais recente ou se usarmos o filtro de pesquisa do dashboard é mais seguro)
    
    // Vamos usar o filtro de pesquisa do dashboard para garantir que o encontramos
    await page.locator('input[name="serialNumber"]').fill(uniqueSerial);
    
    // Aguardar um pouco para a lista atualizar (ou verificar se aparece na tabela)
    await expect(page.getByRole('cell', { name: uniqueSerial })).toBeVisible();
  });
});