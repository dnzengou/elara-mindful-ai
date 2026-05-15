import { useState, useCallback, useEffect } from 'react';
import type { Message } from '@/types';

const STORAGE_KEY = 'elara_history';
const MAX_MESSAGES = 50;

function loadMessages(): Message[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (m): m is Message =>
        m &&
        typeof m.content === 'string' &&
        typeof m.timestamp === 'number' &&
        (m.role === 'user' || m.role === 'assistant')
    );
  } catch {
    return [];
  }
}

function saveMessages(msgs: Message[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));
  } catch {
    // Silently fail if localStorage is full
  }
}

export function useConversation() {
  const [messages, setMessages] = useState<Message[]>(loadMessages);

  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  const addMessage = useCallback((role: Message['role'], content: string) => {
    const msg: Message = { role, content, timestamp: Date.now() };
    setMessages((prev) => {
      const next = [...prev, msg];
      if (next.length > MAX_MESSAGES) {
        return next.slice(next.length - MAX_MESSAGES);
      }
      return next;
    });
    return msg;
  }, []);

  const clearHistory = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { messages, addMessage, clearHistory };
}
