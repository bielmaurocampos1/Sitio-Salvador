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

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Cache-Control': 'no-cache', ...headers });
  res.end(body);
}

async function instagramHandler(res) {
  const accessToken = process.env.IG_ACCESS_TOKEN;
  const userId = process.env.IG_USER_ID;
  const graphVersion = process.env.IG_GRAPH_VERSION || 'v23.0';
  if (!accessToken || !userId) return send(res, 204, '');

  try {
    const fields = 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp';
    const endpoint = `https://graph.facebook.com/${graphVersion}/${userId}/media?fields=${fields}&limit=8&access_token=${encodeURIComponent(accessToken)}`;
    const response = await fetch(endpoint, { headers: { Accept: 'application/json' } });
    const payload = await response.json();
    if (!response.ok) return send(res, 502, JSON.stringify({ error: 'instagram_unavailable' }), { 'Content-Type': MIME['.json'] });
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
    return send(res, 502, JSON.stringify({ error: 'instagram_unavailable' }), { 'Content-Type': MIME['.json'] });
  }
}

function safePathname(pathname) {
  const decoded = decodeURIComponent(pathname).replace(/\\/g, '/');
  const clean = path.normalize(decoded).replace(/^(\.\.(\/|\\|$))+/, '');
  return clean;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (url.pathname === '/api/instagram') return instagramHandler(res);

  let pathname = safePathname(url.pathname);
  if (pathname === '/' || pathname === '') pathname = '/index.html';
  if (!path.extname(pathname)) pathname += '.html';

  let filePath = path.join(PUBLIC_DIR, pathname);
  if (!filePath.startsWith(PUBLIC_DIR)) return send(res, 403, 'Forbidden');

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      filePath = path.join(PUBLIC_DIR, 'index.html');
    }
    fs.readFile(filePath, (readErr, data) => {
      if (readErr) return send(res, 500, 'Erro ao carregar o site.');
      const ext = path.extname(filePath).toLowerCase();
      send(res, 200, data, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400' });
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Sítio Salvador disponível em http://localhost:${PORT}`);
});
