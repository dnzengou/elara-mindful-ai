import { useState, useCallback } from 'react';
import type { DailyPractice } from '@/types';

const STORAGE_KEY = 'elara_practices';

function loadPractices(): DailyPractice[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePractices(list: DailyPractice[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

export function usePractice() {
  const [practices, setPractices] = useState<DailyPractice[]>(loadPractices);

  const getTodayPractice = useCallback((): DailyPractice | undefined => {
    return practices.find((p) => p.date === getToday());
  }, [practices]);

  const updateToday = useCallback(
    (updates: Partial<DailyPractice>) => {
      const today = getToday();
      setPractices((prev) => {
        const existing = prev.findIndex((p) => p.date === today);
        let next: DailyPractice[];
        if (existing >= 0) {
          next = [...prev];
          next[existing] = { ...next[existing], ...updates };
        } else {
          const dayNum = prev.length + 1;
          const newEntry: DailyPractice = {
            day: dayNum,
            date: today,
            words_of_wisdom: '',
            spiritual_practice: '',
            physical_practice: '',
            ...updates,
          };
          next = [...prev, newEntry];
        }
        savePractices(next);
        return next;
      });
    },
    []
  );

  return { practices, getTodayPractice, updateToday };
}
