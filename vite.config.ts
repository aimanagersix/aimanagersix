import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega as variáveis de ambiente do ficheiro .env na pasta raiz do projeto.
  // O terceiro parâmetro '' garante que todas as variáveis são carregadas,
  // independentemente do prefixo VITE_.
  // FIX: Cast `process` to `any` to bypass TypeScript error in environments where Node.js types may not be fully available.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Expõe as variáveis de ambiente ao código da aplicação através de `process.env`,
      // mantendo a compatibilidade com o código existente.
      'process.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.SUPABASE_ANON_KEY),
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
    build: {
      // Aumenta o limite de aviso para o tamanho do chunk para 1500 kB.
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          // Melhora a divisão de código (chunking) separando a lógica da aplicação em pedaços.
          manualChunks: (id) => {
            if (id.includes('/components/')) {
              // Agrupa todos os componentes num único chunk 'components'.
              return 'components';
            }
            if (id.includes('/services/')) {
                // Agrupa todos os serviços num único chunk 'services'.
                return 'services';
            }
          },
        },
      },
    },
  }
})
