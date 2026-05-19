import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, CircularProgress, Alert,
  Chip, Switch, FormControlLabel, Tooltip,
} from '@mui/material';
import {
  Verified as CertIcon,
  Public as PublicIcon,
  Lock as PrivateIcon,
  BarChart as StatsIcon,
} from '@mui/icons-material';
import { forumService } from '../../services/forumService';
import type { ProfessorCertificate } from '../../types/forum';

export default function ProfessorCertificatesPage() {
  const [certs, setCerts] = useState<ProfessorCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [publishing, setPublishing] = useState<number | null>(null);

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
      setError('Não foi possível atualizar o certificado.');
    } finally {
      setPublishing(null);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Box sx={{ p: 1.2, bgcolor: '#EDE9FE', borderRadius: 2 }}>
          <CertIcon sx={{ color: '#7C3AED', fontSize: 28 }} />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={800} color="#0A1628">
            Os Meus Certificados de Apoio
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Emitidos automaticamente ao atingir 70% de taxa de apoio com mínimo de 5 respostas
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#7C3AED' }} />
        </Box>
      ) : certs.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <CertIcon sx={{ fontSize: 72, color: '#DDD6FE', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" fontWeight={600}>
            Ainda sem certificados
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Responda a pelo menos 5 perguntas e mantenha 70% de taxa de apoio para ganhar um certificado.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 2 }}>
          {certs.map(cert => (
            <Card key={cert.id} elevation={0} sx={{
              border: `2px solid ${cert.isPublic ? '#C4B5FD' : '#E5E7EB'}`,
              borderRadius: 3,
              transition: 'box-shadow 0.2s',
              '&:hover': { boxShadow: '0 4px 20px rgba(124,58,237,0.12)' },
            }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                  <CertIcon sx={{ color: '#7C3AED', fontSize: 32 }} />
                  {cert.isPublic
                    ? <Chip icon={<PublicIcon />} label="Público" size="small"
                        sx={{ bgcolor: '#EDE9FE', color: '#7C3AED', fontWeight: 700, fontSize: '0.7rem' }} />
                    : <Chip icon={<PrivateIcon />} label="Privado" size="small"
                        sx={{ bgcolor: '#F3F4F6', color: '#6B7280', fontWeight: 700, fontSize: '0.7rem' }} />
                  }
                </Box>

                <Typography variant="subtitle1" fontWeight={700} color="#0A1628" sx={{ mb: 0.5 }}>
                  {cert.discipline}
                </Typography>

                <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5, flexWrap: 'wrap' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <StatsIcon sx={{ fontSize: 16, color: '#7C3AED' }} />
                    <Typography variant="body2" fontWeight={700} color="#7C3AED">
                      {cert.assistancePercentage.toFixed(1)}% apoio
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {cert.totalAnswered} respostas
                  </Typography>
                </Box>

                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                  Emitido em {formatDate(cert.issuedAt)}
                </Typography>

                <Tooltip title={cert.isPublic ? 'Tornar privado' : 'Publicar no perfil público'}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={cert.isPublic}
                        onChange={() => handleTogglePublish(cert)}
                        disabled={publishing === cert.id}
                        size="small"
                        sx={{ '& .MuiSwitch-thumb': { bgcolor: cert.isPublic ? '#7C3AED' : '#9CA3AF' } }}
                      />
                    }
                    label={
                      <Typography variant="caption" fontWeight={600} color="text.secondary">
                        {publishing === cert.id ? 'A actualizar...' : 'Visível publicamente'}
                      </Typography>
                    }
                    sx={{ m: 0 }}
                  />
                </Tooltip>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {certs.length > 0 && (
        <Box sx={{ mt: 3, p: 2, bgcolor: '#F5F3FF', borderRadius: 2 }}>
          <Typography variant="body2" color="#7C3AED" fontWeight={600}>
            Certificados públicos são visíveis no perfil da plataforma e podem ser consultados por estudantes e administradores.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
