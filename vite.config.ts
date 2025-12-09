
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega as variáveis de ambiente do ficheiro .env na pasta raiz.
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react()],
    define: {
      // Expõe as variáveis de ambiente essenciais.
      'process.env.SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
      // Valores estáticos de segurança
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    build: {
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'react-vendor';
              }
              if (id.includes('supabase')) {
                return 'supabase-vendor';
              }
              if (id.includes('google')) {
                return 'ai-vendor';
              }
              return 'vendor'; // outros pacotes
            }
          },
        },
      },
    },
  }
})
