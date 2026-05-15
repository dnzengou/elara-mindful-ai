import { useEffect, useState } from 'react';
import { SessionPlayer } from './SessionPlayer';
import type { MindfulnessSession, SessionPhase } from '@/types/sessions';

interface SessionOverlayProps {
  session: MindfulnessSession;
  phase: SessionPhase;
  stepIndex: number;
  stepRemaining: number;
  totalRemaining: number;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSpeak: (text: string) => void;
}

export function SessionOverlay({ session, phase, stepIndex, stepRemaining, totalRemaining, onPlay, onPause, onStop, onSpeak }: SessionOverlayProps) {
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setFadeIn(true));
  }, []);

  const currentStep = session.steps[stepIndex] || null;

  if (phase === 'completed') {
    return (
      <div
        className="fixed inset-0 z-[60] flex flex-col items-center justify-center px-4 transition-opacity duration-500"
        style={{ backgroundColor: 'var(--bg-base)', opacity: fadeIn ? 1 : 0 }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
          style={{ background: `${session.color}20`, border: `2px solid ${session.color}40` }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={session.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <h2 className="text-2xl font-light" style={{ color: 'var(--text-primary)' }}>
          Session Complete
        </h2>
        <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
          {session.title}
        </p>
        <button
          onClick={onStop}
          className="mt-6 px-6 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer"
          style={{ background: session.color, color: 'var(--bg-base)', opacity: 0.8 }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.8'; }}
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center px-4 transition-opacity duration-300"
      style={{ backgroundColor: 'var(--bg-base)', opacity: fadeIn ? 1 : 0 }}
    >
      <SessionPlayer
        session={session}
        phase={phase}
        stepIndex={stepIndex}
        stepRemaining={stepRemaining}
        totalRemaining={totalRemaining}
        currentStep={currentStep}
        onPlay={onPlay}
        onPause={onPause}
        onStop={onStop}
        onSpeak={onSpeak}
      />
    </div>
  );
}
