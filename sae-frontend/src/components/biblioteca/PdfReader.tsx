import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Box, IconButton, Typography, LinearProgress, Tooltip, TextField,
  Stack, CircularProgress, Alert, Menu, MenuItem, Slider, Divider, Chip,
} from '@mui/material';
import {
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  FitScreen as FitIcon,
  VolumeUp as PlayIcon,
  Pause as PauseIcon,
  PlayArrow as ResumeIcon,
  Stop as StopIcon,
  Speed as SpeedIcon,
  RecordVoiceOver as VoiceIcon,
} from '@mui/icons-material';
import * as pdfjsLib from 'pdfjs-dist';
// O Vite resolve o worker para um URL servido pelo dev server
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { useReadingTracker } from '../../hooks/useReadingTracker';
import { useTextToSpeech } from '../../hooks/useTextToSpeech';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

interface Props {
  url: string;
  contentId: string;
  initialPage?: number;
  onPageChange?: (page: number, total: number) => void;
}

/**
 * Leitor de PDF embebido com:
 *   • paginação (anterior / seguinte / saltar)
 *   • zoom in/out / fit-to-width
 *   • TTS — lê em voz alta o texto da página actual (acessibilidade)
 *   • registo automático de progresso (via useReadingTracker)
 *   • protecções anti-download: sem botão de download, sem clique-direito
 *
 * O PDF é carregado via fetch — o Service Worker intercepta e serve do
 * cache quando offline.
 */
