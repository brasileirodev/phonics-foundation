import type {
  HealthResponse,
  LessonDto,
  ProgressDto,
  ProgressResponse,
  EvaluationDto,
} from '@phonics/shared';
export function apiBase(
  value: string = import.meta.env.VITE_API_URL || 'http://localhost:4000',
) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol))
    throw new Error('VITE_API_URL must use HTTP or HTTPS');
  return url.toString().replace(/\/$/, '');
}
export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiBase() + path, {
    ...init,
    signal: init?.signal ?? AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error('API request failed: ' + response.status);
  return response.json() as Promise<T>;
}
export const api = {
  health: () => request<HealthResponse>('/health'),
  lesson: () => request<LessonDto>('/lessons/sapo'),
  progress: (session: string) =>
    request<ProgressResponse>(
      '/sessions/' + session + '/lessons/sapo/progress',
    ).then((response) => response.progress),
  save: (session: string, completedSteps: number) =>
    request<ProgressDto>('/sessions/' + session + '/lessons/sapo/progress', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completedSteps }),
    }),
  evaluate: () =>
    request<EvaluationDto>('/lessons/sapo/evaluation', { method: 'POST' }),
};
export function getSessionId() {
  const saved = localStorage.getItem('phonics-session');
  if (
    saved &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      saved,
    )
  )
    return saved;
  const id = crypto.randomUUID();
  localStorage.setItem('phonics-session', id);
  return id;
}
