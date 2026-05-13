import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './styles/theme';

import { AuthProvider, useAuth } from './context/AuthContext';
import Register from './pages/auth/Register';
import Login from './pages/auth/Login';
import MainApp from './pages/app/MainApp';
import MainLayout from './components/Layout/MainLayout';
import PublicLibraryLayout from './components/Layout/PublicLibraryLayout';
import ClassroomsPage from './pages/admin/academic/ClassroomsPage';
import SubjectsPage from './pages/admin/academic/SubjectsPage';
import SchoolsPage from './pages/admin/academic/SchoolsPage';
import ClassLevelsPage from './pages/admin/academic/ClassLevelsPage';
import ProfessorAssignmentsPage from './pages/admin/academic/ProfessorAssignmentsPage';
import ProfessorClassesPage from './pages/professor/ProfessorClassesPage';
import ProfessorGradesPage from './pages/professor/ProfessorGradesPage';
import StudentForumPage from './pages/student/StudentForumPage';
import StudentQuizPage from './pages/student/StudentQuizPage';
import ProfessorQuizPage from './pages/professor/ProfessorQuizPage';
import UsersListPage from './pages/admin/users/UsersListPage';
import ProfessorsPage from './pages/admin/users/ProfessorsPage';
import StudentsEnrollmentPage from './pages/admin/users/StudentsEnrollmentPage';
import ProfessorClassroomsPage from './pages/professor/ProfessorClassroomsPage';
import DirectorClassroomPage from './pages/professor/DirectorClassroomPage';
import ProfessorTasksPage from './pages/professor/ProfessorTasksPage';
import ProfessorTaskDetailsPage from './pages/professor/ProfessorTaskDetailsPage';
import StudentTasksPage from './pages/student/StudentTasksPage';
import StudentTaskDetailsPage from './pages/student/StudentTaskDetailsPage';
import StudentSubmissionsPage from './pages/student/StudentSubmissionsPage';

// Biblioteca / Content-service pages
import ForumList from './pages/forum/ForumList';
import Biblioteca from './pages/Biblioteca';
import Favoritos from './pages/biblioteca/Favoritos';
import ContinuarLer from './pages/biblioteca/ContinuarLer';
import Historico from './pages/biblioteca/Historico';
import Metas from './pages/biblioteca/Metas';
import UploadConteudo from './pages/biblioteca/UploadConteudo';
import MeusConteudos from './pages/biblioteca/MeusConteudos';
import Categorias from './pages/biblioteca/Categorias';
import AdminCategorias from './pages/biblioteca/admin/AdminCategorias';
import AdminDisciplinas from './pages/biblioteca/admin/AdminDisciplinas';
import AdminBatchUpload from './pages/biblioteca/admin/AdminBatchUpload';
import Offline from './pages/biblioteca/Offline';
import Leitor from './pages/biblioteca/Leitor';

// Forum & Dashboard (for dynamic-menu routes)
import Dashboard from './pages/Dashboard';
import ChatIA from './pages/ChatIA';
import SchoolAdminDashboardPage from './pages/school-admin/SchoolAdminDashboardPage';
import ProfilePage from './pages/ProfilePage';

import { testBackendConnection } from './services/api';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function RootRedirect() {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/biblioteca" replace />;
  // Autenticado: encaminha para o dashboard apropriado
  const role = user?.role || '';
  if (role === 'Administrador de Escola' || role === 'SCHOOL_ADMIN') return <Navigate to="/school-admin/dashboard" replace />;
  if (role.includes('ADMIN') || role.includes('Administrador')) return <Navigate to="/admin/library" replace />;
  if (role.includes('PROFESSOR') || role.includes('Professor')) return <Navigate to="/professor/dashboard" replace />;
  return <Navigate to="/student/dashboard" replace />;
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <MainLayout>{children}</MainLayout>
    </ProtectedRoute>
  );
}

