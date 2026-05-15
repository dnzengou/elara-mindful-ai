import { useState, useCallback } from 'react';
import type { JournalEntry } from '@/types';

const STORAGE_KEY = 'elara_journal';
const MOODS = ['😊', '😌', '😐', '😔', '😤', '😴', '✨', '💪'];

function loadEntries(): JournalEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : getDefaultEntries();
  } catch {
    return getDefaultEntries();
  }
}

function saveEntries(list: JournalEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function getDefaultEntries(): JournalEntry[] {
  return [
    {
      id: 'demo-1',
      date: '2025-08-24',
      user: 'Des',
      mood: '😊',
      reflection: 'Today I felt more grounded after the mindful walking practice.',
      timestamp: Date.now() - 86400000,
    },
  ];
}

export function useJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>(loadEntries);

  const addEntry = useCallback(
    (mood: string, reflection: string, user: string = 'Des') => {
      const entry: JournalEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        date: new Date().toISOString().split('T')[0],
        user,
        mood,
        reflection,
        timestamp: Date.now(),
      };
      setEntries((prev) => {
        const next = [entry, ...prev];
        saveEntries(next);
        return next;
      });
    },
    []
  );

  const deleteEntry = useCallback((id: string) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id);
      saveEntries(next);
      return next;
    });
  }, []);

  return { entries, addEntry, deleteEntry, moods: MOODS };
}
