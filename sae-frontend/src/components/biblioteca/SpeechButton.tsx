import React, { useState, useEffect } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { VolumeUp as PlayIcon, Stop as StopIcon } from '@mui/icons-material';

interface Props {
  text: string;
  lang?: string;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Botão Text-to-Speech usando a Web Speech API (nativa do browser).
 * Inclui acessibilidade para alunos com deficiência visual.
 * Funciona offline depois da primeira voz ser carregada.
 */
const SpeechButton: React.FC<Props> = ({ text, lang = 'pt-PT', size = 'small' }) => {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSupported(false);
    }
    return () => {
      // limpa qualquer fala pendente quando o componente desmonta
      window.speechSynthesis?.cancel();
    };
  }, []);

  const handleClick = () => {
    if (!supported) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = lang;
    utt.rate = 0.95;
    utt.pitch = 1;
    utt.onend = () => setSpeaking(false);
    utt.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utt);
    setSpeaking(true);
  };

  if (!supported) return null;

  return (
    <Tooltip title={speaking ? 'Parar leitura' : 'Ouvir'}>
      <IconButton
        size={size}
        onClick={handleClick}
        sx={{
          color: speaking ? '#DC2626' : '#00A651',
          border: '1px solid',
          borderColor: speaking ? '#DC2626' : '#E5E7EB',
          borderRadius: 1.5,
          '&:hover': { bgcolor: speaking ? '#FEE2E2' : '#F0FDF4' },
        }}
      >
        {speaking ? <StopIcon fontSize={size === 'small' ? 'inherit' : size} />
                  : <PlayIcon fontSize={size === 'small' ? 'inherit' : size} />}
      </IconButton>
    </Tooltip>
  );
};

export default SpeechButton;
