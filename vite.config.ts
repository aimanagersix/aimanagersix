import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega as variáveis de ambiente do ficheiro .env na pasta raiz do projeto.
  const env = loadEnv(mode, (process as any).cwd(), '');

  // --- DADOS DE ACESSO (COLE AS SUAS CHAVES AQUI) ---
  // Para aceder de qualquer lugar sem configurar manualmente, preencha estas variáveis:
  const HARDCODED_SUPABASE_URL = "";      // Ex: "https://vossa-url.supabase.co"
  const HARDCODED_SUPABASE_ANON_KEY = ""; // Ex: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  const HARDCODED_API_KEY = "";           // Ex: "AIzaSyD..."
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