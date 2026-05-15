import { useState, useCallback, useRef, useEffect } from 'react';
import type { VoiceStatus, VoiceEngine, OpenAIVoice, Message } from '@/types';
import { useLLM } from './useLLM';

// ─── SpeechRecognition Types ──────────────────────────────
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent {
  error: string;
}
declare global {
  interface Window {
    SpeechRecognition: new () => InstanceType<typeof window.webkitSpeechRecognition>;
    webkitSpeechRecognition: new () => {
      continuous: boolean; interimResults: boolean; lang: string;
      onstart: (() => void) | null; onresult: ((e: SpeechRecognitionEvent) => void) | null;
      onerror: ((e: SpeechRecognitionErrorEvent) => void) | null; onend: (() => void) | null;
      start(): void; stop(): void; abort(): void;
    };
  }
}

// ─── Config ───────────────────────────────────────────────
const XAI_API_KEY = import.meta.env.VITE_XAI_API_KEY || '';
const XAI_TTS_URL = 'https://api.x.ai/v1/audio/speech';
const XAI_STT_WS = 'wss://api.x.ai/v1/stt?sample_rate=16000&encoding=pcm&interim_results=true&language=en';
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
const OPENAI_TTS_URL = 'https://api.openai.com/v1/audio/speech';
const ENGINE_KEY = 'elara_voice_engine';
const OAI_VOICE_KEY = 'elara_openai_voice';

// ─── Engine Storage ───────────────────────────────────────
function getStoredEngine(): VoiceEngine {
  return (localStorage.getItem(ENGINE_KEY) as VoiceEngine) || 'webSpeech';
}
function setStoredEngine(e: VoiceEngine) {
  localStorage.setItem(ENGINE_KEY, e);
}
function getStoredOpenAIVoice(): string {
  return localStorage.getItem(OAI_VOICE_KEY) || 'nova';
}
function setStoredOpenAIVoice(v: string) {
  localStorage.setItem(OAI_VOICE_KEY, v);
}

