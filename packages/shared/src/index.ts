export interface HealthResponse {
  status: 'ok';
  service: 'phonics-api';
}
export interface LessonStepDto {
  id: string;
  position: number;
  kind: 'sound' | 'combination' | 'word';
  highlightedLetters: number[];
  instruction: string;
  referenceAudioUrl: string | null;
}
export interface LessonDto {
  id: string;
  word: string;
  language: string;
  steps: LessonStepDto[];
}
export interface SaveProgressRequest {
  completedSteps: number;
}
export interface ProgressDto {
  sessionId: string;
  lessonId: string;
  completedSteps: number;
  updatedAt: string;
}
export interface EvaluationDto {
  success: true;
  simulated: true;
  provider: 'deterministic-mock';
}
export interface ProgressResponse {
  progress: ProgressDto | null;
}
export interface ApiError {
  code: string;
  message: string;
}
