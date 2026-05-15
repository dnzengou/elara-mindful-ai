import type { FlowchartData } from '@/types';

const FLOW_DATA: FlowchartData = {
  nodes: [
    { id: 'start', label: 'Start' },
    { id: 'morning', label: 'Morning Practice' },
    { id: 'midday', label: 'Mid-day Practice' },
    { id: 'evening', label: 'Evening Practice' },
    { id: 'end', label: 'End of Day' },
  ],
  edges: [
    { from: 'start', to: 'morning' },
    { from: 'morning', to: 'midday' },
    { from: 'midday', to: 'evening' },
    { from: 'evening', to: 'end' },
  ],
};

const NODE_DETAILS: Record<string, { icon: string; desc: string; activities: string[] }> = {
  start: {
    icon: '🌅',
    desc: 'Begin your mindfulness journey',
    activities: ['Set intention', 'Check in with body'],
  },
  morning: {
    icon: '☀️',
    desc: 'Ground yourself for the day',
    activities: ['10-min breath meditation', 'Gentle stretching', 'Gratitude reflection'],
  },
  midday: {
    icon: '🌿',
    desc: 'Reset and recenter',
    activities: ['Mindful walking', 'Body scan', '3 mindful breaths'],
  },
  evening: {
    icon: '🌙',
    desc: 'Wind down and release',
    activities: ['Yoga Nidra', 'Journal entry', 'Loving-kindness meditation'],
  },
  end: {
    icon: '✨',
    desc: 'Rest in awareness',
    activities: ['Review the day', 'Set tomorrow intention', 'Sleep preparation'],
  },
};

function getHour(): number {
  return new Date().getHours();
}

function getActiveNode(): string {
  const h = getHour();
  if (h < 8) return 'start';
  if (h < 12) return 'morning';
  if (h < 17) return 'midday';
  if (h < 21) return 'evening';
  return 'end';
}

export function FlowTab() {
  const activeId = getActiveNode();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-lg font-light" style={{ color: 'var(--text-primary)' }}>
          Daily Flow
        </h3>
        <p className="text-xs uppercase font-medium mt-1" style={{ color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>
          {getHour()}:00 &middot; {NODE_DETAILS[activeId].desc}
        </p>
      </div>

      {/* Visual flow */}
      <div className="flex flex-col gap-0">
        {FLOW_DATA.nodes.map((node, i) => {
          const isActive = node.id === activeId;
          const detail = NODE_DETAILS[node.id];
          const isPast = FLOW_DATA.nodes.findIndex((n) => n.id === activeId) > i;

          return (
            <div key={node.id} className="flex flex-col">
              {/* Node */}
              <div className="flex items-start gap-3">
                {/* Connector line + dot */}
                <div className="flex flex-col items-center shrink-0" style={{ width: 24 }}>
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-sm"
                    style={{
                      background: isActive
                        ? 'var(--accent-amber)'
                        : isPast
                        ? 'var(--bg-elevated)'
                        : 'var(--bg-surface)',
                      border: `2px solid ${
                        isActive
                          ? 'var(--accent-amber)'
                          : isPast
                          ? 'var(--accent-teal)'
                          : 'var(--border-subtle)'
                      }`,
                      color: isActive ? 'var(--bg-base)' : 'var(--text-secondary)',
                    }}
                  >
                    {detail.icon}
                  </div>
                  {i < FLOW_DATA.nodes.length - 1 && (
                    <div
                      className="w-0.5 flex-1"
                      style={{
                        background: isPast || isActive
                          ? 'var(--accent-teal)'
                          : 'var(--border-subtle)',
                        minHeight: 40,
                        opacity: 0.4,
                      }}
                    />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-sm font-medium"
                      style={{
                        color: isActive ? 'var(--accent-amber)' : 'var(--text-primary)',
                      }}
                    >
                      {node.label}
                    </span>
                    {isActive && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded font-medium uppercase"
                        style={{
                          color: 'var(--accent-amber)',
                          background: 'var(--accent-amber-glow)',
                          fontSize: 9,
                          letterSpacing: '0.05em',
                        }}
                      >
                        Now
                      </span>
                    )}
                  </div>

                  {/* Activities */}
                  <div className="flex flex-col gap-1 mt-1.5">
                    {detail.activities.map((a) => (
                      <div key={a} className="flex items-center gap-2">
                        <span
                          className="w-1 h-1 rounded-full shrink-0"
                          style={{
                            background: isPast
                              ? 'var(--accent-teal)'
                              : isActive
                              ? 'var(--accent-amber)'
                              : 'var(--text-tertiary)',
                          }}
                        />
                        <span
                          className="text-xs"
                          style={{
                            color: isActive ? 'var(--text-secondary)' : 'var(--text-tertiary)',
                          }}
                        >
                          {a}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
