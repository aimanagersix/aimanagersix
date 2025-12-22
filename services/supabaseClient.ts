
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

/**
 * Cliente Supabase V2.2 (Resiliência Vercel)
 * Evita o "ecrã preto" ao não lançar erro se as chaves estiverem temporariamente ausentes.
 */
export const getSupabase = (): SupabaseClient => {
    if (supabaseInstance) {
        return supabaseInstance;
    }

    // 1. Prioridade para as chaves estáticas injetadas pelo Vite no build
    const envUrl = process.env.SUPABASE_URL;
    const envKey = process.env.SUPABASE_ANON_KEY;

    // 2. Fallback para LocalStorage (Configuração em runtime)
    const storageUrl = typeof window !== 'undefined' ? localStorage.getItem('SUPABASE_URL') : null;
    const storageKey = typeof window !== 'undefined' ? localStorage.getItem('SUPABASE_ANON_KEY') : null;

    const finalUrl = envUrl || storageUrl;
    const finalKey = envKey || storageKey;

    if (finalUrl && finalKey && finalUrl !== '' && finalKey !== '') {
        try {
            supabaseInstance = createClient(finalUrl, finalKey);
            
            // Sincronizar storage para persistência futura se veio do ENV
            if (envUrl && typeof window !== 'undefined') {
                localStorage.setItem('SUPABASE_URL', finalUrl);
                localStorage.setItem('SUPABASE_ANON_KEY', finalKey);
            }
            
            return supabaseInstance;
        } catch (e) {
            console.error("Erro ao instanciar Supabase:", e);
        }
    }

    // Se chegamos aqui, não temos chaves. 
    // Em vez de dar throw (que causa ecrã preto), retornamos um cliente dummy ou 
    // o código que chama getSupabase deve tratar a nulidade.
    // Para manter compatibilidade com o código atual que espera um objeto:
    console.warn("AIManager: Credenciais Supabase ausentes. A aguardar configuração...");
    
    // Retornamos um proxy que lança erro apenas ao tentar usar, preservando o render da UI
    return new Proxy({} as SupabaseClient, {
        get: () => {
            throw new Error("Supabase não configurado. Por favor, insira o URL e a Anon Key no painel de configuração.");
        }
    });
};
