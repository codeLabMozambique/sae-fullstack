import { useEffect, type ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './styles/theme';

import Register from './pages/auth/Register';
import Login from './pages/auth/Login';
import MainApp from './pages/app/MainApp';
import { testBackendConnection } from './services/api';
import { isAuthenticated } from './services/auth';

const RequireAuth = ({ children }: { children: ReactNode }) => {
  return isAuthenticated() ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
  useEffect(() => {
    // Tests connection to gateway as soon as app loads
    testBackendConnection();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/app/*"
            element={
              <RequireAuth>
                <MainApp />
              </RequireAuth>
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
