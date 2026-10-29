import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'node:path';
import handler from './api/odcloud.js';

export default defineConfig(({ mode }) => {
  // ODCLOUD_SERVICE_KEY 는 VITE_ 접두사가 없어서 브라우저로 나가지 않아요. 개발 서버의 /api/odcloud 에서만 씁니다.
  const env = loadEnv(mode, process.cwd(), '');
  if (env.ODCLOUD_SERVICE_KEY) process.env.ODCLOUD_SERVICE_KEY = env.ODCLOUD_SERVICE_KEY;

  return {
    server: { port: 5173, open: false },
    plugins: [{
      name: 'odcloud-dev-proxy',
      configureServer(server) { server.middlewares.use('/api/odcloud', (req, res) => handler(req, res)); },
    }],
    build: {
      rollupOptions: {
        input: { main: resolve(process.cwd(), 'index.html'), map: resolve(process.cwd(), 'map.html') },
      },
    },
  };
});
