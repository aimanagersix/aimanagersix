
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
    if (supabaseInstance) {
        return supabaseInstance;
    }

    // --- LÓGICA DE DETEÇÃO DE CHAVES (ORDEM DE PRIORIDADE: ENV > STORAGE) ---
    
    // 1. Process Env (Prioridade Máxima - Injetado via Vite/Vercel/Deno)
    // @ts-ignore
    const processUrl = typeof process !== 'undefined' && process.env ? process.env.SUPABASE_URL : null;
    // @ts-ignore
    const processKey = typeof process !== 'undefined' && process.env ? process.env.SUPABASE_ANON_KEY : null;

    // 2. Vite Direct (Fallback Build)
    // @ts-ignore
    const viteUrl = import.meta.env?.VITE_SUPABASE_URL;
    // @ts-ignore
    const viteKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;

    // 3. LocalStorage (Apenas se não houver ENV)
    const storageUrl = localStorage.getItem('SUPABASE_URL');
    const storageKey = localStorage.getItem('SUPABASE_ANON_KEY');

    const supabaseUrl = processUrl || viteUrl || storageUrl;
    const supabaseAnonKey = processKey || viteKey || storageKey;

    if (supabaseUrl && supabaseAnonKey) {
        try {
            supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
            // Sincronizar storage para persistência se veio do ENV pela primeira vez
            if (!storageUrl && typeof window !== 'undefined') {
                localStorage.setItem('SUPABASE_URL', supabaseUrl);
                localStorage.setItem('SUPABASE_ANON_KEY', supabaseAnonKey);
            }
            return supabaseInstance;
        } catch (e) {
            console.error("Erro crítico ao inicializar cliente Supabase:", e);
        }
    }

    throw new Error("Credenciais do Supabase não encontradas no ambiente ou no storage.");
};
