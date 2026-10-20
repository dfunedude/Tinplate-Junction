// Bundles index.html + src/ into one self-contained page, dist/tinplate-junction.html, for the
// claude.ai artifact. The modules are concatenated into a single inline module script, so they
// share one scope there: every top-level name must be unique across src/ (the syntax check at
// the end catches a clash). Usage: node tools/build.mjs [--debug]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ENTRY = 'src/main.js';
const OUT = 'dist/tinplate-junction.html';
// the window.__tj test handle only ships in debug builds
const DEBUG = process.argv.includes('--debug') || !!process.env.DEBUG;

const errors = [];
const rel = f => relative(ROOT, f).split('\\').join('/');

// ---- read the module graph, dependencies first (the order a browser evaluates it in) ----
const IMPORT = /^import\s+([\s\S]*?)\s+from\s+['"]([^'"]+)['"];?[ \t]*\n?/gm;
const EXPORT = /^export\s+(?:const|let|var|function|class)\s+([\w$]+)/gm;
// for the lint: not part of a longer name and not a property (a.n), though a spread (...n) counts
const NOT_PROP = '(?<![\\w$])(?<!(?<!\\.\\.)\\.)';
const modules = [], seen = new Set(), external = [];
function visit(file) {
  if (seen.has(file)) return;
  seen.add(file);
  const src = readFileSync(file, 'utf8');
  const name = rel(file), imports = [];
  for (const [, clause, spec] of src.matchAll(IMPORT)) {
    if (!spec.startsWith('.')) { const line = `import ${clause} from '${spec}';`; if (!external.includes(line)) external.push(line); continue; }
    if (!/^\{[^}]*\}$/.test(clause) || /\bas\b/.test(clause)) errors.push(`${name}: import from '${spec}' must be a plain { list } (no default, * or "as")`);
    const target = resolve(dirname(file), spec);
    imports.push({ target, names: clause.replace(/[{}\s]/g, '').split(',').filter(Boolean) });
    visit(target);
  }
  if (/^export\s+(default\b|\{|\*)/m.test(src)) errors.push(`${name}: use "export const/let/function/class" only`);
  if (/^export\s+(?:const|let|var)\s+[\w$]+\s*=[^;\n(]*,\s*[\w$]+\s*=/m.test(src)) errors.push(`${name}: one name per export statement`);
  const exports = [...src.matchAll(EXPORT)].map(m => m[1]);
  const body = src.replace(IMPORT, '').replace(/^export\s+/gm, '').replace(/^\s*\n/, '');
  modules.push({ file, name, imports, exports, body });
}
visit(join(ROOT, ENTRY));
lint();
if (errors.length) fail(errors.join('\n'));

// ---- the script: shared imports, then each module's code ----
let js = external.join('\n') + '\n' + modules.map(m => `// ---- ${m.name} ----\n${m.body}`).join('\n');
if (!DEBUG) js = js.split('\n').filter(l => !l.includes('window.__tj')).join('\n');
const check = spawnSync(process.execPath, ['--input-type=module', '--check'], { input: js, encoding: 'utf8' });
if (check.status !== 0) fail('the bundled script does not parse (often two modules declaring the same top-level name):\n' + check.stderr);

// ---- the page: the artifact host supplies the doctype, charset and viewport, so ship what goes inside ----
const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
const head = (html.match(/<head>([\s\S]*?)<\/head>/) || [])[1], body = (html.match(/<body>([\s\S]*?)<\/body>/) || [])[1];
if (head === undefined || body === undefined) fail('index.html needs a <head> and a <body>');
let page = (head.replace(/^<meta [^>]*>\n/gm, '') + body).replace(/^\s+/, '');
const css = [];
page = page.replace(/<link rel="stylesheet" href="(src\/[^"]+\.css)">\n/g, (m, href) => {
  css.push(readFileSync(join(ROOT, href), 'utf8'));
  return css.length === 1 ? '<!--STYLES-->' : '';
});
const tag = `<script type="module" src="${ENTRY}"></script>`;
if (!page.includes(tag)) fail(`index.html must load the game with ${tag}`);
page = page.replace('<!--STYLES-->', () => `<style>\n${css.join('\n')}</style>\n`).replace(tag, () => `<script type="module">\n${js}\n</script>`);

