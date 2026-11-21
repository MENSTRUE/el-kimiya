/** V4.3 Typed local-only client, ready for a future React lesson/quiz UI.
 * No VITE_ secrets. Not imported automatically to avoid breaking V3.8 UI.
 * Backend runs at localhost:8000 and stores progress in private SQLite.
 */
const BASE = 'http://127.0.0.1:8000/api/v1/learning';
export type Locale = 'id' | 'en';
export type LearningChoice = { id: string; text: string };
export type LearningQuestion = {
  id: string; topic_id: string; difficulty: number; prompt: string;
  choices: LearningChoice[]; sources: { id: string; title: string; url: string }[];
};
export type LearningProgress = {
  quiz_attempts: number; quiz_correct: number; quiz_accuracy_percent: number | null;
  unique_questions_attempted: number; question_bank_size: number;
  question_bank_coverage_percent: number; flashcards_reviewed: number;
  flashcards_mastered_level_3_plus: number; flashcards_due: number;
  flashcards_total: number; scope: 'single_local_profile'; storage: string;
};
async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
      signal: init?.signal ?? controller.signal,
    });
    if (!response.ok) throw new Error(`Learning API HTTP ${response.status}`);
    return (await response.json()) as T;
  } finally { clearTimeout(timeout); }
}
export const learningBackend = {
  health: () => api<{status: string; topics: number; questions: number; flashcards: number}>('/health'),
  catalog: (lang: Locale) => api<{language: Locale; topics: {id:string;title:string;intro:string;question_count:number;flashcard_count:number}[]}>('/catalog?lang='+lang),
  lesson: (id: string, lang: Locale) => api<{lesson: {id:string;title:string;intro:string;key_points:string[]}}>(`/topics/${encodeURIComponent(id)}?lang=${lang}`),
  questions: (topicId: string, lang: Locale, limit = 20) => api<{total:number;questions:LearningQuestion[]}>(`/questions?topic_id=${encodeURIComponent(topicId)}&lang=${lang}&limit=${limit}`),
  answer: (id: string, choiceId: string, lang: Locale) => api<{is_correct:boolean;correct_choice_id:string;explanation:string}>(`/questions/${encodeURIComponent(id)}/answer`,{method:'POST',body:JSON.stringify({choice_id:choiceId,lang})}),
  flashcards: (lang: Locale, dueOnly=false) => api<{total:number;cards:{id:string;front:string;back:string;due:boolean}[]}>(`/flashcards?lang=${lang}&due_only=${dueOnly}`),
  reviewCard: (id: string, rating: 'again'|'hard'|'good'|'easy') => api<{card_id:string;level:number;due_at:string}>(`/flashcards/${encodeURIComponent(id)}/review`,{method:'POST',body:JSON.stringify({rating})}),
  progress: () => api<LearningProgress>('/progress'),
  daily: (lang: Locale) => api<{date_utc:string;question:LearningQuestion}>(`/daily?lang=${lang}`),
};
