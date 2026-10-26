/* Agenda de Sueño — service worker (v4.9.6)
 * Hace que la aplicación funcione sin conexión una vez abierta por primera vez.
 *  - La página (navegación): primero la red, y si no hay conexión, la copia guardada.
 *    Así las actualizaciones llegan en cuanto hay red y sin red la app sigue abriéndose.
 *  - Librerías de cdnjs, iconos y manifiesto: primero la copia guardada, que se renueva en
 *    segundo plano.
 * Los datos del diario NO pasan por aquí: viven en el almacenamiento del navegador
 * (localStorage) y nunca se envían a ningún servidor.
 * Debe publicarse en la MISMA carpeta que la página (p. ej. junto a index.html). Cada carpeta del sitio con
 * su propia versión (la raíz, /v4.9.6/…) tiene su service worker y su copia, sin pisarse entre sí.
 */
'use strict';
const VERSION = '4.9.6';
// El nombre de la copia lleva la carpeta del service worker: así pueden convivir versiones publicadas en
// carpetas distintas del mismo sitio (la raíz y, por ejemplo, /v4.9.6/) sin borrarse la copia sin conexión.
const SCOPE = (self.registration && self.registration.scope) || self.location.href.replace(/[^/]*$/, '');
const PREFIJO = 'agenda-sueno-';
const CACHE = PREFIJO + VERSION + '@' + SCOPE;
// las copias antiguas (sin carpeta en el nombre) eran de la raíz: solo las borra el service worker de la raíz
const EN_CARPETA_DE_VERSION = /\/v\d+\.\d+\.\d+\/$/.test(new URL(SCOPE).pathname);
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];
const CDN = [
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/docx/8.5.0/docx.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Cada recurso por separado: si falta uno (p. ej. un icono), no se pierde la instalación.
    await Promise.allSettled(SHELL.map(u => cache.add(new Request(u, { cache: 'reload' }))));
    await Promise.allSettled(CDN.map(u => cache.add(new Request(u, { mode: 'no-cors' }))));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    // borra solo las copias anteriores de ESTA carpeta (y, en la raíz, las antiguas sin carpeta)
    const propia = k => k.endsWith('@' + SCOPE) || (!k.includes('@') && !EN_CARPETA_DE_VERSION);
    await Promise.all(keys.filter(k => k.startsWith(PREFIJO) && k !== CACHE && propia(k)).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Navegación (la propia página): red primero, copia guardada si no hay conexión.
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        if (fresh && fresh.ok) {
          const cache = await caches.open(CACHE);
          cache.put(new Request(url.origin + url.pathname), fresh.clone());
        }
        return fresh;
      } catch (e) {
        const cache = await caches.open(CACHE);
        return (await cache.match(new Request(url.origin + url.pathname)))
            || (await cache.match('./index.html'))
            || (await cache.match('./'))
            || Response.error();
      }
    })());
    return;
  }

  // Librerías de cdnjs y recursos estáticos del mismo origen: copia guardada y renovación en segundo plano.
  const esCDN = url.hostname === 'cdnjs.cloudflare.com';
  const esEstatico = url.origin === self.location.origin && /\.(png|json|js|css|svg|ico)$/i.test(url.pathname);
  if (esCDN || esEstatico) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req, { ignoreVary: true });
      const red = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) cache.put(req, r.clone()); return r; }).catch(() => null);
      return cached || (await red) || Response.error();
    })());
  }
});
