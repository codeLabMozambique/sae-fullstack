import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './styles/theme';
import MainLayout from './components/Layout/MainLayout';

// Pages (Moved to their own files soon, but defining here for now to speed up the starter)
import Dashboard from './pages/Dashboard';
import Biblioteca from './pages/Biblioteca';
import ChatIA from './pages/ChatIA';
import AdminPanel from './pages/AdminPanel';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <MainLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/biblioteca" element={<Biblioteca />} />
            <Route path="/chat" element={<ChatIA />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
        </MainLayout>
      </Router>
    </ThemeProvider>
  );
}

export default App;
