import React, { useEffect, useRef, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, IconButton, Box, Typography, Stack,
  CircularProgress, Alert, Chip, Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon, Visibility as ViewIcon,
  PictureAsPdf as PdfIcon, Image as ImageIcon, Description as FileIcon,
  ChevronLeft as PrevIcon, ChevronRight as NextIcon,
} from '@mui/icons-material';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

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
  const [imageUrl, setImageUrl] = useState<string>('');

  const lower = (fileName || '').toLowerCase();
  const isPdf = lower.endsWith('.pdf') || lower.includes('pdf');
  const isImage = /\.(jpe?g|png|webp|gif|svg)$/.test(lower);

  // ─── PDF (renderizado em canvas via pdfjs — bloqueia auto-download do browser) ──
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<any>(null);
  const renderTaskRef = useRef<any>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    setNumPages(0);
    setCurrentPage(1);

    const token = localStorage.getItem('sae_token');
    let cancelled = false;
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
        if (isPdf) {
          const task = pdfjsLib.getDocument({
            url,
            httpHeaders: token ? { Authorization: `Bearer ${token}` } : undefined,
            withCredentials: false,
          });
          const pdf = await task.promise;
          if (cancelled) return;
          pdfRef.current = pdf;
          setNumPages(pdf.numPages);
        } else {
          // imagens / outros: fetch autenticado → blob URL para <img>
          const resp = await fetch(url, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          });
          if (!resp.ok) {
            let detail = '';
            try { detail = (await resp.text()).slice(0, 200); } catch { /* ignore */ }
            throw new Error(`HTTP ${resp.status}${detail ? ' — ' + detail : ''}`);
          }
          const blob = await resp.blob();
          blobUrl = URL.createObjectURL(blob);
          if (!cancelled) setImageUrl(blobUrl);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Falha ao carregar ficheiro');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      try { pdfRef.current?.destroy?.(); } catch { /* noop */ }
      pdfRef.current = null;
    };
  }, [open, url, isPdf]);

  // Renderiza a página actual no canvas
  useEffect(() => {
    if (!isPdf || !pdfRef.current || numPages === 0) return;
    let cancelled = false;
    (async () => {
      if (renderTaskRef.current) {
        try { renderTaskRef.current.cancel(); } catch { /* noop */ }
      }
      try {
        const page = await pdfRef.current.getPage(currentPage);
        if (cancelled || !canvasRef.current) return;
        const containerWidth = containerRef.current?.clientWidth ?? 800;
        const base = page.getViewport({ scale: 1 });
        const scale = Math.min(2.5, (containerWidth - 40) / base.width);
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { alpha: false })!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.maxWidth = '100%';
        const task = page.render({ canvasContext: ctx, viewport, canvas } as any);
        renderTaskRef.current = task;
        await task.promise;
      } catch (e: any) {
        if (e?.name !== 'RenderingCancelledException') {
          console.error('[FileViewerDialog] render', e);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [isPdf, numPages, currentPage]);

  const prevPage = () => setCurrentPage(p => Math.max(1, p - 1));
  const nextPage = () => setCurrentPage(p => Math.min(numPages, p + 1));

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
              src={imageUrl}
              alt={fileName ?? 'imagem'}
              sx={{
                maxWidth: '100%', maxHeight: '100%', objectFit: 'contain',
                pointerEvents: 'none',  // bloqueia drag/save-as
              }}
            />
          ) : isPdf ? (
            <Box
              ref={containerRef}
              sx={{
                width: '100%', height: '100%',
                display: 'flex', flexDirection: 'column',
                bgcolor: '#1F2937', overflow: 'hidden',
              }}
            >
              <Stack
                direction="row" alignItems="center" justifyContent="center" spacing={2}
                sx={{ px: 2, py: 1, bgcolor: '#111827', color: '#fff' }}
              >
                <Tooltip title="Anterior">
                  <span>
                    <IconButton onClick={prevPage} disabled={currentPage <= 1} sx={{ color: '#fff' }} size="small">
                      <PrevIcon />
                    </IconButton>
                  </span>
                </Tooltip>
                <Typography variant="body2" sx={{ minWidth: 80, textAlign: 'center', fontWeight: 600 }}>
                  {currentPage} / {numPages || '—'}
                </Typography>
                <Tooltip title="Seguinte">
                  <span>
                    <IconButton onClick={nextPage} disabled={currentPage >= numPages} sx={{ color: '#fff' }} size="small">
                      <NextIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </Stack>
              <Box sx={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', p: 2 }}>
                <canvas ref={canvasRef} style={{ display: 'block', boxShadow: '0 2px 12px rgba(0,0,0,0.3)' }} />
              </Box>
            </Box>
          ) : (
            <Alert severity="info" sx={{ m: 3 }}>
              Formato não suportado para visualização inline.
            </Alert>
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
