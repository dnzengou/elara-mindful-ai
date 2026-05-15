import { useState } from 'react';
import { SESSIONS, CATEGORY_LABELS } from '@/data/sessions';


interface SessionsTabProps {
  onStartSession: (id: string) => void;
  completionCount: (id: string) => number;
}

const ALL_CATEGORIES = ['all', ...Object.keys(CATEGORY_LABELS)] as const;

export function SessionsTab({ onStartSession, completionCount }: SessionsTabProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filtered = activeCategory === 'all'
    ? SESSIONS
    : SESSIONS.filter(s => s.category === activeCategory);

  const formatDuration = (s: number) => {
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)} min`;
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-lg font-light" style={{ color: 'var(--text-primary)' }}>Guided Sessions</h3>
        <p className="text-xs uppercase font-medium mt-1" style={{ color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>
          {SESSIONS.length} sessions available
        </p>
      </div>

      {/* Category filters */}
      <div className="flex gap-1.5 flex-wrap">
        {ALL_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium uppercase transition-all duration-150 cursor-pointer"
            style={{
              background: activeCategory === cat ? 'var(--bg-elevated)' : 'transparent',
              border: `1px solid ${activeCategory === cat ? 'var(--accent-amber)' : 'var(--border-subtle)'}`,
              color: activeCategory === cat ? 'var(--accent-amber)' : 'var(--text-tertiary)',
              letterSpacing: '0.04em',
            }}
          >
            {cat === 'all' ? 'All' : `${CATEGORY_LABELS[cat]?.icon || ''} ${CATEGORY_LABELS[cat]?.label || cat}`}
          </button>
        ))}
      </div>

      {/* Session cards */}
      <div className="flex flex-col gap-3">
        {filtered.map(session => {
          const completions = completionCount(session.id);
          return (
            <button
              key={session.id}
              onClick={() => onStartSession(session.id)}
              className="w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all duration-200 cursor-pointer group"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = session.color;
                e.currentTarget.style.background = 'var(--bg-elevated)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.background = 'var(--bg-surface)';
              }}
            >
              {/* Color dot */}
              <div
                className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-lg"
                style={{ background: `${session.color}18`, border: `1px solid ${session.color}30` }}
              >
                {CATEGORY_LABELS[session.category]?.icon || '🧘'}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {session.title}
                  </span>
                  {completions > 0 && (
                    <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: `${session.color}15`, color: session.color, fontSize: 10 }}>
                      {completions}x
                    </span>
                  )}
                </div>
                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                  {session.description}
                </p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-xs font-medium uppercase" style={{ color: session.color, letterSpacing: '0.04em' }}>
                    {formatDuration(session.duration)}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {session.steps.length} steps
                  </span>
                </div>
              </div>

              {/* Play arrow */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: session.color, opacity: 0.2 }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ color: session.color, marginLeft: 1 }}>
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
