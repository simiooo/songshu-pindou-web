import type { VercelRequest, VercelResponse } from '@vercel/node';
import https from 'https';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = new URL(req.url || '/', `https://${req.headers.host}`);

  if (url.pathname.startsWith('/api/proxy-image')) {
    return handleProxyImage(url, res);
  }

  res.status(404).json({ error: 'Not found' });
}

async function handleProxyImage(url: URL, res: VercelResponse) {
  const targetUrl = url.searchParams.get('url');

  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  let decodedUrl: string;
  try {
    decodedUrl = decodeURIComponent(targetUrl);
    new URL(decodedUrl);
  } catch {
    return res.status(400).json({ error: 'Invalid url parameter' });
  }

  return new Promise<void>((resolve) => {
    https.get(decodedUrl, { headers: { 'User-Agent': 'Proxy/1.0' } }, (proxyRes) => {
      if (proxyRes.statusCode !== 200) {
        res.status(proxyRes.statusCode || 500).json({ error: `Failed to fetch image: ${proxyRes.statusCode}` });
        return resolve();
      }

      const contentType = proxyRes.headers['content-type'] || 'image/png';
      const chunks: Buffer[] = [];

      proxyRes.on('data', (chunk: Buffer) => chunks.push(chunk));
      proxyRes.on('end', () => {
        const buffer = Buffer.concat(chunks);

        Object.entries(corsHeaders).forEach(([key, value]) => {
          res.setHeader(key, value);
        });
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=300');
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
