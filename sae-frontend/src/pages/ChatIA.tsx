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
                className="animate-fade-in"
                sx={{ 
                  p: 2.5, 
                  bgcolor: msg.isBot ? '#f4f6f8' : 'primary.main',
                  color: msg.isBot ? 'text.primary' : 'white',
                  borderRadius: msg.isBot ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
                  maxWidth: '75%',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
                }}
              >
                <Typography variant="body1">{msg.text}</Typography>
              </Paper>
            </ListItem>
          ))}
        </List>
      </Paper>

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', bgcolor: 'white', p: 1.5, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <TextField
          fullWidth
          multiline
          minRows={2}
          maxRows={6}
          placeholder="Digite sua dúvida, insira fragmentos de código ou peça soluções detalhadas..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          sx={{ 
            bgcolor: 'transparent', 
            '& .MuiOutlinedInput-root': { 
              bgcolor: 'transparent',
              '& fieldset': { border: 'none' },
              p: 1
            } 
          }}
        />
        <IconButton 
          color="primary" 
          onClick={handleSend} 
          sx={{ 
            bgcolor: 'primary.main', 
            color: 'white', 
            borderRadius: '12px',
            width: 48,
            height: 48,
            mb: 0.5,
            transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.4)',
            '&:hover': { bgcolor: 'primary.dark', transform: 'translateY(-2px)' } 
          }}
        >
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
