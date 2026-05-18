import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, CircularProgress, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Chip,
} from '@mui/material';
import {
  Verified as CertIcon,
  EmojiEvents as TrophyIcon,
  Print as PrintIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { quizService } from '../../services/quizService';
import { useAuth } from '../../context/AuthContext';
import type { Certificate } from '../../types/quiz';

export default function StudentCertificatesPage() {
  const { user } = useAuth();
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Certificate | null>(null);

  useEffect(() => {
    quizService.getMyCertificates()
      .then(setCerts)
      .catch(() => setError('Não foi possível carregar os certificados.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Box sx={{ p: 1.2, bgcolor: '#E8F5E9', borderRadius: 2 }}>
          <CertIcon sx={{ color: '#00A651', fontSize: 28 }} />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={800} color="#0A1628">Os Meus Certificados</Typography>
          <Typography variant="body2" color="text.secondary">
            Certificados ganhos ao atingir 80% ou mais nos quizzes
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#00A651' }} />
        </Box>
      ) : certs.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <CertIcon sx={{ fontSize: 72, color: '#A5D6A7', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" fontWeight={600}>
            Ainda sem certificados
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Obtém 80% ou mais num quiz para ganhar o teu primeiro certificado.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 2 }}>
          {certs.map(cert => (
            <Card key={cert.id} elevation={0} sx={{
              border: '2px solid #86EFAC', borderRadius: 3, cursor: 'pointer',
              transition: 'box-shadow 0.2s',
              '&:hover': { boxShadow: '0 4px 20px rgba(0,166,81,0.18)' },
            }} onClick={() => setSelected(cert)}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
                  <CertIcon sx={{ color: '#00A651', fontSize: 32 }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5,
                    px: 1.5, py: 0.5, bgcolor: '#00A651', borderRadius: 4 }}>
                    <TrophyIcon sx={{ color: '#fff', fontSize: 14 }} />
                    <Typography fontWeight={800} color="#fff" fontSize="0.85rem">
                      {cert.score}%
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="subtitle1" fontWeight={700} color="#0A1628" sx={{ mb: 0.5 }}>
                  {cert.quizTitulo}
                </Typography>
                <Chip label={cert.disciplinaLabel} size="small"
                  sx={{ bgcolor: '#E8F5E9', color: '#00A651', fontWeight: 600, fontSize: '0.7rem', mb: 1.5 }} />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Emitido em {new Date(cert.issuedAt).toLocaleDateString('pt-PT', {
                    day: '2-digit', month: 'long', year: 'numeric',
                  })}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Certificate viewer */}
      {selected && (
        <Dialog open onClose={() => setSelected(null)} maxWidth="sm" fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 0 }}>
            <Typography fontWeight={800} color="#0A1628">Certificado de Desempenho</Typography>
            <IconButton size="small" onClick={() => setSelected(null)}><CloseIcon fontSize="small" /></IconButton>
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Box sx={{
              border: '4px solid #00A651', borderRadius: 3, p: 4, textAlign: 'center',
              background: 'linear-gradient(135deg, #f0fdf4 0%, #fff 60%, #f0f9ff 100%)',
              position: 'relative', overflow: 'hidden',
            }}>
              <Box sx={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80,
                background: 'linear-gradient(135deg, transparent 50%, rgba(0,166,81,0.12) 50%)' }} />
              <Box sx={{ position: 'absolute', bottom: 0, left: 0, width: 80, height: 80,
                background: 'linear-gradient(315deg, transparent 50%, rgba(0,166,81,0.12) 50%)' }} />

              <CertIcon sx={{ fontSize: 56, color: '#00A651', mb: 1 }} />
              <Typography variant="caption" sx={{ display: 'block', letterSpacing: 3,
                color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', mb: 1 }}>
                Sistema de Apoio ao Estudo — SAE
              </Typography>
              <Typography variant="h5" fontWeight={900} color="#0A1628" sx={{ mb: 0.5 }}>
                Certificado de Desempenho
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                Este certificado atesta que
              </Typography>
              <Typography variant="h6" fontWeight={800} color="#00A651"
                sx={{ mb: 2.5, fontSize: '1.4rem', fontStyle: 'italic' }}>
                {user?.fullName || 'Estudante'}
              </Typography>
              <Typography variant="body1" color="#374151" sx={{ mb: 0.5 }}>
                concluiu com êxito o quiz
              </Typography>
              <Typography variant="h6" fontWeight={700} color="#0A1628" sx={{ mb: 0.5 }}>
                {selected.quizTitulo}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                {selected.disciplinaLabel}
              </Typography>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1,
                px: 3, py: 1, bgcolor: '#00A651', borderRadius: 4, mb: 2.5 }}>
                <TrophyIcon sx={{ color: '#fff', fontSize: 20 }} />
                <Typography fontWeight={800} color="#fff" fontSize="1.1rem">
                  {selected.score}% de acerto
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ display: 'block', color: '#9CA3AF' }}>
                Emitido em {new Date(selected.issuedAt).toLocaleDateString('pt-PT', {
                  day: '2-digit', month: 'long', year: 'numeric',
                })}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', color: '#D1D5DB', mt: 0.5 }}>
                Certificado #{selected.id}
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setSelected(null)} sx={{ textTransform: 'none', color: '#6B7280' }}>
              Fechar
            </Button>
            <Button variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()}
              sx={{ bgcolor: '#00A651', '&:hover': { bgcolor: '#008f44' },
                textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
              Imprimir / Guardar PDF
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}
