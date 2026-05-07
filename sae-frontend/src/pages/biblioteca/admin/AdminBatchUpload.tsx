import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Alert, Stack,
  LinearProgress, List, ListItem, ListItemText, ListItemIcon, Chip,
} from '@mui/material';
import {
  CloudUpload as UploadIcon, PictureAsPdf as PdfIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import api from '../../../services/api';
import type { Content } from '../../../services/contentService';

const AdminBatchUpload: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Content[]>([]);

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files ? Array.from(e.target.files) : [];
    setFiles(list);
  };

  const handleUpload = async () => {
    if (files.length === 0) { setError('Escolhe pelo menos 1 ficheiro'); return; }
    setError(null); setResults([]);
    setLoading(true);
    try {
      const fd = new FormData();
      files.forEach(f => fd.append('files', f));
      const { data } = await api.post<Content[]>('/content/api/admin/contents/batch', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResults(data);
      setFiles([]);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Falha no upload em lote');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={1} color="#0A1628">
        Upload em Lote (Admin)
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Carrega múltiplos PDFs de uma só vez — cada um é processado individualmente
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {results.length > 0 && (
        <Alert severity="success" sx={{ mb: 2 }} icon={<CheckIcon />} onClose={() => setResults([])}>
          {results.length} conteúdos carregados com sucesso
        </Alert>
      )}

      <Card sx={{ borderRadius: 3, maxWidth: 720 }}>
        <CardContent>
          <Stack spacing={2}>
            <Button
              component="label" variant="outlined" startIcon={<UploadIcon />}
              sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
            >
              Escolher ficheiros PDF
              <input
                type="file" accept="application/pdf" multiple hidden
                onChange={handleFilesChange}
              />
            </Button>

            {files.length > 0 && (
              <List dense sx={{ bgcolor: '#F9FAFB', borderRadius: 2 }}>
                {files.map((f, idx) => (
                  <ListItem key={idx}>
                    <ListItemIcon><PdfIcon color="error" /></ListItemIcon>
                    <ListItemText
                      primary={f.name}
                      secondary={`${(f.size / 1024).toFixed(0)} KB`}
                    />
                  </ListItem>
                ))}
              </List>
            )}

            {loading && <LinearProgress />}

            <Button
              variant="contained" size="large" disabled={loading || files.length === 0}
              onClick={handleUpload} startIcon={<UploadIcon />}
              sx={{ bgcolor: '#001B33', textTransform: 'none', '&:hover': { bgcolor: '#002B50' } }}
            >
              {loading ? 'A carregar…' : `Carregar ${files.length} ficheiros`}
            </Button>

            {results.length > 0 && (
              <Box>
                <Typography variant="subtitle2" fontWeight={700} mt={2} mb={1}>Resultados</Typography>
                <List dense>
                  {results.map(r => (
                    <ListItem key={r.id}>
                      <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                      <ListItemText
                        primary={r.title}
                        secondary={`${r.totalPages ?? 0} páginas`}
                      />
                      <Chip size="small" label={r.id.substring(0, 8)} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AdminBatchUpload;
