import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import packageJson from './package.json'
import process from 'node:process'

export default defineConfig(({ mode }) => {
  // Carrega variáveis do .env e do ambiente do sistema (Vercel)
  const env = loadEnv(mode, process.cwd(), '');
  
  // Normalização de chaves: Aceita VITE_SUPABASE_URL ou apenas SUPABASE_URL
  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL || '';
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || '';
  const geminiKey = env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || env.API_KEY || '';

  return {
    plugins: [react()],
    define: {
      // Injeção estática para que o navegador consiga ler process.env
      'process.env.SUPABASE_URL': JSON.stringify(supabaseUrl),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
      'process.env.API_KEY': JSON.stringify(geminiKey),
      'process.env.APP_VERSION': JSON.stringify(packageJson.version),
    },
    server: {
      port: 5173,
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      chunkSizeWarningLimit: 1600,
    }
  }
})