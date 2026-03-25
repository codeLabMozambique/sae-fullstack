import React, { useState } from 'react';
import { Box, TextField, IconButton, Typography, Paper, Avatar, List, ListItem, Chip } from '@mui/material';
import { Send as SendIcon, SmartToy as BotIcon, Person as UserIcon } from '@mui/icons-material';

const ChatIA: React.FC = () => {
  const [messages, setMessages] = useState([
    { text: 'Olá! Sou o assistente de IA do SAE. Em que posso ajudar hoje?', isBot: true },
    { text: 'Como posso organizar meu cronograma para as provas de Cálculo?', isBot: false },
    { text: 'Baseado no seu progresso, recomendo focar em Derivadas e Integrais por Substituição. Quer que eu crie um plano de 3 dias?', isBot: true },
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { text: input, isBot: false }]);
    setInput('');
    // Mock bot response
    setTimeout(() => {
      setMessages(prev => [...prev, { text: 'Estou processando sua solicitação... (Simulação de integração com sae-ai-service)', isBot: true }]);
    }, 1000);
  };

  return (
    <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 700, color: 'primary.main' }}>
        Chat com IA 🤖
      </Typography>
      
      <Paper sx={{ flexGrow: 1, mb: 2, p: 2, display: 'flex', flexDirection: 'column', overflowY: 'auto', bgcolor: 'white' }}>
        <List>
          {messages.map((msg, index) => (
            <ListItem 
              key={index} 
              sx={{ 
                flexDirection: msg.isBot ? 'row' : 'row-reverse',
                alignItems: 'flex-start',
                gap: 2,
                mb: 2
              }}
            >
              <Avatar sx={{ bgcolor: msg.isBot ? 'primary.main' : 'secondary.main' }}>
                {msg.isBot ? <BotIcon /> : <UserIcon />}
              </Avatar>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 2, 
                  bgcolor: msg.isBot ? '#f0f4f8' : 'primary.main',
                  color: msg.isBot ? 'text.primary' : 'white',
                  borderRadius: msg.isBot ? '0 12px 12px 12px' : '12px 0 12px 12px',
                  maxWidth: '70%'
                }}
              >
                <Typography variant="body1">{msg.text}</Typography>
              </Paper>
            </ListItem>
          ))}
        </List>
      </Paper>

      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          placeholder="Digite sua dúvida ou peça ajuda com os estudos..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          sx={{ bgcolor: 'white' }}
        />
        <IconButton color="primary" onClick={handleSend} sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}>
          <SendIcon />
        </IconButton>
      </Box>
      <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Chip label="Resumir capítulo" onClick={() => setInput('Resuma o capítulo 3 de Programação')} clickable size="small" variant="outlined" />
        <Chip label="Gerar Quiz" onClick={() => setInput('Gere um quiz sobre Cálculo I')} clickable size="small" variant="outlined" />
        <Chip label="Dúvida Técnica" onClick={() => setInput('O que são micro-serviços?')} clickable size="small" variant="outlined" />
      </Box>
    </Box>
  );
};

export default ChatIA;
