import type { VercelRequest, VercelResponse } from '@vercel/node';
import https from 'https';

export const config = {
  api: {
    bodyParser: false,
  },
};

const UGUU_TARGET = 'https://uguu.se';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('[Upload] Received request:', req.method, req.url);
  
  const url = new URL(req.url || '/', `https://${req.headers.host}`);

  if (!url.pathname.startsWith('/api/upload')) {
    return res.status(404).json({ error: 'Not found' });
  }

  if (req.method === 'OPTIONS') {
    Object.entries(corsHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    return res.status(204).send('');
  }

  if (req.method === 'GET') {
    return handleFileAccess(url, res);
  }

  if (req.method === 'POST') {
    try {
      return await handleUpload(url, req, res);
    } catch (error) {
      console.error('[Upload] Error:', error);
      return res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  res.status(405).json({ error: 'Method Not Allowed' });
}

async function handleUpload(url: URL, req: VercelRequest, res: VercelResponse) {
  const targetUrl = `${UGUU_TARGET}/upload${url.search}`;
  console.log('[Upload] Target URL:', targetUrl);
  console.log('[Upload] Content-Type:', req.headers['content-type']);

  // 读取请求体数据
  const body = await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => {
      console.log('[Upload] Received chunk:', chunk.length, 'bytes');
      chunks.push(chunk);
    });
    req.on('end', () => {
      const buffer = Buffer.concat(chunks);
      console.log('[Upload] Total body size:', buffer.length, 'bytes');
      resolve(buffer);
    });
    req.on('error', (err) => {
      console.error('[Upload] Request error:', err);
      reject(err);
    });
  });

  return new Promise<void>((resolve) => {
    // 构建请求头，模仿 vite proxy 的 changeOrigin: true
    const requestHeaders: Record<string, string> = {
      'Accept': 'application/json',
      'Host': 'uguu.se',
      'Origin': 'https://uguu.se',
      'Referer': 'https://uguu.se/',
    };
    
    // 必须保留原始的 Content-Type，包含 boundary
    const originalContentType = req.headers['content-type'];
    if (originalContentType) {
      requestHeaders['Content-Type'] = originalContentType;
      console.log('[Upload] Using Content-Type:', originalContentType);
    }
    
    // 设置正确的 Content-Length
    requestHeaders['Content-Length'] = String(body.length);
    
    console.log('[Upload] Request headers:', requestHeaders);
    
    const proxyReq = https.request(targetUrl, {
      method: 'POST',
      headers: requestHeaders,
    }, (proxyRes) => {
      console.log('[Upload] Response status:', proxyRes.statusCode);
      console.log('[Upload] Response headers:', proxyRes.headers);
      
      const chunks: Buffer[] = [];
      proxyRes.on('data', (chunk: Buffer) => chunks.push(chunk));
      proxyRes.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const responseBody = buffer.toString('utf-8');
        console.log('[Upload] Response body:', responseBody.substring(0, 500));

        Object.entries(corsHeaders).forEach(([key, value]) => {
          res.setHeader(key, value);
        });
        res.setHeader('Content-Type', proxyRes.headers['content-type'] || 'application/json');
        res.status(proxyRes.statusCode || 200).send(buffer);
        resolve();
      });
      proxyRes.on('error', (err) => {
        console.error('[Upload] Proxy response error:', err);
        res.status(500).json({ error: err.message });
        resolve();
      });
    });

    proxyReq.on('error', (error) => {
      console.error('[Upload] Proxy request error:', error);
      res.status(500).json({ error: error.message });
      resolve();
    });

    if (body.length > 0) {
      proxyReq.write(body);
    }
    proxyReq.end();
  });
}

async function handleFileAccess(url: URL, res: VercelResponse) {
  const pathname = url.pathname.replace('/api/upload/', '');
  const filename = pathname.replace(/^\/+/, '');

  if (!filename) {
    return res.status(400).json({ error: 'Missing filename' });
  }

  const targetUrl = `${UGUU_TARGET}/${filename}`;

  return new Promise<void>((resolve) => {
    https.get(targetUrl, { method: 'GET' }, (proxyRes) => {
      if (!proxyRes.statusCode || proxyRes.statusCode > 400) {
        res.status(404).json({ error: 'File not found' });
        return resolve();
      }

      const contentType = proxyRes.headers['content-type'] || 'application/octet-stream';
      const chunks: Buffer[] = [];

      proxyRes.on('data', (chunk: Buffer) => chunks.push(chunk));
      proxyRes.on('end', () => {
        const buffer = Buffer.concat(chunks);

        Object.entries(corsHeaders).forEach(([key, value]) => {
          res.setHeader(key, value);
        });
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        res.status(200).send(buffer);
        resolve();
      });
      proxyRes.on('error', (err) => {
        res.status(500).json({ error: err.message });
        resolve();
      });
    }).on('error', (error) => {
      res.status(500).json({ error: error.message });
      resolve();
    });
  });
}