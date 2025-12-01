
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
    // 1. Navegação
    // Clicar no menu pai "Ativos" para abrir o dropdown
    await page.getByRole('button', { name: /Ativos/i }).click();
    
    // Pequena pausa para garantir que a animação do menu termina
    await page.waitForTimeout(500);
    
    // Clicar no submenu "Equipamentos" (procura pelo texto exato para evitar confusão)
    await page.getByText('Equipamentos', { exact: true }).click(); 
    
    // Verificar se o título da tabela carregou
    await expect(page.getByRole('heading', { name: 'Inventário de Equipamentos' })).toBeVisible();

    // 2. Abrir Modal de Adicionar
    await page.getByRole('button', { name: 'Adicionar' }).first().click();
    
    // Verificar se o modal abriu
    await expect(page.getByRole('heading', { name: /Adicionar/i }).first()).toBeVisible();

    // 3. Preencher Formulário
    const uniqueSerial = `E2E-${Date.now()}`;
    await page.locator('input[name="serialNumber"]').fill(uniqueSerial);
    
    // Selecionar opções (Index 1 para evitar o placeholder)
    await page.locator('select[name="brandId"]').selectOption({ index: 1 });
    await page.locator('select[name="typeId"]').selectOption({ index: 1 });
    
    await page.locator('textarea[name="description"]').fill('Automated Test Asset via Playwright');
    await page.locator('input[name="purchaseDate"]').fill('2024-01-01');

    // 4. Submeter
    await page.locator('button[type="submit"]').click();

    // 5. Verificação
    // O modal deve fechar
    await expect(page.getByRole('heading', { name: /Adicionar/i }).first()).not.toBeVisible();
    
    // Usar o filtro de pesquisa para encontrar o item criado
    await page.locator('input[name="serialNumber"]').fill(uniqueSerial);
    // Pressionar Enter para garantir que o filtro aplica (alguns inputs precisam de change/enter)
    await page.locator('input[name="serialNumber"]').press('Enter');
    
    // Validar que aparece na tabela
    await expect(page.getByRole('cell', { name: uniqueSerial })).toBeVisible();
  });
});
