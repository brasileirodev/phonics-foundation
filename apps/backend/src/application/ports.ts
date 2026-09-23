import type { Evaluation, Lesson, Progress } from '../domain/models';
export interface LessonRepository {
  findById(id: string): Promise<Lesson | null>;
}
export interface ProgressRepository {
  save(progress: Progress): Promise<void>;
  find(sessionId: string, lessonId: string): Promise<Progress | null>;
}
export interface EvaluationService {
  evaluate(lesson: Lesson): Promise<Evaluation>;
}
