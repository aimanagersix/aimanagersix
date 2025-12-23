import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

/**
 * Cliente Supabase V2.5 (Prefix SB_ Standardization)
 * Deteção robusta de infraestrutura focada no prefixo SB_.
 */
export const getSupabase = (): SupabaseClient => {
    if (supabaseInstance) {
        return supabaseInstance;
    }

    // 1. Deteção via LocalStorage (Configuração manual ou persistência)
    // Pedido 4: Prioriza prefixo SB_
    const storageUrl = typeof window !== 'undefined' ? (localStorage.getItem('SB_URL') || localStorage.getItem('SUPABASE_URL')) : null;
    const storageKey = typeof window !== 'undefined' ? (localStorage.getItem('SB_ANON_KEY') || localStorage.getItem('SUPABASE_ANON_KEY')) : null;

    // 2. Deteção via process.env (Injetado via Vite Config com prefixo SB_)
    const envUrl = process.env.SB_URL;
    const envKey = process.env.SB_ANON_KEY;

    const finalUrl = envUrl || storageUrl;
    const finalKey = envKey || storageKey;

    if (finalUrl && finalKey && finalUrl !== '' && finalKey !== '') {
        try {
            console.log("AIManager: A inicializar Supabase (SB_ Prefix)...");
            supabaseInstance = createClient(finalUrl, finalKey);
            
            // Sincronizar storage para consistência
            if (envUrl && typeof window !== 'undefined' && storageUrl !== envUrl) {
                localStorage.setItem('SB_URL', finalUrl);
                localStorage.setItem('SB_ANON_KEY', finalKey);
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
                throw new Error("Funcionalidade indisponível: Supabase não configurado.");
            };
        }
    });
};