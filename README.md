# Elara - Mindfulness AI Companion

Voice-enabled mindfulness app with guided sessions, AI coaching, and daily practice tracking. Inspired by Headspace and Petit Bambou.

## Stack

React 19 + TypeScript + Vite + Tailwind CSS + GSAP + Web Speech API

## Features

- **Two-way voice chat** — Speak to Elara, she listens, thinks, speaks back
- **3 voice engines** — Browser Native (free), xAI Grok (streaming), OpenAI TTS (6 HD voices)
- **8 guided sessions** — Box Breathing, 4-7-8, Body Scan, Loving-Kindness, Sleep Wind-Down, Mindful Walking, Coherent Breathing, Three-Breath Reset
- **Breathing animation** — Visual circle synced to inhale/hold/exhale phases
- **Daily Practice** — Words of Wisdom, Spiritual Practice, Physical Practice with curated suggestions
- **Journal** — Mood + reflection entries with timestamps
- **Daily Flow** — Time-aware routine visualization
- **Dark immersive UI** — Calm amber/teal palette, 60fps waveform

## Quick Start

```bash
npm install
# Add API keys to .env (see .env.example)
npm run build
npx vite preview
```

## Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `VITE_DEEPSEEK_API_KEY` | AI chat responses via DeepSeek | Yes |
| `VITE_XAI_API_KEY` | xAI Grok TTS/STT voice | No |
| `VITE_OPENAI_API_KEY` | OpenAI TTS (6 voices) | No |

**Note:** All vars must start with `VITE_` for Vite to expose them to the browser.

## Deploy

See [DEPLOY.md](../DEPLOY.md) for step-by-step guides for Netlify, Vercel, GitHub Pages, Cloudflare Pages, and Render.

### One-liner deploy

**Netlify:** `npm run build && npx netlify deploy --dir=dist --prod`

**Vercel:** `npm run build && npx vercel --prod`

**GitHub Pages:** `npm install -D gh-pages && npm run deploy`

## Voice Engines

| Engine | STT | TTS | Cost |
|--------|-----|-----|------|
| Browser Native | `webkitSpeechRecognition` | `speechSynthesis` | Free |
| xAI Grok | WebSocket streaming | `grok-tts` / `cove` | Per xAI pricing |
| OpenAI TTS | Browser STT fallback | `tts-1` (6 voices) | Per OpenAI pricing |

OpenAI voices: Nova (warm, default), Alloy (balanced), Shimmer (bright), Echo (warm), Fable (British), Onyx (deep).

## Project Structure

```
src/
  components/    — React components (UI, Player, Tabs, Panels)
  data/          — Session library (8 guided exercises)
  hooks/         — Voice engine, conversation, sessions, practice, journal
  types/         — TypeScript interfaces
  App.tsx        — Root component
```

## License

MIT
