import { useState } from 'react'
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Container,
  useMediaQuery,
  useTheme
} from '@mui/material'
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  MenuBook as BookIcon,
  Quiz as QuizIcon,
  Forum as ForumIcon,
  Person as PersonIcon
} from '@mui/icons-material'
import { Link, useLocation } from 'react-router-dom'

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const location = useLocation()

  const navItems = [
    { name: 'Início', path: '/', icon: HomeIcon },
    { name: 'Biblioteca', path: '/biblioteca', icon: BookIcon },
    { name: 'Quizzes', path: '/quizzes', icon: QuizIcon },
    { name: 'Fórum', path: '/forum', icon: ForumIcon },
  ]

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <Typography variant="h6" sx={{ my: 2, color: 'primary.main' }}>
        SAE
      </Typography>
      <List>
        {navItems.map((item) => (
          <ListItem
            component={Link}
            to={item.path}
            key={item.name}
            sx={{
              color: location.pathname === item.path ? 'primary.main' : 'inherit'
            }}
          >
            <ListItemIcon>
              <item.icon color={location.pathname === item.path ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary={item.name} />
          </ListItem>
        ))}
      </List>
    </Box>
  )

  return (
    <AppBar position="sticky" color="default" elevation={1}>
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{
              flexGrow: 1,
              textDecoration: 'none',
              color: 'primary.main',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <BookIcon />
            SAE
          </Typography>

          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              {navItems.map((item) => (
                <Button
                  key={item.name}
                  component={Link}
                  to={item.path}
                  color={location.pathname === item.path ? 'primary' : 'inherit'}
                  sx={{ fontWeight: location.pathname === item.path ? 600 : 400 }}
                >
                  {item.name}
                </Button>
              ))}
              <Button variant="outlined" color="primary">
                Entrar
              </Button>
              <Button variant="contained" color="primary">
                Cadastrar
              </Button>
            </Box>
          )}

          {isMobile && (
            <IconButton color="inherit" onClick={handleDrawerToggle}>
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
      </Container>

      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
      >
        {drawer}
      </Drawer>
    </AppBar>
  )
}
