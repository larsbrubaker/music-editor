// Local dev server: `bun dev`
// Serves the repo root as a static site (exactly what GitHub Pages does), watches
// the tree, and tells open browser tabs to reload when anything changes.
import { watch } from 'node:fs';
import { join, extname, normalize } from 'node:path';

const root = normalize(join(import.meta.dir, '..'));
const port = Number(process.env.PORT || 3000);
const clients = new Set();

const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.ico': 'image/x-icon', '.md': 'text/markdown; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
};

const reloadScript = `<script>(function(){var es=new EventSource('/__events');es.onmessage=function(e){if(e.data==='reload'){location.reload();}};})();</script>`;

Bun.serve({
  port,
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === '/__events') {
      let controller;
      const stream = new ReadableStream({
        start(c) { controller = c; clients.add(c); c.enqueue(': connected\n\n'); },
        cancel() { clients.delete(controller); },
      });
      return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } });
    }
    let path = decodeURIComponent(url.pathname);
    if (path.endsWith('/')) { path += 'index.html'; }
    const full = normalize(join(root, path));
    if (!full.startsWith(root)) { return new Response('forbidden', { status: 403 }); }
    let file = Bun.file(full);
    if (!(await file.exists())) {
      const alt = Bun.file(join(full, 'index.html'));
      if (await alt.exists()) { return Response.redirect(url.pathname + '/', 302); }
      return new Response('not found: ' + path, { status: 404 });
    }
    const ext = extname(full).toLowerCase();
    const headers = { 'Content-Type': types[ext] || file.type || 'application/octet-stream', 'Cache-Control': 'no-store' };
    if (ext === '.html') {
      const html = await file.text();
      return new Response(html.replace(/<\/body>/i, reloadScript + '</body>'), { headers });
    }
    return new Response(file, { headers });
  },
});

let pending = null;
watch(root, { recursive: true }, (event, filename) => {
  if (!filename || /(^|[\\/])(\.git|node_modules)([\\/]|$)/.test(filename)) { return; }
  clearTimeout(pending);
  pending = setTimeout(() => {
    for (const c of clients) { try { c.enqueue('data: reload\n\n'); } catch (e) { clients.delete(c); } }
    console.log(`[dev] ${filename} changed - reloading ${clients.size} tab(s)`);
  }, 80);
});

console.log(`music-editor dev server: http://localhost:${port}/  (watching ${root})`);
