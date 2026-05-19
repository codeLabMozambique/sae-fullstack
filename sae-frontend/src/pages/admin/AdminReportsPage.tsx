import { useState } from 'react';
import {
  Box, Typography, Card, CardContent, Button, CircularProgress, Alert,
  TextField, MenuItem, Divider, Chip,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Assessment as ReportIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { forumService } from '../../services/forumService';
import type { AttendanceReport } from '../../types/forum';

const DISCIPLINES = [
  'MATEMATICA', 'FISICA', 'QUIMICA', 'BIOLOGIA', 'PORTUGUES',
  'HISTORIA', 'GEOGRAFIA', 'INGLES', 'FILOSOFIA', 'INFORMATICA', 'GERAL',
];

const DISCIPLINE_LABELS: Record<string, string> = {
  MATEMATICA: 'Matemática', FISICA: 'Física', QUIMICA: 'Química', BIOLOGIA: 'Biologia',
  PORTUGUES: 'Português', HISTORIA: 'História', GEOGRAFIA: 'Geografia',
  INGLES: 'Inglês', FILOSOFIA: 'Filosofia', INFORMATICA: 'Informática', GERAL: 'Geral',
};

function toISODate(d: string) {
  return d ? new Date(d).toISOString().slice(0, 10) : '';
}

function fmtDate(dateStr: string) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

function fmtTime(minutes: number | null) {
  if (minutes == null) return '—';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  return `${Math.floor(minutes / 60)}h ${Math.round(minutes % 60)}min`;
}

function pct(n: number, total: number) {
  return total > 0 ? `${Math.round((n / total) * 100)}%` : '0%';
}

// ── Professional PDF generator ────────────────────────────────────────────────

function generateAttendancePDF(report: AttendanceReport, from: string, to: string) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();   // 210
  const H = doc.internal.pageSize.getHeight();  // 297
  const M = 15;  // margin
  const CW = W - 2 * M; // content width

  // ── Header background ──────────────────────────────────────────────────────
  doc.setFillColor(10, 22, 40); // #0A1628
  doc.rect(0, 0, W, 36, 'F');

  // Left green square
  doc.setFillColor(0, 166, 81);
  doc.roundedRect(M, 10, 12, 12, 2, 2, 'F');
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('S', M + 3.5, 19.5);

  // "smart" white + "SAE" green
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('smart', M + 16, 19.5);
  doc.setTextColor(0, 200, 100);
  doc.text('SAE', M + 33.5, 19.5);

  // Tagline under logo
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(160, 175, 195);
  doc.text('Sistema de Apoio ao Estudante', M + 16, 26);

  // Ministry text — right side
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(200, 215, 230);
  doc.text('MINISTERIO DA EDUCACAO', W - M, 14, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(140, 160, 180);
  doc.text('REPUBLICA DE MOCAMBIQUE', W - M, 20, { align: 'right' });

  // Decorative right column
  doc.setFillColor(0, 166, 81);
  doc.rect(W - M, 0, M, 36, 'F');
  doc.setFillColor(10, 22, 40);
  doc.rect(W - M + 2, 0, M - 4, 36, 'F');

  // ── Green accent line ──────────────────────────────────────────────────────
  doc.setFillColor(0, 166, 81);
  doc.rect(0, 36, W, 2, 'F');

  // ── Report title ───────────────────────────────────────────────────────────
  let y = 49;
  doc.setFontSize(17);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(10, 22, 40);
  doc.text('RELATORIO DE ATENDIMENTO DO FORUM', M, y);

  y += 7;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text('Analise de perguntas e respostas por periodo, escola e disciplina', M, y);

  // ── Metadata box ───────────────────────────────────────────────────────────
  y += 7;
  doc.setFillColor(247, 248, 252);
  doc.rect(M, y, CW, 30, 'F');
  doc.setDrawColor(210, 220, 235);
  doc.setLineWidth(0.4);
  doc.rect(M, y, CW, 30, 'S');

  // Left accent bar inside metadata
  doc.setFillColor(0, 166, 81);
  doc.rect(M, y, 2.5, 30, 'F');

  const lx = M + 8;
  const vx = M + 48;
  const lx2 = M + CW / 2 + 5;
  const vx2 = M + CW / 2 + 35;

  doc.setFontSize(8.5);

  const metaRow = (label: string, value: string, startY: number, col2 = false) => {
    const lCol = col2 ? lx2 : lx;
    const vCol = col2 ? vx2 : vx;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(55, 65, 81);
    doc.text(label, lCol, startY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 40, 55);
    doc.text(value, vCol, startY);
  };

  metaRow('Periodo:', `${fmtDate(from)} a ${fmtDate(to)}`, y + 9);
  metaRow('Escola:', report.schoolName ?? 'Todas as escolas', y + 17);
  metaRow('Disciplina:', report.discipline ? (DISCIPLINE_LABELS[report.discipline] ?? report.discipline) : 'Todas', y + 17, true);
  const now = new Date();
  const geradoEm = `${now.toLocaleDateString('pt-PT')} as ${now.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}`;
  metaRow('Gerado em:', geradoEm, y + 25);

  // ── Section heading helper ─────────────────────────────────────────────────
  const sectionHeading = (title: string, startY: number) => {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(10, 22, 40);
    doc.text(title, M, startY);
    doc.setDrawColor(0, 166, 81);
    doc.setLineWidth(0.6);
    doc.line(M, startY + 1.5, M + title.length * 1.9, startY + 1.5);
    return startY + 6;
  };

  // ── Stats table ─────────────────────────────────────────────────────────────
  y += 38;
  y = sectionHeading('RESUMO ESTATISTICO', y);

  const total = report.totalQuestions;

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [['Indicador', 'Quantidade', 'Percentagem']],
    body: [
      ['Total de Perguntas', String(total), '100%'],
      ['Respondidas por Professor', String(report.answeredByProfessor), pct(report.answeredByProfessor, total)],
      ['Respondidas por IA (Inteligencia Artificial)', String(report.answeredByAI), pct(report.answeredByAI, total)],
      ['Respondidas por Estudante', String(report.answeredByStudent), pct(report.answeredByStudent, total)],
      ['Sem Resposta', String(report.unanswered), pct(report.unanswered, total)],
    ],
    headStyles: {
      fillColor: [10, 22, 40],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'left',
      cellPadding: 4,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [55, 65, 81],
      cellPadding: 3.5,
    },
    alternateRowStyles: {
      fillColor: [247, 249, 252],
    },
    columnStyles: {
      0: { halign: 'left' },
      1: { halign: 'center', fontStyle: 'bold', cellWidth: 32 },
      2: { halign: 'center', cellWidth: 32 },
    },
    didParseCell(data) {
      if (data.section !== 'body') return;
      const rowColors: [number, number, number][] = [
        [29, 78, 216],
        [124, 58, 237],
        [8, 145, 178],
        [22, 163, 74],
        [220, 38, 38],
      ];
      if (data.column.index === 1 && data.row.index < rowColors.length) {
        data.cell.styles.textColor = rowColors[data.row.index];
        data.cell.styles.fontSize = 10;
      }
      if (data.column.index === 2 && data.row.index < rowColors.length) {
        data.cell.styles.textColor = rowColors[data.row.index];
        data.cell.styles.fontStyle = 'bold';
      }
      // Highlight the unanswered row
      if (data.row.index === 4) {
        data.cell.styles.fillColor = [255, 242, 242];
      }
    },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // ── Avg response time box ──────────────────────────────────────────────────
  if (report.avgResponseTimeMinutes != null) {
    doc.setFillColor(239, 246, 255);
    doc.rect(M, y, CW, 12, 'F');
    doc.setDrawColor(147, 197, 253);
    doc.setLineWidth(0.3);
    doc.rect(M, y, CW, 12, 'S');
    doc.setFillColor(29, 78, 216);
    doc.rect(M, y, 3, 12, 'F');

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(29, 78, 216);
    doc.text('Tempo Medio de Resposta:', M + 7, y + 7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 40, 55);
    doc.text(fmtTime(report.avgResponseTimeMinutes), M + 70, y + 7.5);

    y += 18;
  }

  // ── Distribution bar ───────────────────────────────────────────────────────
  if (total > 0) {
    y = sectionHeading('DISTRIBUICAO DE RESPOSTAS', y);

    const barH = 11;
    const segments: { value: number; color: [number, number, number]; label: string }[] = [
      { value: report.answeredByProfessor, color: [124, 58, 237], label: 'Professor' },
      { value: report.answeredByAI, color: [8, 145, 178], label: 'IA' },
      { value: report.answeredByStudent, color: [22, 163, 74], label: 'Estudante' },
      { value: report.unanswered, color: [220, 38, 38], label: 'Sem Resposta' },
    ];

    // Background track
    doc.setFillColor(229, 231, 235);
    doc.roundedRect(M, y, CW, barH, 2, 2, 'F');

    let xOff = M;
    for (const seg of segments) {
      const segW = (seg.value / total) * CW;
      if (segW > 0.5) {
        doc.setFillColor(...seg.color);
        doc.rect(xOff, y, segW, barH, 'F');
        xOff += segW;
      }
    }
    // Round right edge overlay
    doc.setFillColor(229, 231, 235);
    doc.roundedRect(M + CW - 3, y, 3, barH, 2, 2, 'F');
    // Restore last segment colour
    if (segments[3].value > 0) {
      doc.setFillColor(...segments[3].color);
      doc.rect(M + CW - 5, y, 5, barH, 'F');
    } else if (segments[2].value > 0) {
      doc.setFillColor(...segments[2].color);
      doc.rect(M + CW - 5, y, 5, barH, 'F');
    }

    y += barH + 5;

    // Legend
    let lx3 = M;
    for (const seg of segments) {
      doc.setFillColor(...seg.color);
      doc.roundedRect(lx3, y, 5, 4, 1, 1, 'F');
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(75, 85, 99);
      doc.text(`${seg.label} (${pct(seg.value, total)})`, lx3 + 7, y + 3.5);
      lx3 += 48;
    }

    y += 14;
  }

  // ── Observation note ──────────────────────────────────────────────────────
  if (y < H - 50) {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(156, 163, 175);
    doc.text(
      'Este relatorio foi gerado automaticamente pelo sistema smartSAE. Os dados reflectem o periodo e filtros seleccionados.',
      M, y, { maxWidth: CW }
    );
  }

  // ── Footer ─────────────────────────────────────────────────────────────────
  const footerY = H - 14;

  // Footer background strip
  doc.setFillColor(10, 22, 40);
  doc.rect(0, footerY, W, 14, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('smart', M, H - 6);
  doc.setTextColor(0, 200, 100);
  doc.text('SAE', M + 9.5, H - 6);
  doc.setTextColor(140, 160, 180);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(
    `© ${now.getFullYear()} — Ministerio da Educacao, Republica de Mocambique`,
    M + 18, H - 6
  );
  doc.setTextColor(160, 175, 195);
  doc.text('Pagina 1 de 1', W - M, H - 6, { align: 'right' });

  // Right green corner
  doc.setFillColor(0, 166, 81);
  doc.rect(W - M, H - 14, M, 14, 'F');

  doc.save(`relatorio_atendimento_${from}_${to}.pdf`);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdminReportsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);

  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);
  const [schoolId, setSchoolId] = useState('');
  const [discipline, setDiscipline] = useState('');

  const [report, setReport] = useState<AttendanceReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [error, setError] = useState('');

  const buildParams = () => ({
    from,
    to,
    ...(schoolId   ? { schoolId: Number(schoolId) } : {}),
    ...(discipline ? { discipline } : {}),
  });

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setReport(null);
    try {
      const data = await forumService.getAttendanceReport(buildParams());
      setReport(data);
    } catch {
      setError('Não foi possível gerar o relatório. Verifique os filtros e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    if (format === 'pdf') {
      if (!report) return;
      generateAttendancePDF(report, from, to);
      return;
    }

    setExporting(format);
    try {
      const blob = await forumService.exportAttendanceReport({ ...buildParams(), format });
      const ext  = format === 'excel' ? 'xlsx' : 'csv';
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `relatorio_atendimento_${from}_${to}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Exportação falhou. Tente novamente.');
    } finally {
      setExporting(null);
    }
  };

  const statPct = (n: number, total: number) =>
    total > 0 ? `${Math.round((n / total) * 100)}%` : '0%';

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Box sx={{ p: 1.2, bgcolor: '#FEF3C7', borderRadius: 2 }}>
          <ReportIcon sx={{ color: '#D97706', fontSize: 28 }} />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={800} color="#0A1628">Relatórios de Atendimento</Typography>
          <Typography variant="body2" color="text.secondary">
            Análise de perguntas do fórum por período, escola e disciplina
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* ── Filtros ── */}
      <Card elevation={0} sx={{ border: '1px solid #F3F4F6', borderRadius: 3, mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <FilterIcon sx={{ color: '#6B7280', fontSize: 18 }} />
            <Typography variant="subtitle2" fontWeight={700} color="#374151">Filtros</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                label="De" type="date" fullWidth size="small"
                value={from} onChange={e => setFrom(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                label="Até" type="date" fullWidth size="small"
                value={to} onChange={e => setTo(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                label="ID da Escola" fullWidth size="small" type="number"
                value={schoolId} onChange={e => setSchoolId(e.target.value)}
                placeholder="Deixar vazio para todas"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                label="Disciplina" fullWidth size="small" select
                value={discipline} onChange={e => setDiscipline(e.target.value)}
              >
                <MenuItem value="">Todas as disciplinas</MenuItem>
                {DISCIPLINES.map(d => (
                  <MenuItem key={d} value={d}>{DISCIPLINE_LABELS[d] ?? d}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', gap: 1.5, mt: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              onClick={handleGenerate}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <ReportIcon />}
              sx={{ bgcolor: '#D97706', '&:hover': { bgcolor: '#B45309' }, textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
            >
              {loading ? 'A gerar...' : 'Gerar Relatório'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* ── Resultado ── */}
      {report && (
        <>
          <Card elevation={0} sx={{ border: '1px solid #F3F4F6', borderRadius: 3, mb: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                <Box>
                  <Typography variant="h6" fontWeight={700} color="#0A1628">Relatório de Atendimento</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {toISODate(report.from)} → {toISODate(report.to)}
                    {report.schoolName ? ` · ${report.schoolName}` : ''}
                    {report.discipline ? ` · ${DISCIPLINE_LABELS[report.discipline] ?? report.discipline}` : ''}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {(['csv', 'excel', 'pdf'] as const).map(fmt => (
                    <Button
                      key={fmt}
                      size="small"
                      variant="outlined"
                      startIcon={exporting === fmt ? <CircularProgress size={14} /> : <DownloadIcon />}
                      disabled={!!exporting}
                      onClick={() => handleExport(fmt)}
                      sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, borderColor: '#D1D5DB', color: '#374151' }}
                    >
                      {fmt.toUpperCase()}
                    </Button>
                  ))}
                </Box>
              </Box>

              <Divider sx={{ mb: 2 }} />

              {/* Stats grid */}
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' },
                gap: 2,
              }}>
                {[
                  { label: 'Total Perguntas', value: report.totalQuestions, color: '#1D4ED8', bg: '#EFF6FF' },
                  { label: 'Por Professor', value: report.answeredByProfessor, sub: statPct(report.answeredByProfessor, report.totalQuestions), color: '#7C3AED', bg: '#EDE9FE' },
                  { label: 'Por IA', value: report.answeredByAI, sub: statPct(report.answeredByAI, report.totalQuestions), color: '#0891B2', bg: '#F0F9FF' },
                  { label: 'Por Estudante', value: report.answeredByStudent, sub: statPct(report.answeredByStudent, report.totalQuestions), color: '#16A34A', bg: '#DCFCE7' },
                  { label: 'Sem Resposta', value: report.unanswered, sub: statPct(report.unanswered, report.totalQuestions), color: '#DC2626', bg: '#FEF2F2' },
                ].map(({ label, value, sub, color, bg }) => (
                  <Box key={label} sx={{ p: 2, bgcolor: bg, borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight={800} color={color}>{value}</Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}
                      sx={{ display: 'block', mt: 0.25, lineHeight: 1.2 }}>
                      {label}
                    </Typography>
                    {sub && (
                      <Chip label={sub} size="small" sx={{ mt: 0.5, bgcolor: color + '22', color, fontWeight: 700, fontSize: '0.65rem', height: 18 }} />
                    )}
                  </Box>
                ))}
              </Box>

              {report.avgResponseTimeMinutes != null && (
                <Box sx={{ mt: 2, p: 1.5, bgcolor: '#F9FAFB', borderRadius: 2, display: 'inline-flex', gap: 1, alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Tempo médio de resposta:</Typography>
                  <Typography variant="body2" fontWeight={700} color="#374151">
                    {fmtTime(report.avgResponseTimeMinutes)}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
}
