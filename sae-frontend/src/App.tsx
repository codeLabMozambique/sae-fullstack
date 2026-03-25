import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './styles/theme';

import Register from './pages/auth/Register';
import Login from './pages/auth/Login';
import MainApp from './pages/app/MainApp';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/register" replace />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/app/*" element={<MainApp />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
