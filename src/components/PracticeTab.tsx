import { useCallback } from 'react';
import { usePractice } from '@/hooks/usePractice';

const SUGGESTIONS: Record<string, string[]> = {
  words_of_wisdom: [
    'Be present. This moment is enough.',
    'Let go of what you cannot control.',
    'The breath is an anchor to the present.',
    'Compassion begins with yourself.',
    'Stillness is not empty — it is full of answers.',
    'Wu Wei: act without forcing.',
    'Each exhale is a small letting go.',
    'You are the sky. Everything else is weather.',
  ],
  spiritual_practice: [
    '10-min breath awareness meditation',
    'Gratitude journaling — 3 things',
    'Loving-kindness (Metta) meditation',
    'Contemplative prayer or silent reflection',
    'Mindful tea ceremony',
    'Walking meditation in nature',
    'Body scan before sleep',
    'Sufi heart-centered breathing (Dhikr)',
  ],
  physical_practice: [
    'Gentle yoga flow (Sun Salutation)',
    'Mindful walking — 15 min outdoors',
    '4-7-8 breathing exercise',
    'Progressive muscle relaxation',
    'Qi Gong slow movement practice',
    'Neck and shoulder stretches',
    'Cold shower or contrast therapy',
    'Restorative pose: legs up the wall',
  ],
};

interface FieldConfig {
  key: 'words_of_wisdom' | 'spiritual_practice' | 'physical_practice';
  label: string;
  placeholder: string;
}

const FIELDS: FieldConfig[] = [
  { key: 'words_of_wisdom', label: 'Words of Wisdom', placeholder: 'Insight for today...' },
  { key: 'spiritual_practice', label: 'Spiritual Practice', placeholder: 'Meditation, prayer, gratitude...' },
  { key: 'physical_practice', label: 'Physical Practice', placeholder: 'Yoga, walking, breathwork...' },
];

function SuggestionChips({
  options,
  onPick,
}: {
  options: string[];
  onPick: (text: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-1.5">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onPick(opt)}
          className="text-xs px-2.5 py-1 rounded-md transition-all duration-150 cursor-pointer"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-tertiary)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent-amber)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.color = 'var(--text-tertiary)';
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export function PracticeTab() {
  const { getTodayPractice, updateToday } = usePractice();
  const today = getTodayPractice();

  const pickSuggestion = useCallback(
    (field: FieldConfig['key'], text: string) => {
      const current = today?.[field] || '';
      updateToday({
        [field]: current ? `${current}\n${text}` : text,
      });
    },
    [today, updateToday]
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-light" style={{ color: 'var(--text-primary)' }}>
            Today&apos;s Practice
          </h3>
          <p className="text-xs uppercase font-medium mt-1" style={{ color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>
            Day {today?.day || 1} &middot; {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
        </div>
        <span
          className="text-xs px-2 py-1 rounded-full font-medium uppercase"
          style={{ color: 'var(--accent-teal)', background: 'var(--accent-teal-glow)', letterSpacing: '0.05em' }}
        >
          {today ? 'Active' : 'New'}
        </span>
      </div>

      {/* Fields */}
      {FIELDS.map(({ key, label, placeholder }) => (
        <div key={key} className="flex flex-col gap-1">
          <label className="text-xs font-medium uppercase" style={{ color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
            {label}
          </label>
          <textarea
            value={today?.[key] || ''}
            onChange={(e) => updateToday({ [key]: e.target.value })}
            placeholder={placeholder}
            rows={2}
            className="w-full px-3 py-2.5 rounded-lg text-sm resize-none outline-none transition-all duration-150"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-amber)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
          />
          <SuggestionChips
            options={SUGGESTIONS[key]}
            onPick={(text) => pickSuggestion(key, text)}
          />
        </div>
      ))}
    </div>
  );
}
