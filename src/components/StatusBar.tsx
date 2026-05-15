import { memo, type ReactNode } from 'react';
import type { VoiceStatus } from '@/types';

interface StatusBarProps {
  status: VoiceStatus;
  isMuted: boolean;
  onToggleMute: () => void;
  onClear: () => void;
  voiceEngineSwitcher?: ReactNode;
}

const STATUS_CONFIG: Record<
  VoiceStatus,
  { label: string; color: string; dotClass: string }
> = {
  idle: {
    label: 'Ready',
    color: 'var(--status-idle)',
    dotClass: '',
  },
  listening: {
    label: 'Listening...',
    color: 'var(--status-listening)',
    dotClass: 'status-dot-listening',
  },
  thinking: {
    label: 'Thinking...',
    color: 'var(--status-thinking)',
    dotClass: 'status-dot-thinking',
  },
  speaking: {
    label: 'Speaking...',
    color: 'var(--status-speaking)',
    dotClass: 'status-dot-speaking',
  },
};

export const StatusBar = memo(function StatusBar({
  status,
  isMuted,
  onToggleMute,
  onClear,
  voiceEngineSwitcher,
}: StatusBarProps) {
  const config = STATUS_CONFIG[status];

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3">
      {/* Left: Brand */}
      <span
        className="text-xs font-medium uppercase"
        style={{
          color: 'var(--text-tertiary)',
          letterSpacing: '0.08em',
        }}
      >
        ELARA
      </span>

      {/* Center: Status */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
        <span
          className={`inline-block w-2 h-2 rounded-full ${config.dotClass}`}
          style={{ backgroundColor: config.color }}
        />
        <span
          className="text-xs font-medium uppercase"
          style={{
            color: config.color,
            letterSpacing: '0.05em',
          }}
        >
          {config.label}
        </span>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-3">
        {/* Voice Engine Switcher */}
        {voiceEngineSwitcher}

        {/* Mute Button */}
        <button
          onClick={onToggleMute}
          className="flex items-center justify-center rounded-full transition-all duration-150 cursor-pointer"
          style={{
            width: 36,
            height: 36,
            background: 'var(--bg-surface)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-elevated)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--bg-surface)';
          }}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: 'var(--status-idle)' }}
            >
              <path d="M11 5L6 9H2v6h4l5 4V5z" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          ) : (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: 'var(--text-secondary)' }}
            >
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          )}
        </button>

        {/* Clear Button */}
        <button
          onClick={onClear}
          className="text-base transition-colors duration-150 cursor-pointer"
          style={{ color: 'var(--text-tertiary)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-tertiary)';
          }}
        >
          Clear
        </button>
      </div>
    </div>
  );
});
