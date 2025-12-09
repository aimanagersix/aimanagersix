import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
    if (supabaseInstance) {
        return supabaseInstance;
    }

    // --- LÓGICA DE DETEÇÃO DE CHAVES ---
    // 1. Tentar VITE padrão (Isto é substituído por string no build do Vercel)
    // @ts-ignore
    const viteUrl = import.meta.env.VITE_SUPABASE_URL;
    // @ts-ignore
    const viteKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    // 2. Tentar process.env (Injetado pelo vite.config.ts como fallback)
    // @ts-ignore
    const processUrl = typeof process !== 'undefined' && process.env ? process.env.SUPABASE_URL : null;
    // @ts-ignore
    const processKey = typeof process !== 'undefined' && process.env ? process.env.SUPABASE_ANON_KEY : null;

    // 3. Tentar LocalStorage (Configuração manual no browser)
    const storageUrl = localStorage.getItem('SUPABASE_URL');
    const storageKey = localStorage.getItem('SUPABASE_ANON_KEY');

    // Prioridade: Vite > Process > Storage
    const supabaseUrl = viteUrl || processUrl || storageUrl;
    const supabaseAnonKey = viteKey || processKey || storageKey;

    if (supabaseUrl && supabaseAnonKey) {
        try {
            supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
            return supabaseInstance;
        } catch (e) {
            console.error("Erro crítico ao inicializar Supabase:", e);
        }
    }

    // Se chegarmos aqui, a app não encontrou chaves em lado nenhum
    console.warn("Supabase credentials not found. URL:", supabaseUrl ? "Found" : "Missing", "Key:", supabaseAnonKey ? "Found" : "Missing");
    throw new Error("As credenciais do Supabase não foram encontradas. Por favor configure as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.");
};