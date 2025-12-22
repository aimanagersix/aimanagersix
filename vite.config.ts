import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import packageJson from './package.json'
// Fix: Import cwd directly from node:process to avoid type errors on the process object
import { cwd } from 'node:process'

export default defineConfig(({ mode }) => {
  // Carrega variáveis do .env e do ambiente do sistema (Vercel)
  // Fix: Call the imported cwd() function instead of process.cwd()
  const env = loadEnv(mode, cwd(), '');
  
  // Normalização de chaves para contornar restrição do Supabase (prefixo SB_ em vez de SUPABASE_)
  const supabaseUrl = env.VITE_SB_URL || env.SB_URL || env.VITE_SUPABASE_URL || env.SUPABASE_URL || '';
  const supabaseAnonKey = env.VITE_SB_ANON_KEY || env.SB_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || '';
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
