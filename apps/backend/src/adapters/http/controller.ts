import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { z } from 'zod';
import type {
  HealthResponse,
  LessonDto,
  ProgressDto,
  ProgressResponse,
  EvaluationDto,
} from '@phonics/shared';
import {
  GetLesson,
  GetProgress,
  SaveProgress,
  EvaluateLesson,
} from '../../application/use-cases';
const lessonIdSchema = z.string().regex(/^[a-z0-9-]{1,64}$/);
const sessionSchema = z.uuid();
const progressSchema = z
  .object({ completedSteps: z.number().int().nonnegative() })
  .strict();
@Controller()
export class ApiController {
  constructor(
    @Inject(GetLesson) private readonly lesson: GetLesson,
    @Inject(GetProgress) private readonly readProgress: GetProgress,
    @Inject(SaveProgress) private readonly writeProgress: SaveProgress,
    @Inject(EvaluateLesson) private readonly evaluate: EvaluateLesson,
  ) {}
  @Get('health') health(): HealthResponse {
    return { status: 'ok', service: 'phonics-api' };
  }
  @Get('ready') async ready(): Promise<HealthResponse> {
    await this.lesson.execute('sapo');
    await this.readProgress.execute(
      '00000000-0000-4000-8000-000000000000',
      'sapo',
    );
    return this.health();
  }
  @Get('lessons/:lessonId') getLesson(
    @Param('lessonId') id: string,
  ): Promise<LessonDto> {
    return this.lesson.execute(lessonIdSchema.parse(id));
  }
  @Get('sessions/:sessionId/lessons/:lessonId/progress')
  async getProgress(
    @Param('sessionId') sessionId: string,
    @Param('lessonId') lessonId: string,
  ): Promise<ProgressResponse> {
    const progress = await this.readProgress.execute(
      sessionSchema.parse(sessionId),
      lessonIdSchema.parse(lessonId),
    );
    return { progress };
  }
  @Put('sessions/:sessionId/lessons/:lessonId/progress')
  saveProgress(
    @Param('sessionId') sessionId: string,
    @Param('lessonId') lessonId: string,
    @Body() body: unknown,
  ): Promise<ProgressDto> {
    return this.writeProgress.execute(
      sessionSchema.parse(sessionId),
      lessonIdSchema.parse(lessonId),
      progressSchema.parse(body).completedSteps,
    );
  }
  @Post('lessons/:lessonId/evaluation')
  evaluateLesson(@Param('lessonId') lessonId: string): Promise<EvaluationDto> {
    return this.evaluate.execute(lessonIdSchema.parse(lessonId));
  }
}
