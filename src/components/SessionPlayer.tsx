import { useEffect, useRef, useState } from 'react';
import type { SessionPhase, MindfulnessSession } from '@/types/sessions';

interface SessionPlayerProps {
  session: MindfulnessSession;
  phase: SessionPhase;
  stepIndex: number;
  stepRemaining: number;
  totalRemaining: number;
  currentStep: { text: string; duration: number; breathIn?: number; breathHold?: number; breathOut?: number } | null;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSpeak: (text: string) => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function SessionPlayer({
  session,
  phase,
  stepIndex,
  stepRemaining,
  totalRemaining,
  currentStep,
  onPlay,
  onPause,
  onStop,
  onSpeak,
}: SessionPlayerProps) {
  const hasSpokenRef = useRef<Set<number>>(new Set());
  const prevPhaseRef = useRef<SessionPhase>('idle');

  // Auto-speak each step when it becomes active
  useEffect(() => {
    if (phase === 'playing' && currentStep && !hasSpokenRef.current.has(stepIndex)) {
      hasSpokenRef.current.add(stepIndex);
      onSpeak(currentStep.text);
    }
    if (phase === 'idle') {
      hasSpokenRef.current.clear();
    }
    prevPhaseRef.current = phase;
  }, [phase, stepIndex, currentStep, onSpeak]);

  // Compute breathing cycle for animation
  const cycleDuration =
    (currentStep?.breathIn || 0) +
    (currentStep?.breathHold || 0) +
    (currentStep?.breathOut || 0);
  const hasBreathing = cycleDuration > 0;

  const progress = session.duration > 0 ? (session.duration - totalRemaining) / session.duration : 0;

  return (
    <div className="flex flex-col items-center gap-4 w-full" style={{ maxWidth: 360 }}>
      {/* Header */}
      <div className="w-full flex items-center justify-between">
        <div>
          <h3 className="text-base font-light" style={{ color: 'var(--text-primary)' }}>
            {session.title}
          </h3>
          <p className="text-xs uppercase font-medium mt-0.5" style={{ color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>
            {formatTime(totalRemaining)} remaining
          </p>
        </div>
        <button
          onClick={onStop}
          className="text-xs uppercase font-medium transition-colors cursor-pointer"
          style={{ color: 'var(--text-tertiary)' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--error-red)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-tertiary)'; }}
        >
          End
        </button>
      </div>

      {/* Breathing circle */}
      <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
        {/* Outer glow ring */}
        <div
          className="absolute rounded-full"
          style={{
            width: 180,
            height: 180,
            border: `2px solid ${session.color}`,
            opacity: 0.15,
            animation: hasBreathing && phase === 'playing' ? `breathe ${cycleDuration}s ease-in-out infinite` : 'none',
          }}
        />
        {/* Breathing core */}
        <div
          className="rounded-full flex items-center justify-center"
          style={{
            width: 120,
            height: 120,
            background: session.color,
            opacity: 0.2,
            animation: hasBreathing && phase === 'playing' ? `breathe-core ${cycleDuration}s ease-in-out infinite` : 'none',
            transform: hasBreathing ? 'scale(1)' : 'scale(0.95)',
            transition: 'transform 0.6s ease',
          }}
        >
          {/* Inner dot */}
          <div
            className="rounded-full"
            style={{
              width: 16,
              height: 16,
              background: session.color,
              opacity: 0.8,
              animation: hasBreathing && phase === 'playing' ? `breathe-dot ${cycleDuration}s ease-in-out infinite` : 'none',
            }}
          />
        </div>

        {/* Breath phase label */}
        {hasBreathing && phase === 'playing' && (
          <div
            className="absolute text-xs font-medium uppercase"
            style={{ color: session.color, letterSpacing: '0.08em', bottom: 20 }}
          >
            <BreathLabel cycle={cycleDuration} breathIn={currentStep?.breathIn || 0} breathHold={currentStep?.breathHold || 0} breathOut={currentStep?.breathOut || 0} />
          </div>
        )}
      </div>

      {/* Step text */}
      <p
        className="text-center text-sm font-light leading-relaxed px-4"
        style={{ color: 'var(--text-primary)', minHeight: 60 }}
      >
        {phase === 'intro' ? 'Press play to begin.' : currentStep?.text || ''}
      </p>

      {/* Progress bar */}
      <div className="w-full" style={{ maxWidth: 300 }}>
        <div className="w-full rounded-full overflow-hidden" style={{ height: 4, background: 'var(--bg-surface)' }}>
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${progress * 100}%`, background: session.color }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Step {stepIndex + 1}/{session.steps.length}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {formatTime(stepRemaining)}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 mt-2">
        {/* Rewind / prev step */}
        <button
          onClick={() => { /* handled by parent if needed */ }}
          className="flex items-center justify-center rounded-full transition-all cursor-pointer opacity-50 hover:opacity-100"
          style={{ width: 36, height: 36, border: '1px solid var(--border-subtle)' }}
          title="Coming soon"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)' }}>
            <polygon points="19 20 9 12 19 4 19 20" />
            <line x1="5" y1="19" x2="5" y2="5" />
          </svg>
        </button>

        {/* Play/Pause */}
        {phase === 'playing' ? (
          <button
            onClick={onPause}
            className="flex items-center justify-center rounded-full transition-all cursor-pointer"
            style={{ width: 56, height: 56, background: session.color, opacity: 0.3 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ color: session.color }}>
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          </button>
        ) : (
          <button
            onClick={onPlay}
            className="flex items-center justify-center rounded-full transition-all cursor-pointer"
            style={{ width: 56, height: 56, background: session.color, opacity: 0.3, boxShadow: `0 0 24px ${session.color}30` }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ color: session.color, marginLeft: 3 }}>
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </button>
        )}

        {/* Forward / next step */}
        <button
          onClick={() => { /* handled by parent if needed */ }}
          className="flex items-center justify-center rounded-full transition-all cursor-pointer opacity-50 hover:opacity-100"
          style={{ width: 36, height: 36, border: '1px solid var(--border-subtle)' }}
          title="Coming soon"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)' }}>
            <polygon points="5 4 15 12 5 20 5 4" />
            <line x1="19" y1="5" x2="19" y2="19" />
          </svg>
        </button>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1); opacity: 0.15; }
          ${(currentStep?.breathIn || 4) / (cycleDuration || 1) * 50}% { transform: scale(1.3); opacity: 0.25; }
          ${((currentStep?.breathIn || 4) + (currentStep?.breathHold || 0)) / (cycleDuration || 1) * 50}% { transform: scale(1.3); opacity: 0.25; }
        }
        @keyframes breathe-core {
          0%, 100% { transform: scale(1); }
          ${(currentStep?.breathIn || 4) / (cycleDuration || 1) * 50}% { transform: scale(1.35); }
          ${((currentStep?.breathIn || 4) + (currentStep?.breathHold || 0)) / (cycleDuration || 1) * 50}% { transform: scale(1.35); }
        }
        @keyframes breathe-dot {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          ${(currentStep?.breathIn || 4) / (cycleDuration || 1) * 50}% { transform: scale(1.5); opacity: 1; }
          ${((currentStep?.breathIn || 4) + (currentStep?.breathHold || 0)) / (cycleDuration || 1) * 50}% { transform: scale(1.5); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// Breath phase label — shows Inhale/Hold/Exhale based on cycle position
function BreathLabel({ cycle, breathIn, breathHold }: {
  cycle: number; breathIn: number; breathHold: number; breathOut?: number;
}) {
  const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');

  useEffect(() => {
    if (!cycle) return;
    const interval = setInterval(() => {
      const elapsed = (Date.now() % (cycle * 1000)) / 1000;
      if (elapsed < breathIn) setPhase('Inhale');
      else if (elapsed < breathIn + breathHold) setPhase('Hold');
      else setPhase('Exhale');
    }, 200);
    return () => clearInterval(interval);
  }, [cycle, breathIn, breathHold]);

  return <span>{phase}</span>;
}
