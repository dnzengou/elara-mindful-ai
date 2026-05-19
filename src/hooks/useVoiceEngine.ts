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
const AMBIENT_KEY = 'elara_ambient_mode';

// Wake phrases — any of these trigger Elara
const WAKE_PHRASES = ['hey elara', 'elara', 'ok elara', 'hi elara'];

// Auto-resume delay after Elara finishes speaking (ms)
const AUTO_RESUME_DELAY = 600;

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
function getStoredAmbient(): boolean {
  return localStorage.getItem(AMBIENT_KEY) === 'true';
}

// ─── Haptic ───────────────────────────────────────────────
function haptic(pattern: number | number[] = 40) {
  try { navigator.vibrate?.(pattern); } catch {}
}

// ─── Wake phrase check ────────────────────────────────────
function startsWithWakePhrase(text: string): { matched: boolean; remainder: string } {
  const lower = text.toLowerCase().trim();
  for (const phrase of WAKE_PHRASES) {
    if (lower.startsWith(phrase)) {
      const remainder = text.slice(phrase.length).trim();
      return { matched: true, remainder };
    }
  }
  return { matched: false, remainder: text };
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
  const [isAmbient, setIsAmbient] = useState(getStoredAmbient);
  // wake-mode: continuous always-on listening that only fires when wake phrase detected
  const [wakeMode, setWakeMode] = useState(false);

  const engineRef = useRef(engine);
  const openaiVoiceRef = useRef(openaiVoice);
  const statusRef = useRef<VoiceStatus>('idle');
  const isMutedRef = useRef(false);
  const isAmbientRef = useRef(isAmbient);
  const wakeModeRef = useRef(false);
  const finalTextRef = useRef('');
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoResumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<InstanceType<typeof window.SpeechRecognition | typeof window.webkitSpeechRecognition> | null>(null);
  // Callbacks stored for auto-resume
  const onUserMsgRef = useRef<((c: string) => void) | null>(null);
  const onAsstMsgRef = useRef<((c: string) => void) | null>(null);

  const { sendMessage } = useLLM();

  useEffect(() => { engineRef.current = engine; }, [engine]);
  useEffect(() => { openaiVoiceRef.current = openaiVoice; }, [openaiVoice]);
  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { isAmbientRef.current = isAmbient; localStorage.setItem(AMBIENT_KEY, String(isAmbient)); }, [isAmbient]);
  useEffect(() => { wakeModeRef.current = wakeMode; }, [wakeMode]);

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

  const clearAutoResume = useCallback(() => {
    if (autoResumeTimerRef.current) { clearTimeout(autoResumeTimerRef.current); autoResumeTimerRef.current = null; }
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

  // Called after any TTS finishes — sets idle + haptic
  const onSpeechEnd = useCallback(() => {
    setStatusCb('idle');
    haptic(20);
  }, [setStatusCb]);

  const speakWithBrowser = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) { setStatusCb('idle'); resolve(); return; }
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.85;
      u.pitch = 0.96;
      u.volume = 0.9;
      const voices = window.speechSynthesis.getVoices();
      const voice = pickMindfulnessVoice(voices);
      if (voice) u.voice = voice;
      u.onstart = () => setStatusCb('speaking');
      u.onend = () => { onSpeechEnd(); resolve(); };
      u.onerror = () => { onSpeechEnd(); resolve(); };
      window.speechSynthesis.speak(u);
    });
  }, [setStatusCb, onSpeechEnd]);

  // ── TTS ─────────────────────────────────────────────────
  const speak = useCallback(async (text: string): Promise<void> => {
    if (isMutedRef.current) { setStatusCb('idle'); return; }

    if (engineRef.current === 'xai') {
      try {
        setStatusCb('speaking');
        const blob = await xaiTTS(text);
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        await new Promise<void>((resolve) => {
          audio.onended = () => { URL.revokeObjectURL(url); onSpeechEnd(); resolve(); };
          audio.onerror = () => { URL.revokeObjectURL(url); onSpeechEnd(); resolve(); };
          audio.play().catch(() => { URL.revokeObjectURL(url); onSpeechEnd(); resolve(); });
        });
      } catch {
        engineRef.current = 'webSpeech';
        localStorage.setItem('elara_voice_engine', 'webSpeech');
        await speakWithBrowser(text);
      }
    } else if (engineRef.current === 'openai') {
      try {
        setStatusCb('speaking');
        const blob = await openaiTTS(text, openaiVoiceRef.current);
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        await new Promise<void>((resolve) => {
          audio.onended = () => { URL.revokeObjectURL(url); onSpeechEnd(); resolve(); };
          audio.onerror = () => { URL.revokeObjectURL(url); onSpeechEnd(); resolve(); };
          audio.play().catch(() => { URL.revokeObjectURL(url); onSpeechEnd(); resolve(); });
        });
      } catch {
        engineRef.current = 'webSpeech';
        localStorage.setItem('elara_voice_engine', 'webSpeech');
        await speakWithBrowser(text);
      }
    } else {
      await speakWithBrowser(text);
    }
  }, [setStatusCb, speakWithBrowser, onSpeechEnd]);

  // ref so processLLM can call startWebSpeech without circular dep
  const startWebSpeechRef = useRef<((onUserMsg: (c: string) => void, onAsstMsg: (c: string) => void) => void) | null>(null);

  // ── Process LLM ─────────────────────────────────────────
  const processLLM = useCallback(async (text: string, onUserMsg: (c: string) => void, onAsstMsg: (c: string) => void) => {
    setStatusCb('thinking');
    setInterimTranscript('');
    haptic(30);
    onUserMsg(text);

    const history = JSON.parse(localStorage.getItem('elara_history') || '[]') as Message[];
    const response = await sendMessage(history);
    onAsstMsg(response);

    if (!isMutedRef.current) {
      await speak(response);
      // Auto-resume listening after Elara speaks — seamless conversation loop
      if (engineRef.current !== 'xai') {
        clearAutoResume();
        autoResumeTimerRef.current = setTimeout(() => {
          if (statusRef.current === 'idle' && startWebSpeechRef.current) {
            startWebSpeechRef.current(onUserMsg, onAsstMsg);
          }
        }, AUTO_RESUME_DELAY);
      }
    } else {
      setStatusCb('idle');
    }
  }, [setStatusCb, sendMessage, speak, clearAutoResume]);

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
    if (!SR) { return; }

    // Store callbacks for auto-resume
    onUserMsgRef.current = onUserMsg;
    onAsstMsgRef.current = onAsstMsg;

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

      if (final) {
        // Wake phrase gate: in wake mode, strip wake phrase and only respond to it
        if (wakeModeRef.current) {
          const { matched, remainder } = startsWithWakePhrase(final);
          if (matched) {
            haptic([30, 50, 30]); // triple pulse = wake triggered
            finalTextRef.current = remainder || 'Hello';
            setInterimTranscript('');
            resetSilenceTimer(onUserMsg, onAsstMsg);
          }
          // In wake mode, ignore speech that doesn't start with wake phrase
          return;
        }
        finalTextRef.current += final;
      }

      setInterimTranscript(interim);
      if ((final || interim) && !wakeModeRef.current) resetSilenceTimer(onUserMsg, onAsstMsg);
    };
    r.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      setError(`Speech error: ${e.error}`);
    };
    r.onend = () => { if (statusRef.current === 'listening') { try { r.start(); } catch {} } };
    try { r.start(); } catch { /* mic may be in use */ }
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

  // Keep startWebSpeechRef current so processLLM can call it without circular dep
  useEffect(() => { startWebSpeechRef.current = startWebSpeech; }, [startWebSpeech]);

  // ── Unified start/stop ──────────────────────────────────
  const startListening = useCallback((onUserMsg: (c: string) => void, onAsstMsg: (c: string) => void) => {
    if (engineRef.current === 'xai') startXaiSTT(onUserMsg, onAsstMsg);
    else startWebSpeech(onUserMsg, onAsstMsg);
  }, [startXaiSTT, startWebSpeech]);

  const stopListening = useCallback(() => {
    // Clear auto-resume + stored callbacks so conversation loop stops
    clearAutoResume();
    onUserMsgRef.current = null;
    onAsstMsgRef.current = null;
    if (engineRef.current === 'xai') {
      if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify({ type: 'audio.done' }));
      cleanupXai();
    } else {
      cleanupWebSpeech();
    }
  }, [cleanupXai, cleanupWebSpeech, clearAutoResume]);

  // ── Controls ────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    setIsMuted(p => { const n = !p; isMutedRef.current = n; if (n) { window.speechSynthesis?.cancel(); } return n; });
    haptic(25);
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

  // Toggle ambient mode (screen chrome disappears, waveform fills view)
  const toggleAmbient = useCallback(() => {
    setIsAmbient(p => !p);
    haptic(40);
  }, []);

  // Toggle wake-word mode — always-on mic, only responds to "Hey Elara"
  const toggleWakeMode = useCallback((onUserMsg: (c: string) => void, onAsstMsg: (c: string) => void) => {
    const next = !wakeModeRef.current;
    setWakeMode(next);
    wakeModeRef.current = next;
    haptic(next ? [40, 30, 40] : 20);
    if (next) {
      // Enter wake mode: start continuous listening but gate on phrase
      startWebSpeech(onUserMsg, onAsstMsg);
    }
  }, [startWebSpeech]);

  // Cleanup on unmount
  useEffect(() => () => {
    clearAutoResume();
    stopListening();
    cancelSpeech();
    cleanupXai();
  }, [stopListening, cancelSpeech, cleanupXai, clearAutoResume]);

  return {
    engine,
    setEngine,
    openaiVoice,
    setOpenAIVoice,
    status,
    interimTranscript,
    error,
    isMuted,
    isAmbient,
    wakeMode,
    startListening,
    stopListening,
    toggleMute,
    toggleAmbient,
    toggleWakeMode,
    cancelSpeech,
    sendText,
  };
}
