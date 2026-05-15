import { useState, useRef, useEffect } from 'react';
import type { VoiceOption } from '@/hooks/useVoiceSettings';

interface VoiceSelectorProps {
  voices: VoiceOption[];
  selected: string;
  onSelect: (voiceURI: string) => void;
}

export function VoiceSelector({
  voices,
  selected,
  onSelect,
}: VoiceSelectorProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const selectedVoice = voices.find((v) => v.voiceURI === selected);
  const label = selectedVoice
    ? selectedVoice.name.split(' ').slice(0, 3).join(' ')
    : 'Voice';

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs font-medium uppercase rounded-lg px-2.5 py-1.5 transition-all duration-150 cursor-pointer"
        style={{
          color: 'var(--text-tertiary)',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          letterSpacing: '0.04em',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--text-secondary)';
          e.currentTarget.style.borderColor = 'var(--accent-amber)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--text-tertiary)';
          e.currentTarget.style.borderColor = 'var(--border-subtle)';
        }}
        title="Select voice"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
        <span className="hidden sm:inline">{label}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.15s ease',
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 rounded-xl overflow-hidden z-50"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            minWidth: 220,
            maxHeight: 280,
            overflowY: 'auto',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div
            className="px-3 py-2 text-xs font-medium uppercase"
            style={{
              color: 'var(--text-tertiary)',
              borderBottom: '1px solid var(--border-subtle)',
              letterSpacing: '0.05em',
            }}
          >
            Speaking Voice
          </div>
          {voices.map((voice) => (
            <button
              key={voice.voiceURI}
              onClick={() => {
                onSelect(voice.voiceURI);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors duration-100 cursor-pointer"
              style={{
                background:
                  voice.voiceURI === selected
                    ? 'var(--bg-elevated)'
                    : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (voice.voiceURI !== selected) {
                  e.currentTarget.style.background = 'var(--bg-elevated)';
                }
              }}
              onMouseLeave={(e) => {
                if (voice.voiceURI !== selected) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{
                  background:
                    voice.voiceURI === selected
                      ? 'var(--accent-amber)'
                      : 'transparent',
                  border:
                    voice.voiceURI === selected
                      ? 'none'
                      : '1px solid var(--text-tertiary)',
                }}
              />
              <span
                className="text-sm flex-1 truncate"
                style={{
                  color:
                    voice.voiceURI === selected
                      ? 'var(--text-primary)'
                      : 'var(--text-secondary)',
                }}
              >
                {voice.name}
              </span>
              {voice.quality === 'premium' && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{
                    color: 'var(--accent-amber)',
                    background: 'var(--accent-amber-glow)',
                    fontSize: 9,
                    letterSpacing: '0.05em',
                  }}
                >
                  HD
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
