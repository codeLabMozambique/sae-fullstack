import React, { useState } from 'react';
import Grid from '@mui/material/Grid';
import { Card, CardContent, Typography, Box, LinearProgress, Switch, FormControlLabel } from '@mui/material';
import { 
  MenuBook as BookIcon, Laptop as LaptopIcon, Person as PersonIcon, TrendingUp as StatsIcon,
  Class as ClassIcon, QuestionAnswer as QuestionIcon, CheckCircle as CheckIcon 
} from '@mui/icons-material';

const StatCard = ({ title, value, icon, color }: any) => (
  <Card className="animate-fade-in" sx={{ height: '100%', borderLeft: `6px solid ${color}` }}>
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

const StudentDashboard = () => (
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
      <Card className="animate-fade-in" sx={{ p: 2 }}>
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
      <Card className="animate-fade-in" sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
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
);

const ProfessorDashboard = () => (
  <Grid container spacing={3}>
    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
      <StatCard title="Turmas Ativas" value="3" icon={<ClassIcon fontSize="large" />} color="#1976d2" />
    </Grid>
    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
      <StatCard title="Dúvidas Pendentes" value="12" icon={<QuestionIcon fontSize="large" />} color="#ff9800" />
    </Grid>
    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
      <StatCard title="Respostas Dadas" value="48" icon={<CheckIcon fontSize="large" />} color="#4caf50" />
    </Grid>
    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
      <StatCard title="Avaliação Média" value="4.8/5" icon={<StatsIcon fontSize="large" />} color="#e91e63" />
    </Grid>

    <Grid size={{ xs: 12, md: 8 }}>
      <Card className="animate-fade-in" sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Dúvidas Recentes nas suas Turmas</Typography>
        <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, mb: 2, borderLeft: '3px solid #ff9800' }}>
          <Typography variant="body2" fontWeight={600}>"Como resolvo integrais por partes com sen(x)?"</Typography>
          <Typography variant="caption" color="textSecondary">Enviado por: João Silva (Turma C1) - Há 2 horas</Typography>
        </Box>
        <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, borderLeft: '3px solid #ff9800' }}>
          <Typography variant="body2" fontWeight={600}>"Na arquitetura do SAE, quem é responsável pelo StripPrefix?"</Typography>
          <Typography variant="caption" color="textSecondary">Enviado por: Clara Nunes (Turma S2) - Há 4 horas</Typography>
        </Box>
      </Card>
    </Grid>

    <Grid size={{ xs: 12, md: 4 }}>
      <Card className="animate-fade-in" sx={{ p: 2, bgcolor: 'secondary.main' }}>
        <Typography variant="h6" color="primary.main">Ações Rápidas</Typography>
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Typography variant="button" sx={{ cursor: 'pointer', color: 'text.secondary', fontWeight: 600 }}>+ Publicar Novo Material</Typography>
          <Typography variant="button" sx={{ cursor: 'pointer', color: 'text.secondary', fontWeight: 600 }}>✓ Corrigir Testes Atrasados</Typography>
          <Typography variant="button" sx={{ cursor: 'pointer', color: 'text.secondary', fontWeight: 600 }}>📅 Agendar Sessão de Dúvidas</Typography>
        </Box>
      </Card>
    </Grid>
  </Grid>
);

const Dashboard: React.FC = () => {
  // Simulação de acesso: No cenário real, viria do JWT/Auth global Context.
  const [isProfessor, setIsProfessor] = useState(true);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
          Bem-vindo ao SAE 👋
        </Typography>
        <FormControlLabel 
          control={<Switch checked={isProfessor} onChange={(e) => setIsProfessor(e.target.checked)} color="primary" />} 
          label={isProfessor ? "Acesso: Professor" : "Acesso: Estudante"} 
          sx={{ bgcolor: 'white', px: 2, py: 0.5, borderRadius: 8, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}
        />
      </Box>
      
      {isProfessor ? <ProfessorDashboard /> : <StudentDashboard />}
    </Box>
  );
};

export default Dashboard;
