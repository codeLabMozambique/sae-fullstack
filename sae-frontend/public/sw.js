/* ============================================================
 * SAE — Service Worker (v2)
 * Cache offline para PDFs da biblioteca, thumbnails e metadata.
 *
 * Caches:
 *   sae-pdf-v2     — PDFs (cache controlado pelo utilizador)
 *   sae-meta-v2    — JSON de metadados (catálogo, categorias, conteúdo individual)
 *   sae-thumb-v2   — thumbnails / imagens
 *   sae-app-v2     — shell estático (HTML/JS/CSS)
 *
 * Estratégias por tipo de pedido:
 *   /content/api/contents/{id}/read         → cache-first  (PDF — guardado on-demand)
 *   /content/api/contents/files/{name}      → cache-first  (thumbs/anexos por filename)
 *   /content/api/contents/...               → network-first com fallback ao cache
 *   /content/api/categories|disciplines     → network-first com fallback
 *   imagens (image/*)                        → stale-while-revalidate
 *   shell estático (mesmo origem, GET)       → stale-while-revalidate
 * ============================================================ */

const VERSION = 'v2';
const PDF_CACHE   = `sae-pdf-${VERSION}`;
const META_CACHE  = `sae-meta-${VERSION}`;
const THUMB_CACHE = `sae-thumb-${VERSION}`;
const APP_CACHE   = `sae-app-${VERSION}`;
const ALL_CACHES  = [PDF_CACHE, META_CACHE, THUMB_CACHE, APP_CACHE];

// ─── Lifecycle ──────────────────────────────────────────────

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => !ALL_CACHES.includes(k)).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

// ─── URL classifiers ────────────────────────────────────────

function isReadEndpoint(url) {
  return /\/content\/api\/contents\/[^/]+\/read(\?|$)/.test(url.pathname);
}
function isFileEndpoint(url) {
  return /\/content\/api\/contents\/files\/[^/]+(\?|$)/.test(url.pathname);
}
function isAttachmentEndpoint(url) {
  return /\/content\/api\/user\/uploads\/[^/]+(\?|$)/.test(url.pathname)
      && !url.pathname.endsWith('/info');
}
function isContentDetail(url) {
  return /\/content\/api\/contents\/[^/]+(\?|$)/.test(url.pathname)
      && !url.pathname.includes('/read')
      && !url.pathname.includes('/files/');
}
function isMetaEndpoint(url) {
  return url.pathname.startsWith('/content/api/contents')
      || url.pathname.startsWith('/content/api/categories')
      || url.pathname.startsWith('/content/api/disciplines');
}
function isImage(req, url) {
  const accept = req.headers.get('accept') || '';
  if (accept.includes('image/')) return true;
  return /\.(jpe?g|png|webp|gif|svg)(\?|$)/.test(url.pathname);
}
function isAppShell(url) {
  return url.origin === self.location.origin
      && (url.pathname === '/' || /\.(html|js|css|woff2?|ttf)$/.test(url.pathname));
}

// ─── Strategies ─────────────────────────────────────────────

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req, { ignoreSearch: true });
  if (cached) return cached;
  try {
    const fresh = await fetch(req);
    if (fresh.ok && req.method === 'GET') {
      try { cache.put(req, fresh.clone()); } catch { /* opaque etc */ }
    }
    return fresh;
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Offline e sem cache' }), {
      status: 503, headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const fresh = await fetch(req);
    if (fresh.ok && req.method === 'GET') {
      try { cache.put(req, fresh.clone()); } catch { /* noop */ }
    }
    return fresh;
  } catch (e) {
    const cached = await cache.match(req, { ignoreSearch: true });
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503, headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const networkPromise = fetch(req).then(res => {
    if (res.ok) {
      try { cache.put(req, res.clone()); } catch { /* noop */ }
    }
    return res;
  }).catch(() => null);
  return cached || networkPromise || new Response(null, { status: 503 });
}

// ─── Fetch handler ──────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch { return; }

  // Gateway requests (porta 8080) ou shell estático
  const isGateway = url.port === '8080'
                 || (url.hostname === 'localhost' && url.pathname.startsWith('/content/'));

  if (isGateway) {
    // PDFs e anexos — cache first (controlado pelo utilizador via CACHE_PDF)
    if (isReadEndpoint(url) || isAttachmentEndpoint(url)) {
      event.respondWith(cacheFirst(req, PDF_CACHE));
      return;
    }
    // Ficheiros directos (thumbnails) — cache first
    if (isFileEndpoint(url)) {
      event.respondWith(cacheFirst(req, THUMB_CACHE));
      return;
    }
    // Detalhe de conteúdo — network first (mas cacheável quando offline)
    if (isContentDetail(url)) {
      event.respondWith(networkFirst(req, META_CACHE));
      return;
    }
    // Catálogo / categorias / disciplinas — network first
    if (isMetaEndpoint(url)) {
      event.respondWith(networkFirst(req, META_CACHE));
      return;
    }
    // Imagens genéricas — stale while revalidate
    if (isImage(req, url)) {
      event.respondWith(staleWhileRevalidate(req, THUMB_CACHE));
      return;
    }
    return;
  }

  // App shell (mesmo origem)
  if (isAppShell(url)) {
    event.respondWith(staleWhileRevalidate(req, APP_CACHE));
  }
});

