import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

/**
 * Retrieves a singleton instance of the Supabase client.
 * Initializes the client on the first call.
 * @throws {Error} if Supabase credentials are not configured.
 */
export const getSupabase = (): SupabaseClient => {
    if (supabaseInstance) {
        return supabaseInstance;
    }

    // O Vite define 'process.env' para a aplicação durante o build.
    // Usamos fallback seguro para evitar ReferenceError caso 'process' não esteja definido no browser.
    const envUrl = typeof process !== 'undefined' && process.env ? process.env.SUPABASE_URL : undefined;
    const envKey = typeof process !== 'undefined' && process.env ? process.env.SUPABASE_ANON_KEY : undefined;

    const supabaseUrl = localStorage.getItem('SUPABASE_URL') || envUrl;
    const supabaseAnonKey = localStorage.getItem('SUPABASE_ANON_KEY') || envKey;

    if (supabaseUrl && supabaseAnonKey) {
        try {
            supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
            return supabaseInstance;
        } catch (e) {
            console.error("Erro ao inicializar Supabase:", e);
        }
    }

    // Se chegarmos aqui, a app deve estar a tentar aceder a dados sem configuração.
    // Lançamos erro, mas o ErrorBoundary no index.tsx ou a verificação no App.tsx devem apanhar.
    throw new Error("As credenciais do Supabase não foram encontradas. Por favor, recarregue a página para ver o ecrã de configuração.");
};