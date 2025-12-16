
import { test, expect } from '@playwright/test';

// --- CONFIGURAÇÃO ---
// Use as credenciais de um administrador
const ADMIN_USER = {
    email: 'josefsmoreira@outlook.com', 
    password: 'QSQmZf62!' 
};

// Quantidade de colaboradores a criar (REDUZIDO PARA SMOKE TEST)
// Para bulk seeding real (1000+), use o script SQL disponível em "Configuração BD -> Seeding"
const TARGET_COUNT = 2;

test.describe('Functional Test - Create Collaborator', () => {
    
    test('should allow creating collaborators manually', async ({ page }) => {
        console.log("Iniciando teste funcional de criação...");

        // 1. Login
        await page.goto('/');
        await page.locator('input[name="email"]').fill(ADMIN_USER.email);
        await page.locator('input[name="password"]').fill(ADMIN_USER.password);
        await page.getByRole('button', { name: 'Entrar' }).click();
        
        // Esperar carregamento do dashboard
        await expect(page.getByText('Visão Geral').first()).toBeVisible({ timeout: 30000 });

        // 2. Navegar para Colaboradores
        await page.getByRole('button', { name: /Organização/i }).click();
        // Pequena pausa para animação do menu
        await page.waitForTimeout(500); 
        await page.getByRole('link', { name: 'Colaboradores' }).click();
        await expect(page.getByRole('heading', { name: 'Gestão de Colaboradores' })).toBeVisible();

        // 3. Loop de Criação (Teste de UI)
        for (let i = 1; i <= TARGET_COUNT; i++) {
            const startTime = Date.now();
            
            // Abrir Modal
            await page.getByRole('button', { name: 'Adicionar' }).click();
            await expect(page.getByRole('heading', { name: 'Adicionar Colaborador' })).toBeVisible();

            // Gerar Dados Sequenciais
            const pad = i.toString().padStart(4, '0');
            const fakeName = `Test User ${pad}`;
            const fakeEmail = `test.ui.${pad}@empresa.local`;
            const fakeMec = `UI-${pad}`;
            
            // Gerar NIF e Telemóvel válidos (Regex da app: 9 dígitos)
            // NIF base 200000000 + i (Evita conflito com o Seed SQL que usa 100...)
            const fakeNif = (200000000 + i).toString(); 
            // Telemovel base 920000000 + i
            const fakePhone = `92${(1000000 + i).toString().padStart(7, '0')}`;

            // Preencher Formulário
            await page.locator('input[name="fullName"]').fill(fakeName);
            await page.locator('input[name="email"]').fill(fakeEmail);
            await page.locator('input[name="numeroMecanografico"]').fill(fakeMec);
            
            await page.locator('input[name="nif"]').fill(fakeNif);
            await page.locator('input[name="telemovel"]').fill(fakePhone);

            // Submeter
            await page.getByRole('button', { name: 'Salvar' }).click();

            // Esperar que o modal feche (indicador de sucesso)
            await expect(page.getByRole('heading', { name: 'Adicionar Colaborador' })).not.toBeVisible();

            // Log de progresso
            const duration = Date.now() - startTime;
            console.log(`UI Test Criado: ${i}/${TARGET_COUNT} (${fakeName}) - ${duration}ms`);
        }

        console.log("Teste funcional concluído com sucesso!");
    });
});
