import type {
  LessonRepository,
  ProgressRepository,
} from '../src/application/ports';
import type { Lesson, Progress } from '../src/domain/models';
export class MemoryLessons implements LessonRepository {
  constructor(public readonly lesson: Lesson) {}
  async findById(id: string) {
    return id === this.lesson.id ? structuredClone(this.lesson) : null;
  }
}
export class MemoryProgress implements ProgressRepository {
  private readonly records = new Map<string, Progress>();
  async save(progress: Progress) {
    this.records.set(
      progress.sessionId + '/' + progress.lessonId,
      structuredClone(progress),
    );
  }
  async find(sessionId: string, lessonId: string) {
    return structuredClone(
      this.records.get(sessionId + '/' + lessonId) ?? null,
    );
  }
}
