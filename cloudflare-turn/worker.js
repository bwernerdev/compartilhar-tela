// Worker da Cloudflare que entrega credenciais TURN temporárias para a página "Tela Compartilhada".
// A chave do TURN (TURN_KEY_ID / TURN_KEY_API_TOKEN) fica só aqui, como segredo do Worker;
// a página recebe apenas usuário e senha que expiram sozinhos.

const ALLOWED_ORIGINS = [
  'https://bwernerdev.github.io',
  'http://localhost:8765',
  'http://127.0.0.1:8765',
];
const TTL_SECONDS = 24 * 60 * 60; // as credenciais valem 24 h (mais que qualquer sessão de tela)

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = ALLOWED_ORIGINS.includes(origin);
    const cors = allowed
      ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'GET, OPTIONS', Vary: 'Origin' }
      : {};

    if (request.method === 'OPTIONS') return new Response(null, { status: allowed ? 204 : 403, headers: cors });
    if (!allowed) return new Response('Origem não permitida', { status: 403 });
    if (request.method !== 'GET') return new Response('Use GET', { status: 405, headers: cors });
    if (!env.TURN_KEY_ID || !env.TURN_KEY_API_TOKEN) return json({ error: 'turn_nao_configurado' }, 500, cors);

    const r = await fetch(
      `https://rtc.live.cloudflare.com/v1/turn/keys/${env.TURN_KEY_ID}/credentials/generate-ice-servers`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.TURN_KEY_API_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ttl: TTL_SECONDS }),
      },
    );
    if (!r.ok) return json({ error: 'cloudflare', status: r.status }, 502, cors);

    const data = await r.json();
    // navegadores bloqueiam a porta 53; tirar essas URLs evita esperar o tempo-limite
    const iceServers = (data.iceServers || [])
      .map(s => ({ ...s, urls: [].concat(s.urls).filter(u => !/:53(\?|$)/.test(u)) }))
      .filter(s => s.urls.length);
    return json({ iceServers }, 200, cors);
  },
};

function json(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
