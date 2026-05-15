import { useState, useCallback, useRef, useEffect } from 'react';
import type { MindfulnessSession, SessionPhase } from '@/types/sessions';

const STORAGE_KEY = 'elara_session_history';

interface CompletedSession {
  sessionId: string;
  completedAt: number;
}

function loadHistory(): CompletedSession[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}
function saveHistory(h: CompletedSession[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(h));
}

export function useSessions() {
  const [activeSession, setActiveSession] = useState<MindfulnessSession | null>(null);
  const [phase, setPhase] = useState<SessionPhase>('idle');
  const [stepIndex, setStepIndex] = useState(0);
  const [stepRemaining, setStepRemaining] = useState(0);
  const [totalRemaining, setTotalRemaining] = useState(0);
  const [history, setHistory] = useState<CompletedSession[]>(loadHistory);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pauseTimeRef = useRef<number>(0);

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const startSession = useCallback((session: MindfulnessSession) => {
    clearTimer();
    setActiveSession(session);
    setPhase('intro');
    setStepIndex(0);
    setStepRemaining(session.steps[0]?.duration || 0);
    setTotalRemaining(session.duration);
  }, [clearTimer]);

  // Main timer tick
  useEffect(() => {
    if (phase !== 'playing' || !activeSession) return;

    timerRef.current = setInterval(() => {
      setStepRemaining(prev => {
        if (prev <= 1) {
          // Advance to next step
          setStepIndex(idx => {
            const nextIdx = idx + 1;
            if (nextIdx >= activeSession.steps.length) {
              // Session complete
              clearTimer();
              setPhase('completed');
              setHistory(h => {
                const updated = [...h, { sessionId: activeSession.id, completedAt: Date.now() }];
                saveHistory(updated);
                return updated;
              });
              return 0;
            }
            setStepRemaining(activeSession.steps[nextIdx].duration);
            return nextIdx;
          });
          return 0;
        }
        return prev - 1;
      });
      setTotalRemaining(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, activeSession, clearTimer]);

  const play = useCallback(() => {
    if (phase === 'intro') { setPhase('playing'); }
    else if (phase === 'paused') { setPhase('playing'); }
  }, [phase]);

  const pause = useCallback(() => {
    if (phase === 'playing') {
      clearTimer();
      setPhase('paused');
      pauseTimeRef.current = Date.now();
    }
  }, [phase, clearTimer]);

  const stop = useCallback(() => {
    clearTimer();
    setPhase('idle');
    setActiveSession(null);
    setStepIndex(0);
    setStepRemaining(0);
    setTotalRemaining(0);
  }, [clearTimer]);

  const completionCount = useCallback((sessionId: string) => {
    return history.filter(h => h.sessionId === sessionId).length;
  }, [history]);

  const currentStep = activeSession?.steps[stepIndex] || null;

  return {
    activeSession,
    phase,
    stepIndex,
    stepRemaining,
    totalRemaining,
    currentStep,
    startSession,
    play,
    pause,
    stop,
    completionCount,
  };
}