const PdfReader: React.FC<Props> = ({ url, contentId, initialPage = 1, onPageChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<any>(null);
  const renderTaskRef = useRef<any>(null);

  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState<number>(1.2);
  const [jumpTo, setJumpTo] = useState<string>('');

  // ── TTS ────────────────────────────────────────────────────
  const tts = useTextToSpeech('pt-PT');
  const [readingMode, setReadingMode] = useState<'page' | 'book'>('page');
  const [voiceMenu, setVoiceMenu] = useState<HTMLElement | null>(null);
  const [speedMenu, setSpeedMenu] = useState<HTMLElement | null>(null);
  const ttsBookCancelledRef = useRef(false);

  const tracker = useReadingTracker(contentId);

  // ─── Load PDF ────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const token = localStorage.getItem('sae_token');
        const loadingTask = pdfjsLib.getDocument({
          url,
          httpHeaders: token ? { Authorization: `Bearer ${token}` } : undefined,
          withCredentials: false,
        });
        const pdf = await loadingTask.promise;
        if (cancelled) return;
        pdfRef.current = pdf;
        setNumPages(pdf.numPages);
        setCurrentPage(Math.min(initialPage, pdf.numPages));
        setLoading(false);
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || 'Falha ao abrir o PDF (talvez não esteja em cache offline)');
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      try { pdfRef.current?.destroy?.(); } catch { /* noop */ }
      tts.cancel();
      ttsBookCancelledRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, initialPage]);

  // ─── Render the current page ─────────────────────────────
  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfRef.current || !canvasRef.current) return;
    if (renderTaskRef.current) {
      try { renderTaskRef.current.cancel(); } catch { /* noop */ }
    }

    try {
      const page = await pdfRef.current.getPage(pageNum);

      const containerWidth = containerRef.current?.clientWidth ?? 800;
      const baseViewport = page.getViewport({ scale: 1 });
      const fitScale = Math.min(2.5, (containerWidth - 40) / baseViewport.width);
      const finalScale = scale === -1 ? fitScale : scale;
      const viewport = page.getViewport({ scale: finalScale });

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { alpha: false })!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.maxWidth = '100%';

      const task = page.render({
        canvasContext: ctx,
        viewport,
        canvas,
      } as any);
      renderTaskRef.current = task;
      await task.promise;
    } catch (e: any) {
      if (e?.name !== 'RenderingCancelledException') {
        console.error('[PdfReader] render failed', e);
      }
    }
  }, [scale]);

  useEffect(() => {
    if (numPages > 0) {
      renderPage(currentPage);
      onPageChange?.(currentPage, numPages);
      tracker.onPageChange(currentPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, numPages, scale]);

  useEffect(() => {
    const onResize = () => { if (numPages > 0) renderPage(currentPage); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [numPages, currentPage, renderPage]);

  // ─── Navegação ───────────────────────────────────────────
  const prev = () => setCurrentPage(p => Math.max(1, p - 1));
  const next = () => setCurrentPage(p => Math.min(numPages, p + 1));

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prev(); }
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); next(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numPages]);

  const handleJump = () => {
    const n = Number(jumpTo);
    if (!isNaN(n) && n >= 1 && n <= numPages) setCurrentPage(n);
    setJumpTo('');
  };

  // ─── TTS: extrair texto de uma página ────────────────────
  const extractPageText = useCallback(async (pageNum: number): Promise<string> => {
    if (!pdfRef.current) return '';
    try {
      const page = await pdfRef.current.getPage(pageNum);
      const tc = await page.getTextContent();
      return tc.items.map((it: any) => it.str || '').join(' ');
    } catch {
      return '';
    }
  }, []);

  // Lê apenas a página actual
  const readCurrentPage = async () => {
    const text = await extractPageText(currentPage);
    if (!text.trim()) {
      alert('Esta página não tem texto extraível (pode ser uma imagem).');
      return;
    }
    ttsBookCancelledRef.current = false;
    setReadingMode('page');
    tts.speak(text);
  };

  // Lê todo o livro a partir da página actual, virando páginas automaticamente
  const readBookFromHere = async () => {
    ttsBookCancelledRef.current = false;
    setReadingMode('book');
    for (let p = currentPage; p <= numPages; p++) {
      if (ttsBookCancelledRef.current) break;
      const text = await extractPageText(p);
      if (!text.trim()) continue;
      setCurrentPage(p);
      // espera o TTS terminar a página
      await new Promise<void>((resolve) => {
        tts.speak(text);
        const interval = setInterval(() => {
          if (ttsBookCancelledRef.current) {
            clearInterval(interval);
            resolve();
            return;
          }
          if (!tts.speaking && !window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
            clearInterval(interval);
            resolve();
          }
        }, 400);
      });
    }
  };

  const stopTts = () => {
    ttsBookCancelledRef.current = true;
    tts.cancel();
  };

  // ─── Anti-download ───────────────────────────────────────
  const blockContext = (e: React.MouseEvent) => e.preventDefault();

  const progress = numPages > 0 ? (currentPage / numPages) * 100 : 0;

  const speedLabel = `${tts.rate.toFixed(1)}x`;

  return (
    <Box
      ref={containerRef}
      onContextMenu={blockContext}
      sx={{
        width: '100%', display: 'flex', flexDirection: 'column',
        bgcolor: '#1F2937', borderRadius: 2, overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Toolbar — navegação + zoom */}
      <Stack
        direction="row" alignItems="center" justifyContent="space-between"
        sx={{ px: 2, py: 1.25, bgcolor: '#111827', color: '#fff' }}
        flexWrap="wrap" gap={1}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Tooltip title="Página anterior (←)">
            <span>
              <IconButton onClick={prev} disabled={currentPage <= 1} sx={{ color: '#fff' }}>
                <PrevIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Typography variant="body2" sx={{ minWidth: 80, textAlign: 'center', fontWeight: 600 }}>
            {currentPage} / {numPages || '—'}
          </Typography>
          <Tooltip title="Página seguinte (→)">
            <span>
              <IconButton onClick={next} disabled={currentPage >= numPages} sx={{ color: '#fff' }}>
                <NextIcon />
              </IconButton>
            </span>
          </Tooltip>

          <TextField
            size="small" placeholder="Saltar"
            value={jumpTo}
            onChange={e => setJumpTo(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleJump()}
            sx={{
              ml: 1, width: 90,
              '& input': { color: '#fff', fontSize: '0.85rem', textAlign: 'center', py: 0.5 },
              '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
            }}
            inputProps={{ inputMode: 'numeric' }}
          />
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1}>
          <Tooltip title="Diminuir zoom">
            <IconButton onClick={() => setScale(s => Math.max(0.5, (s === -1 ? 1.2 : s) - 0.2))} sx={{ color: '#fff' }}>
              <ZoomOutIcon />
            </IconButton>
          </Tooltip>
          <Typography variant="caption" sx={{ minWidth: 48, textAlign: 'center' }}>
            {scale === -1 ? 'Auto' : `${Math.round(scale * 100)}%`}
          </Typography>
          <Tooltip title="Aumentar zoom">
            <IconButton onClick={() => setScale(s => Math.min(3, (s === -1 ? 1.2 : s) + 0.2))} sx={{ color: '#fff' }}>
              <ZoomInIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Ajustar à largura">
            <IconButton onClick={() => setScale(-1)} sx={{ color: '#fff' }}>
              <FitIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Toolbar TTS */}
      {tts.supported && (
        <Stack
          direction="row" alignItems="center" spacing={1.5}
          sx={{
            px: 2, py: 1, bgcolor: '#0F172A', color: '#fff',
            borderTop: '1px solid rgba(255,255,255,0.05)',
          }}
          flexWrap="wrap"
        >
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <VoiceIcon sx={{ color: '#00A651', fontSize: 18 }} />
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#9CA3AF' }}>
              ACESSIBILIDADE
            </Typography>
          </Stack>

          <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

          {!tts.speaking ? (
            <>
              <Tooltip title="Ler esta página">
                <IconButton size="small" onClick={readCurrentPage} sx={{ color: '#00A651' }}>
                  <PlayIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Typography variant="caption" sx={{ cursor: 'pointer', color: '#9CA3AF', '&:hover': { color: '#fff' } }}
                onClick={readCurrentPage}>
                Ouvir página
              </Typography>

              <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

              <Tooltip title="Ler livro inteiro a partir desta página (vira páginas automaticamente)">
                <Chip
                  size="small" label="Ouvir livro completo"
                  onClick={readBookFromHere}
                  sx={{
                    bgcolor: '#1E40AF', color: '#fff',
                    fontWeight: 600, cursor: 'pointer',
                    '&:hover': { bgcolor: '#1E3A8A' },
                  }}
                />
              </Tooltip>
            </>
          ) : (
            <>
              {!tts.paused ? (
                <Tooltip title="Pausar">
                  <IconButton size="small" onClick={tts.pause} sx={{ color: '#FBBF24' }}>
                    <PauseIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              ) : (
                <Tooltip title="Retomar">
                  <IconButton size="small" onClick={tts.resume} sx={{ color: '#00A651' }}>
                    <ResumeIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Parar leitura">
                <IconButton size="small" onClick={stopTts} sx={{ color: '#DC2626' }}>
                  <StopIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Chip
                size="small"
                label={readingMode === 'book' ? `📖 livro · pág. ${currentPage}` : `🎧 ${tts.paused ? 'pausa' : 'a ler'}`}
                sx={{ bgcolor: '#00A651', color: '#fff', fontWeight: 600 }}
              />
            </>
          )}

          <Box sx={{ flex: 1 }} />

          {/* Velocidade */}
          <Tooltip title="Velocidade de leitura">
            <IconButton size="small" onClick={(e) => setSpeedMenu(e.currentTarget)} sx={{ color: '#fff' }}>
              <SpeedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Typography variant="caption" sx={{ minWidth: 28 }}>{speedLabel}</Typography>
          <Menu anchorEl={speedMenu} open={!!speedMenu} onClose={() => setSpeedMenu(null)}>
            <Box sx={{ px: 2, py: 1.5, width: 200 }}>
              <Typography variant="caption" color="text.secondary">Velocidade</Typography>
              <Slider
                value={tts.rate} min={0.5} max={2} step={0.1}
                onChange={(_, v) => tts.setRate(v as number)}
                marks={[
                  { value: 0.5, label: '0.5x' },
                  { value: 1, label: '1x' },
                  { value: 1.5, label: '1.5x' },
                  { value: 2, label: '2x' },
                ]}
                sx={{ color: '#00A651', mt: 1 }}
              />
            </Box>
          </Menu>

          {/* Voz */}
          {tts.voices.length > 0 && (
            <>
              <Tooltip title="Escolher voz">
                <IconButton size="small" onClick={(e) => setVoiceMenu(e.currentTarget)} sx={{ color: '#fff' }}>
                  <VoiceIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Menu anchorEl={voiceMenu} open={!!voiceMenu} onClose={() => setVoiceMenu(null)}
                slotProps={{ paper: { sx: { maxHeight: 320, width: 280 } } }}>
                {tts.voices
                  .filter(v => v.lang?.toLowerCase().startsWith('pt') || v.lang?.toLowerCase().startsWith('en'))
                  .map(v => (
                    <MenuItem key={v.voiceURI}
                      selected={v.voiceURI === tts.voiceURI}
                      onClick={() => { tts.setVoice(v.voiceURI); setVoiceMenu(null); }}>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{v.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{v.lang}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
              </Menu>
            </>
          )}
        </Stack>
      )}

      {/* Barra de progresso */}
      <LinearProgress
        variant="determinate" value={progress}
        sx={{ height: 3, '& .MuiLinearProgress-bar': { bgcolor: '#00A651' } }}
      />

      {/* Conteúdo */}
      <Box sx={{
        flex: 1, minHeight: 500, display: 'flex', justifyContent: 'center',
        alignItems: 'flex-start', overflow: 'auto', py: 3, bgcolor: '#374151',
      }}>
        {loading && (
          <Stack alignItems="center" spacing={1.5} mt={6}>
            <CircularProgress sx={{ color: '#00A651' }} />
            <Typography sx={{ color: '#fff' }} variant="body2">A carregar PDF…</Typography>
          </Stack>
        )}
        {error && (
          <Alert severity="error" sx={{ m: 3, maxWidth: 480 }}>
            {error}
          </Alert>
        )}
        {!loading && !error && (
          <canvas ref={canvasRef} style={{
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            borderRadius: 4,
          }} />
        )}
      </Box>

      <style>{`
        @media print {
          canvas { display: none !important; }
        }
      `}</style>
    </Box>
  );
};

export default PdfReader;
