import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { forumService } from '../services/forumService';
import { listProfessorAssignments } from '../services/assignmentService';
import api from '../services/api';

export interface AppNotification {
  id: string;
  label: string;
  description: string;
  count: number;
  route: string;
  color: string;
  iconType: 'forum' | 'check' | 'assignment' | 'person' | 'warning' | 'quiz';
}

const LS_KEY = 'notif_seen';

function getSeenMap(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '{}'); }
  catch { return {}; }
}

function saveSeenMap(map: Record<string, number>) {
  localStorage.setItem(LS_KEY, JSON.stringify(map));
}

interface QuizAttemptSummary {
  attemptId: number;
  quizId: number;
  quizTitle: string;
  studentUsername: string;
  submittedAt: string;
  score: number;
  totalQuestions: number;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const role = user?.role ?? '';
  const isProfessor = role.includes('PROFESSOR') || role.includes('Professor');
  const isAdmin =
    (role.includes('ADMIN') || role.includes('Administrador')) &&
    !role.includes('SCHOOL');

  const fetchNotifs = useCallback(async () => {
    if (!isProfessor && !isAdmin) return;
    const items: AppNotification[] = [];

    // ── Professor notifications ────────────────────────────────────

    if (isProfessor) {
      // 1. Forum pending questions
      try {
        const pending = await forumService.listProfessorPending();
        if (pending.length > 0) {
          const route = pending.length === 1
            ? '/professor/forum'
            : '/professor/forum';
          items.push({
            id: 'forum_pending',
            label: 'Perguntas Pendentes',
            description: `${pending.length} pergunta${pending.length !== 1 ? 's' : ''} de alunos aguardam resposta`,
            count: pending.length,
            route,
            color: '#EF4444',
            iconType: 'forum',
          });
        }
      } catch {}

      // 2. Collaborative answers to validate
      try {
        const page = await forumService.listPendingAnswers({ size: 1 });
        const total = page.totalElements ?? 0;
        if (total > 0)
          items.push({
            id: 'forum_validation',
            label: 'Respostas para Validar',
            description: `${total} resposta${total !== 1 ? 's' : ''} colaborativa${total !== 1 ? 's' : ''} aguardam validação`,
            count: total,
            route: '/professor/forum/pending',
            color: '#F59E0B',
            iconType: 'check',
          });
      } catch {}

      // 3. Assignment submissions to grade
      try {
        const assignments = await listProfessorAssignments();
        const withNew = assignments.filter(
          a => (a.submissionCount ?? 0) > (a.gradedCount ?? 0)
        );
        const totalUngraded = withNew.reduce(
          (s, a) => s + (a.submissionCount ?? 0) - (a.gradedCount ?? 0),
          0
        );
        if (totalUngraded > 0)
          items.push({
            id: 'assignment_ungraded',
            label: 'Submissões por Corrigir',
            description: `${totalUngraded} entrega${totalUngraded !== 1 ? 's' : ''} em ${withNew.length} tarefa${withNew.length !== 1 ? 's' : ''}`,
            count: totalUngraded,
            route: withNew.length === 1
              ? `/professor/assignments/${withNew[0].id}`
              : '/professor/assignments',
            color: '#8B5CF6',
            iconType: 'assignment',
          });
      } catch {}

      // 4. Quiz submissions from students
      try {
        const res = await api.get<QuizAttemptSummary[]>('/quiz/attempts/for-professor');
        const attempts = res.data ?? [];
        if (attempts.length > 0) {
          const quizIds = [...new Set(attempts.map(a => a.quizId))];
          items.push({
            id: 'quiz_attempts',
            label: 'Resultados de Quiz',
            description: `${attempts.length} submissão${attempts.length !== 1 ? 'ões' : ''} em ${quizIds.length} quiz${quizIds.length !== 1 ? 'zes' : ''}`,
            count: attempts.length,
            route: '/professor/quiz',
            color: '#06B6D4',
            iconType: 'quiz',
          });
        }
      } catch {}
    }

    // ── Admin notifications ────────────────────────────────────────

    if (isAdmin) {
      // 1. Pending professor account approvals
      try {
        const res = await api.get<any[]>('/auth/users/professors/pending');
        const count = res.data.length;
        if (count > 0)
          items.push({
            id: 'prof_approval',
            label: 'Professores Pendentes',
            description: `${count} professor${count !== 1 ? 'es' : ''} aguarda${count !== 1 ? 'm' : ''} aprovação de conta`,
            count,
            route: '/admin/professors',
            color: '#EF4444',
            iconType: 'person',
          });
      } catch {}

      // 2. Open forum questions without answer
      try {
        const stats = await forumService.getStatsOverview();
        const open = stats.totalByStatus?.['ABERTA'] ?? 0;
        if (open > 0)
          items.push({
            id: 'forum_open',
            label: 'Fórum — Perguntas Abertas',
            description: `${open} pergunta${open !== 1 ? 's' : ''} ainda sem resposta`,
            count: open,
            route: '/admin/forum',
            color: '#3B82F6',
            iconType: 'forum',
          });
      } catch {}

      // 3. Total quiz submissions across the platform
      try {
        const res = await api.get<{ total: number }>('/quiz/attempts/count/total');
        const total = res.data?.total ?? 0;
        if (total > 0)
          items.push({
            id: 'quiz_total',
            label: 'Submissões de Quiz',
            description: `${total} quiz${total !== 1 ? 'zes' : ''} submetido${total !== 1 ? 's' : ''} na plataforma`,
            count: total,
            route: '/admin/quiz',
            color: '#06B6D4',
            iconType: 'quiz',
          });
      } catch {}
    }

    setNotifications(items);
  }, [isProfessor, isAdmin]);

  useEffect(() => {
    fetchNotifs();
    const id = setInterval(fetchNotifs, 60_000);
    return () => clearInterval(id);
  }, [fetchNotifs]);

  const seen = getSeenMap();
  const newCount = notifications.reduce((sum, n) => {
    return sum + Math.max(0, n.count - (seen[n.id] ?? 0));
  }, 0);

  const markAllSeen = () => {
    const map = getSeenMap();
    notifications.forEach(n => { map[n.id] = n.count; });
    saveSeenMap(map);
    setNotifications(prev => [...prev]);
  };

  const dismissOne = (id: string) => {
    const n = notifications.find(x => x.id === id);
    if (!n) return;
    const map = getSeenMap();
    map[id] = n.count;
    saveSeenMap(map);
    setNotifications(prev => [...prev]);
  };

  return { notifications, newCount, refresh: fetchNotifs, markAllSeen, dismissOne };
}