// ─── Mensagens vindas da app ────────────────────────────────

self.addEventListener('message', async (event) => {
  const { type, payload, msgId } = event.data || {};
  const reply = (data) => event.source?.postMessage({ msgId, ok: true, data });
  const fail  = (err)  => event.source?.postMessage({ msgId, ok: false, error: String(err) });

  try {
    switch (type) {
      // Cacheia o PDF + thumbnail + metadata num único batch
      case 'CACHE_CONTENT_BUNDLE': {
        const { contentId, readUrl, thumbUrl, detailUrl } = payload;

        const pdfCache = await caches.open(PDF_CACHE);
        const thumbCache = await caches.open(THUMB_CACHE);
        const metaCache = await caches.open(META_CACHE);

        // PDF (obrigatório)
        const pdfRes = await fetch(readUrl, { credentials: 'include' });
        if (!pdfRes.ok) throw new Error(`PDF HTTP ${pdfRes.status}`);
        await pdfCache.put(readUrl, pdfRes.clone());

        // Thumbnail (best effort)
        if (thumbUrl) {
          try {
            const t = await fetch(thumbUrl, { credentials: 'include' });
            if (t.ok) await thumbCache.put(thumbUrl, t.clone());
          } catch { /* noop */ }
        }

        // Detalhe / metadata (best effort)
        if (detailUrl) {
          try {
            const d = await fetch(detailUrl, { credentials: 'include' });
            if (d.ok) await metaCache.put(detailUrl, d.clone());
          } catch { /* noop */ }
        }

        reply({ contentId, cached: true });
        break;
      }

      // (compat) Cacheia apenas o PDF
      case 'CACHE_PDF': {
        const { url, contentId } = payload;
        const cache = await caches.open(PDF_CACHE);
        const res = await fetch(url, { credentials: 'include' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        await cache.put(url, res.clone());
        reply({ contentId, cached: true });
        break;
      }

      case 'LIST_CACHED_PDFS': {
        const cache = await caches.open(PDF_CACHE);
        const reqs = await cache.keys();
        const urls = reqs.map(r => r.url);
        reply({ urls });
        break;
      }

      case 'IS_CACHED': {
        const { url } = payload;
        const cache = await caches.open(PDF_CACHE);
        const match = await cache.match(url, { ignoreSearch: true });
        reply({ cached: !!match });
        break;
      }

      case 'REMOVE_CACHED': {
        const { url, thumbUrl, detailUrl } = payload;
        const pdfCache = await caches.open(PDF_CACHE);
        const ok = await pdfCache.delete(url, { ignoreSearch: true });
        // best effort: limpa thumb e detalhe associados
        if (thumbUrl) {
          try {
            const tc = await caches.open(THUMB_CACHE);
            await tc.delete(thumbUrl, { ignoreSearch: true });
          } catch { /* noop */ }
        }
        if (detailUrl) {
          try {
            const mc = await caches.open(META_CACHE);
            await mc.delete(detailUrl, { ignoreSearch: true });
          } catch { /* noop */ }
        }
        reply({ removed: ok });
        break;
      }

      case 'CLEAR_CACHE': {
        await caches.delete(PDF_CACHE);
        await caches.delete(THUMB_CACHE);
        // mantém META para que o catálogo continue acessível
        reply({ cleared: true });
        break;
      }

      // Estatísticas — devolve tamanho e nº de itens
      case 'STORAGE_STATS': {
        const result = {};
        for (const name of [PDF_CACHE, META_CACHE, THUMB_CACHE]) {
          const cache = await caches.open(name);
          const keys = await cache.keys();
          result[name] = { count: keys.length };
        }
        if (navigator.storage && navigator.storage.estimate) {
          try {
            const est = await navigator.storage.estimate();
            result.usage = est.usage;
            result.quota = est.quota;
          } catch { /* noop */ }
        }
        reply(result);
        break;
      }

      default:
        fail('Tipo de mensagem desconhecido: ' + type);
    }
  } catch (e) {
    fail(e?.message || e);
  }
});
