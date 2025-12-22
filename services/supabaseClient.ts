
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

/**
 * Cliente Supabase V2.1
 * Prioridade: Variáveis de Ambiente (Vercel/Build) > LocalStorage (Configuração Manual)
 */
export const getSupabase = (): SupabaseClient => {
    if (supabaseInstance) {
        return supabaseInstance;
    }

    // 1. Tentar obter do ambiente injetado pelo Vite/Vercel
    // @ts-ignore
    const envUrl = process.env.SUPABASE_URL || import.meta.env?.VITE_SUPABASE_URL;
    // @ts-ignore
    const envKey = process.env.SUPABASE_ANON_KEY || import.meta.env?.VITE_SUPABASE_ANON_KEY;

    // 2. Tentar obter do LocalStorage (Fallback para configuração em runtime)
    const storageUrl = typeof window !== 'undefined' ? localStorage.getItem('SUPABASE_URL') : null;
    const storageKey = typeof window !== 'undefined' ? localStorage.getItem('SUPABASE_ANON_KEY') : null;

    const finalUrl = envUrl || storageUrl;
    const finalKey = envKey || storageKey;

    if (finalUrl && finalKey) {
        try {
            supabaseInstance = createClient(finalUrl, finalKey);
            
            // Persistir no storage se veio do ENV (ajuda em migrações híbridas)
            if (envUrl && typeof window !== 'undefined' && storageUrl !== envUrl) {
                localStorage.setItem('SUPABASE_URL', envUrl);
                localStorage.setItem('SUPABASE_ANON_KEY', envKey);
            }
            
            return supabaseInstance;
        } catch (e) {
            console.error("Erro crítico ao inicializar cliente Supabase:", e);
        }
    }

    throw new Error("Credenciais do Supabase não encontradas. Configure no Vercel (VITE_SUPABASE_URL) ou na tela de Setup da App.");
};
