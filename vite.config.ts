
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega as variáveis de ambiente do ficheiro .env na pasta raiz.
  const env = loadEnv(mode, '.', '');

  // Leitura segura do package.json (evita erros de importação ESM)
  let pkg: any = { version: '0.0.0', dependencies: {}, devDependencies: {} };
  try {
     if (fs.existsSync('./package.json')) {
        const jsonContent = fs.readFileSync('./package.json', 'utf-8');
        pkg = JSON.parse(jsonContent);
     }
  } catch (e) {
     console.warn("Could not read package.json", e);
  }

  // Verificação segura da versão do Node
  let nodeVersion = 'Unknown';
  try {
    nodeVersion = process.version;
  } catch (e) {
    // Ignorar erros se process não estiver disponível
  }

  return {
    plugins: [react()],
    define: {
      // Expõe as variáveis de ambiente ao código da aplicação.
      'process.env.SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
      
      // Injeta versões atuais do package.json para diagnóstico
      'process.env.APP_VERSION': JSON.stringify(pkg.version),
      'process.env.REACT_VERSION': JSON.stringify(pkg.dependencies['react'] || 'Unknown'),
      'process.env.VITE_VERSION': JSON.stringify(pkg.devDependencies['vite'] || 'Unknown'),
      'process.env.GENAI_VERSION': JSON.stringify(pkg.dependencies['@google/genai'] || 'Unknown'),
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
