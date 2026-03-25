import Grid from '@mui/material/Grid';
import { Card, CardContent, Typography, Box, LinearProgress } from '@mui/material';
import { MenuBook as BookIcon, Laptop as LaptopIcon, Person as PersonIcon, TrendingUp as StatsIcon } from '@mui/icons-material';

const StatCard = ({ title, value, icon, color }: any) => (
  <Card sx={{ height: '100%', borderLeft: `6px solid ${color}` }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography color="textSecondary" variant="overline" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {value}
          </Typography>
        </Box>
        <Box sx={{ color: color, fontSize: 40, opacity: 0.8 }}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 700, color: 'primary.main' }}>
        Bem-vindo ao SAE 👋
      </Typography>
      
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Livros Lidos" value="12" icon={<BookIcon fontSize="large" />} color="#1976d2" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Cursos Ativos" value="4" icon={<LaptopIcon fontSize="large" />} color="#4caf50" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Horas de Estudo" value="45h" icon={<StatsIcon fontSize="large" />} color="#ff9800" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Pontos SAE" value="1,250" icon={<PersonIcon fontSize="large" />} color="#e91e63" />
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Progresso Semanal</Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">Matemática Discreta</Typography>
              <LinearProgress variant="determinate" value={75} sx={{ height: 10, borderRadius: 5, mt: 1 }} />
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">Algoritmos e Estruturas de Dados</Typography>
              <LinearProgress variant="determinate" value={45} sx={{ height: 10, borderRadius: 5, mt: 1, bgcolor: '#e0e0e0', '& .MuiLinearProgress-bar': { bgcolor: '#ff9800' } }} />
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
            <Typography variant="h6">Lembrete da IA</Typography>
            <Typography variant="body2" sx={{ mt: 2, opacity: 0.9 }}>
              "Você tem um quiz de Programação II amanhã. Que tal rever os conceitos de POO hoje à tarde?"
            </Typography>
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Typography variant="button" sx={{ cursor: 'pointer', textDecoration: 'underline' }}>
                Falar com a IA
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
