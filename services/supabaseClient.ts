import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

/**
 * Retrieves a singleton instance of the Supabase client.
 * Initializes the client on the first call.
 * Priority:
 * 1. Vite Environment Variables (import.meta.env)
 * 2. Injected Process Variables (process.env via vite.config.ts)
 * 3. Local Storage (User manual entry fallback)
 */
export const getSupabase = (): SupabaseClient => {
    if (supabaseInstance) {
        return supabaseInstance;
    }

    // 1. Tentar ler do padrão Vite
    // Cast to any to avoid TS errors if types are missing
    let envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
    let envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

    // 2. Fallback para process.env (definido no vite.config.ts)
    // Usamos 'as any' para evitar erros de TS se os tipos não estiverem estritos
    if (!envUrl && (process.env as any).SUPABASE_URL) {
        envUrl = (process.env as any).SUPABASE_URL;
    }
    if (!envKey && (process.env as any).SUPABASE_ANON_KEY) {
        envKey = (process.env as any).SUPABASE_ANON_KEY;
    }

    // 3. Tentar ler do LocalStorage (Fallback manual)
    const storageUrl = localStorage.getItem('SUPABASE_URL');
    const storageKey = localStorage.getItem('SUPABASE_ANON_KEY');

    const supabaseUrl = envUrl || storageUrl;
    const supabaseAnonKey = envKey || storageKey;

    if (supabaseUrl && supabaseAnonKey) {
        try {
            supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
            return supabaseInstance;
        } catch (e) {
            console.error("Erro ao inicializar Supabase:", e);
        }
    }

    // Se chegarmos aqui, a app não tem configuração.
    throw new Error("As credenciais do Supabase não foram encontradas.");
};