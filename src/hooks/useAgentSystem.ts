import { useCallback, useState } from 'react';
import type { JournalEntry, DailyPractice } from '@/types';

// Shared LLM call — same endpoint as useLLM, no extra cost
const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';

function getCfg() {
  const e = import.meta.env;
  return {
    url: e.VITE_LLM_API_URL || DEEPSEEK_URL,
    key: e.VITE_LLM_API_KEY || e.VITE_DEEPSEEK_API_KEY || '',
    model: e.VITE_LLM_MODEL || DEEPSEEK_MODEL,
  };
}

async function llm(prompt: string): Promise<string> {
  const cfg = getCfg();
  const res = await fetch(cfg.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(cfg.key ? { Authorization: `Bearer ${cfg.key}` } : {}),
    },
    body: JSON.stringify({
      model: cfg.model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 280,
      temperature: 0.55,
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const d = await res.json();
  return d.choices?.[0]?.message?.content?.trim() ?? '';
}

export interface AgentCard {
  type: 'morning' | 'insights' | 'recommend' | 'progress';
  title: string;
  icon: string;
  description: string;
  content: string;
  loading: boolean;
  error?: string;
  timestamp?: number;
}

const INIT: Record<AgentCard['type'], AgentCard> = {
  morning: {
    type: 'morning', title: 'Morning Briefing', icon: '🌅',
    description: 'Personalized daily intention based on your mood history and practice streak.',
    content: '', loading: false,
  },
  insights: {
    type: 'insights', title: 'Pattern Insights', icon: '🔮',
    description: 'CoT analysis of your journal to surface emotional themes and growth.',
    content: '', loading: false,
  },
  recommend: {
    type: 'recommend', title: 'Session Pick', icon: '🎯',
    description: 'AI-reasoned session recommendation based on your current state and time of day.',
    content: '', loading: false,
  },
  progress: {
    type: 'progress', title: 'Weekly Progress', icon: '📈',
    description: 'Synthesized view of your week — wins, focus area, and a motivational close.',
    content: '', loading: false,
  },
};

function getSessionHistory(): Record<string, number> {
  try {
    const raw: Array<{ sessionId: string }> = JSON.parse(
      localStorage.getItem('elara_session_history') || '[]'
    );
    return raw.reduce<Record<string, number>>((acc, h) => {
      acc[h.sessionId] = (acc[h.sessionId] ?? 0) + 1;
      return acc;
    }, {});
  } catch {
    return {};
  }
}

export function useAgentSystem() {
  const [cards, setCards] = useState<Record<AgentCard['type'], AgentCard>>(INIT);

  function patch(type: AgentCard['type'], update: Partial<AgentCard>) {
    setCards(prev => ({ ...prev, [type]: { ...prev[type], ...update } }));
  }

  // ── Agent 1: Morning Briefing ──────────────────────────────────────────────
  // CoT: analyze streak + mood → intention → practice → affirmation
  const runMorning = useCallback(async (
    journal: JournalEntry[],
    practices: DailyPractice[]
  ) => {
    patch('morning', { loading: true, error: undefined, content: '' });
    const recentMoods = journal.slice(0, 5)
      .map(e => `${e.mood} "${e.reflection.slice(0, 60)}"`)
      .join('\n') || 'No entries yet.';
    const streak = practices.filter(p => p.spiritual_practice || p.physical_practice).length;
    const hour = new Date().getHours();

    const prompt = `You are an AI mindfulness coach. Reason step by step before writing output.

Context:
- Current hour: ${hour}:00
- Practice streak: ${streak} days
- Recent mood journal (newest first):
${recentMoods}

THINK:
Step 1 — What is the dominant emotional theme from the recent moods?
Step 2 — What does this person most need today (calm, energy, clarity, self-compassion)?
Step 3 — Craft a short daily intention aligned to that need (15–20 words).
Step 4 — Pick one specific mindfulness practice for today and explain why in one sentence.
Step 5 — Write a warm, personalized affirmation (15 words).

OUTPUT (exactly 3 labeled lines, no extra text):
INTENTION: [your intention]
PRACTICE: [practice name] — [one-sentence reason]
AFFIRMATION: [warm affirmation]`;

    try {
      const result = await llm(prompt);
      patch('morning', { loading: false, content: result, timestamp: Date.now() });
    } catch {
      patch('morning', { loading: false, error: 'Could not generate briefing. Check API key.' });
    }
  }, []);

  // ── Agent 2: Pattern Insights ──────────────────────────────────────────────
  // CoT: enumerate moods → identify themes → spot growth → synthesize insight
  const runInsights = useCallback(async (journal: JournalEntry[]) => {
    if (journal.length < 2) {
      patch('insights', { error: 'Add at least 2 journal entries to unlock pattern insights.' });
      return;
    }
    patch('insights', { loading: true, error: undefined, content: '' });
    const entries = journal.slice(0, 10)
      .map(e => `[${e.date}] ${e.mood} "${e.reflection.slice(0, 80)}"`)
      .join('\n');

    const prompt = `You are an AI pattern analyzer for a mindfulness app. Use chain-of-thought reasoning.

Journal entries (newest first):
${entries}

THINK:
Step 1 — List the mood sequence (emojis only, comma-separated).
Step 2 — Identify 1–2 recurring emotional themes or situational triggers.
Step 3 — Find any positive momentum, growth signal, or improvement trend.
Step 4 — Synthesize one compassionate, non-judgmental insight the user would value.

OUTPUT (exactly 4 labeled lines, no extra text):
TREND: [mood sequence → direction: improving / stable / mixed / declining]
THEME: [recurring pattern in ≤12 words]
GROWTH: [positive observation in ≤15 words]
INSIGHT: [compassionate insight in ≤20 words]`;

    try {
      const result = await llm(prompt);
      patch('insights', { loading: false, content: result, timestamp: Date.now() });
    } catch {
      patch('insights', { loading: false, error: 'Could not analyze patterns. Check API key.' });
    }
  }, []);

  // ── Agent 3: Session Recommender ───────────────────────────────────────────
  // CoT: assess state → match time + mood → select best session → explain
  const runRecommend = useCallback(async (journal: JournalEntry[]) => {
    patch('recommend', { loading: true, error: undefined, content: '' });
    const hour = new Date().getHours();
    const tod = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    const latest = journal[0];
    const mood = latest?.mood ?? '😐';
    const reflection = latest?.reflection?.slice(0, 100) ?? 'No recent entry.';
    const history = getSessionHistory();
    const leastDone = ['box-breathing', '4-7-8', 'body-scan', 'loving-kindness',
      'sleep-wind-down', 'mindful-walking', 'coherent-breathing', 'three-breath-reset']
      .sort((a, b) => (history[a] ?? 0) - (history[b] ?? 0))[0];

    const sessions = [
      'Box Breathing (3 min) — sharpen focus & calm anxiety',
      '4-7-8 Relaxation (3 min) — dissolve acute stress fast',
      'Body Scan (4 min) — release physical tension head to toe',
      'Loving-Kindness (5 min) — cultivate self-compassion & warmth',
      'Sleep Wind-Down (7 min) — prepare body & mind for rest',
      'Mindful Walking (5 min) — ground through movement',
      'Coherent Breathing (5 min) — sync heart rate & nervous system',
      'Three-Breath Reset (1 min) — instant nervous system reset',
    ];

    const prompt = `You are a mindfulness session recommender. Think step by step.

User context:
- Time of day: ${tod} (${hour}:00)
- Current mood: ${mood}
- Latest reflection: "${reflection}"
- Least practiced session: ${leastDone}

Available sessions:
${sessions.map((s, i) => `${i + 1}. ${s}`).join('\n')}

THINK:
Step 1 — Assess the user's current emotional and physical state from mood + reflection.
Step 2 — Consider time of day constraints (no Sleep Wind-Down in morning, etc.).
Step 3 — Pick the BEST session. Also consider variety if leastDone is relevant.
Step 4 — Explain your reasoning in 12 words.
Step 5 — Name a backup option.

OUTPUT (exactly 3 labeled lines, no extra text):
PICK: [session name exactly as listed above, no number]
WHY: [reason in ≤12 words]
BACKUP: [backup session name]`;

    try {
      const result = await llm(prompt);
      patch('recommend', { loading: false, content: result, timestamp: Date.now() });
    } catch {
      patch('recommend', { loading: false, error: 'Could not generate recommendation. Check API key.' });
    }
  }, []);

  // ── Agent 4: Weekly Progress Report ───────────────────────────────────────
  // CoT: count → assess → celebrate win → identify focus → motivate
  const runProgress = useCallback(async (
    journal: JournalEntry[],
    practices: DailyPractice[]
  ) => {
    patch('progress', { loading: true, error: undefined, content: '' });
    const weekAgo = Date.now() - 7 * 86_400_000;
    const weekJournal = journal.filter(e => e.timestamp > weekAgo);
    const weekPractices = practices.slice(-7);
    const sessionHistory = getSessionHistory();
    const totalSessions = Object.values(sessionHistory).reduce((a, b) => a + b, 0);
    const activeDays = weekPractices.filter(p => p.spiritual_practice || p.physical_practice).length;
    const moodEmojis = weekJournal.map(e => e.mood).join(' ') || 'none';
    const streak = practices.filter(p => p.spiritual_practice || p.physical_practice).length;

    const prompt = `You are a weekly mindfulness progress coach. Think step by step.

This week's data:
- Journal entries this week: ${weekJournal.length} (moods: ${moodEmojis})
- Practice days logged: ${activeDays}/7
- Total guided sessions completed (all time): ${totalSessions}
- Overall streak: ${streak} days

THINK:
Step 1 — Characterize this week: consistent, inconsistent, beginner, or strong?
Step 2 — Find ONE specific win to celebrate (even tiny: first entry, one session, etc.).
Step 3 — Identify ONE actionable focus for next week.
Step 4 — Write a warm, motivational close in the voice of a kind coach.

OUTPUT (exactly 4 labeled lines, no extra text):
WEEK: [one-word assessment + brief context, ≤10 words]
WIN: [specific win to celebrate, ≤15 words]
FOCUS: [one actionable focus for next week, ≤15 words]
CLOSE: [warm motivational close, ≤20 words]`;

    try {
      const result = await llm(prompt);
      patch('progress', { loading: false, content: result, timestamp: Date.now() });
    } catch {
      patch('progress', { loading: false, error: 'Could not generate report. Check API key.' });
    }
  }, []);

  return { cards, runMorning, runInsights, runRecommend, runProgress };
}
