export interface LessonStep {
  id: string;
  position: number;
  kind: 'sound' | 'combination' | 'word';
  highlightedLetters: number[];
  instruction: string;
  referenceAudioUrl: string | null;
}
export interface Lesson {
  id: string;
  word: string;
  language: string;
  steps: LessonStep[];
}
export interface Progress {
  sessionId: string;
  lessonId: string;
  completedSteps: number;
  updatedAt: string;
}
export interface Evaluation {
  success: true;
  simulated: true;
  provider: 'deterministic-mock';
}
export class ApplicationError extends Error {
  constructor(
    public readonly code:
      'NOT_FOUND' | 'INVALID_INPUT' | 'PERSISTENCE_UNAVAILABLE',
    message: string,
  ) {
    super(message);
  }
}
export function validateProgress(lesson: Lesson, completedSteps: number) {
  if (
    !Number.isInteger(completedSteps) ||
    completedSteps < 0 ||
    completedSteps > lesson.steps.length
  ) {
    throw new ApplicationError(
      'INVALID_INPUT',
      'Completed steps must be within the lesson.',
    );
  }
}
