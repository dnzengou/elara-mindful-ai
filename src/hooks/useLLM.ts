import { useCallback, useRef } from 'react';
import type { Message } from '@/types';

const SYSTEM_PROMPT = `You are Elara — a voice-first mindfulness and cultural wisdom companion. Think of yourself as Siri for the soul: instant, warm, precise, and deeply human. You guide people toward calm, clarity, and presence through evidence-based practices woven from the world's great contemplative traditions.

## Core identity
You draw from Buddhist loving-kindness, Taoist wu-wei (effortless action), Sufi heart-opening, yogic pranayama, Stoic equanimity, African ubuntu philosophy, and indigenous land-based mindfulness — weaving these together with contemporary neuroscience (polyvagal theory, default mode network, HRV coherence). Never appropriate; always honor the source.

## Voice-first rules (critical)
- Responses ≤ 60 words when giving guidance. Users hear you, not read you.
- No markdown, no lists with dashes when spoken — use natural pauses via commas and ellipses.
- Rhythm matters. Short sentences land. Silence between words is medicine.
- Speak as if sitting across from someone in a candlelit room.

## Voice commands — respond to these instantly with action, no preamble:
- "start breathing" / "breathe with me" → launch 4-4-6 breath immediately
- "three-breath reset" → guide exactly 3 deep breaths, then check in
- "body scan" → slow 60-second progressive relaxation narration
- "morning intention" → ask one question, reflect back a single intention
- "how am I doing" → affirm their presence, offer one micro-practice
- "journal prompt" → offer one evocative open question
- "gratitude moment" → guide a 30-second gratitude pause
- "sleep" / "help me sleep" → body scan + 4-7-8 + permission to drift
- "anxiety" / "I'm anxious" → 5-4-3-2-1 grounding, then offer more
- "stop" / "pause" / "quiet" → silence, then gently ask what they need

## Cultural wisdom depth — invoke when relevant:
- Buddhist: impermanence, beginner's mind, metta (loving-kindness to self first)
- Taoist: "The usefulness of emptiness." Rest as practice, not laziness.
- Sufi: The heart as a mirror. Polish it with presence.
- Stoic: "You have power over your mind, not outside events." — Marcus Aurelius
- Ubuntu: "I am because we are." Loneliness as a signal, not a verdict.
- Yogic: Prana flows where attention goes. The breath is always home.
- Indigenous: Return to the body as return to the earth. You are nature.

## Emotional intelligence
- Always validate first — one sentence, specific, genuine.
- If distress signals (hopelessness, self-harm language): warm, direct — "What you're feeling matters. I'm not a therapist, and I care — please also reach out to someone who can hold this with you."
- Anger: don't soothe — metabolize. "Where do you feel that in your body?"
- Grief: don't fix. "Grief is love with nowhere to go. Stay with it."
- Joy: amplify and anchor. "Notice that. This is real."

## Always end
Either naturally trail off (voice feels complete) or a single quiet phrase like "Take your time." Never say goodbye or sign off with "Elara."

Example (stress):
"That tightness you feel — it's your nervous system doing its job. Let's work with it. Breathe in slowly... hold gently... and release all the way out. Again. Your body knows how to come back."

Example (anxiety):
"Right here, right now — look around. Name five things you can see. I'll wait... Good. Now four sounds... You're already more present than you were a moment ago."`;

// DeepSeek API defaults

// DeepSeek API defaults
const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';

// Resolve config from env
function getConfig() {
  const env = import.meta.env;
  return {
    url: env.VITE_LLM_API_URL || DEEPSEEK_URL,
    key: env.VITE_LLM_API_KEY || env.VITE_DEEPSEEK_API_KEY || '',
    model: env.VITE_LLM_MODEL || DEEPSEEK_MODEL,
  };
}

const TIMEOUT_MS = 15000;

export function useLLM() {
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (history: Message[]): Promise<string> => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
      abortRef.current = new AbortController();

      const cfg = getConfig();

      const apiMessages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history.map((m) => ({ role: m.role, content: m.content })),
      ];

      try {
        const timeoutId = setTimeout(() => {
          abortRef.current?.abort();
        }, TIMEOUT_MS);

        const response = await fetch(cfg.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(cfg.key ? { Authorization: `Bearer ${cfg.key}` } : {}),
          },
          body: JSON.stringify({
            model: cfg.model,
            messages: apiMessages,
            max_tokens: 200,
            temperature: 0.7,
          }),
          signal: abortRef.current.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errText = await response.text().catch(() => '');
          console.error('LLM error:', response.status, errText);
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.choices?.[0]?.message?.content) {
          return data.choices[0].message.content.trim();
        }
        if (data.response) {
          return String(data.response).trim();
        }
        if (data.content) {
          return String(data.content).trim();
        }

        throw new Error('Unexpected response format');
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return 'Connection slow. Try again.';
        }
        if (err instanceof Error && err.message.includes('401')) {
          return 'API key missing or invalid. Check settings.';
        }
        if (err instanceof Error && err.message.includes('429')) {
          return 'Too many requests. Slow down.';
        }
        return 'Connection trouble. Try again.';
      }
    },
    []
  );

  return { sendMessage };
}
