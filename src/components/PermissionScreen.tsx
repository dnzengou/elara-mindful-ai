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
      className="fixed inset-0 flex flex-col items-center justify-center px-6"
      style={{
        background: 'radial-gradient(ellipse at 50% 40%, rgba(212, 168, 83, 0.05) 0%, rgba(78, 205, 196, 0.02) 50%, transparent 75%)',
      }}
    >
      {/* Brand */}
      <div ref={brandRef} className="flex flex-col items-center opacity-0 translate-y-5">
        {/* Breathing orb */}
        <div className="relative flex items-center justify-center mb-6" style={{ width: 72, height: 72 }}>
          <div className="absolute inset-0 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(212,168,83,0.18) 0%, transparent 70%)', animation: 'breathe-core 4s ease-in-out infinite' }} />
          <div className="absolute inset-2 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(212,168,83,0.25) 0%, transparent 70%)', animation: 'breathe-core 4s ease-in-out infinite 0.5s' }} />
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ color: 'var(--accent-amber)', position: 'relative', zIndex: 1 }}>
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
          </svg>
        </div>

        <h1 className="text-5xl font-extralight tracking-tight" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Elara
        </h1>
        <span className="mt-2 text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--text-tertiary)', letterSpacing: '0.12em' }}>
          Mindfulness AI
        </span>

        {/* Tagline */}
        <p className="mt-4 text-sm text-center max-w-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Your voice companion for calm, clarity, and cultural wisdom — available whenever you need it.
        </p>
      </div>

      {/* Mic CTA */}
      <button
        ref={btnRef}
        onClick={() => onRequestMic()}
        className="mt-10 flex items-center gap-3 px-6 py-4 rounded-2xl opacity-0 scale-[0.9] transition-all duration-200 cursor-pointer"
        style={{
          background: 'rgba(212, 168, 83, 0.1)',
          border: '1px solid rgba(212, 168, 83, 0.3)',
          color: 'var(--accent-amber)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(212, 168, 83, 0.18)';
          e.currentTarget.style.borderColor = 'rgba(212, 168, 83, 0.6)';
          e.currentTarget.style.boxShadow = '0 0 24px rgba(212, 168, 83, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(212, 168, 83, 0.1)';
          e.currentTarget.style.borderColor = 'rgba(212, 168, 83, 0.3)';
          e.currentTarget.style.boxShadow = 'none';
        }}
        onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.97)'; }}
        onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        title="Enable microphone"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
        <span className="text-base font-medium">Enable voice</span>
      </button>

      {/* Feature pills */}
      <div ref={hintRef} className="mt-5 flex flex-wrap justify-center gap-2 max-w-xs opacity-0">
        {error ? (
          <p className="text-sm text-center" style={{ color: 'var(--error-red)' }}>{error}</p>
        ) : (
          ['Guided breathing', 'Cultural wisdom', 'Hey Elara wake word', 'Works offline'].map(f => (
            <span key={f} className="px-3 py-1 rounded-full text-xs"
              style={{ background: 'var(--bg-surface)', color: 'var(--text-tertiary)', border: '1px solid var(--border-subtle)' }}>
              {f}
            </span>
          ))
        )}
      </div>

      {/* Skip */}
      <button
        ref={skipRef}
        onClick={onSkip}
        className="mt-6 text-sm opacity-0 transition-colors duration-150 cursor-pointer"
        style={{ color: 'var(--text-tertiary)' }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-tertiary)'; }}
      >
        Continue with text →
      </button>
    </div>
  );
}
