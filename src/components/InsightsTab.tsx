import { memo, useCallback } from 'react';
import { useAgentSystem, type AgentCard } from '@/hooks/useAgentSystem';
import { useJournal } from '@/hooks/useJournal';
import { usePractice } from '@/hooks/usePractice';

// Parse "LABEL: content" lines into structured rows
function parseOutput(raw: string): Array<{ label: string; value: string }> {
  return raw
    .split('\n')
    .map(line => {
      const idx = line.indexOf(':');
      if (idx === -1) return null;
      const label = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      if (!label || !value) return null;
      return { label, value };
    })
    .filter(Boolean) as Array<{ label: string; value: string }>;
}

const LABEL_COLORS: Record<string, string> = {
  INTENTION: 'var(--accent-amber)',
  AFFIRMATION: 'var(--accent-teal)',
  PRACTICE: 'var(--accent-purple)',
  TREND: 'var(--accent-amber)',
  THEME: 'var(--text-secondary)',
  GROWTH: 'var(--accent-teal)',
  INSIGHT: 'var(--accent-purple)',
  PICK: 'var(--accent-amber)',
  WHY: 'var(--text-secondary)',
  BACKUP: 'var(--accent-teal)',
  WEEK: 'var(--text-secondary)',
  WIN: 'var(--accent-teal)',
  FOCUS: 'var(--accent-amber)',
  CLOSE: 'var(--accent-purple)',
};

const Card = memo(function Card({
  card,
  onRun,
}: {
  card: AgentCard;
  onRun: () => void;
}) {
  const rows = card.content ? parseOutput(card.content) : [];
  const hasResult = rows.length > 0;

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 12,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        transition: 'border-color 0.15s',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>{card.icon}</span>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--text-primary)',
              lineHeight: 1.2,
            }}
          >
            {card.title}
          </div>
          {!hasResult && !card.loading && !card.error && (
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-tertiary)',
                marginTop: 2,
                lineHeight: 1.4,
              }}
            >
              {card.description}
            </div>
          )}
        </div>
        <button
          onClick={onRun}
          disabled={card.loading}
          style={{
            background: card.loading ? 'var(--bg-elevated)' : 'var(--accent-amber)',
            color: card.loading ? 'var(--text-tertiary)' : 'var(--bg-base)',
            border: 'none',
            borderRadius: 8,
            padding: '5px 12px',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.04em',
            cursor: card.loading ? 'default' : 'pointer',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => {
            if (!card.loading) e.currentTarget.style.opacity = '0.82';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.opacity = '1';
          }}
        >
          {card.loading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Spinner />
              Running
            </span>
          ) : hasResult ? (
            'Re-run'
          ) : (
            'Run'
          )}
        </button>
      </div>

      {/* Error */}
      {card.error && (
        <div
          style={{
            fontSize: 12,
            color: 'var(--error-red, #e05555)',
            background: 'rgba(224,85,85,0.08)',
            borderRadius: 8,
            padding: '8px 10px',
          }}
        >
          {card.error}
        </div>
      )}

      {/* Skeleton loading */}
      {card.loading && !card.content && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[80, 65, 90].map(w => (
            <div
              key={w}
              className="animate-pulse"
              style={{
                height: 10,
                width: `${w}%`,
                borderRadius: 6,
                background: 'var(--bg-elevated)',
              }}
            />
          ))}
        </div>
      )}

      {/* Structured result rows */}
      {hasResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {rows.map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: LABEL_COLORS[label] ?? 'var(--text-tertiary)',
                }}
              >
                {label}
              </span>
              <span
                style={{
                  fontSize: 12.5,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                }}
              >
                {value}
              </span>
            </div>
          ))}
          {card.timestamp && (
            <div
              style={{
                fontSize: 10,
                color: 'var(--text-tertiary)',
                marginTop: 2,
              }}
            >
              {new Date(card.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

function Spinner() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      style={{ animation: 'spin 0.8s linear infinite' }}
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

export function InsightsTab() {
  const { cards, runMorning, runInsights, runRecommend, runProgress } = useAgentSystem();
  const { entries: journal } = useJournal();
  const { practices } = usePractice();

  const handleRun = useCallback(
    (type: AgentCard['type']) => {
      switch (type) {
        case 'morning':   return runMorning(journal, practices);
        case 'insights':  return runInsights(journal);
        case 'recommend': return runRecommend(journal);
        case 'progress':  return runProgress(journal, practices);
      }
    },
    [journal, practices, runMorning, runInsights, runRecommend, runProgress]
  );

  const order: AgentCard['type'][] = ['morning', 'recommend', 'insights', 'progress'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 300, color: 'var(--text-primary)', margin: 0 }}>
          AI Insights
        </h3>
        <p
          style={{
            fontSize: 11,
            color: 'var(--text-tertiary)',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            fontWeight: 500,
            marginTop: 4,
            marginBottom: 0,
          }}
        >
          Chain-of-thought agents · on demand · low cost
        </p>
      </div>

      {/* Run All button */}
      <button
        onClick={() => {
          runMorning(journal, practices);
          runInsights(journal);
          runRecommend(journal);
          runProgress(journal, practices);
        }}
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 10,
          padding: '8px 14px',
          fontSize: 12,
          fontWeight: 500,
          color: 'var(--accent-amber)',
          cursor: 'pointer',
          textAlign: 'center',
          letterSpacing: '0.03em',
          transition: 'border-color 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-amber)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
      >
        ✦ Run all agents
      </button>

      {order.map(type => (
        <Card
          key={type}
          card={cards[type]}
          onRun={() => handleRun(type)}
        />
      ))}

      <p
        style={{
          fontSize: 10,
          color: 'var(--text-tertiary)',
          textAlign: 'center',
          lineHeight: 1.6,
          margin: '4px 0 0',
        }}
      >
        Each agent run costs ~1 LLM call (≈$0.0001 on DeepSeek).
        <br />
        Results are not stored — re-run anytime.
      </p>
    </div>
  );
}
