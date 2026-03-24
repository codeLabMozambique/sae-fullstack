import { Box, Container, Typography, Link, Stack } from '@mui/material'
import { Favorite } from '@mui/icons-material'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <Box
      component="footer"
      sx={{
        py: 4,
        mt: 'auto',
        backgroundColor: (theme) => theme.palette.grey[100],
        borderTop: 1,
        borderColor: 'divider'
      }}
    >
      <Container maxWidth="lg">
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems="center"
          spacing={2}
        >
          <Typography variant="body2" color="text.secondary">
            © {currentYear} SAE - Sistema de Apoio ao Estudante
          </Typography>
          
          <Stack direction="row" spacing={3}>
            <Link href="#" color="inherit" variant="body2">
              Sobre
            </Link>
            <Link href="#" color="inherit" variant="body2">
              Termos
            </Link>
            <Link href="#" color="inherit" variant="body2">
              Privacidade
            </Link>
            <Link href="#" color="inherit" variant="body2">
              Ajuda
            </Link>
          </Stack>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            Feito com
            <Favorite sx={{ fontSize: 14, color: '#f44336' }} />
            pela equipe SAE
          </Typography>
        </Stack>
      </Container>
    </Box>
  )
}
