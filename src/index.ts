const UGUU_TARGET = 'https://uguu.se';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/proxy-image')) {
      return handleProxyImage(url);
    }

    if (url.pathname.startsWith('/api/upload')) {
      return handleUpload(request);
    }

    return new Response('Not Found', { status: 404 });
  },
};

async function handleProxyImage(url: URL): Promise<Response> {
  const targetUrl = url.searchParams.get('url');

  if (!targetUrl) {
    return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  let decodedUrl: string;
  try {
    decodedUrl = decodeURIComponent(targetUrl);
    new URL(decodedUrl);
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid url parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  try {
    const response = await fetch(decodedUrl, {
      headers: {
        'Accept': 'image/*,*/*',
        'User-Agent': 'Cloudflare-Image-Proxy/1.0',
      },
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: `Failed to fetch image: ${response.status}` }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const contentType = response.headers.get('Content-Type') || 'image/png';

    return new Response(response.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=300',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

async function handleUpload(request: Request): Promise<Response> {
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method === 'POST') {
    return handleUploadRequest(url, request);
  }

  if (request.method === 'GET') {
    return handleFileAccess(url);
  }

  return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
}

async function handleUploadRequest(url: URL, request: Request): Promise<Response> {
  const targetUrl = `${UGUU_TARGET}/upload${url.search}`;

  try {
    const contentType = request.headers.get('Content-Type') || 'multipart/form-data';
    const body = await request.arrayBuffer();

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        'Accept': 'application/json',
      },
      body,
    });

    const responseBody = await response.arrayBuffer();

    const newHeaders = new Headers(corsHeaders);
    newHeaders.set('Content-Type', response.headers.get('Content-Type') || 'application/json');

    return new Response(responseBody, {
      status: response.status,
      headers: newHeaders,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

async function handleFileAccess(url: URL): Promise<Response> {
  const pathname = url.pathname.replace('/api/upload', '');
  const filename = pathname.replace(/^\/+/, '');

  if (!filename) {
    return new Response(JSON.stringify({ error: 'Missing filename' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const targetUrl = `${UGUU_TARGET}/${filename}`;

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
    });

    if (!response.ok && response.status !== 302 && response.status !== 301) {
      return new Response(JSON.stringify({ error: 'File not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const contentType = response.headers.get('Content-Type') || 'application/octet-stream';

    return new Response(response.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
        ...corsHeaders,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch file';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}
