
import { test, expect } from '@playwright/test';

const TEST_USER = {
    email: 'josefsmoreira@outlook.com', 
    password: 'QSQmZf62!' 
};

test.describe('Organization Management (Institutions & Entities)', () => {

  // Login before each test in this suite
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('input[name="email"]').fill(TEST_USER.email);
    await page.locator('input[name="password"]').fill(TEST_USER.password);
    await page.getByRole('button', { name: 'Entrar' }).click();
    // Wait for the main dashboard to load to ensure login was successful
    await expect(page.getByText('Visão Geral').first()).toBeVisible({ timeout: 15000 });
  });

  test('should create a new Institution, then an Entity within it', async ({ page }) => {
    // Unique names for this test run to avoid conflicts
    const institutionName = `Test Institution ${Date.now()}`;
    const entityName = `Test Entity ${Date.now()}`;

    // --- Part 1: Create Institution ---

    // 1. Navigate to Institutions
    await page.getByRole('button', { name: /Organização/i }).click();
    await page.waitForTimeout(500); // Wait for menu animation
    await page.getByRole('link', { name: 'Instituições' }).click();
    await expect(page.getByRole('heading', { name: 'Gestão Instituições' })).toBeVisible();

    // 2. Open Add Modal
    await page.getByRole('button', { name: 'Adicionar' }).first().click();
    await expect(page.getByRole('heading', { name: 'Adicionar Nova Instituição' })).toBeVisible();

    // 3. Fill Form
    await page.locator('input[name="name"]').fill(institutionName);
    await page.locator('input[name="codigo"]').fill('TEST');
    await page.locator('input[name="email"]').fill('test@institution.com');
    await page.locator('input[name="telefone"]').fill('212345678');

    // 4. Submit
    await page.getByRole('button', { name: 'Salvar Alterações' }).click();

    // 5. Verify
    await expect(page.getByRole('heading', { name: 'Adicionar Nova Instituição' })).not.toBeVisible();
    await page.locator('input[placeholder*="Procurar"]').fill(institutionName);
    await expect(page.getByRole('cell', { name: institutionName })).toBeVisible();
    
    // --- Part 2: Create Entity ---
    
    // 1. Navigate to Entities
    await page.getByRole('button', { name: /Organização/i }).click();
    await page.waitForTimeout(500);
    await page.getByRole('link', { name: 'Entidades' }).click();
    await expect(page.getByRole('heading', { name: 'Gestão de Entidades' })).toBeVisible();
    
    // 2. Open Add Modal
    await page.getByRole('button', { name: 'Adicionar' }).first().click();
    await expect(page.getByRole('heading', { name: 'Adicionar Nova Entidade' })).toBeVisible();

    // 3. Fill Form
    // Select the institution we just created
    await page.locator('select[name="instituicaoId"]').selectOption({ label: institutionName });

    await page.locator('input[name="name"]').fill(entityName);
    await page.locator('input[name="codigo"]').fill('TEST-ENT');
    await page.locator('input[name="email"]').fill('test@entity.com');
    await page.locator('input[name="responsavel"]').fill('Test Lead');

    // 4. Submit
    await page.getByRole('button', { name: 'Salvar Alterações' }).click();

    // 5. Verify
    await expect(page.getByRole('heading', { name: 'Adicionar Nova Entidade' })).not.toBeVisible();
    await page.locator('input[placeholder*="Nome ou código"]').fill(entityName);
    await expect(page.getByRole('cell', { name: entityName })).toBeVisible();
    // Also check if it's correctly associated
    await expect(page.getByRole('cell', { name: institutionName })).toBeVisible();
  });
});
