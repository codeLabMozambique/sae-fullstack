import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: { main: '#1565c0', light: '#42a5f5', dark: '#0d47a1', contrastText: '#fff' },
    secondary: { main: '#00A651', light: '#4caf50', dark: '#008f44', contrastText: '#fff' },
    background: { default: '#f0f4ff', paper: 'rgba(255,255,255,0.85)' },
    text: { primary: '#0A1628', secondary: '#475569' },
    error: { main: '#ef5350' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h5: { fontWeight: 800, letterSpacing: '-0.02em' },
    h6: { fontWeight: 700, letterSpacing: '-0.01em' },
    body1: { fontSize: '0.95rem' },
    body2: { fontSize: '0.85rem' },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: rgba(0,0,0,0.02); border-radius: 10px; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.14); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.24); }
      `,
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          textTransform: 'none',
          fontWeight: 700,
          boxShadow: 'none',
          transition: 'all 0.2s ease',
          '&:hover': { transform: 'translateY(-1px)' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundImage: 'none',
          boxShadow: '0 8px 32px rgba(31,38,135,0.08)',
          border: '1px solid rgba(255,255,255,0.85)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderBottom: '1px solid rgba(0,0,0,0.05)' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, fontSize: '0.75rem' },
      },
    },
  },
});

export default theme;
