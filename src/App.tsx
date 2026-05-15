import { useState, useCallback, useEffect } from 'react';
import { PermissionScreen } from '@/components/PermissionScreen';
import { VoiceInterface } from '@/components/VoiceInterface';

function hasSttSupport(): boolean {
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

export default function App() {
  const [appState, setAppState] = useState<'permission' | 'voice'>('permission');
  const [hasMic, setHasMic] = useState(false);
  const [permError, setPermError] = useState<string | null>(null);

  // Check if we can skip permission screen (no STT support = text-only mode)
  useEffect(() => {
    if (!hasSttSupport()) {
      setHasMic(false);
      setAppState('voice');
    }
  }, []);

  const handleRequestMic = useCallback(async () => {
    setPermError(null);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasMic(true);
      setAppState('voice');
    } catch {
      setPermError('Mic access denied. You can still use text input.');
    }
  }, []);

  const handleSkip = useCallback(() => {
    setHasMic(false);
    setAppState('voice');
  }, []);

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: 'var(--bg-base)',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      {appState === 'voice' ? (
        <VoiceInterface hasMic={hasMic} />
      ) : (
        <PermissionScreen
          onRequestMic={handleRequestMic}
          onSkip={handleSkip}
          error={permError}
        />
      )}
    </div>
  );
}
