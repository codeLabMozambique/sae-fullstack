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
import { testBackendConnection } from './services/api';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
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

            {/* Admin — Academic (extended) */}
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
