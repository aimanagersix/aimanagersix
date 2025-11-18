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

    const supabaseUrl = sessionStorage.getItem('SUPABASE_URL') || process.env.SUPABASE_URL;
    const supabaseAnonKey = sessionStorage.getItem('SUPABASE_ANON_KEY') || process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey) {
        supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
        return supabaseInstance;
    }

    throw new Error("As credenciais do Supabase não foram encontradas. Por favor, configure-as.");
};
