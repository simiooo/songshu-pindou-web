interface RequestContext {
  request: Request;
  env: Env;
  params: Record<string, string>;
}

interface Env {
  UGUU_API_KEY?: string;
}

const UGUU_TARGET = 'https://uguu.se';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequest({ request }: RequestContext): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname.replace('/api/upload/', '') || '';

  const isUploadRequest = request.method === 'POST' || (request.method === 'OPTIONS' && url.searchParams.has('output'));

  if (isUploadRequest) {
    return handleUploadRequest(url, request);
  }

  return handleFileAccess(pathname);
}

async function handleUploadRequest(url: URL, request: Request): Promise<Response> {
  const output = url.searchParams.get('output');

  const targetPath = url.search.includes('?')
    ? `/upload${url.search}`
    : '/upload';

  const targetUrl = `${UGUU_TARGET}${targetPath}`;

  try {
    const headers: Record<string, string> = {};
    const contentType = request.headers.get('Content-Type');
    if (contentType) {
      headers['Content-Type'] = contentType;
    }
    headers['Accept'] = 'application/json';

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: request.body,
      duplex: 'half',
    } as RequestInit);

    if (output === 'json') {
      const contentType = response.headers.get('Content-Type') || 'application/json';
      const responseBody = await response.arrayBuffer();

      const newHeaders = new Headers(corsHeaders);
      newHeaders.set('Content-Type', contentType);

      return new Response(responseBody, {
        status: response.status,
        headers: newHeaders,
      });
    }

    return new Response(response.body, {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': response.headers.get('Content-Type') || 'text/plain',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

async function handleFileAccess(pathname: string): Promise<Response> {
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

export async function onRequestGet({ request }: { request: Request }): Promise<Response> {
  return onRequest({ request } as RequestContext);
}

export async function onRequestPost({ request }: { request: Request }): Promise<Response> {
  return onRequest({ request } as RequestContext);
}
