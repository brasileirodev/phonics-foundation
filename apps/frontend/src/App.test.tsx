import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';
import { api } from './api';
import i18n from './i18n';
vi.mock('./api', () => ({
  api: {
    health: vi.fn(),
    lesson: vi.fn(),
    progress: vi.fn(),
    save: vi.fn(),
    evaluate: vi.fn(),
  },
  getSessionId: () => 'session',
}));
const lesson = {
  id: 'sapo',
  word: 'SAPO',
  language: 'pt-BR',
  steps: [
    {
      id: '1',
      position: 0,
      kind: 'sound' as const,
      highlightedLetters: [0],
      instruction: 'Listen',
      referenceAudioUrl: null,
    },
  ],
};
beforeEach(() => {
  vi.resetAllMocks();
  void i18n.changeLanguage('en');
  vi.mocked(api.health).mockResolvedValue({
    status: 'ok',
    service: 'phonics-api',
  });
  vi.mocked(api.lesson).mockResolvedValue(lesson);
  vi.mocked(api.progress).mockResolvedValue(null);
});
it('shows loading until the API responds', () => {
  vi.mocked(api.health).mockReturnValue(new Promise(() => {}));
  render(<App />);
  expect(screen.getByRole('status')).toHaveTextContent('Connecting');
});
it('loads the lesson and saved progress, saves and labels simulated evaluation', async () => {
  vi.mocked(api.save).mockResolvedValue({
    sessionId: 'session',
    lessonId: 'sapo',
    completedSteps: 1,
    updatedAt: '2026-09-22',
  });
  vi.mocked(api.evaluate).mockResolvedValue({
    success: true,
    simulated: true,
    provider: 'deterministic-mock',
  });
  render(<App />);
  await screen.findByText('Practice space connected');
  fireEvent.click(screen.getByRole('button', { name: 'Try saving progress' }));
  await screen.findByText('1 of 1 steps saved');
  expect(api.save).toHaveBeenCalledWith('session', 1);
  fireEvent.click(
    screen.getByRole('button', { name: 'Run simulated evaluation' }),
  );
  expect(await screen.findByText(/No audio was evaluated/)).toBeInTheDocument();
});
it('shows connection errors and supports retry', async () => {
  vi.mocked(api.health).mockRejectedValueOnce(new Error('offline'));
  render(<App />);
  await screen.findByText(/We could not connect/);
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(
    await screen.findByText('Practice space connected'),
  ).toBeInTheDocument();
});
it('shows save errors and Portuguese resources', async () => {
  await i18n.changeLanguage('pt');
  vi.mocked(api.save).mockRejectedValue(new Error('offline'));
  render(<App />);
  await screen.findByText('Espaço de prática conectado');
  fireEvent.click(
    screen.getByRole('button', { name: 'Testar salvamento de progresso' }),
  );
  expect(
    await screen.findByText(/Não foi possível salvar/),
  ).toBeInTheDocument();
});
