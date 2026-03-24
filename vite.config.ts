import { defineConfig, type Plugin } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import path from 'path'
import https from 'https'
import http from 'http'
import { URL } from 'url'

import { cloudflare } from "@cloudflare/vite-plugin";

// 图片代理插件（开发环境）
function proxyImagePlugin(): Plugin {
  return {
    name: 'proxy-image',
    configureServer(server) {
      server.middlewares.use('/api/proxy-image', (req, res) => {
        const url = new URL(req.url || '', `http://${req.headers.host}`);
        const targetUrl = url.searchParams.get('url');
        
        if (!targetUrl) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Missing url parameter' }));
          return;
        }
        
        const decodedUrl = decodeURIComponent(targetUrl);
        const parsedUrl = new URL(decodedUrl);
        const client = parsedUrl.protocol === 'https:' ? https : http;
        
        const proxyReq = client.get(decodedUrl, (proxyRes) => {
          if (proxyRes.statusCode !== 200) {
            res.statusCode = proxyRes.statusCode || 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: `Failed to fetch image: ${proxyRes.statusCode}` }));
            return;
          }
          
          res.setHeader('Content-Type', proxyRes.headers['content-type'] || 'image/png');
          res.setHeader('Cache-Control', 'public, max-age=300');
          res.setHeader('Access-Control-Allow-Origin', '*');
          
          proxyRes.pipe(res);
        });
        
        proxyReq.on('error', (error) => {
          console.error('Proxy error:', error);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: error.message }));
        });
        
        proxyReq.setTimeout(30000, () => {
          proxyReq.destroy();
          res.statusCode = 504;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Gateway timeout' }));
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    proxyImagePlugin(),
    cloudflare()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api/upload': {
        target: 'https://uguu.se',
        changeOrigin: true,
        rewrite: (path) => {
          // 上传请求: /api/upload?output=json -> /upload?output=json
          // 访问文件: /api/upload/filename.png -> /filename.png
          if (path.includes('?')) {
            return path.replace(/^\/api\/upload/, '/upload');
          }
          return path.replace(/^\/api\/upload\//, '/');
        },
      },
    },
  },
})