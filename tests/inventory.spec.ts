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
    // Esperar que o dashboard carregue (aumentado timeout para 15s para segurança)
    await expect(page.getByText('Visão Geral').first()).toBeVisible({ timeout: 15000 });
  });

  test('should create a new equipment item successfully', async ({ page }) => {
    // 1. Navegar para Inventário
    // NOTA: No ficheiro de traduções, 'nav.inventory' é 'Ativos' e o submenu é 'Equipamentos'
    // O menu é um dropdown, por isso clicamos primeiro no pai para abrir
    await page.getByRole('button', { name: /Ativos/i }).click();
    
    // Depois clicamos no item do submenu
    await page.getByRole('menuitem', { name: /Equipamentos/i }).click(); 
    
    // Verificar se o título da tabela carregou corretamente
    await expect(page.getByRole('heading', { name: 'Inventário de Equipamentos' })).toBeVisible();

    // 2. Abrir Modal de Adicionar
    await page.getByRole('button', { name: 'Adicionar' }).first().click();
    
    // Verificar se o modal abriu
    await expect(page.getByRole('heading', { name: /Adicionar/i }).first()).toBeVisible();

    // 3. Preencher Formulário
    const uniqueSerial = `E2E-${Date.now()}`;
    await page.locator('input[name="serialNumber"]').fill(uniqueSerial);
    
    // Selecionar a primeira opção disponível para Marca e Tipo (Index 1 pois 0 é placeholder)
    await page.locator('select[name="brandId"]').selectOption({ index: 1 });
    await page.locator('select[name="typeId"]').selectOption({ index: 1 });
    
    await page.locator('textarea[name="description"]').fill('Automated Test Asset via Playwright');
    await page.locator('input[name="purchaseDate"]').fill('2024-01-01');

    // 4. Submeter (Procurar botão de submit genérico para evitar erro com texto dinâmico)
    await page.locator('button[type="submit"]').click();

    // 5. Verificação
    // O modal deve fechar
    await expect(page.getByRole('heading', { name: /Adicionar/i }).first()).not.toBeVisible();
    
    // Vamos usar o filtro de pesquisa do dashboard para garantir que o encontramos
    await page.locator('input[name="serialNumber"]').fill(uniqueSerial);
    
    // Validar que aparece na tabela
    await expect(page.getByRole('cell', { name: uniqueSerial })).toBeVisible();
  });
});