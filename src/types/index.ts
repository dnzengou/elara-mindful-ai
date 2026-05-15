export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export type VoiceStatus = 'idle' | 'listening' | 'thinking' | 'speaking';

export type VoiceEngine = 'webSpeech' | 'xai' | 'openai';

export type OpenAIVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

export interface WaveformMode {
  mode: 'idle' | 'listening' | 'thinking' | 'speaking';
  volume: number;
}

// Practice schema types
export interface DailyPractice {
  day: number;
  date: string; // ISO date
  words_of_wisdom: string;
  spiritual_practice: string;
  physical_practice: string;
}

// Journal entry types
export interface JournalEntry {
  id: string;
  date: string; // ISO date
  user: string;
  mood: string;
  reflection: string;
  timestamp: number;
}

// Flowchart types
export interface FlowNode {
  id: string;
  label: string;
}

export interface FlowEdge {
  from: string;
  to: string;
}

export interface FlowchartData {
  nodes: FlowNode[];
  edges: FlowEdge[];
}
