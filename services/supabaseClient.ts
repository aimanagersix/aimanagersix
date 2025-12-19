
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
    if (supabaseInstance) {
        return supabaseInstance;
    }

    // --- LÓGICA DE DETEÇÃO DE CHAVES (ORDEM DE PRIORIDADE) ---
    
    // 1. LocalStorage (Manual - Persistência do Utilizador)
    const storageUrl = localStorage.getItem('SUPABASE_URL');
    const storageKey = localStorage.getItem('SUPABASE_ANON_KEY');

    // 2. Vite Import (Substituído no Build/Vercel)
    // @ts-ignore
    const viteUrl = import.meta.env.VITE_SUPABASE_URL;
    // @ts-ignore
    const viteKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    // 3. Process Env (Fallback Node)
    // @ts-ignore
    const processUrl = typeof process !== 'undefined' && process.env ? process.env.SUPABASE_URL : null;
    // @ts-ignore
    const processKey = typeof process !== 'undefined' && process.env ? process.env.SUPABASE_ANON_KEY : null;

    const supabaseUrl = storageUrl || viteUrl || processUrl;
    const supabaseAnonKey = storageKey || viteKey || processKey;

    if (supabaseUrl && supabaseAnonKey) {
        try {
            supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
            // Re-persistir se veio do ambiente para garantir persistência futura no browser
            if (!storageUrl) localStorage.setItem('SUPABASE_URL', supabaseUrl);
            if (!storageKey) localStorage.setItem('SUPABASE_ANON_KEY', supabaseAnonKey);
            
            return supabaseInstance;
        } catch (e) {
            console.error("Erro crítico ao inicializar cliente Supabase:", e);
        }
    }

    throw new Error("Credenciais do Supabase não encontradas.");
};
