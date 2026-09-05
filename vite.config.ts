import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import os from 'os';
import {defineConfig, Plugin} from 'vite';

function networkInfoPlugin(): Plugin {
  return {
    name: 'network-info-plugin',
    configureServer(server) {
      server.middlewares.use('/api/server-info', (req, res) => {
        const interfaces = os.networkInterfaces();
        const localIps: string[] = [];
        
        for (const name of Object.keys(interfaces)) {
          for (const iface of interfaces[name] || []) {
            if (iface.family === 'IPv4' && !iface.internal) {
              localIps.push(iface.address);
            }
          }
        }

        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          status: 'running',
          host: '0.0.0.0',
          port: 3000,
          localIps: localIps.length > 0 ? localIps : ['192.168.1.100'],
          hostname: os.hostname(),
          platform: os.platform(),
          uptime: Math.floor(process.uptime()),
          timestamp: new Date().toISOString(),
        }));
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), networkInfoPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
