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
    // 1. Expandir Sidebar (Passar o rato para revelar menus)
    // A sidebar é o elemento <aside>
    const sidebar = page.locator('aside');
    await sidebar.hover();
    
    // Esperar que o texto "Ativos" fique visível (confirma expansão)
    await expect(page.getByText('Ativos').first()).toBeVisible();

    // 2. Navegar para Inventário -> Equipamentos
    // Clicar no menu pai (Ativos)
    await page.getByRole('button', { name: /Ativos/i }).click();
    
    // Clicar no submenu (Equipamentos)
    await page.getByRole('menuitem', { name: /Equipamentos/i }).click(); 
    
    // Verificar se o título da tabela carregou
    await expect(page.getByRole('heading', { name: 'Inventário de Equipamentos' })).toBeVisible();

    // 3. Abrir Modal de Adicionar
    await page.getByRole('button', { name: 'Adicionar' }).first().click();
    
    // Verificar se o modal abriu
    await expect(page.getByRole('heading', { name: /Adicionar/i }).first()).toBeVisible();

    // 4. Preencher Formulário
    const uniqueSerial = `E2E-${Date.now()}`;
    await page.locator('input[name="serialNumber"]').fill(uniqueSerial);
    
    // Selecionar opções (Index 1 para evitar o placeholder)
    await page.locator('select[name="brandId"]').selectOption({ index: 1 });
    await page.locator('select[name="typeId"]').selectOption({ index: 1 });
    
    await page.locator('textarea[name="description"]').fill('Automated Test Asset via Playwright');
    await page.locator('input[name="purchaseDate"]').fill('2024-01-01');

    // 5. Submeter (Procurar botão pelo tipo submit para ser mais robusto)
    await page.locator('button[type="submit"]').click();

    // 6. Verificação
    // O modal deve fechar
    await expect(page.getByRole('heading', { name: /Adicionar/i }).first()).not.toBeVisible();
    
    // Usar o filtro de pesquisa para encontrar o item criado
    await page.locator('input[name="serialNumber"]').fill(uniqueSerial);
    
    // Validar que aparece na tabela (aguarda até aparecer)
    await expect(page.getByRole('cell', { name: uniqueSerial })).toBeVisible();
  });
});