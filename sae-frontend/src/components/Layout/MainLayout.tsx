import React, { useState } from 'react';
import {
  Box, Drawer, AppBar, Toolbar, List, Typography, Divider, IconButton,
  ListItem, ListItemButton, ListItemIcon, ListItemText, Avatar
} from '@mui/material';
import {
  Dashboard as DashboardIcon, LibraryBooks as LibraryIcon, Chat as ChatIcon,
  AdminPanelSettings as AdminIcon, Menu as MenuIcon, Logout as LogoutIcon,
  Forum as ForumIcon, FactCheck as ValidationsIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import OfflineIndicator from '../OfflineIndicator';
import { useAuth } from '../../context/AuthContext';

const drawerWidth = 260;

interface Props {
  children: React.ReactNode;
}

// roles that can see each item — undefined means all authenticated users
const ALL_MENU_ITEMS = [
  { text: 'Dashboard',             icon: <DashboardIcon />,   path: '/app/dashboard' },
  { text: 'Biblioteca Digital',    icon: <LibraryIcon />,     path: '/app/biblioteca' },
  { text: 'Fórum',                 icon: <ForumIcon />,       path: '/app/forum' },
  { text: 'Chat com IA',           icon: <ChatIcon />,        path: '/app/chat' },
  { text: 'Validações',            icon: <ValidationsIcon />, path: '/app/forum/validations', roles: ['Professor', 'Administrador', 'Root'] },
  { text: 'Painel Administrativo', icon: <AdminIcon />,       path: '/app/admin',              roles: ['Administrador', 'Root'] },
];

const MainLayout: React.FC<Props> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const userInitials = user?.fullName
    ? user.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = ALL_MENU_ITEMS.filter(
    item => !item.roles || item.roles.includes(user?.role ?? ''),
  );

  const currentPage = [...menuItems]
    .sort((a, b) => b.path.length - a.path.length)
    .find(item => location.pathname.startsWith(item.path))?.text || 'SAE';

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, #001B33 0%, #002B50 100%)' }}>
      {/* Logo */}
      <Box sx={{ p: 3, pb: 2 }}>
        <Typography variant="h5" fontWeight={800} color="white" letterSpacing={-0.5}>
          smart<span style={{ color: '#00A651' }}>SAE</span>
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', letterSpacing: 1 }}>
          PLATAFORMA EDUCACIONAL
        </Typography>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      {/* Navigation */}
      <List sx={{ flex: 1, px: 2, py: 2 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 2.5,
                  py: 1.2,
                  bgcolor: isActive ? 'rgba(0,166,81,0.15)' : 'transparent',
                  border: isActive ? '1px solid rgba(0,166,81,0.3)' : '1px solid transparent',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: isActive ? '#00A651' : 'rgba(255,255,255,0.5)' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: isActive ? 700 : 400,
                    color: isActive ? '#ffffff' : 'rgba(255,255,255,0.6)',
                  }}
                />
                {isActive && (
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#00A651', ml: 1 }} />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* User section */}
      <Box sx={{ p: 2 }}>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mb: 2 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1 }}>
          <Avatar sx={{ bgcolor: '#00A651', width: 36, height: 36, fontSize: '0.85rem', fontWeight: 700 }}>{userInitials}</Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" fontWeight={600} color="white">{user?.fullName || user?.username}</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>{user?.role || 'GUEST'}</Typography>
          </Box>
          <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: '#f44336' } }}
            onClick={handleLogout}>
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Top App Bar (mobile only) */}
      <AppBar position="fixed" sx={{ display: { sm: 'none' }, bgcolor: '#001B33', boxShadow: 'none' }}>
        <Toolbar>
          <IconButton color="inherit" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" fontWeight={800}>
            smart<span style={{ color: '#00A651' }}>SAE</span>
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: drawerWidth, border: 'none' } }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { width: drawerWidth, border: 'none' } }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 4,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: { xs: '64px', sm: 0 },
          minHeight: '100vh',
          bgcolor: '#f0f2f5',
        }}
      >
        {/* Top bar for desktop */}
        <Box sx={{ display: { xs: 'none', sm: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h5" fontWeight={700} color="#0A1628">{currentPage}</Typography>
            <Typography variant="caption" color="text.secondary">
              Bem-vindo de volta, {user?.fullName || user?.username}
            </Typography>
          </Box>
        </Box>
        {children}
      </Box>

      <OfflineIndicator />
    </Box>
  );
};

export default MainLayout;
