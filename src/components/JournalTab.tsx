import { useState } from 'react';
import { useJournal } from '@/hooks/useJournal';

export function JournalTab() {
  const { entries, addEntry, deleteEntry, moods } = useJournal();
  const [mood, setMood] = useState('😊');
  const [reflection, setReflection] = useState('');

  const handleSubmit = () => {
    if (!reflection.trim()) return;
    addEntry(mood, reflection.trim());
    setReflection('');
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-lg font-light" style={{ color: 'var(--text-primary)' }}>
          Journal
        </h3>
        <p className="text-xs uppercase font-medium mt-1" style={{ color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>
          Reflect on your practice
        </p>
      </div>

      {/* New entry */}
      <div
        className="flex flex-col gap-3 p-4 rounded-xl"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
      >
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium uppercase" style={{ color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
            Mood
          </label>
          <div className="flex gap-2 flex-wrap">
            {moods.map((m) => (
              <button
                key={m}
                onClick={() => setMood(m)}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-lg transition-all duration-150 cursor-pointer"
                style={{
                  background: m === mood ? 'var(--bg-elevated)' : 'transparent',
                  border: m === mood ? '1px solid var(--accent-amber)' : '1px solid transparent',
                }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <textarea
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="How do you feel today?"
          rows={3}
          className="w-full px-3 py-2.5 rounded-lg text-sm resize-none outline-none transition-all duration-150"
          style={{
            background: 'var(--bg-base)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-amber)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
        />

        <button
          onClick={handleSubmit}
          className="self-end px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer"
          style={{ background: 'var(--accent-amber)', color: 'var(--bg-base)' }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
        >
          Save Entry
        </button>
      </div>

      {/* Entries list */}
      <div className="flex flex-col gap-3">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="flex flex-col gap-2 p-3 rounded-lg"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{entry.mood}</span>
                <span className="text-xs font-medium uppercase" style={{ color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>
                  {new Date(entry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
              <button
                onClick={() => deleteEntry(entry.id)}
                className="text-xs transition-colors cursor-pointer"
                style={{ color: 'var(--text-tertiary)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--error-red)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-tertiary)'; }}
              >
                Delete
              </button>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {entry.reflection}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