// ─── xAI TTS Fetch ────────────────────────────────────────
async function xaiTTS(text: string): Promise<Blob> {
  const resp = await fetch(XAI_TTS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${XAI_API_KEY}`,
    },
    body: JSON.stringify({ model: 'grok-tts', voice: 'cove', input: text }),
  });
  if (!resp.ok) throw new Error(`TTS ${resp.status}`);
  return resp.blob();
}

// ─── OpenAI TTS Fetch ─────────────────────────────────────
async function openaiTTS(text: string, voice: string): Promise<Blob> {
  const resp = await fetch(OPENAI_TTS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model: 'tts-1', voice, input: text, speed: 0.9 }),
  });
  if (!resp.ok) throw new Error(`TTS ${resp.status}`);
  return resp.blob();
}

// ─── Main Hook ────────────────────────────────────────────
export function useVoiceEngine() {
  const [engine, setEngineState] = useState<VoiceEngine>(getStoredEngine);
  const [openaiVoice, setOpenAIVoiceState] = useState<string>(getStoredOpenAIVoice);
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  const engineRef = useRef(engine);
  const openaiVoiceRef = useRef(openaiVoice);
  const statusRef = useRef<VoiceStatus>('idle');
  const isMutedRef = useRef(false);
  const finalTextRef = useRef('');
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<InstanceType<typeof window.SpeechRecognition | typeof window.webkitSpeechRecognition> | null>(null);

  const { sendMessage } = useLLM();

  useEffect(() => { engineRef.current = engine; }, [engine]);
  useEffect(() => { openaiVoiceRef.current = openaiVoice; }, [openaiVoice]);
  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

  const setStatusCb = useCallback((s: VoiceStatus) => {
    setStatus(s);
    statusRef.current = s;
  }, []);

  // ── Cleanup ─────────────────────────────────────────────
  const cleanupXai = useCallback(() => {
    if (processorRef.current) { try { processorRef.current.disconnect(); } catch {} processorRef.current = null; }
    if (sourceRef.current) { try { sourceRef.current.disconnect(); } catch {} sourceRef.current = null; }
    if (audioCtxRef.current) { try { audioCtxRef.current.close(); } catch {} audioCtxRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
  }, []);

  const cleanupWebSpeech = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.onend = null; recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
  }, []);

  // ── Browser TTS ─────────────────────────────────────────
  const VOICE_SCORES: [RegExp, number][] = [
    [/^Google UK English Female$/i, 100],  // warm, sophisticated, ideal
    [/^Samantha$/i, 95],                    // Apple's gold standard
    [/^Victoria$/i, 92],                    // soft, warm
    [/^Moira$/i, 88],                       // gentle Irish
    [/^Fiona$/i, 86],                       // gentle Scottish
    [/^Google US English$/i, 82],           // clear, neutral
    [/^Tessa$/i, 80],                       // South African, warm
    [/^Google.*Female$/i, 78],              // any Google female
    [/^Microsoft Zira/i, 75],               // Windows female
    [/^Microsoft.*Female/i, 72],            // any MS female
    [/^Karen$/i, 65],                       // Australian
    [/^Google.*Male$/i, 55],               // Google male (backup)
    [/^(Microsoft David|Microsoft Mark)/i, 50], // Windows male
    [/en-GB|en-UK/i, 40],                   // any UK English
    [/en-US|en-AU|en-CA/i, 30],             // any US/English variant
  ];

  function pickMindfulnessVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
    if (!voices.length) return null;
    const english = voices.filter(v => v.lang.startsWith('en'));
    if (!english.length) return voices[0];

    let best: SpeechSynthesisVoice | null = null;
    let bestScore = -1;

    for (const v of english) {
      let score = 0;
      for (const [pattern, points] of VOICE_SCORES) {
        if (pattern.test(v.name)) { score = points; break; }
      }
      if (score > bestScore) { bestScore = score; best = v; }
    }
    return best || english[0];
  }

  const speakWithBrowser = useCallback((text: string) => {
    if (!window.speechSynthesis) { setStatusCb('idle'); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.85;      // slower = calmer
    u.pitch = 0.96;     // slightly lower = warmer
    u.volume = 0.9;     // gentle volume

    const voices = window.speechSynthesis.getVoices();
    const voice = pickMindfulnessVoice(voices);
    if (voice) u.voice = voice;

    u.onstart = () => setStatusCb('speaking');
    u.onend = () => setStatusCb('idle');
    u.onerror = () => setStatusCb('idle');
    window.speechSynthesis.speak(u);
  }, [setStatusCb]);

  // ── TTS ─────────────────────────────────────────────────
  const speak = useCallback(async (text: string) => {
    if (isMutedRef.current) { setStatusCb('idle'); return; }

    if (engineRef.current === 'xai') {
      try {
        setStatusCb('speaking');
        const blob = await xaiTTS(text);
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        await new Promise<void>((resolve) => {
          audio.onended = () => { URL.revokeObjectURL(url); setStatusCb('idle'); resolve(); };
          audio.onerror = () => { URL.revokeObjectURL(url); setStatusCb('idle'); resolve(); };
          audio.play().catch(() => { URL.revokeObjectURL(url); setStatusCb('idle'); resolve(); });
        });
      } catch {
        // xAI TTS failed — silently fall back to browser TTS
        engineRef.current = 'webSpeech';
        localStorage.setItem('elara_voice_engine', 'webSpeech');
        speakWithBrowser(text);
      }
    } else if (engineRef.current === 'openai') {
      try {
        setStatusCb('speaking');
        const blob = await openaiTTS(text, openaiVoiceRef.current);
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        await new Promise<void>((resolve) => {
          audio.onended = () => { URL.revokeObjectURL(url); setStatusCb('idle'); resolve(); };
          audio.onerror = () => { URL.revokeObjectURL(url); setStatusCb('idle'); resolve(); };
          audio.play().catch(() => { URL.revokeObjectURL(url); setStatusCb('idle'); resolve(); });
        });
      } catch {
        // OpenAI TTS failed — silently fall back to browser TTS
        engineRef.current = 'webSpeech';
        localStorage.setItem('elara_voice_engine', 'webSpeech');
        speakWithBrowser(text);
      }
    } else {
      speakWithBrowser(text);
    }
  }, [setStatusCb, speakWithBrowser]);

  // ── Process LLM ─────────────────────────────────────────
  const processLLM = useCallback(async (text: string, onUserMsg: (c: string) => void, onAsstMsg: (c: string) => void) => {
    setStatusCb('thinking');
    setInterimTranscript('');
    onUserMsg(text);

    const history = JSON.parse(localStorage.getItem('elara_history') || '[]') as Message[];
    const response = await sendMessage(history);
    onAsstMsg(response);

    if (!isMutedRef.current) await speak(response);
    else setStatusCb('idle');
  }, [setStatusCb, sendMessage, speak]);

  // ── Silence timer ───────────────────────────────────────
  const resetSilenceTimer = useCallback((onUserMsg: (c: string) => void, onAsstMsg: (c: string) => void) => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => {
      stopListening();
      if (finalTextRef.current.trim()) {
        processLLM(finalTextRef.current.trim(), onUserMsg, onAsstMsg);
      }
    }, 2500);
  }, [processLLM]);

  // ── Web Speech STT ──────────────────────────────────────
  const startWebSpeech = useCallback((onUserMsg: (c: string) => void, onAsstMsg: (c: string) => void) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { return; } // Silently skip — UI handles text-only mode

    cleanupWebSpeech();
    finalTextRef.current = '';
    setInterimTranscript('');

    const r = new SR();
    r.continuous = true; r.interimResults = true; r.lang = 'en-US';
    recognitionRef.current = r;

    r.onstart = () => { setStatusCb('listening'); setError(null); };
    r.onresult = (e: SpeechRecognitionEvent) => {
      let final = '', interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      if (final) { finalTextRef.current += final; }
      setInterimTranscript(interim);
      if (final || interim) resetSilenceTimer(onUserMsg, onAsstMsg);
    };
    r.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      setError(`Speech error: ${e.error}`);
    };
    r.onend = () => { if (statusRef.current === 'listening') r.start(); };
    try { r.start(); } catch { /* ignore — mic may be in use */ }
  }, [setStatusCb, cleanupWebSpeech, resetSilenceTimer]);

  // ── xAI STT ─────────────────────────────────────────────
  const startXaiSTT = useCallback(async (onUserMsg: (c: string) => void, onAsstMsg: (c: string) => void) => {
    cleanupXai();
    finalTextRef.current = '';
    setInterimTranscript('');

    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000, channelCount: 1 } });
      audioCtxRef.current = new AudioContext({ sampleRate: 16000 });
      sourceRef.current = audioCtxRef.current.createMediaStreamSource(streamRef.current);
      processorRef.current = audioCtxRef.current.createScriptProcessor(4096, 1, 1);

      wsRef.current = new WebSocket(XAI_STT_WS);
      wsRef.current.binaryType = 'arraybuffer';

      wsRef.current.onopen = () => { setStatusCb('listening'); setError(null); };

      wsRef.current.onmessage = (ev) => {
        const data = JSON.parse(ev.data);
        if (data.type === 'transcript.created') {
          processorRef.current!.onaudioprocess = (e) => {
            const floatData = e.inputBuffer.getChannelData(0);
            const pcm16 = new Int16Array(floatData.length);
            for (let i = 0; i < floatData.length; i++) pcm16[i] = Math.max(-1, Math.min(1, floatData[i])) * 0x7fff;
            if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(pcm16.buffer);
            resetSilenceTimer(onUserMsg, onAsstMsg);
          };
          sourceRef.current!.connect(processorRef.current!);
          processorRef.current!.connect(audioCtxRef.current!.destination);
        } else if (data.type === 'transcript.partial') {
          if (data.is_final) { finalTextRef.current += data.text; setInterimTranscript(''); }
          else setInterimTranscript(data.text);
        } else if (data.type === 'transcript.done') {
          setStatusCb('idle');
          cleanupXai();
        }
      };

      wsRef.current.onerror = () => {
        setError('xAI STT: CORS or auth issue. Use Browser Native voice, or set up a proxy.');
        cleanupXai();
      };

      wsRef.current.onclose = () => cleanupXai();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mic access denied');
      cleanupXai();
    }
  }, [setStatusCb, cleanupXai, resetSilenceTimer]);

  // ── Unified start/stop ──────────────────────────────────
  const startListening = useCallback((onUserMsg: (c: string) => void, onAsstMsg: (c: string) => void) => {
    if (engineRef.current === 'xai') startXaiSTT(onUserMsg, onAsstMsg);
    else startWebSpeech(onUserMsg, onAsstMsg); // openai uses browser STT
  }, [startXaiSTT, startWebSpeech]);

  const stopListening = useCallback(() => {
    if (engineRef.current === 'xai') {
      if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify({ type: 'audio.done' }));
      cleanupXai();
    } else {
      cleanupWebSpeech();
    }
  }, [cleanupXai, cleanupWebSpeech]);

  // ── Controls ────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    setIsMuted(p => { const n = !p; isMutedRef.current = n; if (n) { window.speechSynthesis?.cancel(); } return n; });
  }, []);

  const cancelSpeech = useCallback(() => {
    window.speechSynthesis?.cancel();
  }, []);

  const setEngine = useCallback((e: VoiceEngine) => {
    stopListening();
    cancelSpeech();
    setStoredEngine(e);
    setEngineState(e);
  }, [stopListening, cancelSpeech]);

  const setOpenAIVoice = useCallback((voice: string) => {
    setStoredOpenAIVoice(voice);
    setOpenAIVoiceState(voice);
  }, []);

  const sendText = useCallback(async (text: string, onUserMsg: (c: string) => void, onAsstMsg: (c: string) => void) => {
    if (!text.trim()) return;
    await processLLM(text.trim(), onUserMsg, onAsstMsg);
  }, [processLLM]);

  // Cleanup on unmount
  useEffect(() => () => { stopListening(); cancelSpeech(); cleanupXai(); }, [stopListening, cancelSpeech, cleanupXai]);

  return {
    engine,
    setEngine,
    openaiVoice,
    setOpenAIVoice,
    status,
    interimTranscript,
    error,
    isMuted,
    startListening,
    stopListening,
    toggleMute,
    cancelSpeech,
    sendText,
  };
}
