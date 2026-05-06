import React, { useState } from 'react';
import {
  Box, Drawer, AppBar, Toolbar, List, Typography, Divider, IconButton,
  ListItem, ListItemButton, ListItemIcon, ListItemText, Avatar, Collapse,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  LibraryBooks as LibraryIcon,
  Chat as ChatIcon,
  AdminPanelSettings as AdminIcon,
  Menu as MenuIcon,
  Logout as LogoutIcon,
  Group as GroupIcon,
  School as SchoolIcon,
  MeetingRoom as ClassroomIcon,
  MenuBook as SubjectIcon,
  ExpandLess,
  ExpandMore,
  Home as HomeIcon,
  Forum as ForumIcon,
  Grade as GradeIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import OfflineIndicator from '../OfflineIndicator';
import { useAuth } from '../../context/AuthContext';
import type { MenuDTO } from '../../services/authService';

const drawerWidth = 260;

interface Props {
  children: React.ReactNode;
}

/* ── Static fallback menu (legacy /app/* routes) ── */
const staticMenuItems = [
  { text: 'Dashboard',           icon: <DashboardIcon />, path: '/app/dashboard' },
  { text: 'Biblioteca Digital',  icon: <LibraryIcon />,   path: '/app/biblioteca' },
  { text: 'Chat com IA',         icon: <ChatIcon />,      path: '/app/chat' },
  { text: 'Painel Administrativo', icon: <AdminIcon />,   path: '/app/admin' },
];

/* ── Icon map for dynamic menus by code prefix ── */
function menuIcon(code: string): React.ReactNode {
  if (code.startsWith('ADM-001')) return <GroupIcon />;
  if (code.startsWith('ADM-002')) return <SchoolIcon />;
  if (code.startsWith('STD-001')) return <DashboardIcon />;
  if (code.startsWith('STD-002')) return <ForumIcon />;
  if (code.startsWith('PRF-001')) return <GradeIcon />;
  if (code.startsWith('PRF-002')) return <ForumIcon />;
  if (code.startsWith('GST'))     return <HomeIcon />;
  return <AdminIcon />;
}

function subMenuIcon(code: string): React.ReactNode {
  if (code.includes('001-001') || code.includes('list')) return <GroupIcon />;
  if (code.includes('001-002') || code.includes('roles')) return <PersonIcon />;
  if (code.includes('002-001') || code.includes('classroom')) return <ClassroomIcon />;
  if (code.includes('002-002') || code.includes('subject')) return <SubjectIcon />;
  return <AdminIcon />;
}

/* ── Dynamic two-level nav ── */
interface DynamicNavProps {
  menus: MenuDTO[];
  location: ReturnType<typeof useLocation>;
  navigate: ReturnType<typeof useNavigate>;
}

const DynamicNav: React.FC<DynamicNavProps> = ({ menus, location, navigate }) => {
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    menus.forEach(m => {
      const hasActiveChild = m.items?.some(i => location.pathname.startsWith(i.routerLink));
      initial[m.code] = hasActiveChild || location.pathname.startsWith(m.routerLink);
    });
    return initial;
  });

  const toggle = (code: string) => setOpen(prev => ({ ...prev, [code]: !prev[code] }));

  return (
    <List sx={{ flex: 1, px: 2, py: 2 }}>
      {menus.map(menu => {
        const hasChildren = menu.items && menu.items.length > 0;
        const isParentActive = location.pathname.startsWith(menu.routerLink);
        const isExpanded = open[menu.code] ?? false;

        return (
          <React.Fragment key={menu.code}>
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => hasChildren ? toggle(menu.code) : navigate(menu.routerLink)}
                sx={{
                  borderRadius: 2.5,
                  py: 1.2,
                  bgcolor: isParentActive && !hasChildren ? 'rgba(0,166,81,0.15)' : 'transparent',
                  border: isParentActive && !hasChildren ? '1px solid rgba(0,166,81,0.3)' : '1px solid transparent',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: isParentActive ? '#00A651' : 'rgba(255,255,255,0.5)' }}>
                  {menuIcon(menu.code)}
                </ListItemIcon>
                <ListItemText
                  primary={menu.label}
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: isParentActive ? 700 : 400,
                    color: isParentActive ? '#ffffff' : 'rgba(255,255,255,0.6)',
                  }}
                />
                {hasChildren && (
                  isExpanded
                    ? <ExpandLess sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '1.1rem' }} />
                    : <ExpandMore sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '1.1rem' }} />
                )}
                {!hasChildren && isParentActive && (
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#00A651', ml: 1 }} />
                )}
              </ListItemButton>
            </ListItem>

            {hasChildren && (
              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                <List disablePadding sx={{ pl: 1.5, mb: 0.5 }}>
                  {menu.items.map(item => {
                    const isActive = location.pathname.startsWith(item.routerLink);
                    return (
                      <ListItem key={item.code} disablePadding sx={{ mb: 0.3 }}>
                        <ListItemButton
                          onClick={() => navigate(item.routerLink)}
                          sx={{
                            borderRadius: 2,
                            py: 0.9,
                            pl: 1.5,
                            bgcolor: isActive ? 'rgba(0,166,81,0.15)' : 'transparent',
                            border: isActive ? '1px solid rgba(0,166,81,0.3)' : '1px solid transparent',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 32, color: isActive ? '#00A651' : 'rgba(255,255,255,0.4)' }}>
                            <Box sx={{ fontSize: '1rem', display: 'flex' }}>
                              {subMenuIcon(item.code)}
                            </Box>
                          </ListItemIcon>
                          <ListItemText
                            primary={item.label}
                            primaryTypographyProps={{
                              fontSize: '0.85rem',
                              fontWeight: isActive ? 600 : 400,
                              color: isActive ? '#ffffff' : 'rgba(255,255,255,0.55)',
                            }}
                          />
                          {isActive && (
                            <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#00A651', ml: 1 }} />
                          )}
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </List>
              </Collapse>
            )}
          </React.Fragment>
        );
      })}
    </List>
  );
};

