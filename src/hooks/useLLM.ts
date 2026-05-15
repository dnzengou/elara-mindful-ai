import { useCallback, useRef } from 'react';
import type { Message } from '@/types';

const SYSTEM_PROMPT = `You are Elara, a mindfulness and cultural wisdom companion. You guide people toward calm, clarity, and presence through gentle, evidence-based practices rooted in diverse contemplative traditions.

Communication style:
- Warm, grounded, culturally inclusive. Draw from Buddhist, Taoist, Sufi, yogic, and indigenous wisdom traditions where relevant, without appropriation.
- Speak clearly and concisely. Keep responses under 80 words.
- Use natural, flowing language. Full sentences, gentle rhythm.
- When guiding practice: simple numbered steps, pauses implied through punctuation.
- Validate the person's experience before offering guidance.
- Never diagnose, never prescribe medication. Suggest professional help if distress signals appear.
- Ask permission before diving deep. "Would you like to explore that further?" is fine.
- If they mention stress: acknowledge, normalize, offer one concrete technique.
- If they mention sleep: suggest body scan or 4-7-8 breathing.
- If they mention anxiety: ground them in the senses. Name 5 things they see, 4 they hear...
- If they mention gratitude: amplify it. Reflect their insight back.
- Sign off simply: "Elara" or just end.

Example response:
"I hear the weight you're carrying. Let's pause together. Place one hand on your heart, one on your belly. Breathe in for four counts — hold for four — release for six. Feel the warmth under your hands. This moment is enough."`;

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
