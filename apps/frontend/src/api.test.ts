import { afterEach, expect, it, vi } from 'vitest';
import { api, apiBase, getSessionId } from './api';
afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});
it('reads a new session from a valid JSON envelope', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ progress: null }) }),
  );
  await expect(api.progress('session')).resolves.toBeNull();
});
it('uses the API URL and JSON request contract', async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValue({ ok: true, json: async () => ({ completedSteps: 2 }) });
  vi.stubGlobal('fetch', fetchMock);
  await api.save('session', 2);
  expect(fetchMock).toHaveBeenCalledWith(
    'http://localhost:4000/sessions/session/lessons/sapo/progress',
    expect.objectContaining({ method: 'PUT', body: '{"completedSteps":2}' }),
  );
});
it('rejects failed HTTP responses and unsafe configuration', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));
  await expect(api.health()).rejects.toThrow('503');
  expect(() => apiBase('file:///tmp/api')).toThrow();
});
it('persists a valid anonymous ID and repairs malformed local state', () => {
  localStorage.setItem('phonics-session', 'invalid');
  const id = getSessionId();
  expect(id).toMatch(/^[a-f0-9-]{36}$/);
  expect(getSessionId()).toBe(id);
});
