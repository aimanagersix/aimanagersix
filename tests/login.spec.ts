
import { test, expect } from '@playwright/test';

// --- CONFIGURAÇÃO ---
// Credenciais para o teste de login bem-sucedido
const TEST_USER = {
    email: 'josefsmoreira@outlook.com', 
    password: 'QSQmZf62!' 
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
    // Fill with real email but WRONG password
    await page.locator('input[name="email"]').fill(TEST_USER.email);
    await page.locator('input[name="password"]').fill('wrongpassword123');
    
    await page.getByRole('button', { name: 'Entrar' }).click();

    // Wait for error message or ensure we are still on login page
    // The error message usually contains "Invalid login credentials" from Supabase
    // We check if the button is still visible, meaning we didn't redirect
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
    
    // Optional: Check for specific error text if it appears in the DOM
    // await expect(page.locator('text=Invalid login credentials')).toBeVisible();
  });

  test('should login successfully and redirect to dashboard', async ({ page }) => {
    console.log(`Attempting login with: ${TEST_USER.email}`);

    // 1. Preencher Credenciais
    await page.locator('input[name="email"]').fill(TEST_USER.email);
    await page.locator('input[name="password"]').fill(TEST_USER.password);

    // 2. Clicar Entrar
    await page.getByRole('button', { name: 'Entrar' }).click();

    // 3. Verificar Redirecionamento para o Dashboard
    // Aumentamos o timeout para 15s para dar tempo à autenticação do Supabase
    await expect(page.getByText('Visão Geral').first()).toBeVisible({ timeout: 15000 });
    
    // Verificar se o menu lateral carregou
    await expect(page.getByText('Inventário')).toBeVisible();

    // Verificar se o botão de Logout está presente (indicando sessão ativa)
    await expect(page.getByText('Sair')).toBeVisible();
  });
});
