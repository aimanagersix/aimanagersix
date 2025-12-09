
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import packageJson from './package.json'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega as variáveis de ambiente do ficheiro .env na pasta raiz.
  const env = loadEnv(mode, '.', '');

  // Safe Node Version Check
  let nodeVersion = 'Unknown';
  try {
    nodeVersion = process.version;
  } catch (e) {
    console.warn("Could not detect Node version", e);
  }

  return {
    plugins: [react()],
    define: {
      // Expõe as variáveis de ambiente ao código da aplicação.
      'process.env.SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
      
      // Injeta versões atuais do package.json para diagnóstico
      'process.env.APP_VERSION': JSON.stringify(packageJson.version),
      'process.env.REACT_VERSION': JSON.stringify(packageJson.dependencies['react']),
      'process.env.VITE_VERSION': JSON.stringify(packageJson.devDependencies['vite'] || 'Latest'),
      'process.env.GENAI_VERSION': JSON.stringify(packageJson.dependencies['@google/genai']),
      'process.env.NODE_VERSION': JSON.stringify(nodeVersion), 
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