function App() {
  useEffect(() => {
    testBackendConnection();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />

            {/* ── Acesso público (sem login) — TdR ─────────────── */}
            <Route path="/biblioteca" element={
              <PublicLibraryLayout><Biblioteca /></PublicLibraryLayout>
            } />
            <Route path="/biblioteca/leitor/:id" element={
              <PublicLibraryLayout><Leitor /></PublicLibraryLayout>
            } />
            <Route path="/biblioteca/categorias" element={
              <PublicLibraryLayout><Categorias /></PublicLibraryLayout>
            } />
            <Route path="/biblioteca/chat" element={
              <PublicLibraryLayout><ChatIA /></PublicLibraryLayout>
            } />

            {/* Legacy /app/* routes */}
            <Route path="/app/*" element={
              <ProtectedRoute>
                <MainApp />
              </ProtectedRoute>
            } />

            {/* ── Leitor de PDF embebido (qualquer role) ─────── */}
            <Route path="/leitor/:id" element={<Layout><Leitor /></Layout>} />

            {/* ── Perfil (qualquer role autenticada) ───────── */}
            <Route path="/perfil" element={<Layout><ProfilePage /></Layout>} />
            <Route path="/profile" element={<Navigate to="/perfil" replace />} />

            {/* ── STUDENT — Dashboard & Fórum ───────────────── */}
            <Route path="/student/dashboard" element={<Layout><Dashboard /></Layout>} />
            <Route path="/student/questions" element={<Layout><StudentForumPage /></Layout>} />
            <Route path="/student/forum" element={<Layout><StudentForumPage /></Layout>} />
            <Route path="/student/forum/new" element={<Layout><StudentForumPage /></Layout>} />
            <Route path="/student/forum/questions" element={<Layout><StudentForumPage /></Layout>} />

            {/* ── STUDENT — Tarefas (Assignments) ───────────── */}
            <Route path="/student/assignments" element={<Layout><StudentTasksPage /></Layout>} />
            <Route path="/student/assignments/:id" element={<Layout><StudentTaskDetailsPage /></Layout>} />
            <Route path="/student/submissions" element={<Layout><StudentSubmissionsPage /></Layout>} />

            {/* ── STUDENT — Quizzes ─────────────────────────── */}
            <Route path="/student/quiz" element={<Layout><StudentQuizPage /></Layout>} />
            <Route path="/student/quiz/results" element={<Layout><StudentQuizPage /></Layout>} />

            {/* ── STUDENT — Biblioteca ───────────────────────── */}
            <Route path="/student/library" element={<Layout><Biblioteca /></Layout>} />
            <Route path="/student/library/categories" element={<Layout><Categorias /></Layout>} />
            <Route path="/student/library/favorites" element={<Layout><Favoritos /></Layout>} />
            <Route path="/student/library/progress" element={<Layout><ContinuarLer /></Layout>} />
            <Route path="/student/library/history" element={<Layout><Historico /></Layout>} />
            <Route path="/student/library/offline" element={<Layout><Offline /></Layout>} />
            <Route path="/student/goals" element={<Layout><Metas /></Layout>} />
            <Route path="/student/goals/new" element={<Layout><Metas /></Layout>} />

            {/* ── PROFESSOR — Dashboard, Fórum & Turmas ─────── */}
            <Route path="/professor/dashboard" element={<Layout><Dashboard /></Layout>} />
            <Route path="/professor/forum" element={<Layout><StudentForumPage /></Layout>} />
            <Route path="/professor/forum/pending" element={<Layout><StudentForumPage /></Layout>} />
            <Route path="/professor/forum/answered" element={<Layout><StudentForumPage /></Layout>} />

            {/* ── PROFESSOR — Tarefas (Assignments) ─────────── */}
            <Route path="/professor/assignments" element={<Layout><ProfessorTasksPage /></Layout>} />
            <Route path="/professor/assignments/:id" element={<Layout><ProfessorTaskDetailsPage /></Layout>} />

            {/* ── PROFESSOR — Quizzes ───────────────────────── */}
            <Route path="/professor/quiz" element={<Layout><ProfessorQuizPage /></Layout>} />
            <Route path="/professor/quiz/manage" element={<Layout><ProfessorQuizPage /></Layout>} />
            <Route path="/professor/quiz/create" element={<Layout><ProfessorQuizPage /></Layout>} />
            <Route path="/professor/my-classes" element={<Layout><ProfessorClassroomsPage /></Layout>} />
            <Route path="/professor/students" element={<Layout><ProfessorClassroomsPage /></Layout>} />
            <Route path="/professor/director-classroom" element={<Layout><DirectorClassroomPage /></Layout>} />
            <Route path="/professor/classes" element={<Layout><ProfessorClassesPage /></Layout>} />
            <Route path="/professor/grades" element={<Layout><ProfessorGradesPage /></Layout>} />

            {/* ── PROFESSOR — Biblioteca ─────────────────────── */}
            <Route path="/professor/library" element={<Layout><Biblioteca /></Layout>} />
            <Route path="/professor/library/my-content" element={<Layout><MeusConteudos /></Layout>} />
            <Route path="/professor/library/upload" element={<Layout><UploadConteudo /></Layout>} />
            <Route path="/professor/library/categories" element={<Layout><Categorias /></Layout>} />
            <Route path="/professor/library/favorites" element={<Layout><Favoritos /></Layout>} />
            <Route path="/professor/library/progress" element={<Layout><ContinuarLer /></Layout>} />
            <Route path="/professor/library/history" element={<Layout><Historico /></Layout>} />
            <Route path="/professor/library/offline" element={<Layout><Offline /></Layout>} />
            <Route path="/professor/goals" element={<Layout><Metas /></Layout>} />

            {/* ── ADMIN — Biblioteca ─────────────────────────── */}
            <Route path="/admin/library" element={<Layout><Biblioteca /></Layout>} />
            <Route path="/admin/forum" element={<Layout><ForumList /></Layout>} />

            {/* ── ADMIN — Quizzes ───────────────────────────── */}
            <Route path="/admin/quiz" element={<Layout><ProfessorQuizPage /></Layout>} />
            <Route path="/admin/quiz/manage" element={<Layout><ProfessorQuizPage /></Layout>} />
            <Route path="/admin/quiz/create" element={<Layout><ProfessorQuizPage /></Layout>} />

            {/* ── ADMIN — Aliases para rotas do menu dinâmico ── */}
            <Route path="/admin/schools" element={<Layout><SchoolsPage /></Layout>} />
            <Route path="/admin/classrooms" element={<Layout><ClassroomsPage /></Layout>} />
            <Route path="/admin/subjects" element={<Layout><SubjectsPage /></Layout>} />
            <Route path="/admin/users" element={<Layout><UsersListPage /></Layout>} />
            <Route path="/admin/students" element={<Layout><StudentsEnrollmentPage /></Layout>} />
            <Route path="/admin/professors" element={<Layout><ProfessorsPage /></Layout>} />
            <Route path="/admin/library/contents" element={<Layout><MeusConteudos /></Layout>} />
            <Route path="/admin/library/upload" element={<Layout><UploadConteudo /></Layout>} />
            <Route path="/admin/library/batch" element={<Layout><AdminBatchUpload /></Layout>} />
            <Route path="/admin/library/categories" element={<Layout><AdminCategorias /></Layout>} />
            <Route path="/admin/library/disciplines" element={<Layout><AdminDisciplinas /></Layout>} />
            <Route path="/admin/library/logs" element={<Layout><Historico /></Layout>} />
            <Route path="/admin/library/offline" element={<Layout><Offline /></Layout>} />

            {/* Admin — Academic */}
            <Route path="/admin/academic/classrooms" element={
              <ProtectedRoute>
                <MainLayout><ClassroomsPage /></MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/academic/subjects" element={
              <ProtectedRoute>
                <MainLayout><SubjectsPage /></MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/admin/academic/schools" element={
              <ProtectedRoute>
                <MainLayout><SchoolsPage /></MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/academic/class-levels" element={
              <ProtectedRoute>
                <MainLayout><ClassLevelsPage /></MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/academic/professor-assignments" element={
              <ProtectedRoute>
                <MainLayout><ProfessorAssignmentsPage /></MainLayout>
              </ProtectedRoute>
            } />

            {/* ── SCHOOL_ADMIN — Dashboard ───────────────────── */}
            <Route path="/school-admin/dashboard" element={<Layout><SchoolAdminDashboardPage /></Layout>} />
            <Route path="/school-admin/dashboard/stats" element={<Layout><SchoolAdminDashboardPage /></Layout>} />
            <Route path="/school-admin/students" element={<Layout><StudentsEnrollmentPage /></Layout>} />
            <Route path="/school-admin/professors" element={<Layout><ProfessorsPage /></Layout>} />

            {/* Admin — Users */}
            <Route path="/admin/users/list" element={
              <ProtectedRoute>
                <MainLayout><UsersListPage /></MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/users/roles" element={
              <ProtectedRoute>
                <MainLayout><UsersListPage /></MainLayout>
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
