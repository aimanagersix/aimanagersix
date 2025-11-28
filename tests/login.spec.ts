import { test, expect } from '@playwright/test';

// --- CONFIGURAÇÃO ---
// PARA O TESTE REAL FUNCIONAR:
// Substitua estes valores por um utilizador válido que exista na sua base de dados Supabase.
const TEST_USER = {
    email: 'admin@exemplo.com', 
    password: 'password123' 
};

test.describe('Authentication Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    // Go to the base URL configured in playwright.config.ts
    await page.goto('/');
  });

  test('should display the login page correctly (Smoke Test)', async ({ page }) => {
    // Check for the App Title
    await expect(page.getByText('AIManager', { exact: false })).toBeVisible();
    
    // Check for the Login header
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    
    // Check for inputs
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    
    // Check for Submit button
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
  });

  test('should show validation errors on empty submit', async ({ page }) => {
    // Click login without filling anything
    await page.getByRole('button', { name: 'Entrar' }).click();

    // Expect validation messages
    await expect(page.getByText('O email é obrigatório.')).toBeVisible();
    await expect(page.getByText('A password é obrigatória.')).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    // Fill with dummy data
    await page.locator('input[name="email"]').fill('josefsmoreira@outlook.com');
    await page.locator('input[name="password"]').fill('QSQmZf62!');
    
    await page.getByRole('button', { name: 'Entrar' }).click();

    // Try to catch common Supabase error messages or generic UI feedback
    // Using a loose locator to catch either the specific text or just ensure we didn't redirect
    try {
        // If error message appears
        const errorLocator = page.locator('.text-red-400').first(); 
        await expect(errorLocator).toBeVisible({ timeout: 5000 });
    } catch (e) {
        // If no specific error text found, verify we are still on Login page (button still visible)
        await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
    }
  });

  test('should login successfully and redirect to dashboard', async ({ page }) => {
    // Se as credenciais ainda forem as de exemplo, o teste salta com um aviso.
    if (TEST_USER.email === 'admin@exemplo.com') {
        console.warn('⚠️  TESTE SALTADO: Configure TEST_USER em tests/login.spec.ts com credenciais reais.');
        test.skip();
        return;
    }

    // 1. Preencher Credenciais
    await page.locator('input[name="email"]').fill(TEST_USER.email);
    await page.locator('input[name="password"]').fill(TEST_USER.password);

    // 2. Clicar Entrar
    await page.getByRole('button', { name: 'Entrar' }).click();

    // 3. Verificar Redirecionamento para o Dashboard
    // Espera que elementos do Dashboard apareçam (timeout maior pois o login real pode demorar)
    await expect(page.getByText('Visão Geral')).toBeVisible({ timeout: 15000 });
    
    // Verificar se o menu lateral ou de topo carregou
    await expect(page.getByText('Inventário')).toBeVisible();

    // Verificar se o botão de Logout está presente
    await expect(page.getByText('Sair')).toBeVisible();
  });
});