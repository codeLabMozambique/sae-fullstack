import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, IconButton, Box, Typography, Stack,
  CircularProgress, Alert, Chip,
} from '@mui/material';
import {
  Close as CloseIcon, Visibility as ViewIcon,
  PictureAsPdf as PdfIcon, Image as ImageIcon, Description as FileIcon,
} from '@mui/icons-material';

interface Props {
  open: boolean;
  onClose: () => void;
  url: string;
  fileName?: string | null;
  title?: string;
}

/**
 * Visualizador inline de ficheiros — política da plataforma:
 *   "A leitura é apenas dentro da plataforma. Não permitimos download."
 *
 * Suporta:
 *   • PDF       → renderiza via <iframe> (browser viewer)
 *   • Imagens   → tag <img>
 *   • Outros    → mensagem de incompatibilidade
 *
 * Anti-download:
 *   • bloqueia menu de contexto
 *   • desactiva selecção de texto
 *   • CSS @media print { display: none }
 *   • o iframe usa o ficheiro com Content-Disposition: inline
 */
const FileViewerDialog: React.FC<Props> = ({ open, onClose, url, fileName, title }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Adiciona o token via query string como fallback para iframes (que não enviam Authorization)
  const [authedUrl, setAuthedUrl] = useState<string>(url);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);

    const token = localStorage.getItem('sae_token');
    if (!token) {
      setAuthedUrl(url);
      return;
    }
    // Carrega o ficheiro com Authorization e cria um Blob URL (não-descarregável)
    let blobUrl: string | null = null;
    (async () => {
      try {
        const resp = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resp.ok) {
          if (resp.status === 403) throw new Error('Não tens acesso a este ficheiro.');
          if (resp.status === 404) throw new Error('Ficheiro não encontrado.');
          throw new Error(`Erro ao carregar ficheiro (${resp.status})`);
        }
        const blob = await resp.blob();
        blobUrl = URL.createObjectURL(blob);
        setAuthedUrl(blobUrl);
      } catch (e: any) {
        setError(e?.message || 'Falha ao carregar ficheiro');
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [open, url]);

  const lower = (fileName || '').toLowerCase();
  const isPdf = lower.endsWith('.pdf') || lower.includes('pdf');
  const isImage = /\.(jpe?g|png|webp|gif|svg)$/.test(lower);

  const blockContext = (e: React.MouseEvent) => e.preventDefault();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      PaperProps={{
        sx: {
          borderRadius: 3, overflow: 'hidden',
          height: { xs: '100vh', sm: '90vh' },
          userSelect: 'none',
        },
        onContextMenu: blockContext,
      }}
    >
      <DialogTitle sx={{ p: 0 }}>
        <Stack
          direction="row" alignItems="center" justifyContent="space-between"
          sx={{
            px: 2.5, py: 1.5,
            bgcolor: '#0A1628', color: '#fff',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5} minWidth={0}>
            {isPdf ? <PdfIcon sx={{ color: '#F87171' }} />
              : isImage ? <ImageIcon sx={{ color: '#60A5FA' }} />
              : <FileIcon sx={{ color: '#9CA3AF' }} />}
            <Box minWidth={0}>
              <Typography variant="body2" fontWeight={700} noWrap>
                {title || 'Visualizar ficheiro'}
              </Typography>
              {fileName && (
                <Typography variant="caption" sx={{ opacity: 0.7 }} noWrap>
                  {fileName}
                </Typography>
              )}
            </Box>
            <Chip
              size="small" icon={<ViewIcon sx={{ fontSize: '14px !important', color: '#fff !important' }} />}
              label="Apenas leitura"
              sx={{
                bgcolor: 'rgba(255,255,255,0.12)', color: '#fff',
                fontWeight: 700, fontSize: '0.65rem',
                '& .MuiChip-icon': { color: '#fff' },
                ml: 1,
              }}
            />
          </Stack>
          <IconButton onClick={onClose} sx={{ color: '#fff' }} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent
        sx={{
          p: 0, bgcolor: '#1F2937', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}
        onContextMenu={blockContext}
      >
        {loading && !error && (
          <Stack alignItems="center" spacing={1.5} sx={{ color: '#fff' }}>
            <CircularProgress sx={{ color: '#00A651' }} />
            <Typography variant="body2">A carregar ficheiro…</Typography>
          </Stack>
        )}
        {error && (
          <Alert severity="error" sx={{ m: 3 }}>
            {error}
          </Alert>
        )}
        {!loading && !error && (
          isImage ? (
            <Box
              component="img"
              src={authedUrl}
              alt={fileName ?? 'imagem'}
              sx={{
                maxWidth: '100%', maxHeight: '100%', objectFit: 'contain',
                pointerEvents: 'none',  // bloqueia drag/save-as
              }}
            />
          ) : (
            <iframe
              src={authedUrl}
              title={title || 'Ficheiro'}
              style={{
                width: '100%', height: '100%', border: 'none',
                background: '#fff',
              }}
            />
          )
        )}
      </DialogContent>

      {/* CSS print-protection */}
      <style>{`
        @media print {
          .MuiDialog-paper { display: none !important; }
        }
      `}</style>
    </Dialog>
  );
};

export default FileViewerDialog;
