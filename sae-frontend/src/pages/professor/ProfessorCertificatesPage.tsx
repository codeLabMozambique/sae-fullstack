import { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Card, CardContent, Button, CircularProgress, Alert,
  Chip, Switch, FormControlLabel, Tooltip, Stack, Dialog, DialogContent,
  IconButton,
} from '@mui/material';
import {
  Verified as CertIcon,
  Public as PublicIcon,
  Lock as PrivateIcon,
  BarChart as StatsIcon,
  Close as CloseIcon,
  PictureAsPdf as PdfIcon,
  Visibility as PreviewIcon,
} from '@mui/icons-material';
import { forumService } from '../../services/forumService';
import { useAuth } from '../../context/AuthContext';
import type { ProfessorCertificate } from '../../types/forum';

const GREEN = '#00A651';
const NAVY  = '#0A1628';
const WHITE = '#FFFFFF';

const DISC_LABELS: Record<string, string> = {
  MATEMATICA:'Matemática', FISICA:'Física', QUIMICA:'Química',
  BIOLOGIA:'Biologia', PORTUGUES:'Português', HISTORIA:'História',
  GEOGRAFIA:'Geografia', INGLES:'Inglês', FILOSOFIA:'Filosofia',
  INFORMATICA:'Informática', PROGRAMACAO:'Programação',
  ECONOMIA:'Economia', GERAL:'Geral',
};
const dl = (d: string) => DISC_LABELS[d] ?? d;

const CERT_W = 1122;
const CERT_H = 794;

// ── 12-point starburst polygon (center=40,40 · outer R=35 · inner r=25) ─────
const STAR_PTS =
  '40,5 46.5,15.9 57.5,9.7 57.7,22.3 70.3,22.5 64.1,33.5 ' +
  '75,40 64.1,46.5 70.3,57.5 57.7,57.7 57.5,70.3 46.5,64.1 ' +
  '40,75 33.5,64.1 22.5,70.3 22.3,57.7 9.7,57.5 15.9,46.5 ' +
  '5,40 15.9,33.5 9.7,22.5 22.3,22.3 22.5,9.7 33.5,15.9';

function sealSVG(size = 80): string {
  const s = size;
  const cx = s / 2;
  const cy = s / 2;
  const scale = s / 80;

  // Scale polygon points
  const pts = STAR_PTS.split(' ').map(p => {
    const [x, y] = p.split(',').map(Number);
    return `${(x * scale).toFixed(1)},${(y * scale).toFixed(1)}`;
  }).join(' ');

  return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="glow">
      <feGaussianBlur stdDeviation="1.5" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <polygon points="${pts}" fill="${NAVY}" stroke="${GREEN}" stroke-width="${(0.8 * scale).toFixed(1)}" filter="url(#glow)"/>
  <circle cx="${cx}" cy="${cy}" r="${(22 * scale).toFixed(1)}" fill="${NAVY}" stroke="${GREEN}" stroke-width="${(1.2 * scale).toFixed(1)}"/>
  <circle cx="${cx}" cy="${cy}" r="${(16 * scale).toFixed(1)}" fill="none" stroke="rgba(0,166,81,0.3)" stroke-width="${(0.6 * scale).toFixed(1)}"/>
  <text x="${cx}" y="${(cy - 2 * scale).toFixed(1)}" font-size="${(11 * scale).toFixed(1)}" fill="${GREEN}" text-anchor="middle" dominant-baseline="middle" font-family="Georgia,serif">&#9733;</text>
  <text x="${cx}" y="${(cy + 10 * scale).toFixed(1)}" font-size="${(4 * scale).toFixed(1)}" fill="${GREEN}" text-anchor="middle" font-family="sans-serif" letter-spacing="${(1.2 * scale).toFixed(1)}" font-weight="bold">SAE</text>
</svg>`;
}

// ── guilloché SVG pattern (sine-wave overlay) ─────────────────────────────────
function guillocheSVG(w: number, h: number): string {
  const lines: string[] = [];
  const step = 5;
  const amp  = 3;
  for (let y = 0; y <= h; y += step) {
    let d = `M 0 ${y}`;
    for (let x = 0; x <= w; x += 2) {
      const wy = y + amp * Math.sin((x / w) * Math.PI * 8);
      d += ` L ${x} ${wy.toFixed(2)}`;
    }
    lines.push(`<path d="${d}" fill="none" stroke="rgba(0,166,81,0.07)" stroke-width="0.5"/>`);
  }
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0;pointer-events:none">${lines.join('')}</svg>`;
}

