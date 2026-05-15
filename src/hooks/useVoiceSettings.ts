import { useState, useCallback, useEffect, useRef } from 'react';

export interface VoiceOption {
  name: string;
  voiceURI: string;
  lang: string;
  default: boolean;
  quality: 'premium' | 'standard' | 'fallback';
}

const PREFERRED_VOICE_NAMES = [
  // Premium calming voices
  'Google UK English Female',
  'Google US English',
  'Samantha',
  'Google UK English Male',
  'Karen',
  // macOS voices
  'Samantha',
  'Victoria',
  'Alex',
  // Windows voices
  'Microsoft Zira',
  'Microsoft David',
  // Fallbacks
  'English United States',
  'English',
];

function scoreVoice(voice: SpeechSynthesisVoice): number {
  const name = voice.name;
  const idx = PREFERRED_VOICE_NAMES.findIndex(
    (p) => name.includes(p)
  );
  if (idx >= 0) return PREFERRED_VOICE_NAMES.length - idx;
  if (voice.lang.startsWith('en')) return 1;
  return 0;
}

function getVoiceQuality(voice: SpeechSynthesisVoice): VoiceOption['quality'] {
  if (
    voice.name.includes('Google') ||
    voice.name.includes('Premium') ||
    voice.name.includes('Enhanced')
  )
    return 'premium';
  if (
    voice.name.includes('Microsoft') ||
    voice.name.includes('Samantha') ||
    voice.name.includes('Karen')
  )
    return 'premium';
  return 'standard';
}

const STORAGE_KEY = 'elara_voice_uri';

export function useVoiceSettings() {
  const [availableVoices, setAvailableVoices] = useState<VoiceOption[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');
  const loadedRef = useRef(false);

  // Load and sort voices
  const loadVoices = useCallback(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;

    const raw = synth.getVoices();
    if (!raw.length) return;

    const englishVoices = raw
      .filter((v) => v.lang.startsWith('en'))
      .sort((a, b) => scoreVoice(b) - scoreVoice(a));

    const options: VoiceOption[] = englishVoices.map((v) => ({
      name: v.name,
      voiceURI: v.voiceURI,
      lang: v.lang,
      default: v.default,
      quality: getVoiceQuality(v),
    }));

    setAvailableVoices(options);

    // Pick saved or best voice
    if (!loadedRef.current) {
      loadedRef.current = true;
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && options.some((o) => o.voiceURI === saved)) {
        setSelectedVoiceURI(saved);
      } else if (options.length > 0) {
        setSelectedVoiceURI(options[0].voiceURI);
      }
    }
  }, []);

  useEffect(() => {
    loadVoices();

    // Voices may load async on some browsers
    const synth = window.speechSynthesis;
    if (synth) {
      synth.onvoiceschanged = loadVoices;
    }

    return () => {
      if (synth) synth.onvoiceschanged = null;
    };
  }, [loadVoices]);

  const selectVoice = useCallback((voiceURI: string) => {
    setSelectedVoiceURI(voiceURI);
    localStorage.setItem(STORAGE_KEY, voiceURI);
  }, []);

  const getSpeechVoice = useCallback((): SpeechSynthesisVoice | null => {
    const synth = window.speechSynthesis;
    if (!synth) return null;

    const voices = synth.getVoices();
    if (selectedVoiceURI) {
      const found = voices.find((v) => v.voiceURI === selectedVoiceURI);
      if (found) return found;
    }

    // Fallback: best English voice
    const english = voices
      .filter((v) => v.lang.startsWith('en'))
      .sort((a, b) => scoreVoice(b) - scoreVoice(a));
    return english[0] || voices[0] || null;
  }, [selectedVoiceURI]);

  return {
    availableVoices,
    selectedVoiceURI,
    selectVoice,
    getSpeechVoice,
  };
}
