import { useCallback, useEffect, useRef, useState } from 'react';
import { StatusBar } from './StatusBar';
import { WaveformCanvas } from './WaveformCanvas';
import { Transcript } from './Transcript';
import { SidePanel } from './SidePanel';
import { VoiceEngineSwitcher } from './VoiceEngineSwitcher';
import { SessionOverlay } from './SessionOverlay';
import { useConversation } from '@/hooks/useConversation';
import { useVoiceEngine } from '@/hooks/useVoiceEngine';
import { useSessions } from '@/hooks/useSessions';
import { getSessionById } from '@/data/sessions';
import type { VoiceEngine } from '@/types';

interface VoiceInterfaceProps {
  hasMic: boolean;
}

export function VoiceInterface({ hasMic }: VoiceInterfaceProps) {
  const { messages, addMessage, clearHistory } = useConversation();
  const hasStartedRef = useRef(false);
  const [textInput, setTextInput] = useState('');

  const {
    engine, setEngine, openaiVoice, setOpenAIVoice, status, interimTranscript, error, isMuted,
    startListening, stopListening, toggleMute, cancelSpeech, sendText,
  } = useVoiceEngine();

  // Sessions
  const sessions = useSessions();

  const onUserMsg = useCallback((c: string) => addMessage('user', c), [addMessage]);
  const onAsstMsg = useCallback((c: string) => addMessage('assistant', c), [addMessage]);

  // Start session handler
  const handleStartSession = useCallback((id: string) => {
    const session = getSessionById(id);
    if (!session) return;
    sessions.startSession(session);
  }, [sessions]);

  // Stop session handler
  const handleStopSession = useCallback(() => {
    sessions.stop();
  }, [sessions]);

  // Speak for session TTS — uses same engine as chat
  const handleSessionSpeak = useCallback((text: string) => {
    // Use browser TTS directly for session narration
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.82;
    u.pitch = 0.95;
    u.volume = 0.9;
    const voices = window.speechSynthesis.getVoices();
    const best = voices.find(v => /Google UK English Female|Samantha|Victoria|Moira|Fiona/i.test(v.name))
      || voices.find(v => v.lang.startsWith('en'));
    if (best) u.voice = best;
    window.speechSynthesis.speak(u);
  }, []);

  // Auto-start listening
  useEffect(() => {
    if (!hasMic || sessions.phase !== 'idle') return;
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    const timer = setTimeout(() => startListening(onUserMsg, onAsstMsg), 600);
    return () => clearTimeout(timer);
  }, [hasMic, sessions.phase, startListening, onUserMsg, onAsstMsg]);

  // Resume listening after session
  useEffect(() => {
    if (sessions.phase === 'idle' && hasMic) {
      const timer = setTimeout(() => startListening(onUserMsg, onAsstMsg), 300);
      return () => clearTimeout(timer);
    }
  }, [sessions.phase, hasMic, startListening, onUserMsg, onAsstMsg]);

  const volume =
    status === 'listening' ? 0.5 + Math.random() * 0.3
    : status === 'speaking' ? 0.4 + Math.random() * 0.3
    : status === 'thinking' ? 0.2 : 0.05;

  const handleWaveformClick = useCallback(() => {
    if (sessions.phase !== 'idle') return; // Don't interfere during session
    if (!hasMic) return;
    if (status === 'idle') startListening(onUserMsg, onAsstMsg);
    else if (status === 'listening') stopListening();
    else if (status === 'speaking') cancelSpeech();
  }, [hasMic, sessions.phase, status, startListening, stopListening, cancelSpeech, onUserMsg, onAsstMsg]);

  const handleTextSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    sendText(textInput.trim(), onUserMsg, onAsstMsg);
    setTextInput('');
  }, [textInput, sendText, onUserMsg, onAsstMsg]);

  const isTextOnly = !hasMic;
  const isSessionActive = sessions.phase !== 'idle';

  return (
    <div className="fixed inset-0 flex flex-col items-center" style={{ backgroundColor: 'var(--bg-base)' }}>
      <StatusBar
        status={isSessionActive ? 'speaking' : status}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onClear={clearHistory}
        voiceEngineSwitcher={
          <VoiceEngineSwitcher
            engine={engine}
            openaiVoice={openaiVoice}
            onChangeEngine={(e: VoiceEngine) => setEngine(e)}
            onChangeVoice={setOpenAIVoice}
          />
        }
      />

      <div style={{ height: 56 }} />

      {/* Session Overlay */}
      {isSessionActive && sessions.activeSession && (
        <SessionOverlay
          session={sessions.activeSession}
          phase={sessions.phase}
          stepIndex={sessions.stepIndex}
          stepRemaining={sessions.stepRemaining}
          totalRemaining={sessions.totalRemaining}
          onPlay={sessions.play}
          onPause={sessions.pause}
          onStop={handleStopSession}
          onSpeak={handleSessionSpeak}
        />
      )}

      {/* Text-only banner */}
      {isTextOnly && !isSessionActive && (
        <div className="w-full text-center py-2 px-4 text-xs font-medium shrink-0"
          style={{ color: 'var(--accent-amber)', background: 'rgba(212, 168, 83, 0.08)' }}>
          Text mode — type below to chat with Elara
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center w-full px-4 min-h-0">
        {status === 'listening' && interimTranscript && (
          <div className="text-center mb-4 px-4 py-2 animate-pulse"
            style={{ color: 'var(--text-secondary)', fontSize: 15, fontStyle: 'italic', minHeight: 28 }}>
            {interimTranscript}
          </div>
        )}
        {status !== 'listening' && !isTextOnly && <div style={{ minHeight: 28 }} />}
        {isTextOnly && <div style={{ minHeight: 8 }} />}

        <div className="flex-1 flex items-center justify-center w-full min-h-0">
          <WaveformCanvas mode={isTextOnly ? 'idle' : status} volume={isTextOnly ? 0.05 : volume}
            onClick={handleWaveformClick} />
        </div>
      </div>

      {/* Transcript */}
      <div className="w-full flex justify-center shrink-0">
        <Transcript messages={messages} />
      </div>

      {error && (
        <div className="w-full text-center py-2 px-4 text-xs font-medium"
          style={{ color: 'var(--error-red)', background: 'rgba(224, 85, 85, 0.08)' }}>
          {error}
        </div>
      )}

      {/* Text input */}
      <form onSubmit={handleTextSubmit} className="w-full flex justify-center px-4 pb-4 pt-2 shrink-0">
        <div className="flex items-center gap-2 w-full" style={{ maxWidth: 600 }}>
          <input type="text" value={textInput} onChange={(e) => setTextInput(e.target.value)}
            placeholder={isTextOnly ? 'Type your message to Elara...' : 'Type to Elara...'}
            className="flex-1 px-4 py-3 rounded-xl text-base outline-none transition-all duration-150"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-amber)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }} />
          <button type="submit"
            className="px-5 py-3 rounded-xl text-base font-medium transition-all duration-150 cursor-pointer"
            style={{ background: 'var(--accent-amber)', color: 'var(--bg-base)' }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}>
            Send
          </button>
        </div>
      </form>

      {/* Side Panel */}
      <SidePanel onStartSession={handleStartSession} completionCount={sessions.completionCount} />
    </div>
  );
}
