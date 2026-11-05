import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// The project's environment variables live in '.env' (gitignored; Kood injects them into the
// sandbox). On top of Vite's own 'import.meta.env.VITE_*', the VITE_* names are exposed as
// 'process.env.*' too, so generated code can use either API. This file never holds a value.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const processEnvDefines = Object.fromEntries(
    Object.entries(env).map(([key, value]) => ['process.env.' + key, JSON.stringify(value)])
  );

  return {
    plugins: [react(), tailwindcss()],
    define: processEnvDefines,
    resolve: {
      alias: {
        '@/src': path.resolve(__dirname, './src'),
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
    // The project's own API (server/index.mjs), so /api works in the page without a second origin.
    proxy: { '/api': 'http://localhost:8787' },
      port: 3000,
      host: true
    }
  };
});