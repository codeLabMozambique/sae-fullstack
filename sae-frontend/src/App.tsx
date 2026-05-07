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
import ClassroomsPage from './pages/admin/academic/ClassroomsPage';
import SubjectsPage from './pages/admin/academic/SubjectsPage';
import SchoolsPage from './pages/admin/academic/SchoolsPage';
import ClassLevelsPage from './pages/admin/academic/ClassLevelsPage';
import ProfessorAssignmentsPage from './pages/admin/academic/ProfessorAssignmentsPage';
import UsersListPage from './pages/admin/users/UsersListPage';

// Biblioteca / Content-service pages
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

import { testBackendConnection } from './services/api';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
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
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />

            {/* Legacy /app/* routes */}
            <Route path="/app/*" element={
              <ProtectedRoute>
                <MainApp />
              </ProtectedRoute>
            } />

            {/* ── STUDENT — Biblioteca ───────────────────────── */}
            <Route path="/student/library" element={<Layout><Biblioteca /></Layout>} />
            <Route path="/student/library/categories" element={<Layout><Categorias /></Layout>} />
            <Route path="/student/library/favorites" element={<Layout><Favoritos /></Layout>} />
            <Route path="/student/library/progress" element={<Layout><ContinuarLer /></Layout>} />
            <Route path="/student/library/history" element={<Layout><Historico /></Layout>} />
            <Route path="/student/goals" element={<Layout><Metas /></Layout>} />
            <Route path="/student/goals/new" element={<Layout><Metas /></Layout>} />

            {/* ── PROFESSOR — Biblioteca ─────────────────────── */}
            <Route path="/professor/library" element={<Layout><Biblioteca /></Layout>} />
            <Route path="/professor/library/my-content" element={<Layout><MeusConteudos /></Layout>} />
            <Route path="/professor/library/upload" element={<Layout><UploadConteudo /></Layout>} />
            <Route path="/professor/library/categories" element={<Layout><Categorias /></Layout>} />
            <Route path="/professor/library/favorites" element={<Layout><Favoritos /></Layout>} />
            <Route path="/professor/library/progress" element={<Layout><ContinuarLer /></Layout>} />
            <Route path="/professor/library/history" element={<Layout><Historico /></Layout>} />
            <Route path="/professor/goals" element={<Layout><Metas /></Layout>} />

            {/* ── ADMIN — Biblioteca ─────────────────────────── */}
            <Route path="/admin/library" element={<Layout><Biblioteca /></Layout>} />
            <Route path="/admin/library/contents" element={<Layout><MeusConteudos /></Layout>} />
            <Route path="/admin/library/upload" element={<Layout><UploadConteudo /></Layout>} />
            <Route path="/admin/library/batch" element={<Layout><AdminBatchUpload /></Layout>} />
            <Route path="/admin/library/categories" element={<Layout><AdminCategorias /></Layout>} />
            <Route path="/admin/library/disciplines" element={<Layout><AdminDisciplinas /></Layout>} />
            <Route path="/admin/library/logs" element={<Layout><Historico /></Layout>} />

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

            {/* Admin — Users */}
            <Route path="/admin/users/list" element={
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
