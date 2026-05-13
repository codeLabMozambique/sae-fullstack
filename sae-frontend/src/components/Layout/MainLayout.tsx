import React, { useState, useEffect } from 'react';
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
  Person as PersonIcon,
  // Biblioteca sub-items
  Search as SearchIcon,
  PermMedia as MyContentIcon,
  CloudUpload as UploadIcon,
  AccountTree as CategoriesIcon,
  Bookmark as FavoritesIcon,
  AutoStories as ContinueReadingIcon,
  History as HistoryIcon,
  DownloadForOffline as OfflineIcon,
  // Outros
  EmojiEvents as GoalsIcon,
  Groups as StudentsIcon,
  BarChart as StatsIcon,
  Class as ClassIcon,
  MenuBook as MenuBookIcon,
  Quiz as QuizIcon,
  Assignment as AssignmentIcon,
  Star as DirectorIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import OfflineIndicator from '../OfflineIndicator';
import { useAuth } from '../../context/AuthContext';
import type { MenuDTO } from '../../services/authService';
import api from '../../services/api';

const drawerWidth = 260;

interface Props {
  children: React.ReactNode;
}

/* ── Static fallback menu (legacy /app/* routes) ── */
const staticMenuItems = [
  { text: 'Dashboard',             icon: <DashboardIcon />, path: '/app/dashboard' },
  { text: 'Biblioteca Digital',    icon: <LibraryIcon />,   path: '/app/biblioteca' },
  { text: 'Fórum',                 icon: <ForumIcon />,     path: '/app/forum' },
  { text: 'Chat com IA',           icon: <ChatIcon />,      path: '/app/chat' },
  { text: 'Painel Administrativo', icon: <AdminIcon />,     path: '/app/admin' },
];

/* ── Icon map for dynamic menus by code (parent headers) ── */
function menuIcon(code: string): React.ReactNode {
  if (code === '02') return <AdminIcon />;
  if (code === '03' || code === 'PRF-ASG') return <SchoolIcon />;
  if (code === '04' || code === 'STD-ASG') return <DashboardIcon />;
  if (code === '05') return <HomeIcon />;
  if (code.startsWith('SADM')) return <AdminIcon />;
  if (code === 'PRF-DIR') return <DirectorIcon />;
  if (code.includes('QUIZ')) return <QuizIcon />;
  return <AssignmentIcon />;
}

/* ── Route-based icon (preciso e semântico) ── */
function iconByRoute(route: string): React.ReactNode | null {
  // Biblioteca — sub-itens
  if (/\/library\/my-content/.test(route))  return <MyContentIcon />;
  if (/\/library\/upload/.test(route))      return <UploadIcon />;
  if (/\/library\/categories/.test(route))  return <CategoriesIcon />;
  if (/\/library\/favorites/.test(route))   return <FavoritesIcon />;
  if (/\/library\/progress/.test(route))    return <ContinueReadingIcon />;
  if (/\/library\/history/.test(route))     return <HistoryIcon />;
  if (/\/library\/offline/.test(route))     return <OfflineIcon />;
  if (/\/library$/.test(route))             return <SearchIcon />;
  // Metas
  if (/\/goals/.test(route))                return <GoalsIcon />;
  // Director de Turma / Matrícula / Professores
  if (/\/director-classroom/.test(route))   return <DirectorIcon />;
  if (/\/students/.test(route))             return <StudentsIcon />;
  if (/\/professors/.test(route))           return <PersonIcon />;
  // Professor / Aluno raíz
  if (/\/dashboard/.test(route))            return <DashboardIcon />;
  if (/\/my-classes/.test(route))           return <ClassIcon />;
  if (/\/students/.test(route))             return <StudentsIcon />;
  if (/\/quiz/.test(route))                return <QuizIcon />;
  if (/\/forum/.test(route))               return <ForumIcon />;
  if (/\/questions/.test(route))            return <ForumIcon />;
  if (/\/stats/.test(route))               return <StatsIcon />;
  if (/\/assignments/.test(route))         return <AssignmentIcon />;
  if (/\/submissions/.test(route))         return <AssignmentIcon />;
  // Admin
  if (/\/schools/.test(route))             return <SchoolIcon />;
  if (/\/classrooms/.test(route))          return <ClassroomIcon />;
  if (/\/subjects/.test(route))            return <MenuBookIcon />;
  if (/\/users/.test(route))              return <GroupIcon />;
  if (/\/admin\/library/.test(route))      return <LibraryIcon />;
  return null;
}

