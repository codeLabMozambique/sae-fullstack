import { 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Box, 
  Container,
  Avatar,
  useTheme,
  alpha
} from '@mui/material'
import { 
  MenuBook as BookIcon,
  Quiz as QuizIcon,
  Forum as ForumIcon,
  People as PeopleIcon,
  ArrowForward as ArrowIcon
} from '@mui/icons-material'
import { motion } from 'framer-motion'

export function Home() {
  const theme = useTheme()
  
  const stats = [
    { label: 'Livros Disponíveis', value: '150+', icon: BookIcon, color: '#2196f3' },
    { label: 'Quizzes', value: '45', icon: QuizIcon, color: '#4caf50' },
    { label: 'Dúvidas Respondidas', value: '128', icon: ForumIcon, color: '#9c27b0' },
    { label: 'Colaboradores', value: '89', icon: PeopleIcon, color: '#ff9800' },
  ]

  const features = [
    {
      title: 'Biblioteca Digital',
      description: 'Acesse milhares de livros, artigos e materiais didáticos organizados por categoria.',
      icon: BookIcon,
      color: '#2196f3'
    },
    {
      title: 'Quizzes Interativos',
      description: 'Teste seus conhecimentos com quizzes personalizados e acompanhe seu progresso.',
      icon: QuizIcon,
      color: '#4caf50'
    },
    {
      title: 'Fórum Colaborativo',
      description: 'Tire suas dúvidas e ajude outros estudantes em nossa comunidade ativa.',
      icon: ForumIcon,
      color: '#9c27b0'
    }
  ]

  return (
    <Box>
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography
            variant="h1"
            component="h1"
            sx={{
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              fontWeight: 700,
              background: linear-gradient(135deg,  0%,  100%),
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              mb: 2
            }}
          >
            Bem-vindo ao SAE! 
          </Typography>
          <Typography
            variant="h5"
            component="p"
            color="text.secondary"
            sx={{ maxWidth: 600, mx: 'auto', mb: 4 }}
          >
            Sua plataforma completa de apoio à aprendizagem. Estude, pratique e colabore com outros estudantes.
          </Typography>
        </Box>
      </motion.div>

      {/* Stats Section */}
      <Grid container spacing={3} sx={{ mb: 8 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={stat.label}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card sx={{ textAlign: 'center', height: '100%' }}>
                <CardContent>
                  <Avatar
                    sx={{
                      bgcolor: alpha(stat.color, 0.1),
                      color: stat.color,
                      width: 56,
                      height: 56,
                      mx: 'auto',
                      mb: 2
                    }}
                  >
                    <stat.icon />
                  </Avatar>
                  <Typography variant="h4" component="div" fontWeight="bold">
                    {stat.value}
                  </Typography>
                  <Typography color="text.secondary">
                    {stat.label}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Features Section */}
      <Typography
        variant="h3"
        component="h2"
        textAlign="center"
        sx={{ mb: 6, fontSize: { xs: '1.75rem', md: '2rem' } }}
      >
        Explore o que temos para você
      </Typography>
      
      <Grid container spacing={4} sx={{ mb: 8 }}>
        {features.map((feature, index) => (
          <Grid item xs={12} md={4} key={feature.title}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 + 0.3 }}
            >
              <Card sx={{ height: '100%', transition: 'transform 0.3s', '&:hover': { transform: 'translateY(-4px)' } }}>
                <CardContent>
                  <Avatar
                    sx={{
                      bgcolor: alpha(feature.color, 0.1),
                      color: feature.color,
                      width: 48,
                      height: 48,
                      mb: 2
                    }}
                  >
                    <feature.icon />
                  </Avatar>
                  <Typography variant="h5" component="h3" gutterBottom fontWeight="500">
                    {feature.title}
                  </Typography>
                  <Typography color="text.secondary" paragraph>
                    {feature.description}
                  </Typography>
                  <Button
                    variant="outlined"
                    endIcon={<ArrowIcon />}
                    sx={{ mt: 2 }}
                  >
                    Explorar
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* CTA Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <Card
          sx={{
            background: linear-gradient(135deg,  0%,  100%),
            color: 'white',
            textAlign: 'center',
            py: 6
          }}
        >
          <CardContent>
            <Typography variant="h4" component="h3" gutterBottom fontWeight="bold">
              Pronto para começar sua jornada?
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, opacity: 0.9 }}>
              Acesse nossos recursos e comece a estudar hoje mesmo.
              <br />
              O conhecimento está a um clique de distância!
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                sx={{
                  bgcolor: 'white',
                  color: theme.palette.primary.main,
                  '&:hover': { bgcolor: alpha('#fff', 0.9) }
                }}
              >
                Aceder Biblioteca
              </Button>
              <Button
                variant="outlined"
                size="large"
                sx={{
                  borderColor: 'white',
                  color: 'white',
                  '&:hover': { borderColor: alpha('#fff', 0.8), bgcolor: alpha('#fff', 0.1) }
                }}
              >
                Fazer Quiz
              </Button>
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  )
}
