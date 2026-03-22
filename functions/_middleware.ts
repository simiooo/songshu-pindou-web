interface RequestContext {
  request: Request;
  env: Env;
  params: Record<string, string>;
}

interface Env {
  ASSETS?: { fetch: typeof fetch };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequest({ request }: RequestContext): Promise<Response> {
  const url = new URL(request.url);

  if (url.pathname.startsWith('/api/proxy-image')) {
    return handleProxyImage(url);
  }

  return fetch(request);
}

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
    } as RequestInit);

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

export async function onRequestGet({ request }: RequestContext): Promise<Response> {
  return onRequest({ request, env: {}, params: {} });
}
