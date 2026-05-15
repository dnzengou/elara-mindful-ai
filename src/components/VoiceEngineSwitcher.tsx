import { useState, useRef, useEffect } from 'react';
import type { VoiceEngine } from '@/types';

interface VoiceEngineSwitcherProps {
  engine: VoiceEngine;
  openaiVoice: string;
  onChangeEngine: (engine: VoiceEngine) => void;
  onChangeVoice: (voice: string) => void;
}

const OAI_VOICES: { value: string; label: string; desc: string }[] = [
  { value: 'nova', label: 'Nova', desc: 'Warm, gentle, ideal for mindfulness' },
  { value: 'alloy', label: 'Alloy', desc: 'Balanced, neutral, versatile' },
  { value: 'shimmer', label: 'Shimmer', desc: 'Clear, bright, optimistic' },
  { value: 'echo', label: 'Echo', desc: 'Warm, approachable, calm' },
  { value: 'fable', label: 'Fable', desc: 'British accent, refined' },
  { value: 'onyx', label: 'Onyx', desc: 'Deep, resonant, authoritative' },
];

const ENGINES: { value: VoiceEngine; label: string; desc: string; color: string }[] = [
  { value: 'webSpeech', label: 'Browser Native', desc: 'Free, built-in voices', color: 'var(--status-listening)' },
  { value: 'xai', label: 'xAI Grok', desc: 'Streaming STT + TTS', color: 'var(--accent-teal)' },
  { value: 'openai', label: 'OpenAI TTS', desc: '6 HD voices, premium', color: '#E06B8A' },
];

export function VoiceEngineSwitcher({ engine, openaiVoice, onChangeEngine, onChangeVoice }: VoiceEngineSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [voicePickerOpen, setVoicePickerOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setVoicePickerOpen(false); }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const current = ENGINES.find((e) => e.value === engine);
  const currentVoice = OAI_VOICES.find((v) => v.value === openaiVoice);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs font-medium uppercase rounded-lg px-2.5 py-1.5 transition-all duration-150 cursor-pointer"
        style={{
          color: 'var(--text-tertiary)',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          letterSpacing: '0.04em',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-teal)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: current?.color || 'var(--status-idle)' }} />
        <span className="hidden sm:inline">
          {engine === 'openai' ? `OpenAI · ${currentVoice?.label || 'Nova'}` : current?.label}
        </span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.15s' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 rounded-xl overflow-hidden z-50 flex flex-col gap-0"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', minWidth: 220, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
          <div className="px-3 py-2 text-xs font-medium uppercase" style={{ color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border-subtle)', letterSpacing: '0.05em' }}>
            Voice Engine
          </div>
          {ENGINES.map((e) => (
            <button key={e.value}
              onClick={() => { onChangeEngine(e.value); if (e.value !== 'openai') setVoicePickerOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors duration-100 cursor-pointer"
              style={{ background: e.value === engine ? 'var(--bg-elevated)' : 'transparent' }}
              onMouseEnter={(ev) => { if (e.value !== engine) ev.currentTarget.style.background = 'var(--bg-elevated)'; }}
              onMouseLeave={(ev) => { if (e.value !== engine) ev.currentTarget.style.background = 'transparent'; }}>
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{
                background: e.value === engine ? e.color : 'transparent',
                border: e.value === engine ? 'none' : '1px solid var(--text-tertiary)',
              }} />
              <div className="flex flex-col">
                <span className="text-sm" style={{ color: e.value === engine ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{e.label}</span>
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{e.desc}</span>
              </div>
            </button>
          ))}

          {/* OpenAI voice sub-picker */}
          {engine === 'openai' && (
            <>
              <div className="px-3 py-2 text-xs font-medium uppercase" style={{ color: 'var(--text-tertiary)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)', letterSpacing: '0.05em' }}>
                OpenAI Voice
              </div>
              {OAI_VOICES.map((v) => (
                <button key={v.value}
                  onClick={() => onChangeVoice(v.value)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left transition-colors duration-100 cursor-pointer"
                  style={{ background: v.value === openaiVoice ? 'var(--bg-elevated)' : 'transparent' }}
                  onMouseEnter={(ev) => { if (v.value !== openaiVoice) ev.currentTarget.style.background = 'var(--bg-elevated)'; }}
                  onMouseLeave={(ev) => { if (v.value !== openaiVoice) ev.currentTarget.style.background = 'transparent'; }}>
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{
                    background: v.value === openaiVoice ? '#E06B8A' : 'transparent',
                    border: v.value === openaiVoice ? 'none' : '1px solid var(--text-tertiary)',
                  }} />
                  <div className="flex flex-col">
                    <span className="text-sm" style={{ color: v.value === openaiVoice ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{v.label}</span>
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{v.desc}</span>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
