// Local preview server. ES modules need http:// rather than file://, so `npm run dev` serves the
// repo root: / runs the game straight from src/, and /dist/tinplate-junction.html shows the
// bundled build inside the same kind of page skeleton the claude.ai artifact host adds.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT) || 8080;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
};
const SKELETON = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
  + '<style>body{margin:0}[hidden]{display:none!important}</style></head><body>\n';

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = resolve(ROOT, '.' + (path.endsWith('/') ? path + 'index.html' : path));
  if (file !== ROOT && !file.startsWith(ROOT + sep)) { res.writeHead(403).end(); return; }
  try {
    let data = await readFile(file);
    if (file.startsWith(resolve(ROOT, 'dist') + sep) && extname(file) === '.html') data = SKELETON + data + '\n</body></html>';
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(data);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found. Run `npm run build` first if you want /dist.');
  }
}).listen(PORT, () => console.log(`Tinplate Junction at http://localhost:${PORT}/  (built page: http://localhost:${PORT}/dist/tinplate-junction.html)`));
