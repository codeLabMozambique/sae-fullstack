import { useState, useRef, useEffect } from 'react';
import { Box, IconButton, Typography, LinearProgress, Tooltip, Paper } from '@mui/material';
import {
  Mic as MicIcon, Stop as StopIcon,
  PlayArrow as PlayIcon, Pause as PauseIcon,
  Delete as DeleteIcon, CheckCircle as DoneIcon,
} from '@mui/icons-material';

type RecordState = 'idle' | 'recording' | 'reviewing';

interface Props {
  onTranscript: (text: string) => void;
  onAudioBlob?: (blob: Blob) => void;
  language?: string;
  accentColor?: string;
  buttonSize?: number;
  tooltip?: string;
}

export default function VoiceRecorderButton({
  onTranscript, onAudioBlob,
  language = 'pt-PT', accentColor = '#1976d2',
  buttonSize = 38, tooltip = 'Responder por voz',
}: Props) {
  const [state, setState] = useState<RecordState>('idle');
  const [liveText, setLiveText] = useState('');
  const [transcript, setTranscript] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [supported, setSupported] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const blobRef = useRef<Blob | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recogRef = useRef<SpeechRecognition | null>(null);
  const finalRef = useRef('');

  useEffect(() => {
    setSupported(!!navigator.mediaDevices?.getUserMedia);
    return () => { if (audioUrl) URL.revokeObjectURL(audioUrl); };
  }, []);

  if (!supported) return null;

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      finalRef.current = '';
      setLiveText('');
      setTranscript('');

      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';
      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;

      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });
        blobRef.current = blob;
        setAudioUrl(URL.createObjectURL(blob));
        setTranscript(finalRef.current.trim());
        setState('reviewing');
      };
      recorder.start(100);

      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRec) {
        const rec: SpeechRecognition = new SpeechRec();
        recogRef.current = rec;
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = language;
        rec.onresult = (e: SpeechRecognitionEvent) => {
          let interim = '';
          for (let i = e.resultIndex; i < e.results.length; i++) {
            if (e.results[i].isFinal) finalRef.current += e.results[i][0].transcript;
            else interim += e.results[i][0].transcript;
          }
          setLiveText(finalRef.current + interim);
        };
        rec.onerror = () => {};
        try { rec.start(); } catch {}
      }
      setState('recording');
    } catch {}
  };

  const stopRecording = () => {
    try { recogRef.current?.stop(); } catch {}
    recogRef.current = null;
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  };

  const deleteRecording = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setTranscript('');
    setLiveText('');
    setIsPlaying(false);
    setProgress(0);
    blobRef.current = null;
    setState('idle');
  };

  const sendRecording = () => {
    onTranscript(transcript || liveText);
    if (onAudioBlob && blobRef.current) onAudioBlob(blobRef.current);
    deleteRecording();
  };

  const togglePlay = () => {
    if (!audioUrl) return;
    if (!audioRef.current) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.ontimeupdate = () => setProgress((audio.currentTime / (audio.duration || 1)) * 100);
      audio.onended = () => { setIsPlaying(false); setProgress(0); };
    }
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { audioRef.current.play(); setIsPlaying(true); }
  };

  if (state === 'idle') return (
    <Tooltip title={tooltip}>
      <IconButton onClick={startRecording}
        sx={{ width: buttonSize, height: buttonSize, color: '#9CA3AF',
          '&:hover': { color: accentColor, bgcolor: `${accentColor}18` }, transition: 'all 0.2s' }}>
        <MicIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );

  if (state === 'recording') return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {liveText && (
        <Typography variant="caption" color="text.secondary"
          sx={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: 'italic' }}>
          {liveText}
        </Typography>
      )}
      <Tooltip title="Parar gravação">
        <IconButton onClick={stopRecording}
          sx={{
            width: buttonSize, height: buttonSize, bgcolor: '#EF4444', color: '#fff',
            animation: 'micPulse 1.2s ease-in-out infinite',
            '@keyframes micPulse': {
              '0%,100%': { boxShadow: '0 0 0 0 rgba(239,68,68,0.5)' },
              '50%': { boxShadow: '0 0 0 8px rgba(239,68,68,0)' },
            },
            '&:hover': { bgcolor: '#DC2626' },
          }}>
          <StopIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );

  // reviewing
  return (
    <Paper elevation={0} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, p: 0.75,
      bgcolor: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 2 }}>
      <Tooltip title={isPlaying ? 'Pausar' : 'Ouvir'}>
        <IconButton onClick={togglePlay} sx={{ width: 30, height: 30, color: accentColor }}>
          {isPlaying ? <PauseIcon sx={{ fontSize: 16 }} /> : <PlayIcon sx={{ fontSize: 16 }} />}
        </IconButton>
      </Tooltip>
      <Box sx={{ flex: 1, minWidth: 60 }}>
        <LinearProgress variant="determinate" value={progress}
          sx={{ height: 2, borderRadius: 1, bgcolor: '#E5E7EB',
            '& .MuiLinearProgress-bar': { bgcolor: accentColor } }} />
        {transcript && (
          <Typography variant="caption" color="text.secondary"
            sx={{ display: 'block', mt: 0.3, overflow: 'hidden', textOverflow: 'ellipsis',
              whiteSpace: 'nowrap', maxWidth: 150, fontSize: '0.65rem' }}>
            "{transcript}"
          </Typography>
        )}
      </Box>
      <Tooltip title="Apagar e repetir">
        <IconButton onClick={deleteRecording}
          sx={{ width: 30, height: 30, color: '#EF4444', '&:hover': { bgcolor: '#FEE2E2' } }}>
          <DeleteIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Usar esta resposta">
        <IconButton onClick={sendRecording}
          sx={{ width: 30, height: 30, bgcolor: '#10B981', color: '#fff', '&:hover': { bgcolor: '#059669' } }}>
          <DoneIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
    </Paper>
  );
}
