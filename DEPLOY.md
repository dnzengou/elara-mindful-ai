# Elara Mindfulness AI - Deploy Guide

A voice-enabled mindfulness companion with TTS/STT, guided sessions, and AI chat. React + TypeScript + Vite.

---

## Quick Start

### Prerequisites

- Node.js 18+ (check: `node -v`)
- npm 9+ (check: `npm -v`)
- Git

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd elara-mindful-ai
npm install
```

### 2. Configure Environment Variables

Copy `.env` and fill in your API keys:

```bash
# .env
VITE_DEEPSEEK_API_KEY=sk-your-deepseek-key-here
VITE_XAI_API_KEY=xai-your-xai-key-here
VITE_OPENAI_API_KEY=sk-your-openai-key-here
```

**Get your keys:**
- **DeepSeek:** https://platform.deepseek.com/api_keys (for AI chat responses)
- **xAI:** https://console.x.ai/ (for Grok TTS/STT streaming voice)
- **OpenAI:** https://platform.openai.com/api-keys (for TTS-1 HD voices)

All keys are optional. If a key is missing, that voice engine degrades gracefully to Browser Native (free, built-in).

### 3. Build Locally

```bash
npm run build
```

Output goes to `dist/`. Preview it:

```bash
npx vite preview
# Opens at http://localhost:4173
```

---

## Deploy to Netlify

### Method A: Git-connected (recommended)

1. Push code to GitHub
2. Go to https://app.netlify.com
3. Click **Add new site > Import an existing project**
4. Select your GitHub repo
5. Build settings (auto-detected or set manually):
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
6. Click **Deploy**

### Method B: Manual upload (drag & drop)

```bash
npm run build
# Go to https://app.netlify.com/drop
# Drag the dist/ folder onto the page
```

### Method C: Netlify CLI

```bash
npm install -g netlify-cli
npm run build
netlify deploy --dir=dist --prod
```

### Environment Variables on Netlify

Go to **Site settings > Environment variables** and add:

| Key | Value |
|-----|-------|
| `VITE_DEEPSEEK_API_KEY` | `sk-your-key` |
| `VITE_XAI_API_KEY` | `xai-your-key` |
| `VITE_OPENAI_API_KEY` | `sk-your-key` |

**Critical:** Must use `VITE_` prefix. Vite only exposes env vars prefixed with `VITE_` to the browser bundle. `XAI_API_KEY` without the prefix will not work.

### Known Netlify Issue (TS18003)

If your build fails with:
```
error TS18003: No inputs were found in config file 'tsconfig.app.json'
```

**Fix:** Remove `tsc -b` from the build script in `package.json`:

```json
{
  "scripts": {
    "build": "vite build"
  }
}
```

Vite handles TypeScript compilation via esbuild. The `tsc -b` step is redundant and fails in CI because project references don't resolve correctly without node_modules cached.

---

## Deploy to Vercel

### Method A: Git-connected (recommended)

1. Push code to GitHub
2. Go to https://vercel.com/new
3. Import your GitHub repo
4. Framework preset: **Vite**
5. Build settings:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
6. Add environment variables (same table as Netlify above)
7. Click **Deploy**

### Method B: Vercel CLI

```bash
npm install -g vercel
npm run build
vercel --prod
```

### Vercel `vercel.json` (optional)

If you need SPA routing (not needed for this single-page app, but good practice):

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## Deploy to GitHub Pages

### Steps

1. Install the `gh-pages` package:

```bash
npm install -D gh-pages
```

2. Update `package.json`:

```json
{
  "scripts": {
    "build": "vite build",
    "deploy": "npm run build && gh-pages -d dist"
  },
  "homepage": "https://yourusername.github.io/elara-mindful-ai"
}
```

3. Update `vite.config.ts` to set the base path:

```ts
export default defineConfig({
  base: '/elara-mindful-ai/',
  // ... rest of config
});
```

4. Deploy:

```bash
npm run deploy
```

---

## Deploy to Cloudflare Pages

1. Push code to GitHub
2. Go to https://dash.cloudflare.com > Pages
3. **Create a project > Connect to Git**
4. Select your repo
5. Build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
6. Add environment variables in the Cloudflare dashboard
7. Click **Save and Deploy**

---

## Deploy to Render (Static Site)

1. Go to https://dashboard.render.com
2. **New > Static Site**
3. Connect your GitHub repo
4. Settings:
   - **Build Command:** `npm run build`
   - **Publish Directory:** `dist`
5. Add environment variables
6. Click **Create Static Site**

---

## Post-Deploy Checklist

1. **Open the deployed URL** in Chrome/Edge (best Web Speech API support)
2. **Test mic permission** — tap the mic button, grant permission
3. **Say something** — you should see the waveform respond and Elara reply
4. **Test text input** — type a message, press Send
5. **Open the side panel** (bottom-right grid icon) > Sessions tab
6. **Start a session** — "Three-Breath Reset" is the fastest test
7. **Check the voice** — if you set xAI/OpenAI keys, switch engine in the top-right dropdown

### Browser Compatibility

| Feature | Chrome/Edge | Firefox | Safari | Mobile |
|---------|-------------|---------|--------|--------|
| Web Speech STT | Full | No | Partial | Full (Android) |
| Web Speech TTS | Full | Full | Full | Full |
| xAI TTS | Full | Full | Full | Full |
| xAI STT WebSocket | Full | Full | Full | Full |
| OpenAI TTS | Full | Full | Full | Full |

**Recommendation:** Chrome/Edge on desktop for full voice features.

---

## Architecture Notes

- **Frontend only** — React SPA, no backend server needed
- **API keys in bundle** — `VITE_*` vars are inlined at build time
- **No database** — localStorage for history, journal, practice tracking
- **Bundle size:** ~342KB JS (108KB gzipped), ~80KB CSS
- **Voice engines:** Pluggable — add more by extending `useVoiceEngine.ts`