// ── certificate HTML ──────────────────────────────────────────────────────────
function buildHTML(cert: ProfessorCertificate, fullName: string, autoprint = true): string {
  const discipline = dl(cert.discipline);
  const school     = cert.schoolName ?? 'Escola Pública';
  const pct        = cert.assistancePercentage.toFixed(1);
  const year       = new Date(cert.issuedAt).getFullYear();
  const issued     = new Date(cert.issuedAt).toLocaleDateString('pt-PT', {
                       day: 'numeric', month: 'long', year: 'numeric',
                     });
  const serial     = `SAE-${String(cert.id).padStart(6, '0')}-${year}`;
  const seal       = sealSVG(80);
  const gc         = guillocheSVG(520, 110);
  const ps         = autoprint
    ? `<script>document.fonts.ready.then(()=>{window.print();setTimeout(()=>window.close(),900);});<\/script>`
    : '';

  return `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="UTF-8"/>
<title>Certificado – ${fullName}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400;1,700&family=Lato:wght@300;400;700;900&display=swap');

@page { size: A4 landscape; margin: 0; }
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 297mm; height: 210mm; overflow: hidden; font-family: 'Lato', sans-serif; background: #fff; }

/* ══ PAGE ══ */
.page { width: 297mm; height: 210mm; display: flex; flex-direction: column; position: relative; overflow: hidden; background: #fff; }

/* ══ RIBBON ══ */
.ribbon {
  width: 100%; height: 22mm; flex-shrink: 0;
  background: #00A651;
  display: flex; align-items: center; justify-content: center; gap: 4mm;
  position: relative; z-index: 2;
}
.ribbon::after {
  content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 1.5px;
  background: rgba(255,255,255,0.25);
}
.r-brand { font-size: 16pt; font-weight: 900; color: #fff; letter-spacing: 0.5px; line-height: 1; }
.r-brand .g { color: rgba(255,255,255,0.65); }
.r-sep { font-size: 10pt; color: rgba(255,255,255,0.45); margin: 0 1mm; }
.r-sub { font-size: 7pt; color: rgba(255,255,255,0.7); letter-spacing: 2px; text-transform: uppercase; }
.r-star { font-size: 9pt; color: rgba(255,255,255,0.5); }
.r-divider { width: 1px; height: 8mm; background: rgba(255,255,255,0.3); margin: 0 3mm; }

/* ══ NAVY ACCENT LINE ══ */
.navy-line {
  width: 100%; height: 3px; flex-shrink: 0;
  background: linear-gradient(to right, transparent 0%, #0A1628 15%, #0A1628 85%, transparent 100%);
}

/* ══ CONTENT ══ */
.content {
  flex: 1; position: relative;
  padding: 7mm 14mm 6mm;
  display: flex; flex-direction: column;
}

/* Corner ornaments */
.co { position: absolute; width: 13mm; height: 13mm; }
.co.tl { top: 4mm; left: 10mm; border-top: 1.5px solid rgba(0,166,81,0.4); border-left: 1.5px solid rgba(0,166,81,0.4); }
.co.tr { top: 4mm; right: 10mm; border-top: 1.5px solid rgba(0,166,81,0.4); border-right: 1.5px solid rgba(0,166,81,0.4); }
.co.bl { bottom: 3.5mm; left: 10mm; border-bottom: 1.5px solid rgba(0,166,81,0.4); border-left: 1.5px solid rgba(0,166,81,0.4); }
.co.br { bottom: 3.5mm; right: 10mm; border-bottom: 1.5px solid rgba(0,166,81,0.4); border-right: 1.5px solid rgba(0,166,81,0.4); }

/* ── Header ── */
.hdr { text-align: center; position: relative; z-index: 1; margin-bottom: 3.5mm; }
.eyebrow { font-size: 5.5pt; font-weight: 700; letter-spacing: 4.5px; text-transform: uppercase; color: #00A651; margin-bottom: 2.5mm; }
.ornament { display: flex; align-items: center; justify-content: center; gap: 4mm; margin: 2mm 0; }
.o-line { flex: 1; max-width: 35mm; height: 0.5px; }
.o-line.l { background: linear-gradient(to right, transparent, rgba(0,166,81,0.55)); }
.o-line.r { background: linear-gradient(to left, transparent, rgba(0,166,81,0.55)); }
.o-dia { font-size: 8pt; color: #00A651; line-height: 1; }
.main-title {
  font-family: 'Playfair Display', serif;
  font-size: 18.5pt; font-weight: 800; color: #0A1628; line-height: 1.1; letter-spacing: 0.5px;
}

/* ── Intro ── */
.intro { font-size: 7.5pt; color: #777; text-align: center; line-height: 1.85; margin-bottom: 3.5mm; position: relative; z-index: 1; }
.intro strong { color: #0A1628; font-weight: 700; }

/* ── Name box (guilloché) ── */
.name-box {
  position: relative; overflow: hidden;
  border: 1px solid rgba(0,166,81,0.28);
  background: #fafffe;
  padding: 4mm 10mm;
  margin-bottom: 3.5mm;
  text-align: center;
  z-index: 1;
}
/* Subtle diamond micro-pattern as fallback / base */
.name-box::before {
  content: '';
  position: absolute; inset: 0;
  background:
    repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,166,81,0.04) 5px, rgba(0,166,81,0.04) 5.5px),
    repeating-linear-gradient(-45deg, transparent, transparent 5px, rgba(0,166,81,0.04) 5px, rgba(0,166,81,0.04) 5.5px);
}
.name-inner { position: relative; z-index: 1; }
.nv {
  font-family: 'Playfair Display', serif;
  font-size: 22pt; font-weight: 700; color: #0A1628; letter-spacing: 0.5px; line-height: 1.1;
}
.nb { width: 45%; height: 2.5px; background: #00A651; margin: 2.5mm auto; }
.nu { font-size: 7.5pt; color: #999; letter-spacing: 1.2px; }

/* ── Stats row ── */
.stats {
  display: flex; align-items: center; justify-content: center; gap: 0;
  margin-bottom: 3mm; position: relative; z-index: 1;
}
.s-item { text-align: center; flex: 1; padding: 0 4mm; }
.sv {
  display: block;
  font-family: 'Playfair Display', serif; font-size: 15pt; font-weight: 700;
  color: #0A1628; line-height: 1;
}
.sl { display: block; font-size: 5pt; color: #bbb; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 1mm; }
.sd { display: block; font-size: 9pt; font-weight: 700; color: #0A1628; line-height: 1.2; }
.s-sep { width: 0.7px; height: 10mm; background: rgba(0,166,81,0.2); flex-shrink: 0; }

/* ── Footer ── */
.footer {
  margin-top: auto; position: relative; z-index: 1;
  display: flex; align-items: flex-end; justify-content: space-between;
  border-top: 0.6px solid rgba(0,166,81,0.2); padding-top: 3mm;
}
.sig { text-align: center; }
.sig-line { width: 36mm; border-bottom: 0.8px solid #0A1628; margin-bottom: 2mm; }
.sig-name { font-size: 6.5pt; font-weight: 700; color: #0A1628; }
.sig-role { font-size: 5pt; color: #ccc; text-transform: uppercase; letter-spacing: 1px; margin-top: 0.5mm; }

.seal-col { display: flex; flex-direction: column; align-items: center; gap: 2mm; }
.date-block { text-align: center; }
.dl { font-size: 5pt; color: #ccc; text-transform: uppercase; letter-spacing: 2px; }
.dv { font-size: 7.5pt; font-weight: 700; color: #0A1628; font-family: 'Playfair Display', serif; margin-top: 0.5mm; }
.ds { font-size: 4pt; color: #ddd; letter-spacing: 1.5px; margin-top: 0.8mm; }
</style>
</head>
<body>
<div class="page">

  <!-- ═══ RIBBON ═══ -->
  <div class="ribbon">
    <span class="r-star">✦</span>
    <span class="r-brand">smart<span class="g">SAE</span></span>
    <div class="r-divider"></div>
    <span class="r-sub">Sistema Académico de Aprendizado</span>
    <div class="r-divider"></div>
    <span class="r-sub">Moçambique &nbsp;·&nbsp; Nampula</span>
    <span class="r-star">✦</span>
  </div>

  <!-- ═══ NAVY ACCENT ═══ -->
  <div class="navy-line"></div>

  <!-- ═══ CONTENT ═══ -->
  <div class="content">
    <div class="co tl"></div><div class="co tr"></div>
    <div class="co bl"></div><div class="co br"></div>

    <!-- Header -->
    <div class="hdr">
      <div class="eyebrow">Reconhecimento Oficial</div>
      <div class="ornament">
        <div class="o-line l"></div><div class="o-dia">✦</div><div class="o-line r"></div>
      </div>
      <div class="main-title">Certificado de Excelência Académica</div>
      <div class="ornament">
        <div class="o-line l"></div><div class="o-dia">✦</div><div class="o-line r"></div>
      </div>
    </div>

    <!-- Intro -->
    <div class="intro">
      O <strong>smartSAE</strong> — Sistema Académico de Aprendizado certifica que o(a) docente
      abaixo identificado(a) demonstrou desempenho excepcional no apoio académico prestado
      aos estudantes, cumprindo todos os critérios de qualidade estabelecidos pela plataforma.
    </div>

    <!-- Name box -->
    <div class="name-box">
      ${gc}
      <div class="name-inner">
        <div class="nv">${fullName}</div>
        <div class="nb"></div>
        <div class="nu">${school}&nbsp;&nbsp;·&nbsp;&nbsp;Nampula, Moçambique</div>
      </div>
    </div>

    <!-- Stats -->
    <div class="stats">
      <div class="s-item">
        <span class="sv">${pct}%</span>
        <span class="sl">Taxa de Apoio</span>
      </div>
      <div class="s-sep"></div>
      <div class="s-item">
        <span class="sv">${cert.totalAnswered}</span>
        <span class="sl">Respostas Dadas</span>
      </div>
      <div class="s-sep"></div>
      <div class="s-item">
        <span class="sd">${discipline}</span>
        <span class="sl">Área Curricular</span>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="sig">
        <div class="sig-line"></div>
        <div class="sig-name">Direcção Pedagógica</div>
        <div class="sig-role">smartSAE · Plataforma Educativa</div>
      </div>

      <div class="seal-col">
        ${seal}
        <div class="date-block">
          <div class="dl">Emitido em</div>
          <div class="dv">${issued}</div>
          <div class="ds">${serial}</div>
        </div>
      </div>

      <div class="sig">
        <div class="sig-line"></div>
        <div class="sig-name">Coordenação de Qualidade</div>
        <div class="sig-role">Ensino e Avaliação</div>
      </div>
    </div>
  </div>
</div>
${ps}
</body>
</html>`;
}