function subMenuIcon(code: string): React.ReactNode {
  // Admin sub-items
  if (code === '0201') return <SchoolIcon />;
  if (code === '0202') return <ClassroomIcon />;
  if (code === '0203') return <SubjectIcon />;
  if (code === '0204') return <GroupIcon />;
  if (code === '0205' || code === '0206') return <LibraryIcon />;
  // Professor sub-items
  if (code === '0301') return <StatsIcon />;
  if (code === '0302') return <ClassIcon />;
  if (code === '0303') return <StudentsIcon />;
  if (code === '0304') return <LibraryIcon />;
  if (code === '0305') return <ForumIcon />;
  // Student sub-items
  if (code === '0401') return <DashboardIcon />;
  if (code === '0402') return <ForumIcon />;
  if (code === '0403') return <LibraryIcon />;
  // Guest sub-items
  if (code === '0501') return <LibraryIcon />;
  // Legacy
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
                              {iconByRoute(item.routerLink) ?? subMenuIcon(item.code)}
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
  const [subInfo, setSubInfo] = useState<string | null>(null);
  const navigate  = useNavigate();
  const location  = useLocation();
  const isForumPage = location.pathname.includes('/forum');
  const { user, logout } = useAuth();

  const dynamicMenus = (user?.menus ?? []) as MenuDTO[];
  const hasDynamicMenus = dynamicMenus.length > 0;

  const userInitials = user?.fullName
    ? user.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  useEffect(() => {
    if (!user?.username) return;
    if (user.role === 'Professor') {
      api.get<string[]>(`/auth/users/professor/${user.username}/specializations`)
        .then(r => { if (r.data.length > 0) setSubInfo(r.data[0]); })
        .catch(() => {});
    } else if (user.role === 'Estudante') {
      api.get('/auth/users/student-profile-by-username', { params: { username: user.username } })
        .then((r: any) => {
          const profile = r.data;
          const parts = [profile.grade, profile.classroomId ? `Turma ${profile.classroomId}` : null].filter(Boolean);
          if (parts.length > 0) setSubInfo(parts.join(' · '));
        })
        .catch(() => {});
    }
  }, [user?.username, user?.role]);

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
      <Box sx={{ p: 2, bgcolor: '#001B33' }}>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mb: 2 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1 }}>
          <Avatar sx={{ bgcolor: '#00A651', width: 36, height: 36, fontSize: '0.85rem', fontWeight: 700 }}>
            {userInitials}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} color="white" noWrap>
              {user?.fullName || user?.username}
            </Typography>
            <Typography variant="caption" sx={{ color: '#00A651', fontWeight: 600 }} noWrap>
              {user?.role || 'GUEST'}
            </Typography>
            {subInfo && (
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', display: 'block' }} noWrap>
                {subInfo}
              </Typography>
            )}
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
    <Box sx={{ display: 'flex', width: '100vw', maxWidth: '100vw', overflow: 'hidden' }}>
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
          sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: drawerWidth, border: 'none', bgcolor: '#001B33' } }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { width: drawerWidth, border: 'none', bgcolor: '#001B33' } }}
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
          minWidth: 0,
          p: isForumPage ? 0 : 4,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          maxWidth: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: { xs: '64px', sm: 0 },
          minHeight: isForumPage ? undefined : '100vh',
          height: isForumPage ? { xs: 'calc(100vh - 64px)', sm: '100vh' } : undefined,
          bgcolor: isForumPage ? 'white' : '#f0f2f5',
          overflow: isForumPage ? 'hidden' : undefined,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Top bar (desktop) — hidden on forum pages */}
        {!isForumPage && (
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Box>
              <Typography variant="h5" fontWeight={700} color="#0A1628">{currentPage}</Typography>
              <Typography variant="caption" color="text.secondary">
                Bem-vindo de volta, {user?.fullName || user?.username}
              </Typography>
            </Box>
          </Box>
        )}
        {children}
      </Box>

      <OfflineIndicator />
    </Box>
  );
};

export default MainLayout;
