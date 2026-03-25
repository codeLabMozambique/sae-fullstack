import Grid from '@mui/material/Grid';
import { Card, CardContent, CardMedia, Typography, Button, TextField, InputAdornment, Box } from '@mui/material';
import { Search as SearchIcon, Download as DownloadIcon } from '@mui/icons-material';

const books = [
  { id: 1, title: 'Introdução à Programação', author: 'João Silva', image: 'https://placehold.co/200x300/1976d2/white?text=Programacao' },
  { id: 2, title: 'Cálculo Diferencial I', author: 'Ana Costa', image: 'https://placehold.co/200x300/1565c0/white?text=Calculo' },
  { id: 3, title: 'Sistemas Distribuídos', author: 'Pedro Santos', image: 'https://placehold.co/200x300/42a5f5/white?text=Sistemas' },
  { id: 4, title: 'Inteligência Artificial', author: 'Maria Luz', image: 'https://placehold.co/200x300/1976d2/white?text=IA' },
];

const Biblioteca: React.FC = () => {
  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
          Biblioteca Digital 📚
        </Typography>
        <TextField
          size="small"
          placeholder="Pesquisar livros..."
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ width: { xs: '100%', sm: 300 }, bgcolor: 'white' }}
        />
      </Box>

      <Grid container spacing={3}>
        {books.map((book) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={book.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia
                component="img"
                height="200"
                image={book.image}
                alt={book.title}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h6" component="div" sx={{ fontWeight: 600 }}>
                  {book.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {book.author}
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Button size="small" variant="outlined" startIcon={<DownloadIcon />}>
                    Download
                  </Button>
                  <Button size="small" variant="contained">
                    Ler Agora
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Biblioteca;
