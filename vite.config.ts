
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega as variáveis de ambiente do ficheiro .env na pasta raiz do projeto.
  const env = loadEnv(mode, (process as any).cwd(), '');

  // --- DADOS DE ACESSO ---
  // PARA EVITAR O ECRÃ DE CONFIGURAÇÃO: Cole as suas chaves do Supabase abaixo.
  
  // 1. Configuração do Supabase (Base de Dados)
  const HARDCODED_SUPABASE_URL = "";      // <--- COLE AQUI A URL (Ex: "https://xxyyzz.supabase.co")
  const HARDCODED_SUPABASE_ANON_KEY = ""; // <--- COLE AQUI A ANON KEY (Ex: "eyJhbGci...")
  
  // 2. Configuração do Google Gemini (Inteligência Artificial)
  const HARDCODED_API_KEY = "AIzaSyDZeldUKNcsKsH-drgHHQFDFPl_t1HUCPs"; 
  
  // --------------------------------------------------

  return {
    plugins: [react()],
    define: {
      // Expõe as variáveis de ambiente ao código da aplicação.
      // Prioriza os valores hardcoded acima, se existirem.
      'process.env.SUPABASE_URL': JSON.stringify(HARDCODED_SUPABASE_URL || env.SUPABASE_URL),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(HARDCODED_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY),
      'process.env.API_KEY': JSON.stringify(HARDCODED_API_KEY || env.API_KEY),
    },
    build: {
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('/components/')) {
              return 'components';
            }
            if (id.includes('/services/')) {
                return 'services';
            }
          },
        },
      },
    },
  }
})