// ── PDF export ────────────────────────────────────────────────────────────────
function downloadPDF(cert: ProfessorCertificate, fullName: string) {
  const win = window.open('', '_blank', 'width=1200,height=900,scrollbars=no');
  if (!win) { alert('Permita popups para esta página e tente novamente.'); return; }
  win.document.open();
  win.document.write(buildHTML(cert, fullName, true));
  win.document.close();
}

// ── Preview modal ─────────────────────────────────────────────────────────────
function CertPreviewModal({
  cert, fullName, open, onClose,
}: { cert: ProfessorCertificate; fullName: string; open: boolean; onClose: () => void }) {
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const compute = () => {
      if (containerRef.current) {
        const avail = containerRef.current.clientWidth - 32;
        setScale(Math.min(1, avail / CERT_W));
      }
    };
    const t = setTimeout(compute, 80);
    window.addEventListener('resize', compute);
    return () => { clearTimeout(t); window.removeEventListener('resize', compute); };
  }, [open]);

  const html = buildHTML(cert, fullName, false);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      slotProps={{
        backdrop: { sx: { backdropFilter: 'blur(8px)', bgcolor: 'rgba(10,22,40,0.85)' } },
        paper:    { sx: { bgcolor: '#0d1e33', borderRadius: 3, overflow: 'hidden', m: 2 } },
      }}
    >
      {/* Top bar */}
      <Box sx={{
        bgcolor: NAVY, px: 3, py: 1.5,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid rgba(0,166,81,0.2)',
      }}>
        <Box>
          <Typography sx={{ color: WHITE, fontWeight: 800, fontSize: 15, lineHeight: 1.2 }}>
            Pré-visualização do Certificado
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, mt: 0.3 }}>
            {dl(cert.discipline)}&nbsp;&nbsp;·&nbsp;&nbsp;{cert.schoolName ?? 'Escola Pública'}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button
            variant="contained"
            startIcon={<PdfIcon />}
            onClick={() => downloadPDF(cert, fullName)}
            sx={{
              bgcolor: GREEN, fontWeight: 700, textTransform: 'none',
              fontSize: 13, borderRadius: 2, px: 2.5,
              boxShadow: '0 4px 14px rgba(0,166,81,0.4)',
              '&:hover': { bgcolor: '#008f44' },
            }}
          >
            Baixar PDF
          </Button>
          <IconButton onClick={onClose}
            sx={{ color: 'rgba(255,255,255,0.55)', '&:hover': { color: WHITE } }}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </Box>

      {/* Certificate preview */}
      <DialogContent sx={{ p: 2, bgcolor: '#0d1e33' }}>
        <Box ref={containerRef}>
          <Box sx={{
            width: CERT_W * scale,
            height: CERT_H * scale,
            mx: 'auto',
            boxShadow: '0 28px 70px rgba(0,0,0,0.6)',
            borderRadius: 0.5,
            overflow: 'hidden',
            position: 'relative',
          }}>
            <Box sx={{
              width: CERT_W,
              height: CERT_H,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              position: 'absolute',
              top: 0,
              left: 0,
            }}>
              <iframe
                srcDoc={html}
                style={{ width: CERT_W, height: CERT_H, border: 'none', display: 'block' }}
                title="Certificado Preview"
                scrolling="no"
              />
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ProfessorCertificatesPage() {
  const { user } = useAuth();
  const fullName = user?.fullName ?? user?.username ?? 'Professor(a)';

  const [certs,      setCerts]      = useState<ProfessorCertificate[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [publishing, setPublishing] = useState<number | null>(null);
  const [preview,    setPreview]    = useState<ProfessorCertificate | null>(null);

  useEffect(() => {
    forumService.getMyCertificates()
      .then(setCerts)
      .catch(() => setError('Não foi possível carregar os certificados.'))
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async (cert: ProfessorCertificate) => {
    setPublishing(cert.id);
    try {
      const updated = await forumService.publishCertificate(cert.id);
      setCerts(prev => prev.map(c => c.id === updated.id ? updated : c));
    } catch {
      setError('Não foi possível actualizar a visibilidade do certificado.');
    } finally {
      setPublishing(null);
    }
  };

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} color={NAVY}>Os Meus Certificados</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Emitidos automaticamente ao atingir 70% de taxa de apoio com mínimo de 5 respostas
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: GREEN }} />
        </Box>
      ) : certs.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <CertIcon sx={{ fontSize: 64, color: 'rgba(0,166,81,0.2)', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" fontWeight={600}>
            Ainda sem certificados
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Responda a pelo menos 5 perguntas e mantenha 70% de taxa de apoio.
          </Typography>
        </Box>
      ) : (
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' },
          gap: 2,
        }}>
          {certs.map(cert => (
            <Card
              key={cert.id}
              variant="outlined"
              onClick={() => setPreview(cert)}
              sx={{
                borderRadius: 3,
                border: `1px solid ${cert.isPublic ? 'rgba(0,166,81,0.4)' : '#E2E8F0'}`,
                cursor: 'pointer',
                transition: 'box-shadow 0.2s, transform 0.15s',
                '&:hover': { boxShadow: '0 8px 28px rgba(10,22,40,0.12)', transform: 'translateY(-2px)' },
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                  <Box sx={{ p: 1, bgcolor: '#F0FDF4', borderRadius: 2, display: 'flex', border: '1px solid rgba(0,166,81,0.25)' }}>
                    <CertIcon sx={{ color: GREEN, fontSize: 22 }} />
                  </Box>
                  <Stack direction="row" spacing={0.8} alignItems="center">
                    {cert.isPublic
                      ? <Chip icon={<PublicIcon />} label="Público" size="small"
                          sx={{ bgcolor: '#DCFCE7', color: '#166534', fontWeight: 700, fontSize: '0.7rem' }} />
                      : <Chip icon={<PrivateIcon />} label="Privado" size="small"
                          sx={{ bgcolor: '#F1F5F9', color: '#475569', fontWeight: 700, fontSize: '0.7rem' }} />
                    }
                    <Tooltip title="Pré-visualizar certificado">
                      <Box sx={{
                        p: 0.5, borderRadius: 1, bgcolor: 'rgba(10,22,40,0.04)',
                        display: 'flex', color: '#64748B',
                        '&:hover': { bgcolor: 'rgba(10,22,40,0.09)', color: NAVY },
                        transition: 'all 0.15s',
                      }}>
                        <PreviewIcon sx={{ fontSize: 16 }} />
                      </Box>
                    </Tooltip>
                  </Stack>
                </Stack>

                <Typography variant="subtitle1" fontWeight={700} color={NAVY} sx={{ mb: 0.5 }}>
                  {dl(cert.discipline)}
                </Typography>
                {cert.schoolName && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    {cert.schoolName}
                  </Typography>
                )}

                <Stack direction="row" gap={1.5} mb={1.5} flexWrap="wrap">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <StatsIcon sx={{ fontSize: 15, color: cert.assistancePercentage >= 80 ? GREEN : '#D97706' }} />
                    <Typography variant="body2" fontWeight={700}
                      sx={{ color: cert.assistancePercentage >= 80 ? GREEN : '#D97706' }}>
                      {cert.assistancePercentage.toFixed(1)}% apoio
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {cert.totalAnswered} respostas
                  </Typography>
                </Stack>

                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                  Emitido em {fmt(cert.issuedAt)}
                </Typography>

                <Box onClick={e => e.stopPropagation()}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={!!cert.isPublic}
                        onChange={() => handleToggle(cert)}
                        disabled={publishing === cert.id}
                        size="small"
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': { color: GREEN },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: GREEN },
                        }}
                      />
                    }
                    label={
                      <Typography variant="caption" fontWeight={600} color="text.secondary">
                        {publishing === cert.id ? 'A actualizar…' : 'Visível publicamente'}
                      </Typography>
                    }
                    sx={{ m: 0 }}
                  />
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {certs.length > 0 && (
        <Box sx={{ mt: 3, p: 2, bgcolor: '#F0FDF4', borderRadius: 2, border: '1px solid rgba(0,166,81,0.2)' }}>
          <Typography variant="body2" color="#166534" fontWeight={600}>
            Clique num certificado para pré-visualizar e transferir em PDF.
            Certificados públicos ficam visíveis no perfil da plataforma.
          </Typography>
        </Box>
      )}

      {preview && (
        <CertPreviewModal
          cert={preview}
          fullName={fullName}
          open={!!preview}
          onClose={() => setPreview(null)}
        />
      )}
    </Box>
  );
}
