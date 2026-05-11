# Tech Spec — Elara Mindfulness AI

## Karpathy-Style Overview
Voice-enabled mindfulness companion. Single page. No routing. Web Speech APIs for TTS/STT. Canvas waveform. LLM for caveman responses. Store history in localStorage.

No over-engineering. No speculative abstractions.

---

## Dependencies

| Package | Version | Purpose |
|---|---|---|
| `react` | `^19.1` | UI framework |
| `react-dom` | `^19.1` | DOM renderer |
| `vite` | `^6.3` | Build tool |
| `@vitejs/plugin-react` | `^4.5` | React Vite plugin |
| `typescript` | `^5.8` | Type safety |
| `tailwindcss` | `^4.1` | Utility CSS |
| `@tailwindcss/vite` | `^4.1` | Tailwind Vite integration |
| `gsap` | `^3.12` | Entrance animations, text reveals |

No router needed (single page). No state library needed (simple state, useReducer sufficient). No icon library (3 SVGs, inline). No shadcn (custom components, simpler than shadcn setup).

---

## State & Logic Plan

### useVoiceManager Hook
Orchestrates the entire voice flow. Core of the app.

State machine:
```
idle → listening → thinking → speaking → idle
```

Responsibilities:
- Manage `SpeechRecognition` instance (create once, reuse)
- Manage `SpeechSynthesis` instance (cancel previous, speak new)
- Handle silence detection (3s timer resets on each speech event)
- Send STT result to LLM API
- Trigger TTS on LLM response
- Emit state transitions via callback (no direct UI coupling)

Refs, not state, for:
- Current transcript text (updates frequently during recognition)
- Silence timeout ID
- Animation frame ID for waveform volume data
- Recognition/synthesis instances (created once in useEffect)

### useWaveform Hook
Manages Canvas 2D rendering. Completely separate from React render cycle.

Responsibilities:
- Own the canvas ref
- Run `requestAnimationFrame` loop
- Accept `amplitudeTarget` and `mode` (idle/listening/thinking/speaking) via refs
- Lerp amplitude smoothly each frame
- Draw dual-layer sine wave with noise

Input via refs (not state, to avoid re-renders):
- `modeRef`: string — current waveform mode
- `volumeRef`: number — 0-1 normalized volume from STT/TTS

### useConversation Hook
Manages conversation history.

Responsibilities:
- Load from localStorage on mount
- Save to localStorage on each message addition
- Provide `addMessage(role, content)` function
- Provide `clearHistory()` function
- Enforce 50-message limit (trim oldest)

State shape:
```ts
interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}
```

### useLLM Hook
Sends messages to LLM API.

Responsibilities:
- Accept conversation history
- Append caveman system prompt
- POST to API endpoint
- Return promise with response text
- Handle timeout (15s) and network errors

---

## Component Inventory

### App (root)
No layout wrapper. Renders permission state or voice-active state based on mic permission. Manages GSAP entrance animations on mount.

### PermissionScreen
Props: `onRequestMic: () => Promise<void>`
- Brand mark "Elara" + subtitle
- Mic permission button (circular, 80px)
- Hint text below
- Error state display
- GSAP entrance animation on mount

### VoiceInterface
Props: `onReset: () => void`
- Composes StatusBar, WaveformCanvas, Transcript
- Owns the conversation state (useConversation)
- Connects voice manager events to transcript display

### StatusBar
Props: `status: 'idle' | 'listening' | 'thinking' | 'speaking'`
- Fixed top bar
- Brand label left
- Status dot + label center-left (dot has CSS pulse animation per status)
- Mute button + Clear button right

### WaveformCanvas
Props: `mode: string`, `volume: number`
- Canvas element, ref-based
- useWaveform hook handles all rendering
- Listens to mode/volume changes via effect that writes to refs
- Responsive: canvas width matches container, capped at 600px

### Transcript
Props: `messages: Message[]`, `isSpeaking: boolean`, `currentUtterance: string`
- Scrollable message list
- UserMessage and AIMessage sub-components
- Auto-scroll with manual override detection
- Word-by-word reveal on AI messages (GSAP SplitText or manual word stagger)

### UserMessage
Props: `content: string`, `timestamp: number`
- Right-aligned bubble with card styling
- Timestamp below

### AIMessage
Props: `content: string`, `timestamp: number`, `animate: boolean`
- Left-aligned, no bubble background (transparent)
- Word-by-word fade reveal on first render
- Timestamp below

### MicButton
Props: `onClick: () => void`, `hasError: boolean`
- Circular 80px button
- Mic icon SVG
- Hover/active states

---

## Other Key Decisions

### Web Speech API
Use native `webkitSpeechRecognition` (Chrome/Edge) and `speechSynthesis` (all modern browsers). No fallback library needed — if unsupported, degrade gracefully to text-only mode.

### LLM API
Endpoint configurable via env var. Default to OpenAI-compatible `/chat/completions`. Caveman system prompt prepended to every request.

### Canvas Rendering
Raw Canvas 2D API, no library. ~60 lines of draw logic. Single RAF loop. All state via refs.

### No PWA / Service Worker
Out of scope. Single-page web app.

### Font Loading
Inter from Google Fonts via `<link>` in index.html. `font-display: swap`.

### localStorage
Simple JSON serialization. No encryption. 50-message limit keeps size small.
