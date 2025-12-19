
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
    if (supabaseInstance) {
        return supabaseInstance;
    }

    // --- LÓGICA DE DETEÇÃO DE CHAVES (DIAGNÓSTICO) ---
    
    // 1. Vite Import (Substituído no Build)
    // @ts-ignore
    const viteUrl = import.meta.env.VITE_SUPABASE_URL;
    // @ts-ignore
    const viteKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    // 2. Process Env (Injetado pelo vite.config.ts corrigido)
    // @ts-ignore
    const processUrl = typeof process !== 'undefined' && process.env ? process.env.SUPABASE_URL : null;
    // @ts-ignore
    const processKey = typeof process !== 'undefined' && process.env ? process.env.SUPABASE_ANON_KEY : null;

    // 3. LocalStorage (Manual)
    const storageUrl = localStorage.getItem('SUPABASE_URL');
    const storageKey = localStorage.getItem('SUPABASE_ANON_KEY');

    const supabaseUrl = viteUrl || processUrl || storageUrl;
    const supabaseAnonKey = viteKey || processKey || storageKey;

    // Log para depuração no browser (F12)
    if (!supabaseUrl || !supabaseAnonKey) {
        console.group("AIManager: Falha na Configuração do Supabase");
        console.log("Tentativa Vite (import.meta.env.VITE_...):", viteUrl ? "OK" : "Missing");
        console.log("Tentativa Process (process.env.SUPABASE_...):", processUrl ? "OK" : "Missing");
        console.log("Tentativa Storage (localStorage):", storageUrl ? "OK" : "Missing");
        console.groupEnd();
    }

    if (supabaseUrl && supabaseAnonKey) {
        try {
            supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
            return supabaseInstance;
        } catch (e) {
            console.error("Erro crítico ao inicializar cliente Supabase:", e);
        }
    }

    // Se falhar, lançar erro para a UI capturar e mostrar o ecrã de setup
    throw new Error("Credenciais do Supabase em falta. Verifique a consola (F12) para detalhes.");
};
