import React from 'react';
import { Box, Typography, Avatar, Chip } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { useNavigate } from 'react-router-dom';
import type { ForumQuestion } from '../../types/forum';

const SPEC_COLOR = '#2563EB';
const COLLAB_COLOR = '#16A34A';

function initials(name: string): string {
  return name
    .split(/[\s._@-]+/)
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
}

interface Props {
  question: ForumQuestion;
}

const ChatConversationRow: React.FC<Props> = ({ question }) => {
  const navigate = useNavigate();
  const isSpec = question.questionType === 'ESPECIALIZADO';
  const accent = isSpec ? SPEC_COLOR : COLLAB_COLOR;
  const lightBg = isSpec ? '#DBEAFE' : '#DCFCE7';
  const totalAnswers =
    (question.expertAnswers?.length ?? 0) +
    (question.collaborativeAnswers?.length ?? 0);

  return (
    <Box
      onClick={() => navigate(`/app/forum/questions/${question.id}`)}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        px: 2.5,
        py: 1.75,
        cursor: 'pointer',
        borderBottom: '1px solid #F3F4F6',
        transition: 'background-color 0.15s',
        '&:hover': { bgcolor: '#F9FAFB' },
        '&:last-child': { borderBottom: 'none' },
      }}
    >
      {/* Avatar */}
      <Avatar
        sx={{
          bgcolor: lightBg,
          color: accent,
          fontWeight: 700,
          width: 46,
          height: 46,
          fontSize: '0.88rem',
          flexShrink: 0,
          border: `2px solid ${accent}22`,
        }}
      >
        {initials(question.createdBy)}
      </Avatar>

      {/* Center */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 0.25,
          }}
        >
          <Typography
            variant="body2"
            fontWeight={700}
            color="#111827"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
              mr: 1,
            }}
          >
            {question.titulo}
          </Typography>
          <Typography
            variant="caption"
            color="#9CA3AF"
            sx={{ flexShrink: 0, fontSize: '0.72rem' }}
          >
            {formatTime(question.createdAt)}
          </Typography>
        </Box>
        <Typography
          variant="caption"
          color="#6B7280"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            display: 'block',
            fontSize: '0.77rem',
          }}
        >
          {question.createdBy}
          {question.area ? ` · ${question.area}` : ''}
        </Typography>
      </Box>

      {/* Right indicators */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 0.5,
          flexShrink: 0,
        }}
      >
        <Chip
          label={isSpec ? 'ESP' : 'COL'}
          size="small"
          sx={{
            bgcolor: lightBg,
            color: accent,
            fontWeight: 700,
            fontSize: '0.6rem',
            height: 18,
            '& .MuiChip-label': { px: 0.75 },
          }}
        />
        {totalAnswers > 0 ? (
          <Box
            sx={{
              bgcolor: accent,
              color: '#fff',
              borderRadius: '50%',
              width: 18,
              height: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.62rem',
              fontWeight: 700,
            }}
          >
            {totalAnswers > 9 ? '9+' : totalAnswers}
          </Box>
        ) : question.status === 'FECHADA' ? (
          <LockIcon sx={{ fontSize: 13, color: '#9CA3AF' }} />
        ) : null}
      </Box>
    </Box>
  );
};

export default ChatConversationRow;
