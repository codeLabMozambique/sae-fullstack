import { useCallback, useEffect, useState } from 'react';
import {
  cacheContentBundle, isCached, listCachedUrls, removeCached, clearCache,
  extractContentIdFromReadUrl, getStorageStats,
} from '../services/offlineService';
import { readUrl, absoluteContentUrl, getContentById } from '../services/contentService';

/**
 * Hook para gerir conteúdos offline.
 * - `cachedIds` é o set de contentIds já em cache (PDF + thumb + metadata).
 * - `saveOffline(id)` faz pré-cache do bundle completo.
 * - `removeOffline(id)` apaga do cache.
 * - `isOnline` reflecte o estado actual da rede.
 * - `stats` devolve uso de storage do browser.
 */
export function useOfflineContent() {
  const [cachedIds, setCachedIds] = useState<Set<string>>(new Set());
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [busy, setBusy] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    try {
      const urls = await listCachedUrls();
      const ids = new Set<string>();
      urls.forEach(u => {
        const id = extractContentIdFromReadUrl(u);
        if (id) ids.add(id);
      });
      setCachedIds(ids);
    } catch {
      // SW ainda não está activo, ou erro silencioso
    }
  }, []);

  useEffect(() => {
    refresh();
    const handleOnline  = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refresh]);

  const saveOffline = useCallback(async (contentId: string) => {
    setBusy(prev => { const n = new Set(prev); n.add(contentId); return n; });
    try {
      // Pré-busca os metadados para cachear thumb + detalhe junto com o PDF
      let thumbUrl: string | null = null;
      try {
        const c = await getContentById(contentId);
        thumbUrl = absoluteContentUrl(c.thumbnailUrl);
      } catch { /* sem thumbnail é aceitável */ }

      const detailUrl = `${(import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080')}/content/api/contents/${contentId}`;

      await cacheContentBundle({
        contentId,
        readUrl: readUrl(contentId),
        thumbUrl,
        detailUrl,
      });
      setCachedIds(prev => { const n = new Set(prev); n.add(contentId); return n; });
    } finally {
      setBusy(prev => { const n = new Set(prev); n.delete(contentId); return n; });
    }
  }, []);

  const removeOffline = useCallback(async (contentId: string) => {
    setBusy(prev => { const n = new Set(prev); n.add(contentId); return n; });
    try {
      // Tenta apanhar thumbnail para limpar também
      let thumbUrl: string | null = null;
      try {
        const c = await getContentById(contentId);
        thumbUrl = absoluteContentUrl(c.thumbnailUrl);
      } catch { /* noop */ }
      const detailUrl = `${(import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080')}/content/api/contents/${contentId}`;

      await removeCached(readUrl(contentId), thumbUrl, detailUrl);
      setCachedIds(prev => { const n = new Set(prev); n.delete(contentId); return n; });
    } finally {
      setBusy(prev => { const n = new Set(prev); n.delete(contentId); return n; });
    }
  }, []);

  const isContentCached = useCallback(
    async (contentId: string) => isCached(readUrl(contentId)),
    []
  );

  const clearAll = useCallback(async () => {
    await clearCache();
    setCachedIds(new Set());
  }, []);

  const stats = useCallback(async () => getStorageStats(), []);

  return {
    cachedIds,
    isOnline,
    busy,
    saveOffline,
    removeOffline,
    isContentCached,
    refresh,
    clearAll,
    stats,
  };
}
