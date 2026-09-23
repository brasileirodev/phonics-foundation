import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client';
import type { LessonRepository } from '../../../application/ports';
import {
  ApplicationError,
  type Lesson,
  type LessonStep,
} from '../../../domain/models';
export class PostgresLessonRepository implements LessonRepository {
  private readonly client: PrismaClient;
  constructor(url: string) {
    this.client = new PrismaClient({
      adapter: new PrismaPg({
        connectionString: url,
        connectionTimeoutMillis: 3000,
      }),
    });
  }
  async findById(id: string): Promise<Lesson | null> {
    try {
      const row = await this.client.lesson.findUnique({
        where: { id },
        include: { steps: { orderBy: { position: 'asc' } } },
      });
      if (!row) return null;
      return {
        id: row.id,
        word: row.word,
        language: row.language,
        steps: row.steps.map((step) => {
          if (!['sound', 'combination', 'word'].includes(step.kind))
            throw new Error('Invalid stored step kind');
          return {
            id: step.id,
            position: step.position,
            kind: step.kind as LessonStep['kind'],
            highlightedLetters: step.highlightedLetters,
            instruction: step.instruction,
            referenceAudioUrl: step.referenceAudioUrl,
          };
        }),
      };
    } catch {
      throw new ApplicationError(
        'PERSISTENCE_UNAVAILABLE',
        'Lesson storage is unavailable.',
      );
    }
  }
  async onModuleDestroy() {
    await this.client.$disconnect();
  }
}