mkdirSync(join(ROOT, dirname(OUT)), { recursive: true });
writeFileSync(join(ROOT, OUT), page);
console.log(`${OUT}  ${(page.length / 1024).toFixed(1)} KB  ${modules.length} modules, ${css.length} stylesheets${DEBUG ? '  (debug)' : ''}`);

function fail(msg) { console.error('build failed:\n' + msg); process.exit(1); }

// ---- module hygiene the bundle would otherwise hide ----
// In the bundle every module sees every other module's names, so a missing import still works
// there but breaks `npm run dev` (real ES modules). Catch it here instead.
function lint() {
  const owner = new Map();
  for (const m of modules) for (const n of m.exports) {
    if (owner.has(n)) errors.push(`${n} is exported by both ${owner.get(n).name} and ${m.name}`);
    owner.set(n, m);
  }
  for (const m of modules) {
    const code = codeOnly(m.body), imported = new Set();
    for (const { target, names } of m.imports) {
      const t = modules.find(x => x.file === target);
      for (const n of names) {
        imported.add(n);
        if (!t.exports.includes(n)) errors.push(`${m.name}: imports ${n}, which ${t.name} does not export`);
        else if (!used(code, n)) console.warn(`warning: ${m.name} imports ${n} but never uses it`);
      }
    }
    for (const [n, o] of owner) {
      if (o === m || imported.has(n) || declared(code, n)) continue;
      if (used(code, n)) errors.push(`${m.name}: uses ${n} without importing it from ${o.name}`);
    }
  }
}
function word(n) { return n.replace(/\$/g, '\\$'); }
// a name used as a value: not a property (a.n) and not an object key ({ n: 1 })
function used(code, n) {
  const N = word(n);
  return new RegExp(`${NOT_PROP}${N}(?![\\w$])`).test(code.replace(new RegExp(`(?<=[{,]\\s*)${N}\\s*:(?!:)`, 'g'), ''));
}
// declared somewhere in the module (a local variable or parameter that shadows the import)
function declared(code, n) {
  const N = word(n), name = new RegExp(`${NOT_PROP}${N}(?![\\w$])`);
  if (new RegExp(`\\b(?:const|let|var|function|class)\\s+${N}(?![\\w$])`).test(code)) return true;
  if (new RegExp(`\\b(?:const|let|var)\\s*[{[][^=;]*(?<![\\w$.])${N}(?![\\w$])[^=;]*[}\\]]\\s*=`).test(code)) return true;
  if (new RegExp(`(?<![\\w$.])${N}\\s*=>`).test(code)) return true;
  const params = /(?:\bfunction\s*[\w$]*|\b(?!(?:if|for|while|switch|with|return|typeof)\b)[\w$]+)\s*\(([^()]*)\)\s*\{|\(([^()]*)\)\s*=>/g;
  for (const m of code.matchAll(params)) if (name.test(m[1] ?? m[2] ?? '')) return true;
  return false;
}
// blank out comments and the text of strings, so names are only matched in code
function codeOnly(src) {
  let out = '', i = 0, mode = 'code', depth = 0;
  const holes = [];   // brace depth at each open ${ in a template string
  while (i < src.length) {
    const c = src[i], n = src[i + 1];
    if (mode === 'code') {
      if (c === '/' && n === '/') { const j = src.indexOf('\n', i); i = j < 0 ? src.length : j; continue; }
      if (c === '/' && n === '*') { const j = src.indexOf('*/', i + 2); i = j < 0 ? src.length : j + 2; out += ' '; continue; }
      if (c === '"' || c === "'" || c === '`') { mode = c; out += ' '; i++; continue; }
      if (c === '{') depth++;
      else if (c === '}') {
        if (holes.length && holes[holes.length - 1] === depth) { holes.pop(); mode = '`'; out += ' '; i++; continue; }
        depth--;
      }
      out += c; i++;
    } else {
      if (c === '\\') { i += 2; continue; }
      if (c === mode) { mode = 'code'; out += ' '; i++; continue; }
      if (mode === '`' && c === '$' && n === '{') { holes.push(depth); mode = 'code'; out += ' '; i += 2; continue; }
      if (c === '\n') out += '\n';
      i++;
    }
  }
  return out;
}
