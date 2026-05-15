import { useState, useRef, useEffect } from 'react';
import { PracticeTab } from './PracticeTab';
import { JournalTab } from './JournalTab';
import { FlowTab } from './FlowTab';
import { SessionsTab } from './SessionsTab';

type Tab = 'practice' | 'journal' | 'flow' | 'sessions';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'sessions', label: 'Sessions', icon: '🎧' },
  { id: 'practice', label: 'Practice', icon: '🧘' },
  { id: 'journal', label: 'Journal', icon: '📓' },
  { id: 'flow', label: 'Flow', icon: '🌊' },
];

interface SidePanelProps {
  onStartSession: (id: string) => void;
  completionCount: (id: string) => number;
}

export function SidePanel({ onStartSession, completionCount }: SidePanelProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('sessions');
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer"
        style={{
          width: 48, height: 48,
          background: open ? 'var(--bg-elevated)' : 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          boxShadow: open ? '0 0 20px rgba(212, 168, 83, 0.2)' : '0 4px 16px rgba(0,0,0,0.3)',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-amber)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-amber)' }}>
          {open ? (
            <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
          ) : (
            <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
             <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>
          )}
        </svg>
      </button>

      <div ref={panelRef}
        className="fixed right-0 top-0 h-full z-40 flex flex-col transition-transform duration-300"
        style={{
          width: 'min(420px, 90vw)',
          background: 'var(--bg-base)',
          borderLeft: '1px solid var(--border-subtle)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          boxShadow: open ? '-8px 0 32px rgba(0,0,0,0.4)' : 'none',
        }}>
        <div className="flex items-center gap-1 px-4 py-3 shrink-0" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium uppercase transition-all duration-150 cursor-pointer"
              style={{
                background: activeTab === tab.id ? 'var(--bg-elevated)' : 'transparent',
                color: activeTab === tab.id ? 'var(--accent-amber)' : 'var(--text-tertiary)',
                letterSpacing: '0.04em',
              }}
              onMouseEnter={(e) => { if (activeTab !== tab.id) e.currentTarget.style.color = 'var(--text-secondary)'; }}
              onMouseLeave={(e) => { if (activeTab !== tab.id) e.currentTarget.style.color = 'var(--text-tertiary)'; }}>
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          {activeTab === 'sessions' && <SessionsTab onStartSession={(id) => { onStartSession(id); setOpen(false); }} completionCount={completionCount} />}
          {activeTab === 'practice' && <PracticeTab />}
          {activeTab === 'journal' && <JournalTab />}
          {activeTab === 'flow' && <FlowTab />}
        </div>
      </div>

      {open && <div className="fixed inset-0 z-30" style={{ background: 'rgba(0,0,0,0.3)' }} onClick={() => setOpen(false)} />}
    </>
  );
}
