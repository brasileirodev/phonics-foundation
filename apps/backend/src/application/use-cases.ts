import { ApplicationError, validateProgress } from '../domain/models';
import type {
  LessonRepository,
  ProgressRepository,
  EvaluationService,
} from './ports';
export class GetLesson {
  constructor(private readonly lessons: LessonRepository) {}
  async execute(id: string) {
    const lesson = await this.lessons.findById(id);
    if (!lesson) throw new ApplicationError('NOT_FOUND', 'Lesson not found.');
    return lesson;
  }
}
export class SaveProgress {
  constructor(
    private readonly lessons: GetLesson,
    private readonly progress: ProgressRepository,
  ) {}
  async execute(sessionId: string, lessonId: string, completedSteps: number) {
    const lesson = await this.lessons.execute(lessonId);
    validateProgress(lesson, completedSteps);
    const result = {
      sessionId,
      lessonId,
      completedSteps,
      updatedAt: new Date().toISOString(),
    };
    await this.progress.save(result);
    return result;
  }
}
export class GetProgress {
  constructor(
    private readonly lessons: GetLesson,
    private readonly progress: ProgressRepository,
  ) {}
  async execute(sessionId: string, lessonId: string) {
    await this.lessons.execute(lessonId);
    return this.progress.find(sessionId, lessonId);
  }
}
export class EvaluateLesson {
  constructor(
    private readonly lessons: GetLesson,
    private readonly evaluator: EvaluationService,
  ) {}
  async execute(lessonId: string) {
    return this.evaluator.evaluate(await this.lessons.execute(lessonId));
  }
}