/* ── Static nav (fallback) ── */
interface StaticNavProps {
  location: ReturnType<typeof useLocation>;
  navigate: ReturnType<typeof useNavigate>;
}

const StaticNav: React.FC<StaticNavProps> = ({ location, navigate }) => (
  <List sx={{ flex: 1, px: 2, py: 2 }}>
    {staticMenuItems.map(item => {
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
);

/* ── Main Layout ── */
const MainLayout: React.FC<Props> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, logout } = useAuth();

  const dynamicMenus = (user?.menus ?? []) as MenuDTO[];
  const hasDynamicMenus = dynamicMenus.length > 0;

  const userInitials = user?.fullName
    ? user.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  /* Current page title: try dynamic menus first, then static */
  const currentPage = (() => {
    if (hasDynamicMenus) {
      for (const m of dynamicMenus) {
        const sub = m.items?.find(i => location.pathname.startsWith(i.routerLink));
        if (sub) return sub.label;
        if (location.pathname.startsWith(m.routerLink)) return m.label;
      }
    }
    return staticMenuItems.find(i => location.pathname.startsWith(i.path))?.text ?? 'SAE';
  })();

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
      {hasDynamicMenus
        ? <DynamicNav menus={dynamicMenus} location={location} navigate={navigate} />
        : <StaticNav location={location} navigate={navigate} />
      }

      {/* User section */}
      <Box sx={{ p: 2 }}>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mb: 2 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1 }}>
          <Avatar sx={{ bgcolor: '#00A651', width: 36, height: 36, fontSize: '0.85rem', fontWeight: 700 }}>
            {userInitials}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} color="white" noWrap>
              {user?.fullName || user?.username}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
              {user?.role || 'GUEST'}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={handleLogout}
            sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: '#f44336' } }}
          >
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
        {/* Top bar (desktop) */}
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
