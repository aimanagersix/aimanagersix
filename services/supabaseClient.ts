import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

// --- CREDENCIAIS PADRÃO (HARDCODED) ---
// Estas credenciais são usadas se não houver configuração local (localStorage)
const DEFAULT_SUPABASE_URL = "https://afwtfuajkmrzdencuxor.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmd3RmdWFqa21yemRlbmN1eG9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNjc1NDcsImV4cCI6MjA3ODY0MzU0N30._OUkGstLN0eN6g-CPbw5anMZ_uefNcBLO-0NqiHYV_k";

/**
 * Retrieves a singleton instance of the Supabase client.
 * Initializes the client on the first call.
 * @throws {Error} if Supabase credentials are not configured.
 */
export const getSupabase = (): SupabaseClient => {
    if (supabaseInstance) {
        return supabaseInstance;
    }

    // Helper to safely get env vars in Vite/Browser/Node environments
    const getEnvVar = (key: string) => {
        // Check import.meta.env (Vite)
        // @ts-ignore
        if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
            // @ts-ignore
            return import.meta.env[key];
        }
        // Check process.env (Node/Webpack fallback), wrapped in try-catch for strict browsers
        try {
            if (typeof process !== 'undefined' && process.env && process.env[key]) {
                return process.env[key];
            }
        } catch (e) {
            // process not defined
        }
        return '';
    };

    // Prioritize localStorage, then Env Vars, then Hardcoded Defaults
    const supabaseUrl = localStorage.getItem('SUPABASE_URL') || getEnvVar('SUPABASE_URL') || getEnvVar('VITE_SUPABASE_URL') || DEFAULT_SUPABASE_URL;
    const supabaseAnonKey = localStorage.getItem('SUPABASE_ANON_KEY') || getEnvVar('SUPABASE_ANON_KEY') || getEnvVar('VITE_SUPABASE_ANON_KEY') || DEFAULT_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey) {
        supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
        return supabaseInstance;
    }

    throw new Error("As credenciais do Supabase não foram encontradas. Por favor, configure-as.");
};

// Export defaults for use in hooks
export const SUPABASE_CONFIG = {
    url: DEFAULT_SUPABASE_URL,
    key: DEFAULT_SUPABASE_ANON_KEY
};