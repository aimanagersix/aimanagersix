
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
    if (supabaseInstance) {
        return supabaseInstance;
    }

    // Acesso direto é OBRIGATÓRIO para o Vite substituir as variáveis durante o build.
    // Não usar destructuring ou acesso dinâmico (ex: env['KEY']).
    const viteUrl = (import.meta as any).env.VITE_SUPABASE_URL;
    const viteKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

    // Fallback para process.env injetado pelo vite.config.ts (caso o import.meta falhe)
    // @ts-ignore
    const processUrl = typeof process !== 'undefined' && process.env ? process.env.SUPABASE_URL : null;
    // @ts-ignore
    const processKey = typeof process !== 'undefined' && process.env ? process.env.SUPABASE_ANON_KEY : null;

    // Fallback para LocalStorage (Configuração manual)
    const storageUrl = localStorage.getItem('SUPABASE_URL');
    const storageKey = localStorage.getItem('SUPABASE_ANON_KEY');

    // Ordem de prioridade
    const supabaseUrl = viteUrl || processUrl || storageUrl;
    const supabaseAnonKey = viteKey || processKey || storageKey;

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
