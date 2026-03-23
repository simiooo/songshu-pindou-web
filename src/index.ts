import { corsHeaders, jsonResponse, errorResponse, validateUrl, getFilenameFromUrl } from './lib/proxy';

const UGUU_TARGET = 'https://uguu.se';

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/proxy-image')) {
      return handleProxyImage(url);
    }

    if (url.pathname.startsWith('/api/upload')) {
      return handleUpload(url, request);
    }

    return jsonResponse({ error: 'Not found' }, 404);
  },
};

async function handleProxyImage(url: URL): Promise<Response> {
  const targetUrl = url.searchParams.get('url');

  if (!targetUrl) {
    return errorResponse('Missing url parameter', 400);
  }

  const decodedUrl = decodeURIComponent(targetUrl);
  const parsedUrl = validateUrl(decodedUrl);

  if (!parsedUrl) {
    return errorResponse('Invalid url parameter', 400);
  }

  try {
    const response = await fetch(decodedUrl, {
      headers: {
        'Accept': 'image/*,*/*',
        'User-Agent': 'Cloudflare-Image-Proxy/1.0',
      },
    });

    if (!response.ok) {
      return errorResponse(`Failed to fetch image: ${response.status}`, response.status);
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
    return errorResponse(message, 500);
  }
}

async function handleUpload(url: URL, request: Request): Promise<Response> {
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
    return errorResponse(message, 500);
  }
}

async function handleFileAccess(url: URL): Promise<Response> {
  const filename = getFilenameFromUrl(url, '/api/upload');

  if (!filename) {
    return errorResponse('Missing filename', 400);
  }

  const targetUrl = `${UGUU_TARGET}/${filename}`;

  try {
    const response = await fetch(targetUrl, { method: 'GET' });

    if (!response.ok && response.status !== 302 && response.status !== 301) {
      return errorResponse('File not found', 404);
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
    return errorResponse(message, 500);
  }
}
