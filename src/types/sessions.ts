export type SessionCategory = 'breathing' | 'bodyscan' | 'sleep' | 'walking' | 'quick' | 'lovingkindness';

export interface SessionStep {
  text: string;
  duration: number; // seconds
  breathIn?: number;  // inhale seconds (for breathing animation)
  breathHold?: number; // hold seconds
  breathOut?: number;  // exhale seconds
}

export interface MindfulnessSession {
  id: string;
  title: string;
  description: string;
  category: SessionCategory;
  duration: number; // total seconds
  steps: SessionStep[];
  color: string; // accent color
}

export type SessionPhase = 'idle' | 'intro' | 'playing' | 'paused' | 'completed';

export interface SessionState {
  phase: SessionPhase;
  session: MindfulnessSession | null;
  currentStepIndex: number;
  stepTimeRemaining: number;
  totalTimeRemaining: number;
}
