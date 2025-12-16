
import { test, expect } from '@playwright/test';

// --- CONFIGURAÇÃO ---
// Use as credenciais de um administrador
const ADMIN_USER = {
    email: 'josefsmoreira@outlook.com', 
    password: 'QSQmZf62!' 
};

// Quantidade de colaboradores a criar
const TARGET_COUNT = 1000;

test.describe('Data Seeding - Collaborators', () => {
    // Desativar timeout do teste pois criar 1000 registos demora tempo
    test.setTimeout(0); 

    test('Seed 1000 Collaborators via UI without login access', async ({ page }) => {
        console.log("Iniciando processo de criação em massa...");

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

        // 3. Loop de Criação
        for (let i = 1; i <= TARGET_COUNT; i++) {
            const startTime = Date.now();
            
            // Abrir Modal
            await page.getByRole('button', { name: 'Adicionar' }).click();
            await expect(page.getByRole('heading', { name: 'Adicionar Colaborador' })).toBeVisible();

            // Gerar Dados Sequenciais
            const pad = i.toString().padStart(4, '0');
            const fakeName = `Colaborador Bulk ${pad}`;
            const fakeEmail = `bulk.user.${pad}@empresa.local`;
            const fakeMec = `MEC-${pad}`;
            
            // Gerar NIF e Telemóvel válidos (Regex da app: 9 dígitos)
            // NIF base 100000000 + i
            const fakeNif = (100000000 + i).toString(); 
            // Telemovel base 910000000 + i
            const fakePhone = `91${(1000000 + i).toString().padStart(7, '0')}`;

            // Preencher Formulário
            await page.locator('input[name="fullName"]').fill(fakeName);
            await page.locator('input[name="email"]').fill(fakeEmail);
            await page.locator('input[name="numeroMecanografico"]').fill(fakeMec);
            
            await page.locator('input[name="nif"]').fill(fakeNif);
            await page.locator('input[name="telemovel"]').fill(fakePhone);

            // IMPORTANTE: "Permitir Login" vem desmarcado por defeito.
            // Não clicamos nele, garantindo que o utilizador fica sem acesso.

            // Submeter
            await page.getByRole('button', { name: 'Salvar' }).click();

            // Esperar que o modal feche (indicador de sucesso)
            await expect(page.getByRole('heading', { name: 'Adicionar Colaborador' })).not.toBeVisible();

            // Log de progresso
            const duration = Date.now() - startTime;
            if (i % 10 === 0) {
                console.log(`Criado: ${i}/${TARGET_COUNT} (${fakeName}) - ${duration}ms`);
            }
        }

        console.log("Processo concluído com sucesso!");
    });
});
