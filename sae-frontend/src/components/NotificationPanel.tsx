import { useState, useRef } from 'react';
import {
  Box, IconButton, Badge, Popover, Typography, Stack,
  Divider, Tooltip, Button, Chip,
} from '@mui/material';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import ForumIcon from '@mui/icons-material/Forum';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import QuizIcon from '@mui/icons-material/Quiz';
import CloseIcon from '@mui/icons-material/Close';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { useNavigate } from 'react-router-dom';
import { useNotifications, type AppNotification } from '../hooks/useNotifications';

function NotifIcon({ type, color }: { type: AppNotification['iconType']; color: string }) {
  const sx = { fontSize: 20, color };
  switch (type) {
    case 'forum':      return <ForumIcon sx={sx} />;
    case 'check':      return <CheckCircleOutlineIcon sx={sx} />;
    case 'assignment': return <AssignmentIcon sx={sx} />;
    case 'person':     return <PersonAddIcon sx={sx} />;
    case 'quiz':       return <QuizIcon sx={sx} />;
    default:           return <WarningAmberIcon sx={sx} />;
  }
}

function NotifItem({
  n, isNew, onNavigate, onDismiss,
}: {
  n: AppNotification;
  isNew: boolean;
  onNavigate: (route: string) => void;
  onDismiss: (id: string) => void;
}) {
  return (
    <Box
      sx={{
        display: 'flex', alignItems: 'flex-start', gap: 1.5,
        px: 2, py: 1.5,
        borderLeft: `3px solid ${isNew ? n.color : 'transparent'}`,
        bgcolor: isNew ? `${n.color}08` : 'transparent',
        cursor: 'pointer',
        transition: 'background 0.15s',
        '&:hover': { bgcolor: `${n.color}12` },
      }}
      onClick={() => onNavigate(n.route)}
    >
      <Box sx={{
        mt: 0.3, p: 0.8, borderRadius: 2,
        bgcolor: `${n.color}15`, flexShrink: 0,
      }}>
        <NotifIcon type={n.iconType} color={n.color} />
      </Box>

      <Box flex={1} minWidth={0}>
        <Stack direction="row" alignItems="center" spacing={1} mb={0.2}>
          <Typography fontWeight={700} fontSize={13} color="#1a1a2e" noWrap sx={{ flex: 1 }}>
            {n.label}
          </Typography>
          <Chip
            label={n.count}
            size="small"
            sx={{
              height: 20, fontSize: 11, fontWeight: 800,
              bgcolor: n.color, color: 'white',
              '& .MuiChip-label': { px: 1 },
            }}
          />
        </Stack>
        <Typography fontSize={12} color="text.secondary" sx={{ lineHeight: 1.4 }}>
          {n.description}
        </Typography>
      </Box>

      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0, ml: 0.5 }}>
        <ArrowForwardIosIcon sx={{ fontSize: 11, color: '#9CA3AF' }} />
        <Tooltip title="Dispensar" placement="top">
          <IconButton
            size="small"
            onClick={e => { e.stopPropagation(); onDismiss(n.id); }}
            sx={{ color: '#9CA3AF', '&:hover': { color: '#EF4444' }, p: 0.3 }}
          >
            <CloseIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
      </Stack>
    </Box>
  );
}

export default function NotificationPanel() {
  const navigate = useNavigate();
  const { notifications, newCount, markAllSeen, dismissOne } = useNotifications();
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  const hasAny = notifications.length > 0;

  const handleOpen = () => {
    setOpen(true);
    markAllSeen();
  };

  const handleClose = () => setOpen(false);

  const handleNavigate = (route: string) => {
    handleClose();
    navigate(route);
  };

  const seenMap = (() => {
    try { return JSON.parse(localStorage.getItem('notif_seen') ?? '{}') as Record<string, number>; }
    catch { return {} as Record<string, number>; }
  })();

  return (
    <>
      <Tooltip title={hasAny ? `${newCount > 0 ? `${newCount} novas ` : ''}notificações` : 'Sem notificações'} placement="right">
        <IconButton
          ref={anchorRef}
          onClick={handleOpen}
          size="small"
          sx={{
            color: hasAny ? '#00A651' : 'rgba(255,255,255,0.35)',
            position: 'relative',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
          }}
        >
          <Badge
            badgeContent={newCount}
            max={99}
            sx={{
              '& .MuiBadge-badge': {
                bgcolor: '#EF4444', color: 'white',
                fontSize: 10, fontWeight: 800,
                minWidth: 16, height: 16, padding: '0 3px',
              },
            }}
          >
            {newCount > 0
              ? <NotificationsActiveIcon sx={{ fontSize: 22 }} />
              : <NotificationsNoneIcon sx={{ fontSize: 22 }} />}
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorRef.current}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{
          sx: {
            width: 360, maxHeight: 480,
            borderRadius: 3,
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            border: '1px solid #F3F4F6',
            overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
          },
        }}
      >
        {/* Header */}
        <Box sx={{ px: 2.5, py: 2, bgcolor: '#FAFAFA', borderBottom: '1px solid #F3F4F6' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography fontWeight={800} fontSize={15} color="#111827">
                Notificações
              </Typography>
              {hasAny && (
                <Typography fontSize={12} color="text.secondary">
                  {notifications.reduce((s, n) => s + n.count, 0)} itens a requerer atenção
                </Typography>
              )}
            </Box>
            <Stack direction="row" spacing={0.5}>
              {hasAny && (
                <Tooltip title="Marcar tudo como visto">
                  <IconButton size="small" onClick={markAllSeen} sx={{ color: '#6B7280' }}>
                    <DoneAllIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              <IconButton size="small" onClick={handleClose} sx={{ color: '#6B7280' }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Stack>
        </Box>

        {/* Items */}
        <Box sx={{ overflowY: 'auto', flex: 1 }}>
          {!hasAny ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <NotificationsNoneIcon sx={{ fontSize: 48, color: '#D1D5DB', mb: 1.5 }} />
              <Typography color="text.secondary" fontSize={14} fontWeight={600}>
                Tudo em dia!
              </Typography>
              <Typography color="text.disabled" fontSize={12}>
                Sem notificações de momento.
              </Typography>
            </Box>
          ) : (
            notifications.map((n, i) => {
              const isNew = n.count > (seenMap[n.id] ?? 0);
              return (
                <Box key={n.id}>
                  <NotifItem
                    n={n}
                    isNew={isNew}
                    onNavigate={handleNavigate}
                    onDismiss={dismissOne}
                  />
                  {i < notifications.length - 1 && (
                    <Divider sx={{ mx: 2, borderColor: '#F9FAFB' }} />
                  )}
                </Box>
              );
            })
          )}
        </Box>

        {/* Footer */}
        {hasAny && (
          <Box sx={{ px: 2, py: 1.5, borderTop: '1px solid #F3F4F6', bgcolor: '#FAFAFA' }}>
            <Button
              fullWidth
              size="small"
              variant="text"
              onClick={markAllSeen}
              sx={{ color: '#6B7280', fontSize: 12, textTransform: 'none', fontWeight: 600 }}
            >
              Marcar todas como vistas
            </Button>
          </Box>
        )}
      </Popover>
    </>
  );
}
