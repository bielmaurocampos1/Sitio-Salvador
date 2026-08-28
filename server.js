const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function cacheHeader(ext) {
  if (ext === '.html' || ext === '.css' || ext === '.js' || ext === '.json') return 'no-cache, no-store, must-revalidate';
  return 'public, max-age=604800, immutable';
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    ...headers
  });
  res.end(body);
}

async function instagramHandler(res) {
  const accessToken = process.env.IG_ACCESS_TOKEN;
  const userId = process.env.IG_USER_ID;
  const graphVersion = process.env.IG_GRAPH_VERSION || 'v23.0';
  if (!accessToken || !userId) return send(res, 204, '', { 'Cache-Control': 'no-store' });

  try {
    const fields = 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp';
    const endpoint = `https://graph.facebook.com/${graphVersion}/${userId}/media?fields=${fields}&limit=8&access_token=${encodeURIComponent(accessToken)}`;
    const response = await fetch(endpoint, { headers: { Accept: 'application/json' } });
    const payload = await response.json();
    if (!response.ok) return send(res, 502, JSON.stringify({ error: 'instagram_unavailable' }), { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store' });
    const posts = (payload.data || []).map(post => ({
      id: post.id,
      caption: post.caption || '',
      media_type: post.media_type,
      media_url: post.media_type === 'VIDEO' ? (post.thumbnail_url || post.media_url) : post.media_url,
      permalink: post.permalink,
      timestamp: post.timestamp
    }));
    return send(res, 200, JSON.stringify({ source: 'live', posts }), { 'Content-Type': MIME['.json'], 'Cache-Control': 'public, max-age=300' });
  } catch (error) {
    console.error(error);
    return send(res, 502, JSON.stringify({ error: 'instagram_unavailable' }), { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store' });
  }
}

function normalizePathname(pathname) {
  try {
    return decodeURIComponent(pathname).replace(/\\/g, '/');
  } catch {
    return pathname.replace(/\\/g, '/');
  }
}

function serveFile(reqPath, res) {
  const relative = reqPath.replace(/^\/+/, '');
  const normalized = path.normalize(relative);
  if (normalized.startsWith('..') || path.isAbsolute(normalized)) {
    return send(res, 403, 'Forbidden', { 'Cache-Control': 'no-store' });
  }

  const filePath = path.join(PUBLIC_DIR, normalized);
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) return send(res, 404, 'Not found', { 'Cache-Control': 'no-store' });
    fs.readFile(filePath, (readErr, data) => {
      if (readErr) return send(res, 500, 'Erro ao carregar o site.', { 'Cache-Control': 'no-store' });
      const ext = path.extname(filePath).toLowerCase();
      send(res, 200, data, {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Cache-Control': cacheHeader(ext)
      });
    });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (url.pathname === '/health') return send(res, 200, 'ok', { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
  if (url.pathname === '/api/instagram') return instagramHandler(res);

  let pathname = normalizePathname(url.pathname);
  if (pathname === '/' || pathname === '') pathname = '/index.html';

  // URLs amigáveis, sem quebrar arquivos estáticos.
  if (!path.extname(pathname)) pathname = `${pathname.replace(/\/$/, '')}.html`;

  serveFile(pathname, res);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Sítio Salvador disponível em http://localhost:${PORT}`);
});
