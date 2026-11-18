import { useState } from "react";

export type SavedNote = {
  id: string;
  title: string;
  content: string;
  source: string;
  createdAt: string;
};
export type StudyProgress = { answered: number; correct: number; reviewed: number };

export function useStoredState<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const value = localStorage.getItem(key);
      return value ? (JSON.parse(value) as T) : defaultValue;
    } catch { return defaultValue; }
  });
  const update = (value: T | ((prev: T) => T)) => {
    setState(previous => {
      const next = typeof value === 'function' ? (value as (prev: T) => T)(previous) : value;
      try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* storage may be disabled/full */ }
      return next;
    });
  };
  return [state, update];
}
export function createNote(title: string, content: string, source: string): SavedNote {
  return { id: (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Date.now())), title, content, source, createdAt: new Date().toISOString() };
}
