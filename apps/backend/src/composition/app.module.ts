import { Module } from '@nestjs/common';
import { ApiController } from '../adapters/http/controller';
import { PostgresLessonRepository } from '../adapters/persistence/postgres/lesson-repository';
import { DynamoProgressRepository } from '../adapters/persistence/dynamo/progress-repository';
import { SimulatedEvaluator } from '../adapters/evaluation/simulated-evaluator';
import {
  GetLesson,
  GetProgress,
  SaveProgress,
  EvaluateLesson,
} from '../application/use-cases';
import type {
  LessonRepository,
  ProgressRepository,
  EvaluationService,
} from '../application/ports';
import {
  CONFIG,
  LESSON_REPOSITORY,
  PROGRESS_REPOSITORY,
  EVALUATION_SERVICE,
} from './tokens';
import { readConfig } from './config';
type Config = ReturnType<typeof readConfig>;
@Module({
  controllers: [ApiController],
  providers: [
    { provide: CONFIG, useFactory: () => readConfig() },
    {
      provide: LESSON_REPOSITORY,
      inject: [CONFIG],
      useFactory: (config: Config) =>
        new PostgresLessonRepository(config.databaseUrl),
    },
    {
      provide: PROGRESS_REPOSITORY,
      inject: [CONFIG],
      useFactory: (config: Config) =>
        new DynamoProgressRepository(config.dynamo),
    },
    { provide: EVALUATION_SERVICE, useClass: SimulatedEvaluator },
    {
      provide: GetLesson,
      inject: [LESSON_REPOSITORY],
      useFactory: (repository: LessonRepository) => new GetLesson(repository),
    },
    {
      provide: GetProgress,
      inject: [GetLesson, PROGRESS_REPOSITORY],
      useFactory: (lesson: GetLesson, repository: ProgressRepository) =>
        new GetProgress(lesson, repository),
    },
    {
      provide: SaveProgress,
      inject: [GetLesson, PROGRESS_REPOSITORY],
      useFactory: (lesson: GetLesson, repository: ProgressRepository) =>
        new SaveProgress(lesson, repository),
    },
    {
      provide: EvaluateLesson,
      inject: [GetLesson, EVALUATION_SERVICE],
      useFactory: (lesson: GetLesson, evaluator: EvaluationService) =>
        new EvaluateLesson(lesson, evaluator),
    },
  ],
})
export class AppModule {}
