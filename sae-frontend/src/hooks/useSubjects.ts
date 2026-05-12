import { useCallback, useEffect, useRef, useState } from 'react';
import { forumService } from '../services/forumService';
import type { SubjectInfo } from '../types/forum';

const POLL_INTERVAL_MS = 30_000; // re-fetch a cada 30s

interface UseSubjectsResult {
  subjects: SubjectInfo[];
  subjectsMap: Map<number, SubjectInfo>;
  loading: boolean;
  refresh: () => void;
}

/**
 * Carrega as disciplinas activas da base de dados e mantém-nas
 * sincronizadas em tempo real:
 *   - Re-fetch imediato ao montar
 *   - Re-fetch quando o utilizador volta ao separador (visibilitychange)
 *   - Re-fetch quando a janela recupera o foco (focus)
 *   - Polling de 30 s em segundo plano
 *
 * Passando classroomId, filtra as disciplinas da turma do aluno.
 * Sem classroomId, devolve todas as disciplinas activas (professor/admin).
 */
export function useSubjects(classroomId?: number | null): UseSubjectsResult {
  const [subjects, setSubjects] = useState<SubjectInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const fetch = useCallback(async () => {
    try {
      const list = classroomId
        ? await forumService.getSubjectsForClassroom(classroomId)
        : await forumService.getAllActiveSubjects();
      if (mountedRef.current) setSubjects(list);
    } catch {
      // silencia erros de rede — mantém a lista anterior
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [classroomId]);

  // Fetch inicial + polling
  useEffect(() => {
    mountedRef.current = true;
    setLoading(true);
    fetch();
    timerRef.current = setInterval(fetch, POLL_INTERVAL_MS);
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetch]);

  // Re-fetch ao voltar ao separador ou ao focar a janela
  useEffect(() => {
    const onVisible = () => { if (!document.hidden) fetch(); };
    const onFocus   = () => fetch();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetch]);

  const subjectsMap = new Map(subjects.map(s => [s.id, s]));

  return { subjects, subjectsMap, loading, refresh: fetch };
}
