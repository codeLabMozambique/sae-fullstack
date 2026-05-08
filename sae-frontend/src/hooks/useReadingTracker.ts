import { useCallback, useEffect, useRef } from 'react';
import { upsertProgress, recordHistory } from '../services/contentService';

/**
 * Hook que regista automaticamente o progresso de leitura.
 *
 *  - O cliente acumula segundos lidos *desde o último sync* e envia como `delta`.
 *  - O servidor guarda max(página existente, página recebida) e soma o delta.
 *  - Faz sync em 3 momentos:
 *      1. Quando muda de página (debounced 1.5s)
 *      2. Heartbeat a cada 60s
 *      3. On unmount / antes de fechar a aba (`beforeunload`)
 *  - On unmount também regista a sessão completa em `/api/user/history`.
 */
export function useReadingTracker(contentId: string | null) {
  const startedAt = useRef<number>(Date.now());
  const lastSyncAt = useRef<number>(Date.now());
  const lastPage = useRef<number>(1);
  const totalReadSeconds = useRef<number>(0);
  const pagesReadInSession = useRef<Set<number>>(new Set());
  const pendingDelta = useRef<number>(0);
  const debounceTimer = useRef<number | null>(null);

  /** Calcula segundos desde o último sync e adiciona ao delta pendente. */
  const accumulate = useCallback(() => {
    const now = Date.now();
    const elapsed = Math.floor((now - lastSyncAt.current) / 1000);
    if (elapsed > 0) {
      pendingDelta.current += elapsed;
      totalReadSeconds.current += elapsed;
      lastSyncAt.current = now;
    }
  }, []);

  /** Faz upsert ao backend com a página actual e o delta acumulado. */
  const flush = useCallback(async (page: number) => {
    if (!contentId) return;
    // Sem token = utilizador anónimo, não há progresso para guardar
    if (!localStorage.getItem('sae_token')) return;
    accumulate();
    const delta = pendingDelta.current;
    if (delta === 0 && page === lastPage.current) return; // nada a sincronizar
    pendingDelta.current = 0;
    try {
      await upsertProgress(contentId, page, delta);
    } catch {
      // se falhar, devolvemos o delta para tentar no próximo sync
      pendingDelta.current += delta;
    }
  }, [contentId, accumulate]);

  /** Notifica que o utilizador mudou para uma página específica. */
  const onPageChange = useCallback((page: number) => {
    pagesReadInSession.current.add(page);
    if (page === lastPage.current) return;
    lastPage.current = page;
    if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
    debounceTimer.current = window.setTimeout(() => flush(page), 1500);
  }, [flush]);

  /** Heartbeat: a cada 60s, envia delta acumulado mesmo sem mudar de página. */
  useEffect(() => {
    if (!contentId) return;
    const interval = window.setInterval(() => {
      flush(lastPage.current);
    }, 60_000);
    return () => window.clearInterval(interval);
  }, [contentId, flush]);

  /** Antes de fechar a aba, faz sync best-effort. */
  useEffect(() => {
    if (!contentId) return;
    const handler = () => {
      accumulate();
      const delta = pendingDelta.current;
      if (delta > 0 || lastPage.current > 1) {
        // sendBeacon não funciona com axios — usamos fetch keepalive como fallback
        const body = JSON.stringify({
          currentPage: lastPage.current,
          readingTimeSecondsDelta: delta,
        });
        const token = localStorage.getItem('sae_token');
        const base = (import.meta as any).env?.VITE_API_GATEWAY_URL || 'http://localhost:8080';
        fetch(`${base}/content/api/user/progress/${contentId}`, {
          method: 'PUT',
          keepalive: true,
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body,
        }).catch(() => undefined);
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [contentId, accumulate]);

  /** No unmount: flush final + regista sessão no histórico. */
  useEffect(() => {
    return () => {
      if (!contentId) return;
      accumulate();
      const sessionSeconds = Math.floor((Date.now() - startedAt.current) / 1000);
      const pagesRead = pagesReadInSession.current.size;
      // flush progresso final (best-effort)
      flush(lastPage.current).catch(() => undefined);
      // regista no histórico se foi uma leitura significativa (e estiver autenticado)
      if (sessionSeconds >= 10 && localStorage.getItem('sae_token')) {
        recordHistory(contentId, pagesRead, sessionSeconds).catch(() => undefined);
      }
    };
  }, [contentId, flush, accumulate]);

  return { onPageChange };
}
