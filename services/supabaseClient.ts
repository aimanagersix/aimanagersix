
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

    // O Vite define 'process.env' para a aplicação.
    // Priorizamos o localStorage para permitir que o ecrã de configuração inicial funcione.
    // Caso contrário, usamos as variáveis de ambiente injetadas pelo Vite no momento da compilação.
    const supabaseUrl = localStorage.getItem('SUPABASE_URL') || process.env.SUPABASE_URL;
    const supabaseAnonKey = localStorage.getItem('SUPABASE_ANON_KEY') || process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey) {
        supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
        return supabaseInstance;
    }

    throw new Error("As credenciais do Supabase não foram encontradas. Por favor, configure-as.");
};
