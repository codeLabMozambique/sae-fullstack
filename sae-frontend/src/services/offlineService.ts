/**
 * Wrappers em torno do Service Worker — comunicação via postMessage.
 * Inclui um helper de registo (registerServiceWorker) chamado uma vez no main.tsx.
 */

let counter = 0;

/**
 * Envia uma mensagem ao SW e espera pela resposta.
 */
function ask<T = any>(type: string, payload?: any, timeoutMs = 30000): Promise<T> {
  return new Promise((resolve, reject) => {
    const sw = navigator.serviceWorker?.controller;
    if (!sw) return reject(new Error('Service Worker não está activo. Refresca a página.'));

    const msgId = `m-${Date.now()}-${counter++}`;
    const channel = new MessageChannel();
    let settled = false;

    const settle = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { channel.port1.close(); } catch { /* port já fechado */ }
      fn();
    };

    const timer = setTimeout(() => {
      settle(() => reject(new Error('Timeout SW')));
    }, timeoutMs);

    channel.port1.onmessage = (e) => {
      settle(() => {
        const { ok, data, error } = e.data || {};
        if (ok) resolve(data as T);
        else reject(new Error(error || 'Erro SW'));
      });
    };

    channel.port1.onmessageerror = () => {
      settle(() => reject(new Error('Erro de mensagem no port SW')));
    };

    try {
      sw.postMessage({ type, payload, msgId }, [channel.port2]);
    } catch (err) {
      // Port desconectado (e.g. React DevTools ou navegação)
      settle(() => reject(err instanceof Error ? err : new Error(String(err))));
    }
  });
}

// fallback: ouvir directamente em navigator.serviceWorker (caso o port falhe em alguns browsers)
function broadcastAsk<T = any>(type: string, payload?: any, timeoutMs = 30000): Promise<T> {
  // tenta primeiro o channel; se falhar, faz broadcast
  return ask<T>(type, payload, timeoutMs).catch(() => new Promise((resolve, reject) => {
    const sw = navigator.serviceWorker?.controller;
    if (!sw) return reject(new Error('Service Worker indisponível'));
    const msgId = `b-${Date.now()}-${counter++}`;
    const handler = (e: MessageEvent) => {
      if (e.data?.msgId !== msgId) return;
      navigator.serviceWorker.removeEventListener('message', handler);
      e.data.ok ? resolve(e.data.data) : reject(new Error(e.data.error));
    };
    navigator.serviceWorker.addEventListener('message', handler);
    sw.postMessage({ type, payload, msgId });
    setTimeout(() => {
      navigator.serviceWorker.removeEventListener('message', handler);
      reject(new Error('Timeout SW (broadcast)'));
    }, timeoutMs);
  }));
}

// ─── API pública ────────────────────────────────────────────

export async function registerServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker não suportado neste browser');
    return;
  }
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    // espera até estar activo + a controlar a página
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) => {
        const handler = () => {
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.removeEventListener('controllerchange', handler);
            resolve();
          }
        };
        navigator.serviceWorker.addEventListener('controllerchange', handler);
        // ou se já existe um waiting, força claim
        if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        // resolve eventualmente, sem bloquear UI
        setTimeout(resolve, 1500);
      });
    }
    console.log('[SW] registado e activo');
  } catch (err) {
    console.error('[SW] falha ao registar', err);
  }
}

export async function cachePdf(contentId: string, url: string): Promise<void> {
  await broadcastAsk('CACHE_PDF', { contentId, url });
}

/**
 * Cacheia um conteúdo completo: PDF + thumbnail + metadata.
 * Use este em vez de cachePdf para offline robusto.
 */
export async function cacheContentBundle(opts: {
  contentId: string;
  readUrl: string;
  thumbUrl?: string | null;
  detailUrl?: string | null;
}): Promise<void> {
  await broadcastAsk('CACHE_CONTENT_BUNDLE', opts, 60000);
}

export interface StorageStats {
  [cacheName: string]: { count: number } | number | undefined;
  usage?: number;
  quota?: number;
}

export async function getStorageStats(): Promise<StorageStats> {
  return broadcastAsk<StorageStats>('STORAGE_STATS');
}

export async function isCached(url: string): Promise<boolean> {
  const r = await broadcastAsk<{ cached: boolean }>('IS_CACHED', { url });
  return r.cached;
}

export async function listCachedUrls(): Promise<string[]> {
  const r = await broadcastAsk<{ urls: string[] }>('LIST_CACHED_PDFS');
  return r.urls;
}

export async function removeCached(
  url: string,
  thumbUrl?: string | null,
  detailUrl?: string | null,
): Promise<void> {
  await broadcastAsk('REMOVE_CACHED', { url, thumbUrl, detailUrl });
}

export async function clearCache(): Promise<void> {
  await broadcastAsk('CLEAR_CACHE');
}

/**
 * Extrai o contentId do path /content/api/contents/{id}/read
 */
export function extractContentIdFromReadUrl(url: string): string | null {
  const m = url.match(/\/content\/api\/contents\/([^/?#]+)\/read/);
  return m ? m[1] : null;
}
