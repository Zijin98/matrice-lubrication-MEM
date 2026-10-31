// Service worker de las matrices: permite usar la página SIN INTERNET.
// - Guarda la página y, en segundo plano, todas las matrices con sus imágenes.
// - Con señal: muestra lo más reciente. Con señal débil (más de 3 s) o sin señal:
//   muestra al instante la copia guardada en el celular.
const CACHE = 'matrices-v2';
const ESPERA_MS = 3000;
const BASICOS = [
  './', 'index.html', 'css/app.css', 'js/app.js', 'js/util.js', 'js/qr.js', 'js/exportar.js', 'js/cripto.js', 'js/github.js',
  'js/vendor/jszip.min.js', 'manifest.webmanifest', 'data/matrices.json', 'data/config.json',
  'img/logo-blanco.png', 'img/icono-192.png', 'img/icono-512.png',
  'fonts/inter-400.woff', 'fonts/inter-500.woff', 'fonts/inter-600.woff', 'fonts/inter-700.woff', 'fonts/interdisplay-700.woff', 'fonts/interdisplay-800.woff',
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(BASICOS.map((u) => c.add(u).catch(() => {})))));
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const claves = await caches.keys();
    await Promise.all(claves.filter((k) => k.startsWith('matrices-') && k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

const local = (u) => new URL(u, self.registration.scope).href;
const esEstatico = (p) => /\/(img|fonts)\//.test(p) || /\.(png|jpe?g|webp|svg|woff2?)$/i.test(p);

function marcarCopia(res) {
  const h = new Headers(res.headers);
  h.set('X-Desde-Cache', '1');
  return res.blob().then((b) => new Response(b, { status: res.status, statusText: res.statusText, headers: h }));
}

async function deCache(req) {
  const cache = await caches.open(CACHE);
  if (req.mode === 'navigate') return (await cache.match(local('index.html'))) || cache.match(local('./'));
  return cache.match(req, { ignoreSearch: true });
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (u.origin !== self.location.origin) return;

  // Imágenes y fuentes: primero el celular (no cambian de nombre al editarse)
  if (esEstatico(u.pathname)) {
    e.respondWith((async () => {
      const guardado = await deCache(req);
      if (guardado) return guardado;
      const res = await fetch(req);
      if (res.ok) (await caches.open(CACHE)).put(req, res.clone()).catch(() => {});
      return res;
    })());
    return;
  }

  // Página y datos: red primero, pero si tarda o falla, la copia guardada
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const red = fetch(req).then((res) => {
      if (res.ok && res.type === 'basic') {
        const clave = req.mode === 'navigate' ? local('index.html') : req.url.split('?')[0];
        cache.put(clave, res.clone()).catch(() => {});
      }
      return res;
    });
    const guardado = await deCache(req);
    if (!guardado) return red;
    const lento = new Promise((r) => setTimeout(() => r('lento'), ESPERA_MS));
    try {
      const gana = await Promise.race([red, lento]);
      if (gana !== 'lento' && gana.ok) return gana;
    } catch { /* sin red */ }
    e.waitUntil(red.catch(() => {}));
    return marcarCopia(guardado.clone());
  })());
});

// Descarga en segundo plano de todas las matrices e imágenes para uso sin conexión
let enCurso = null;
self.addEventListener('message', (e) => {
  if (e.data && e.data.tipo === 'precargar') {
    if (!enCurso) enCurso = precargar().finally(() => { enCurso = null; });
    e.waitUntil(enCurso);
  }
});

async function avisar(msg) {
  (await self.clients.matchAll({ includeUncontrolled: true })).forEach((c) => c.postMessage(msg));
}

async function precargar() {
  const cache = await caches.open(CACHE);
  try {
    await Promise.all(BASICOS.map((u) => cache.add(u).catch(() => {})));
    const res = await fetch(local('data/matrices.json'), { cache: 'no-store' });
    if (!res.ok) throw new Error('sin datos');
    await cache.put(local('data/matrices.json'), res.clone());
    const d = await res.json();
    const rutas = new Set();
    (d.equipos || []).forEach((e) => { if (e.imagen) rutas.add(e.imagen); if (e.foto) rutas.add(e.foto); });
    Object.values(d.lubricantes || {}).forEach((l) => { if (l.imagen) rutas.add(l.imagen); });
    Object.values(d.lis || {}).forEach((r) => rutas.add(r));
    const lista = [...rutas].map(local);
    let hechos = 0;
    const total = lista.length;
    await avisar({ tipo: 'progreso', hechos, total });
    for (let i = 0; i < lista.length; i += 6) {
      await Promise.all(lista.slice(i, i + 6).map(async (url) => {
        if (!(await cache.match(url))) {
          try { const r = await fetch(url); if (r.ok) await cache.put(url, r); } catch { /* se reintenta la próxima vez */ }
        }
        hechos++;
      }));
      await avisar({ tipo: 'progreso', hechos, total });
    }
    await avisar({ tipo: 'listo', total, equipos: (d.equipos || []).length, actualizado: d.actualizado || '', fecha: new Date().toISOString() });
  } catch (err) {
    await avisar({ tipo: 'error', mensaje: String(err && err.message || err) });
  }
}
