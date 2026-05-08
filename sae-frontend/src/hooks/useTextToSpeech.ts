import { useEffect, useRef, useState, useCallback } from 'react';

export interface TtsState {
  supported: boolean;
  speaking: boolean;
  paused: boolean;
  rate: number;
  voices: SpeechSynthesisVoice[];
  voiceURI: string | null;
}

export interface TtsControls {
  speak: (text: string) => void;
  pause: () => void;
  resume: () => void;
  cancel: () => void;
  setRate: (r: number) => void;
  setVoice: (uri: string) => void;
}

/**
 * Hook completo de Text-to-Speech (Web Speech API).
 *
 * - Divide texto longo em pedaços (a maior parte dos browsers tem limite de 200-300 chars)
 *   para evitar truncagem em livros longos.
 * - Permite play / pause / resume / cancel.
 * - Permite escolher voz e ajustar velocidade.
 *
 * Funciona offline depois das vozes terem sido carregadas pelo SO.
 */
export function useTextToSpeech(defaultLang = 'pt-PT'): TtsState & TtsControls {
  const [supported, setSupported] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [rate, setRateState] = useState(1);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState<string | null>(null);

  const queueRef = useRef<string[]>([]);
  const cancelledRef = useRef(false);

  // ── Detecta suporte e carrega vozes ─────────────────────
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSupported(false);
      return;
    }
    const synth = window.speechSynthesis;
    const refresh = () => {
      const list = synth.getVoices();
      setVoices(list);
      // selecciona voz pt por defeito
      if (!voiceURI) {
        const pt = list.find(v => v.lang?.toLowerCase().startsWith('pt'));
        if (pt) setVoiceURI(pt.voiceURI);
      }
    };
    refresh();
    synth.addEventListener('voiceschanged', refresh);
    return () => {
      synth.removeEventListener('voiceschanged', refresh);
      synth.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Divide texto em pedaços naturais ────────────────────
  const splitText = (text: string): string[] => {
    const clean = text.replace(/\s+/g, ' ').trim();
    if (!clean) return [];
    // partir por frase, respeitando limite ~220 chars
    const sentences = clean.split(/(?<=[.!?…])\s+/);
    const chunks: string[] = [];
    let buf = '';
    for (const s of sentences) {
      if ((buf + ' ' + s).length > 220 && buf) {
        chunks.push(buf.trim());
        buf = s;
      } else {
        buf = (buf ? buf + ' ' : '') + s;
      }
    }
    if (buf.trim()) chunks.push(buf.trim());
    return chunks;
  };

  const speakNext = useCallback(() => {
    if (cancelledRef.current) return;
    const next = queueRef.current.shift();
    if (!next) {
      setSpeaking(false);
      return;
    }
    const utt = new SpeechSynthesisUtterance(next);
    utt.lang = defaultLang;
    utt.rate = rate;
    utt.pitch = 1;
    if (voiceURI) {
      const v = voices.find(v => v.voiceURI === voiceURI);
      if (v) utt.voice = v;
    }
    utt.onend = () => {
      if (!cancelledRef.current) speakNext();
    };
    utt.onerror = () => speakNext();
    window.speechSynthesis.speak(utt);
  }, [defaultLang, rate, voiceURI, voices]);

  const speak = useCallback((text: string) => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    cancelledRef.current = false;
    queueRef.current = splitText(text);
    if (queueRef.current.length === 0) return;
    setSpeaking(true);
    setPaused(false);
    speakNext();
  }, [supported, speakNext]);

  const pause = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.pause();
    setPaused(true);
  }, [supported]);

  const resume = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.resume();
    setPaused(false);
  }, [supported]);

  const cancel = useCallback(() => {
    if (!supported) return;
    cancelledRef.current = true;
    queueRef.current = [];
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
  }, [supported]);

  const setRate = useCallback((r: number) => {
    setRateState(Math.min(2, Math.max(0.5, r)));
  }, []);

  const setVoice = useCallback((uri: string) => {
    setVoiceURI(uri);
  }, []);

  return {
    supported, speaking, paused, rate, voices, voiceURI,
    speak, pause, resume, cancel, setRate, setVoice,
  };
}
