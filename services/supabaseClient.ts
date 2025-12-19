
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
    if (supabaseInstance) {
        return supabaseInstance;
    }

    // --- LÓGICA DE DETEÇÃO DE CHAVES (DIAGNÓSTICO) ---
    
    // 1. LocalStorage (Manual - Prioridade para persistência do utilizador)
    const storageUrl = localStorage.getItem('SUPABASE_URL');
    const storageKey = localStorage.getItem('SUPABASE_ANON_KEY');

    // 2. Vite Import (Substituído no Build)
    // @ts-ignore
    const viteUrl = import.meta.env.VITE_SUPABASE_URL;
    // @ts-ignore
    const viteKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    // 3. Process Env
    // @ts-ignore
    const processUrl = typeof process !== 'undefined' && process.env ? process.env.SUPABASE_URL : null;
    // @ts-ignore
    const processKey = typeof process !== 'undefined' && process.env ? process.env.SUPABASE_ANON_KEY : null;

    const supabaseUrl = storageUrl || viteUrl || processUrl;
    const supabaseAnonKey = storageKey || viteKey || processKey;

    if (supabaseUrl && supabaseAnonKey) {
        try {
            supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
            return supabaseInstance;
        } catch (e) {
            console.error("Erro crítico ao inicializar cliente Supabase:", e);
        }
    }

    throw new Error("Credenciais do Supabase em falta.");
};
