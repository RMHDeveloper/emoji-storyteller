// Vercel serverless function. Forwards OpenRouter chat-completion requests to
// the shared dashboard proxy so the OpenRouter API key never reaches the
// browser. The client calls this same-origin POST /api/proxy route instead
// of hitting OpenRouter directly.
export const config = { runtime: 'edge' };

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405);
  }

  const proxyUrl = (process.env.DASHBOARD_PROXY_URL || '').trim();
  const proxySecret = (process.env.DASHBOARD_PROXY_SECRET || '').trim();
  if (!proxyUrl || !proxySecret) {
    return json(
      {
        error:
          'The server is missing DASHBOARD_PROXY_URL or DASHBOARD_PROXY_SECRET. Add them in Vercel -> Settings -> Environment Variables, then redeploy.',
      },
      500
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }

  try {
    const upstream = await fetch(`${proxyUrl}/api/proxy/emoji-storyteller`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-proxy-secret': proxySecret,
      },
      body: JSON.stringify(body),
    });

    const data = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      return json(data ?? { error: 'The dashboard proxy request failed.' }, upstream.status);
    }
    return json(data);
  } catch {
    return json({ error: 'The server could not reach the dashboard proxy.' }, 502);
  }
}
