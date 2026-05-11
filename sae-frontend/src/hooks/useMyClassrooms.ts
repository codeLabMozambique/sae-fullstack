import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  professorService, professorAssignmentService, classroomService,
  studentService, classLevelService,
} from '../services/academicService';

export interface MyClassroom {
  id: number;
  name: string;
  classLevelName: string;
}

/**
 * Devolve as turmas associadas ao utilizador autenticado.
 *  - Professor: turmas onde está atribuído (via professorAssignmentService)
 *  - Estudante: a turma do seu perfil
 *  - Admin / sem auth: todas as turmas
 */
export function useMyClassrooms(): { classrooms: MyClassroom[]; loading: boolean; error: string | null } {
  const { user } = useAuth();
  const [classrooms, setClassrooms] = useState<MyClassroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const [allClassrooms, classLevels] = await Promise.all([
          classroomService.findAll(),
          classLevelService.findAll(),
        ]);
        const levelMap: Record<number, string> = {};
        classLevels.forEach(cl => { if (cl.id) levelMap[cl.id] = cl.name; });

        const role = user?.role || '';
        let ids: number[] = [];

        if (role.includes('PROFESSOR') || role.includes('Professor')) {
          const [profs, assigns] = await Promise.all([
            professorService.findAll(),
            professorAssignmentService.findAll(),
          ]);
          const me = profs.find(p => p.username === user?.username);
          if (me) ids = [...new Set(assigns.filter(a => a.professorId === me.id).map(a => a.classroomId))];
        } else if (role.includes('STUDENT') || role.includes('Estudante') || role.includes('Aluno')) {
          try {
            const profile = await studentService.findByUsername(user!.username);
            if (profile?.classroomId) ids = [profile.classroomId];
          } catch { /* sem perfil = sem turmas */ }
        } else {
          // Admin / outros: todas as turmas
          ids = allClassrooms.map(c => c.id!).filter(Boolean);
        }

        const mine = allClassrooms
          .filter(c => ids.includes(c.id ?? -1))
          .map<MyClassroom>(c => ({
            id: c.id!,
            name: c.name,
            classLevelName: levelMap[c.classLevelId] ?? `Nível ${c.classLevelId}`,
          }));

        if (!cancelled) setClassrooms(mine);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Falha ao carregar turmas');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user?.username, user?.role]);

  return { classrooms, loading, error };
}
