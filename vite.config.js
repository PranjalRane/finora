import { resolve } from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';

// Plugin to ensure vanilla JS and asset folders are copied into dist for production builds
function copyStaticAssets() {
  return {
    name: 'copy-static-assets',
    closeBundle() {
      const jsDir = resolve(__dirname, 'js');
      const distJsDir = resolve(__dirname, 'dist', 'js');
      if (fs.existsSync(jsDir)) {
        fs.cpSync(jsDir, distJsDir, { recursive: true });
      }

      const assetsDir = resolve(__dirname, 'assets');
      const distAssetsDir = resolve(__dirname, 'dist', 'assets');
      if (fs.existsSync(assetsDir)) {
        fs.cpSync(assetsDir, distAssetsDir, { recursive: true });
      }
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      port: 5173,
      open: true
    },
    define: {
      __SUPABASE_URL__: JSON.stringify(env.VITE_SUPABASE_URL || 'https://rxxgelkxclsjavxvevvm.supabase.co'),
      __SUPABASE_ANON_KEY__: JSON.stringify(env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_HSIPaKeMY3IguAyrYsSQHQ_GO9MuE9b')
    },
    plugins: [
      copyStaticAssets()
    ],
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          login: resolve(__dirname, 'login.html'),
          register: resolve(__dirname, 'register.html'),
          dashboard: resolve(__dirname, 'dashboard.html')
        }
      }
    }
  };
});
