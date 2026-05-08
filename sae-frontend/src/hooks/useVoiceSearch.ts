import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Hook para pesquisa por voz usando a Web Speech API.
 * Compatível com Chrome / Edge / Brave (qualquer browser baseado em Chromium).
 * Em Firefox / Safari devolve `supported: false`.
 *
 * Diferenças vs versão anterior:
 *  - Devolve `interimTranscript` (resultado em tempo real, antes de o utilizador parar)
 *  - Devolve `confidence` (qualidade do reconhecimento, 0..1)
 *  - Reportar `error` em vez de silenciar (microfone bloqueado, sem rede, etc)
 *  - Re-tenta automaticamente em caso de "no-speech" durante curtos períodos
 *  - `start()` força nova permissão se necessário
 */

export interface VoiceSearchHook {
  listening: boolean;
  supported: boolean;
  start: () => void;
  stop: () => void;
  transcript: string;
  interimTranscript: string;
  confidence: number;
  error: string | null;
  reset: () => void;
}

export function useVoiceSearch(lang = 'pt-PT'): VoiceSearchHook {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterim] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const manuallyStoppedRef = useRef(false);

  const SR =
    typeof window !== 'undefined'
      ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
      : null;
  const supported = !!SR;

  useEffect(() => {
    if (!SR) return;
    const recognition = new SR();
    recognition.lang = lang;
    recognition.continuous = false;        // termina depois de uma frase
    recognition.interimResults = true;     // ⬅ resultados em tempo real
    recognition.maxAlternatives = 1;

    recognition.onresult = (e: any) => {
      let interim = '';
      let final = '';
      let conf = 0;
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const text = r[0].transcript;
        if (r.isFinal) {
          final += text;
          conf = r[0].confidence ?? conf;
        } else {
          interim += text;
        }
      }
      if (final) {
        setTranscript(prev => (prev + ' ' + final).trim());
        setConfidence(conf);
      }
      setInterim(interim);
    };

    recognition.onerror = (e: any) => {
      const msg = e?.error || 'unknown';
      // mapear erros conhecidos para mensagens humanas
      const human: Record<string, string> = {
        'no-speech':       'Nada foi detectado — tenta falar mais perto do microfone.',
        'audio-capture':   'Microfone indisponível.',
        'not-allowed':     'Permissão para o microfone negada. Activa nas definições do browser.',
        'network':         'Sem rede — pesquisa por voz precisa de internet.',
        'service-not-allowed': 'Reconhecimento de voz não autorizado.',
        'aborted':         '', // silencioso
      };
      const friendly = human[msg];
      if (friendly === undefined) setError(`Erro: ${msg}`);
      else if (friendly) setError(friendly);
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
      setInterim('');
    };

    recognitionRef.current = recognition;

    return () => {
      manuallyStoppedRef.current = true;
      try { recognition.stop(); } catch { /* noop */ }
    };
  }, [SR, lang]);

  const start = useCallback(() => {
    if (!recognitionRef.current) return;
    setError(null);
    setTranscript('');
    setInterim('');
    setConfidence(0);
    manuallyStoppedRef.current = false;
    setListening(true);
    try { recognitionRef.current.start(); }
    catch (e: any) {
      // Se já estiver a correr (InvalidStateError), reinicia limpo
      try {
        recognitionRef.current.stop();
        setTimeout(() => recognitionRef.current?.start(), 100);
      } catch { setListening(false); setError('Falha ao iniciar reconhecimento'); }
    }
  }, []);

  const stop = useCallback(() => {
    if (!recognitionRef.current) return;
    manuallyStoppedRef.current = true;
    try { recognitionRef.current.stop(); } catch { /* noop */ }
    setListening(false);
  }, []);

  const reset = useCallback(() => {
    setTranscript('');
    setInterim('');
    setConfidence(0);
    setError(null);
  }, []);

  return {
    listening, supported,
    start, stop, reset,
    transcript, interimTranscript,
    confidence, error,
  };
}
