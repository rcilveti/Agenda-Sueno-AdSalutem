// Arnés de pruebas: carga la Agenda de Sueño en jsdom con las APIs del navegador que necesita.
// Uso: const app = await loadApp({file, url, pilot, standalone, storage});
'use strict';
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const { webcrypto } = require('crypto');

// Archivo a probar: variable AGENDA_HTML, o index.html en la raíz del repositorio, o el
// agenda_sueno_diario_v*.html más reciente de la raíz.
function resolverArchivo() {
  if (process.env.AGENDA_HTML) return path.resolve(process.env.AGENDA_HTML);
  const raiz = path.join(__dirname, '..');
  const idx = path.join(raiz, 'index.html');
  if (fs.existsSync(idx)) return idx;
  const cand = fs.readdirSync(raiz).filter(f => /^agenda_sueno_diario_v[\d_]+\.html$/.test(f)).sort();
  if (!cand.length) throw new Error('No se encuentra el HTML de la aplicación (usa AGENDA_HTML=ruta)');
  return path.join(raiz, cand[cand.length - 1]);
}
const DEFAULT_FILE = resolverArchivo();

async function loadApp(opts = {}) {
  const file = opts.file || DEFAULT_FILE;
  let html = fs.readFileSync(file, 'utf8');
  // Las librerías externas (cdnjs) no se cargan en las pruebas.
  html = html.replace(/<script defer src="https:\/\/cdnjs[^"]+"><\/script>/g, '');
  if (opts.pilot === false) html = html.replace('const MODO_PILOTO = true;', 'const MODO_PILOTO = false;');
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => errors.push(String(e && (e.stack || e.message) || e)));
  vc.on('error', (...a) => { if (!opts.quiet) errors.push('console.error: ' + a.map(String).join(' ')); });
  const dialogs = [];
  const dom = new JSDOM(html, {
    url: opts.url || 'https://rcilveti.github.io/Agenda-Sueno-AdSalutem/',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(win) {
      Object.defineProperty(win, 'crypto', { value: webcrypto, configurable: true });
      win.TextEncoder = TextEncoder; win.TextDecoder = TextDecoder;
      win.CompressionStream = CompressionStream; win.DecompressionStream = DecompressionStream;
      win.Response = Response;
      win.matchMedia = q => ({ matches: !!(opts.standalone && /standalone/.test(q)), media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
      win.alert = m => dialogs.push(['alert', String(m)]);
      win.confirm = m => { dialogs.push(['confirm', String(m)]); return opts.confirm ? opts.confirm(String(m)) : true; };
      win.prompt = (m, d) => { dialogs.push(['prompt', String(m)]); return opts.prompt ? opts.prompt(String(m), d) : null; };
      win.print = () => {};
      win.scrollTo = () => {};
      win.HTMLElement.prototype.scrollIntoView = function () {};
      win.URL.createObjectURL = () => 'blob:test';
      win.URL.revokeObjectURL = () => {};
      if (opts.userAgent) Object.defineProperty(win.navigator, 'userAgent', { get: () => opts.userAgent, configurable: true });
      if (opts.standalone) Object.defineProperty(win.navigator, 'standalone', { get: () => true, configurable: true });
      if (opts.storage) for (const [k, v] of Object.entries(opts.storage)) win.localStorage.setItem(k, v);
      if (opts.beforeParse) opts.beforeParse(win);
    }
  });
  const win = dom.window;
  // esperar a que termine el arranque asíncrono (start())
  await new Promise(r => setTimeout(r, opts.bootDelay || 400));
  const ev = code => win.eval(code);
  // evj: igual que ev, pero devuelve una copia en el contexto de Node (para comparar objetos)
  const copia = v => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
  const evj = code => { const v = win.eval(code); return (v && typeof v.then === 'function') ? v.then(copia) : copia(v); };
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  // copia del almacenamiento local (para simular que se cierra y se vuelve a abrir la app)
  const storage = () => { const o = {}; for (let i = 0; i < win.localStorage.length; i++) { const k = win.localStorage.key(i); o[k] = win.localStorage.getItem(k); } return o; };
  return { dom, win, doc: win.document, ev, evj, errors, dialogs, sleep, storage };
}

module.exports = { loadApp, DEFAULT_FILE };
