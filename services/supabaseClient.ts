
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

/**
 * Cliente Supabase V2.3 (Resiliência Vercel)
 * Diagnóstico automático de chaves injetadas.
 */
export const getSupabase = (): SupabaseClient => {
    if (supabaseInstance) {
        return supabaseInstance;
    }

    // 1. Deteção de chaves via process.env (injetadas pelo Vite no build)
    const envUrl = process.env.SUPABASE_URL;
    const envKey = process.env.SUPABASE_ANON_KEY;

    // 2. Deteção via LocalStorage (Configuração manual ou persistência de sessão)
    const storageUrl = typeof window !== 'undefined' ? localStorage.getItem('SUPABASE_URL') : null;
    const storageKey = typeof window !== 'undefined' ? localStorage.getItem('SUPABASE_ANON_KEY') : null;

    const finalUrl = envUrl || storageUrl;
    const finalKey = envKey || storageKey;

    if (finalUrl && finalKey && finalUrl !== '' && finalKey !== '') {
        try {
            console.log("AIManager: A inicializar Supabase...");
            supabaseInstance = createClient(finalUrl, finalKey);
            
            // Garantir que o Storage tem a cópia das chaves de ambiente para consistência
            if (envUrl && typeof window !== 'undefined' && storageUrl !== envUrl) {
                localStorage.setItem('SUPABASE_URL', finalUrl);
                localStorage.setItem('SUPABASE_ANON_KEY', finalKey);
            }
            
            return supabaseInstance;
        } catch (e) {
            console.error("Erro fatal na instância Supabase:", e);
        }
    }

    // Fallback silencioso para evitar ecrã preto
    console.warn("AIManager: Credenciais Supabase não detetadas. Modo offline ativo.");
    
    return new Proxy({} as SupabaseClient, {
        get: (_, prop) => {
            if (prop === 'auth') return { getSession: async () => ({ data: { session: null } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }) };
            return () => {
                throw new Error("Funcionalidade indisponível: Supabase não configurado no Vercel.");
            };
        }
    });
};
