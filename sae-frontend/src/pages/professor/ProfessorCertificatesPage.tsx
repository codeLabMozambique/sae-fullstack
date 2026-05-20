import { useState, useEffect } from 'react';
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

// ─── Discipline label map ──────────────────────────────────────────────────────

const DISC_LABELS: Record<string, string> = {
  MATEMATICA: 'Matemática', FISICA: 'Física', QUIMICA: 'Química',
  BIOLOGIA: 'Biologia', PORTUGUES: 'Português', HISTORIA: 'História',
  GEOGRAFIA: 'Geografia', INGLES: 'Inglês', FILOSOFIA: 'Filosofia',
  INFORMATICA: 'Informática', PROGRAMACAO: 'Programação',
  ECONOMIA: 'Economia', GERAL: 'Geral',
};

function discLabel(d: string) {
  return DISC_LABELS[d] ?? d;
}

// ─── PDF generation ────────────────────────────────────────────────────────────

function generateCertificateHTML(cert: ProfessorCertificate, fullName: string): string {
  const issuedDate = new Date(cert.issuedAt).toLocaleDateString('pt-PT', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const discipline = discLabel(cert.discipline);
  const serial = `SAE-${cert.id.toString().padStart(6, '0')}-${new Date(cert.issuedAt).getFullYear()}`;
  const percent = cert.assistancePercentage.toFixed(1);

  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8"/>
  <title>Certificado – ${fullName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Lato:wght@300;400;600;700&display=swap');
    @page { size: A4 portrait; margin: 0; }
    * { margin:0; padding:0; box-sizing:border-box; }
    body { background:#fff; }

    .page {
      width:210mm; height:297mm;
      background:#ffffff;
      position:relative;
      overflow:hidden;
      font-family:'Lato',sans-serif;
    }

    /* Outer decorative border */
    .border-outer {
      position:absolute; inset:8mm;
      border:3px solid #C9A227;
    }
    .border-inner {
      position:absolute; inset:11mm;
      border:1px solid #C9A227;
    }

    /* Corner ornaments */
    .corner {
      position:absolute; width:14mm; height:14mm;
    }
    .corner svg { width:100%; height:100%; }
    .c-tl { top:6mm; left:6mm; }
    .c-tr { top:6mm; right:6mm; transform:scaleX(-1); }
    .c-bl { bottom:6mm; left:6mm; transform:scaleY(-1); }
    .c-br { bottom:6mm; right:6mm; transform:scale(-1); }

    /* Watermark */
    .watermark {
      position:absolute;
      top:50%; left:50%;
      transform:translate(-50%,-50%) rotate(-35deg);
      font-size:52pt;
      font-family:'Playfair Display',serif;
      font-weight:700;
      color:rgba(10,22,40,0.04);
      white-space:nowrap;
      letter-spacing:6px;
      pointer-events:none;
      user-select:none;
    }

    /* Content wrapper */
    .content {
      position:absolute;
      inset:14mm;
      display:flex;
      flex-direction:column;
      align-items:center;
    }

    /* Header band */
    .header-band {
      width:100%;
      background:#0A1628;
      padding:7mm 0 6mm;
      display:flex;
      flex-direction:column;
      align-items:center;
      gap:2mm;
    }
    .platform-name {
      font-family:'Lato',sans-serif;
      font-size:9pt;
      font-weight:700;
      letter-spacing:5px;
      color:#C9A227;
      text-transform:uppercase;
    }
    .platform-sub {
      font-size:7pt;
      color:rgba(255,255,255,0.55);
      letter-spacing:2px;
      text-transform:uppercase;
    }

    /* Gold divider */
    .gold-divider {
      width:100%;
      height:3px;
      background:linear-gradient(90deg,transparent,#C9A227 20%,#f5d97e 50%,#C9A227 80%,transparent);
      margin:4mm 0;
    }
    .thin-divider {
      width:60%;
      height:1px;
      background:linear-gradient(90deg,transparent,#C9A227,transparent);
      margin:3mm 0;
    }

    /* Seal */
    .seal-row {
      display:flex;
      align-items:center;
      gap:4mm;
      margin:3mm 0 2mm;
    }
    .seal-line { flex:1; height:1px; background:linear-gradient(90deg,transparent,#C9A22760); }
    .seal {
      width:18mm; height:18mm;
      border-radius:50%;
      border:2px solid #C9A227;
      background:radial-gradient(circle,#0A1628,#1a2e50);
      display:flex; flex-direction:column;
      align-items:center; justify-content:center;
      gap:0.5mm;
    }
    .seal-star { font-size:10pt; color:#C9A227; }
    .seal-text { font-size:4.5pt; color:#C9A227; letter-spacing:1px; text-transform:uppercase; font-weight:700; }

    /* Certificate type */
    .cert-type {
      font-family:'Lato',sans-serif;
      font-size:7pt;
      letter-spacing:6px;
      color:#888;
      text-transform:uppercase;
      margin:1mm 0;
    }

    /* Main title */
    .main-title {
      font-family:'Playfair Display',serif;
      font-size:22pt;
      font-weight:700;
      color:#0A1628;
      text-align:center;
      letter-spacing:1px;
      line-height:1.2;
      margin:1mm 0 2mm;
    }

    /* Body text */
    .body-text {
      font-size:9pt;
      color:#444;
      text-align:center;
      line-height:1.7;
      max-width:155mm;
      margin:2mm 0;
    }

    /* Name block */
    .name-block {
      text-align:center;
      margin:3mm 0;
    }
    .name-label {
      font-size:7pt;
      color:#888;
      letter-spacing:3px;
      text-transform:uppercase;
      margin-bottom:1mm;
    }
    .professor-name {
      font-family:'Playfair Display',serif;
      font-size:24pt;
      font-weight:600;
      color:#0A1628;
      letter-spacing:1px;
    }

    /* Stats table */
    .stats-row {
      display:flex;
      gap:4mm;
      margin:3mm 0 2mm;
      width:100%;
      justify-content:center;
    }
    .stat-box {
      background:#F8F9FC;
      border:1px solid #e0e4ef;
      border-top:3px solid #C9A227;
      padding:3mm 5mm;
      text-align:center;
      min-width:35mm;
    }
    .stat-val {
      font-family:'Playfair Display',serif;
      font-size:16pt;
      font-weight:700;
      color:#0A1628;
      line-height:1;
    }
    .stat-lbl {
      font-size:6.5pt;
      color:#888;
      text-transform:uppercase;
      letter-spacing:1px;
      margin-top:1mm;
    }
    .stat-disc {
      font-size:8pt;
      font-weight:600;
      color:#0A1628;
      line-height:1;
    }

    /* Footer row */
    .footer-row {
      width:100%;
      display:flex;
      justify-content:space-between;
      align-items:flex-end;
      margin-top:auto;
      padding-top:3mm;
    }
    .sig-block {
      text-align:center;
      min-width:50mm;
    }
    .sig-line {
      border-bottom:1px solid #0A1628;
      margin-bottom:2mm;
      width:50mm;
    }
    .sig-name { font-size:7.5pt; font-weight:700; color:#0A1628; }
    .sig-role { font-size:6.5pt; color:#888; letter-spacing:1px; text-transform:uppercase; }
    .date-block {
      text-align:center;
    }
    .date-label { font-size:6.5pt; color:#888; letter-spacing:2px; text-transform:uppercase; margin-bottom:1mm; }
    .date-val { font-family:'Playfair Display',serif; font-size:9pt; color:#0A1628; font-weight:600; }

    /* Serial */
    .serial {
      margin-top:2mm;
      font-size:6pt;
      color:#bbb;
      letter-spacing:2px;
      text-transform:uppercase;
    }
  </style>
</head>
<body>
<div class="page">
  <!-- Decorative borders -->
  <div class="border-outer"></div>
  <div class="border-inner"></div>

  <!-- Corner ornaments -->
  <div class="corner c-tl">
    <svg viewBox="0 0 40 40" fill="none">
      <path d="M2 2 L18 2 M2 2 L2 18" stroke="#C9A227" stroke-width="2"/>
      <path d="M6 6 L14 6 M6 6 L6 14" stroke="#C9A227" stroke-width="1"/>
      <circle cx="2" cy="2" r="2" fill="#C9A227"/>
    </svg>
  </div>
  <div class="corner c-tr">
    <svg viewBox="0 0 40 40" fill="none">
      <path d="M2 2 L18 2 M2 2 L2 18" stroke="#C9A227" stroke-width="2"/>
      <path d="M6 6 L14 6 M6 6 L6 14" stroke="#C9A227" stroke-width="1"/>
      <circle cx="2" cy="2" r="2" fill="#C9A227"/>
    </svg>
  </div>
  <div class="corner c-bl">
    <svg viewBox="0 0 40 40" fill="none">
      <path d="M2 2 L18 2 M2 2 L2 18" stroke="#C9A227" stroke-width="2"/>
      <path d="M6 6 L14 6 M6 6 L6 14" stroke="#C9A227" stroke-width="1"/>
      <circle cx="2" cy="2" r="2" fill="#C9A227"/>
    </svg>
  </div>
  <div class="corner c-br">
    <svg viewBox="0 0 40 40" fill="none">
      <path d="M2 2 L18 2 M2 2 L2 18" stroke="#C9A227" stroke-width="2"/>
      <path d="M6 6 L14 6 M6 6 L6 14" stroke="#C9A227" stroke-width="1"/>
      <circle cx="2" cy="2" r="2" fill="#C9A227"/>
    </svg>
  </div>

  <!-- Watermark -->
  <div class="watermark">SAE ACADÉMICO</div>

  <!-- Content -->
  <div class="content">

    <!-- Header band -->
    <div class="header-band" style="width:calc(100% + 0px)">
      <div class="platform-name">SAE — Sistema Académico de Excelência</div>
      <div class="platform-sub">Plataforma de Apoio ao Ensino · Angola</div>
    </div>

    <div class="gold-divider"></div>

    <!-- Seal row -->
    <div class="seal-row">
      <div class="seal-line"></div>
      <div class="seal">
        <div class="seal-star">★</div>
        <div class="seal-text">SAE</div>
        <div class="seal-text">CERT</div>
      </div>
      <div class="seal-line" style="background:linear-gradient(90deg,#C9A22760,transparent)"></div>
    </div>

    <!-- Type -->
    <div class="cert-type">Documento de Reconhecimento Oficial</div>

    <!-- Main title -->
    <div class="main-title">Certificado de<br/>Excelência Académica</div>

    <div class="thin-divider"></div>

    <!-- Body text -->
    <div class="body-text">
      A Plataforma <strong>SAE — Sistema Académico de Excelência</strong> certifica que o/a docente
    </div>

    <!-- Name block -->
    <div class="name-block">
      <div class="name-label">Professor(a)</div>
      <div class="professor-name">${fullName}</div>
    </div>

    <div class="thin-divider"></div>

    <div class="body-text" style="margin-top:1mm">
      demonstrou desempenho excepcional no apoio académico aos alunos,
      respondendo com dedicação e qualidade às questões na área de
      <strong>${discipline}</strong>, cumprindo todos os critérios de excelência
      definidos pela plataforma.
    </div>

    <!-- Stats -->
    <div class="stats-row">
      <div class="stat-box">
        <div class="stat-val">${percent}%</div>
        <div class="stat-lbl">Taxa de Apoio</div>
      </div>
      <div class="stat-box">
        <div class="stat-val">${cert.totalAnswered}</div>
        <div class="stat-lbl">Respostas Dadas</div>
      </div>
      <div class="stat-box">
        <div class="stat-disc">${discipline}</div>
        <div class="stat-lbl" style="margin-top:2mm">Área Curricular</div>
      </div>
    </div>

    <!-- Gold divider -->
    <div class="gold-divider" style="margin-top:auto"></div>

    <!-- Footer -->
    <div class="footer-row">
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-name">Direcção Académica</div>
        <div class="sig-role">SAE — Plataforma Educativa</div>
      </div>
      <div class="date-block">
        <div class="date-label">Emitido em</div>
        <div class="date-val">${issuedDate}</div>
        <div class="serial">${serial}</div>
      </div>
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-name">Coordenação de Qualidade</div>
        <div class="sig-role">Ensino e Avaliação</div>
      </div>
    </div>

  </div>
</div>
<script>
  document.fonts.ready.then(function() {
    window.print();
    setTimeout(function() { window.close(); }, 800);
  });
</script>
</body>
</html>`;
}

function downloadCertificatePDF(cert: ProfessorCertificate, fullName: string) {
  const win = window.open('', '_blank', 'width=794,height=1123,scrollbars=no');
  if (!win) {
    alert('O browser bloqueou o popup. Permita popups para esta página e tente novamente.');
    return;
  }
  win.document.open();
  win.document.write(generateCertificateHTML(cert, fullName));
  win.document.close();
}

// ─── Certificate Preview Modal ─────────────────────────────────────────────────

function CertPreviewModal({
  cert, fullName, open, onClose,
}: {
  cert: ProfessorCertificate; fullName: string; open: boolean; onClose: () => void;
}) {
  const issuedDate = new Date(cert.issuedAt).toLocaleDateString('pt-PT', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const discipline = discLabel(cert.discipline);
  const serial = `SAE-${cert.id.toString().padStart(6, '0')}-${new Date(cert.issuedAt).getFullYear()}`;
  const percent = cert.assistancePercentage.toFixed(1);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      slotProps={{
        backdrop: { sx: { backdropFilter: 'blur(6px)', bgcolor: 'rgba(10,22,40,0.7)' } },
        paper: { sx: { bgcolor: 'transparent', boxShadow: 'none', overflow: 'visible' } },
      }}>
      <DialogContent sx={{ p: 0, overflow: 'visible' }}>
        <Box sx={{ position: 'relative' }}>
          {/* Close & Download buttons */}
          <Stack direction="row" spacing={1} sx={{ position: 'absolute', top: -48, right: 0, zIndex: 10 }}>
            <Button
              variant="contained"
              startIcon={<PdfIcon />}
              onClick={() => downloadCertificatePDF(cert, fullName)}
              sx={{
                bgcolor: '#C9A227', color: '#0A1628', fontWeight: 800, borderRadius: 2,
                textTransform: 'none', fontSize: 13,
                '&:hover': { bgcolor: '#b8911e' },
                boxShadow: '0 4px 14px rgba(201,162,39,0.5)',
              }}>
              Baixar PDF
            </Button>
            <IconButton onClick={onClose}
              sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' } }}>
              <CloseIcon />
            </IconButton>
          </Stack>

          {/* Certificate preview */}
          <Box sx={{
            bgcolor: 'white',
            width: '100%',
            aspectRatio: '210 / 297',
            position: 'relative',
            overflow: 'hidden',
            fontFamily: '"Georgia", "Times New Roman", serif',
            /* Double gold border */
            outline: '3px solid #C9A227',
            outlineOffset: '-8px',
            boxShadow: 'inset 0 0 0 11px white, inset 0 0 0 12px #C9A227',
          }}>

            {/* Watermark */}
            <Box sx={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%,-50%) rotate(-35deg)',
              fontSize: { xs: '3.5vw', md: '2.2vw' },
              fontWeight: 900, color: 'rgba(10,22,40,0.04)',
              whiteSpace: 'nowrap', letterSpacing: 6, pointerEvents: 'none',
              fontFamily: '"Georgia", serif',
            }}>
              SAE ACADÉMICO
            </Box>

            {/* Corner ornament top-left */}
            {['tl','tr','bl','br'].map(pos => (
              <Box key={pos} sx={{
                position: 'absolute',
                top: pos.startsWith('t') ? '2%' : 'auto',
                bottom: pos.startsWith('b') ? '2%' : 'auto',
                left: pos.endsWith('l') ? '1.5%' : 'auto',
                right: pos.endsWith('r') ? '1.5%' : 'auto',
                width: '6%', height: '6%',
                borderTop: pos.startsWith('t') ? '2px solid #C9A227' : 'none',
                borderBottom: pos.startsWith('b') ? '2px solid #C9A227' : 'none',
                borderLeft: pos.endsWith('l') ? '2px solid #C9A227' : 'none',
                borderRight: pos.endsWith('r') ? '2px solid #C9A227' : 'none',
              }} />
            ))}

            {/* Content */}
            <Stack sx={{ height: '100%', px: '6%', pb: '3%' }} alignItems="center">

              {/* Header band */}
              <Box sx={{
                width: '112%', mx: '-6%',
                bgcolor: '#0A1628', py: '2.5%',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5%',
              }}>
                <Typography sx={{
                  fontSize: { xs: '1.4vw', md: '0.9vw' },
                  fontFamily: '"Lato", sans-serif', fontWeight: 700,
                  letterSpacing: 4, color: '#C9A227', textTransform: 'uppercase',
                }}>
                  SAE — Sistema Académico de Excelência
                </Typography>
                <Typography sx={{
                  fontSize: { xs: '1vw', md: '0.65vw' },
                  color: 'rgba(255,255,255,0.5)', letterSpacing: 2, textTransform: 'uppercase',
                }}>
                  Plataforma de Apoio ao Ensino · Angola
                </Typography>
              </Box>

              {/* Gold divider */}
              <Box sx={{ width: '100%', height: 2, background: 'linear-gradient(90deg,transparent,#C9A227 20%,#f5d97e 50%,#C9A227 80%,transparent)', my: '1.5%' }} />

              {/* Seal row */}
              <Stack direction="row" alignItems="center" sx={{ width: '90%', my: '0.5%' }}>
                <Box sx={{ flex: 1, height: 1, background: 'linear-gradient(90deg,transparent,#C9A22750)' }} />
                <Box sx={{
                  width: { xs: '8vw', md: '5.5vw' }, height: { xs: '8vw', md: '5.5vw' },
                  borderRadius: '50%', border: '2px solid #C9A227',
                  background: 'radial-gradient(circle,#0A1628,#1a2e50)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  mx: 2,
                }}>
                  <Typography sx={{ color: '#C9A227', fontSize: { xs: '2.5vw', md: '1.6vw' }, lineHeight: 1 }}>★</Typography>
                  <Typography sx={{ color: '#C9A227', fontSize: { xs: '0.8vw', md: '0.5vw' }, letterSpacing: 1, fontWeight: 700, lineHeight: 1.2 }}>SAE</Typography>
                </Box>
                <Box sx={{ flex: 1, height: 1, background: 'linear-gradient(90deg,#C9A22750,transparent)' }} />
              </Stack>

              {/* Doc type */}
              <Typography sx={{
                fontSize: { xs: '1vw', md: '0.65vw' },
                letterSpacing: 5, color: '#999', textTransform: 'uppercase',
                fontFamily: '"Lato", sans-serif', mt: '0.5%',
              }}>
                Documento de Reconhecimento Oficial
              </Typography>

              {/* Main title */}
              <Typography sx={{
                fontSize: { xs: '3.5vw', md: '2.2vw' },
                fontFamily: '"Georgia", "Playfair Display", serif', fontWeight: 700,
                color: '#0A1628', textAlign: 'center', lineHeight: 1.2, mt: '0.5%',
              }}>
                Certificado de<br />Excelência Académica
              </Typography>

              {/* Thin divider */}
              <Box sx={{ width: '50%', height: 1, background: 'linear-gradient(90deg,transparent,#C9A227,transparent)', my: '1%' }} />

              {/* Body intro */}
              <Typography sx={{ fontSize: { xs: '1.2vw', md: '0.78vw' }, color: '#555', textAlign: 'center', lineHeight: 1.8 }}>
                A Plataforma <strong>SAE</strong> certifica que o/a docente
              </Typography>

              {/* Name */}
              <Box sx={{ textAlign: 'center', my: '1%' }}>
                <Typography sx={{ fontSize: { xs: '0.9vw', md: '0.58vw' }, color: '#999', letterSpacing: 3, textTransform: 'uppercase', mb: '0.5%' }}>
                  Professor(a)
                </Typography>
                <Typography sx={{
                  fontSize: { xs: '4vw', md: '2.6vw' },
                  fontFamily: '"Georgia", serif', fontWeight: 600,
                  color: '#0A1628', letterSpacing: 0.5,
                }}>
                  {fullName}
                </Typography>
              </Box>

              {/* Thin divider */}
              <Box sx={{ width: '50%', height: 1, background: 'linear-gradient(90deg,transparent,#C9A227,transparent)', mb: '1%' }} />

              {/* Body text */}
              <Typography sx={{ fontSize: { xs: '1.1vw', md: '0.72vw' }, color: '#555', textAlign: 'center', lineHeight: 1.8, maxWidth: '85%' }}>
                demonstrou desempenho excepcional no apoio académico, respondendo com dedicação e qualidade
                às questões na área de <strong>{discipline}</strong>, cumprindo todos os critérios de excelência.
              </Typography>

              {/* Stats */}
              <Stack direction="row" spacing={1.5} sx={{ my: '2%' }}>
                {[
                  { val: `${percent}%`, lbl: 'Taxa de Apoio' },
                  { val: String(cert.totalAnswered), lbl: 'Respostas Dadas' },
                  { val: discipline, lbl: 'Área Curricular', small: true },
                ].map(s => (
                  <Box key={s.lbl} sx={{
                    bgcolor: '#F8F9FC', border: '1px solid #e0e4ef',
                    borderTop: '3px solid #C9A227', px: '1.5vw', py: '0.8vw',
                    textAlign: 'center', minWidth: { xs: '15vw', md: '10vw' },
                  }}>
                    <Typography sx={{
                      fontSize: s.small ? { xs: '1.4vw', md: '0.9vw' } : { xs: '2.4vw', md: '1.5vw' },
                      fontFamily: '"Georgia", serif', fontWeight: 700, color: '#0A1628', lineHeight: 1,
                    }}>
                      {s.val}
                    </Typography>
                    <Typography sx={{ fontSize: { xs: '0.8vw', md: '0.52vw' }, color: '#999', textTransform: 'uppercase', letterSpacing: 1, mt: '0.4vw' }}>
                      {s.lbl}
                    </Typography>
                  </Box>
                ))}
              </Stack>

              {/* Gold divider before footer */}
              <Box sx={{ width: '100%', height: 2, background: 'linear-gradient(90deg,transparent,#C9A227 20%,#f5d97e 50%,#C9A227 80%,transparent)', mt: 'auto', mb: '1.5%' }} />

              {/* Footer */}
              <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ width: '100%' }}>
                {/* Signature left */}
                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{ borderBottom: '1px solid #0A1628', mb: '1%', width: { xs: '18vw', md: '12vw' } }} />
                  <Typography sx={{ fontSize: { xs: '0.9vw', md: '0.58vw' }, fontWeight: 700, color: '#0A1628' }}>Direcção Académica</Typography>
                  <Typography sx={{ fontSize: { xs: '0.8vw', md: '0.5vw' }, color: '#999', textTransform: 'uppercase', letterSpacing: 1 }}>SAE — Plataforma Educativa</Typography>
                </Box>

                {/* Date center */}
                <Box sx={{ textAlign: 'center' }}>
                  <Typography sx={{ fontSize: { xs: '0.8vw', md: '0.5vw' }, color: '#999', textTransform: 'uppercase', letterSpacing: 2, mb: '1%' }}>Emitido em</Typography>
                  <Typography sx={{ fontSize: { xs: '1.2vw', md: '0.78vw' }, fontFamily: '"Georgia", serif', fontWeight: 600, color: '#0A1628' }}>
                    {issuedDate}
                  </Typography>
                  <Typography sx={{ fontSize: { xs: '0.8vw', md: '0.5vw' }, color: '#ccc', letterSpacing: 2, mt: '1%' }}>
                    {serial}
                  </Typography>
                </Box>

                {/* Signature right */}
                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{ borderBottom: '1px solid #0A1628', mb: '1%', width: { xs: '18vw', md: '12vw' } }} />
                  <Typography sx={{ fontSize: { xs: '0.9vw', md: '0.58vw' }, fontWeight: 700, color: '#0A1628' }}>Coordenação de Qualidade</Typography>
                  <Typography sx={{ fontSize: { xs: '0.8vw', md: '0.5vw' }, color: '#999', textTransform: 'uppercase', letterSpacing: 1 }}>Ensino e Avaliação</Typography>
                </Box>
              </Stack>

            </Stack>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ProfessorCertificatesPage() {
  const { user } = useAuth();
  const fullName = user?.fullName ?? user?.username ?? 'Professor(a)';

  const [certs, setCerts] = useState<ProfessorCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [publishing, setPublishing] = useState<number | null>(null);
  const [previewCert, setPreviewCert] = useState<ProfessorCertificate | null>(null);

  useEffect(() => {
    forumService.getMyCertificates()
      .then(setCerts)
      .catch(() => setError('Não foi possível carregar os certificados.'))
      .finally(() => setLoading(false));
  }, []);

  const handleTogglePublish = async (cert: ProfessorCertificate) => {
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

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} color="#0A1628">Os Meus Certificados</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Emitidos automaticamente ao atingir 70% de taxa de apoio com mínimo de 5 respostas
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#00A651' }} />
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
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 2 }}>
          {certs.map(cert => (
            <Card key={cert.id} variant="outlined" sx={{
              borderRadius: 3,
              border: `1px solid ${cert.isPublic ? 'rgba(201,162,39,0.45)' : '#E2E8F0'}`,
              transition: 'box-shadow 0.2s, transform 0.15s',
              cursor: 'pointer',
              '&:hover': {
                boxShadow: '0 6px 24px rgba(10,22,40,0.12)',
                transform: 'translateY(-2px)',
              },
            }}
              onClick={() => setPreviewCert(cert)}
            >
              <CardContent sx={{ p: 2.5 }}>
                {/* Top row: icon + badge */}
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                  <Box sx={{ p: 1, bgcolor: '#FBF5E0', borderRadius: 2, display: 'flex', border: '1px solid rgba(201,162,39,0.3)' }}>
                    <CertIcon sx={{ color: '#C9A227', fontSize: 22 }} />
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
                        '&:hover': { bgcolor: 'rgba(10,22,40,0.09)', color: '#0A1628' },
                        transition: 'all 0.15s',
                      }}>
                        <PreviewIcon sx={{ fontSize: 16 }} />
                      </Box>
                    </Tooltip>
                  </Stack>
                </Stack>

                {/* Discipline */}
                <Typography variant="subtitle1" fontWeight={700} color="#0A1628" sx={{ mb: 0.5 }}>
                  {discLabel(cert.discipline)}
                </Typography>

                {/* Stats row */}
                <Stack direction="row" gap={1.5} mb={1.5} flexWrap="wrap">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <StatsIcon sx={{ fontSize: 15, color: cert.assistancePercentage >= 80 ? '#00A651' : '#D97706' }} />
                    <Typography variant="body2" fontWeight={700}
                      sx={{ color: cert.assistancePercentage >= 80 ? '#00A651' : '#D97706' }}>
                      {cert.assistancePercentage.toFixed(1)}% apoio
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {cert.totalAnswered} respostas
                  </Typography>
                </Stack>

                {/* Issue date */}
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                  Emitido em {formatDate(cert.issuedAt)}
                </Typography>

                {/* Toggle */}
                <Box onClick={e => e.stopPropagation()}>
                  <Tooltip title={cert.isPublic ? 'Tornar privado' : 'Publicar no perfil público'}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={cert.isPublic}
                          onChange={() => handleTogglePublish(cert)}
                          disabled={publishing === cert.id}
                          size="small"
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#C9A227' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#C9A227' },
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
                  </Tooltip>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {certs.length > 0 && (
        <Box sx={{ mt: 3, p: 2, bgcolor: '#FFFBEB', borderRadius: 2, border: '1px solid rgba(201,162,39,0.25)' }}>
          <Typography variant="body2" color="#92400E" fontWeight={600}>
            Clique num certificado para o pré-visualizar e transferir em PDF. Certificados públicos ficam visíveis no perfil da plataforma.
          </Typography>
        </Box>
      )}

      {/* Certificate preview modal */}
      {previewCert && (
        <CertPreviewModal
          cert={previewCert}
          fullName={fullName}
          open={!!previewCert}
          onClose={() => setPreviewCert(null)}
        />
      )}
    </Box>
  );
}
