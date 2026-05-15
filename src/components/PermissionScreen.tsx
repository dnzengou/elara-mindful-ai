import { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface PermissionScreenProps {
  onRequestMic: () => Promise<void>;
  onSkip: () => void;
  error: string | null;
}

export function PermissionScreen({ onRequestMic, onSkip, error }: PermissionScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(brandRef.current, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', delay: 0.1 });
      gsap.to(btnRef.current, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(2)', delay: 0.3 });
      gsap.to(hintRef.current, { opacity: 1, duration: 0.4, ease: 'power2.out', delay: 0.5 });
      gsap.to(skipRef.current, { opacity: 1, duration: 0.4, ease: 'power2.out', delay: 0.7 });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 flex flex-col items-center justify-center px-4"
      style={{
        background: 'radial-gradient(ellipse at 50% 50%, rgba(212, 168, 83, 0.03) 0%, transparent 70%)',
      }}
    >
      {/* Brand */}
      <div ref={brandRef} className="flex flex-col items-center opacity-0 translate-y-5">
        <h1 className="text-5xl font-extralight tracking-tight" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Elara
        </h1>
        <span className="mt-2 text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>
          Mindfulness AI
        </span>
      </div>

      {/* Mic button */}
      <button
        ref={btnRef}
        onClick={() => onRequestMic()}
        className="mt-10 flex items-center justify-center rounded-full opacity-0 scale-[0.8] transition-all duration-200 cursor-pointer"
        style={{ width: 80, height: 80, border: '2px solid var(--border-subtle)', background: 'transparent' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--accent-amber)';
          e.currentTarget.style.boxShadow = '0 0 20px rgba(212, 168, 83, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-subtle)';
          e.currentTarget.style.boxShadow = 'none';
        }}
        onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; }}
        onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        title="Enable microphone for voice chat"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)' }}>
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      </button>

      {/* Hint / Error */}
      <p ref={hintRef} className="mt-4 text-base text-center opacity-0" style={{ color: error ? 'var(--error-red)' : 'var(--text-tertiary)' }}>
        {error || 'Tap mic to enable voice'}
      </p>

      {/* Skip button */}
      <button
        ref={skipRef}
        onClick={onSkip}
        className="mt-4 text-sm opacity-0 transition-colors duration-150 cursor-pointer"
        style={{ color: 'var(--text-tertiary)' }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-tertiary)'; }}
      >
        Continue with text input
      </button>
    </div>
  );
}
