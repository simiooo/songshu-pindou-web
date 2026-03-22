import type { VercelRequest, VercelResponse } from '@vercel/node';

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

  try {
    // 使用 fetch API 转发请求
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    
    // 必须保留原始的 Content-Type，包含 boundary
    const originalContentType = req.headers['content-type'];
    if (originalContentType) {
      headers['Content-Type'] = originalContentType;
      console.log('[Upload] Using Content-Type:', originalContentType);
    }
    
    console.log('[Upload] Sending fetch request to:', targetUrl);
    
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: new Uint8Array(body),
    });
    
    console.log('[Upload] Response status:', response.status);
    console.log('[Upload] Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseBody = await response.text();
    console.log('[Upload] Response body:', responseBody.substring(0, 500));
    
    Object.entries(corsHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
    res.status(response.status).send(responseBody);
    
  } catch (error) {
    console.error('[Upload] Fetch error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

async function handleFileAccess(url: URL, res: VercelResponse) {
  const pathname = url.pathname.replace('/api/upload/', '');
  const filename = pathname.replace(/^\/+/, '');

  if (!filename) {
    return res.status(400).json({ error: 'Missing filename' });
  }

  const targetUrl = `${UGUU_TARGET}/${filename}`;

  try {
    const response = await fetch(targetUrl);
    
    if (!response.ok) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const buffer = await response.arrayBuffer();
    
    Object.entries(corsHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.status(200).send(Buffer.from(buffer));
    
  } catch (error) {
    console.error('[Upload] File access error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}