import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// As credenciais são carregadas a partir do sessionStorage ou das variáveis de ambiente.
const supabaseUrl = sessionStorage.getItem('SUPABASE_URL') || process.env.SUPABASE_URL;
const supabaseAnonKey = sessionStorage.getItem('SUPABASE_ANON_KEY') || process.env.SUPABASE_ANON_KEY;

// O cliente Supabase é inicializado apenas se as variáveis de ambiente estiverem presentes.
// A UI principal em App.tsx irá mostrar um ecrã de configuração se estas
// não estiverem configuradas.
export const supabase: SupabaseClient | null = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;