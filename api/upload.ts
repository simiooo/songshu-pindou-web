import type { VercelRequest, VercelResponse } from '@vercel/node';
import https from 'https';

const UGUU_TARGET = 'https://uguu.se';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    return handleUpload(url, req, res);
  }

  res.status(405).json({ error: 'Method Not Allowed' });
}

async function handleUpload(url: URL, req: VercelRequest, res: VercelResponse) {
  const targetUrl = `${UGUU_TARGET}/upload${url.search}`;

  const chunks: Buffer[] = [];
  for await (const chunk of req.body) {
    chunks.push(Buffer.from(chunk));
  }
  const body = chunks.length > 0 ? Buffer.concat(chunks) : null;

  return new Promise<void>((resolve) => {
    const proxyReq = https.request(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': req.headers['content-type'] || 'multipart/form-data',
        'Accept': 'application/json',
      },
    }, (proxyRes) => {
      const chunks: Buffer[] = [];
      proxyRes.on('data', (chunk: Buffer) => chunks.push(chunk));
      proxyRes.on('end', () => {
        const buffer = Buffer.concat(chunks);

        Object.entries(corsHeaders).forEach(([key, value]) => {
          res.setHeader(key, value);
        });
        res.setHeader('Content-Type', proxyRes.headers['content-type'] || 'application/json');
        res.status(proxyRes.statusCode || 200).send(buffer);
        resolve();
      });
      proxyRes.on('error', (err) => {
        res.status(500).json({ error: err.message });
        resolve();
      });
    });

    proxyReq.on('error', (error) => {
      res.status(500).json({ error: error.message });
      resolve();
    });

    if (body) {
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
