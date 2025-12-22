
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import packageJson from './package.json'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega variáveis do ficheiro .env (se existir)
  const envFile = loadEnv(mode, (process as any).cwd(), '');
  
  // Combina variáveis do ficheiro com variáveis de sistema (Vercel/Node)
  const processEnv = typeof process !== 'undefined' ? process.env : {};
  const combinedEnv = { ...processEnv, ...envFile };

  // Lógica Robusta de Resolução de Chaves
  // Procura por VITE_SUPABASE_URL, e se não existir, tenta SUPABASE_URL
  const supabaseUrl = combinedEnv.VITE_SUPABASE_URL || combinedEnv.SUPABASE_URL;
  const supabaseAnonKey = combinedEnv.VITE_SUPABASE_ANON_KEY || combinedEnv.SUPABASE_ANON_KEY;
  const geminiKey = combinedEnv.VITE_GEMINI_API_KEY || combinedEnv.GEMINI_API_KEY;

  return {
    plugins: [react()],
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
    define: {
      // Define 'process.env' de forma segura para não quebrar bibliotecas
      // mas injeta explicitamente as nossas chaves críticas
      'process.env.SUPABASE_URL': JSON.stringify(supabaseUrl),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
      'process.env.API_KEY': JSON.stringify(geminiKey),
      
      // Metadados da versão
      'process.env.APP_VERSION': JSON.stringify(packageJson.version),
      'process.env.REACT_VERSION': JSON.stringify(packageJson.dependencies['react']),
      'process.env.VITE_VERSION': JSON.stringify(packageJson.devDependencies['vite'] || 'Latest'),
      'process.env.GENAI_VERSION': JSON.stringify(packageJson.dependencies['@google/genai']),
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
