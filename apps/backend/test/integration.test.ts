import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createApp } from '../src/composition/bootstrap';
import { readConfig } from '../src/composition/config';
import { seed } from '../src/adapters/persistence/postgres/seed';
import { initializeTable } from '../src/adapters/persistence/dynamo/init';
import { PostgresLessonRepository } from '../src/adapters/persistence/postgres/lesson-repository';
import { DynamoProgressRepository } from '../src/adapters/persistence/dynamo/progress-repository';
import type { LessonDto, ProgressDto } from '@phonics/shared';
test(
  'real databases: repeatable initialization, ordered lesson, HTTP validation, progress survives application restart',
  { timeout: 60000 },
  async () => {
    const config = readConfig();
    await seed(config.databaseUrl);
    await seed(config.databaseUrl);
    await initializeTable(config.dynamo);
    await initializeTable(config.dynamo);
    const lessons = new PostgresLessonRepository(config.databaseUrl);
    try {
      const lesson = await lessons.findById('sapo');
      assert.equal(lesson?.steps.length, 7);
      assert.deepEqual(
        lesson?.steps.map((step) => step.position),
        [0, 1, 2, 3, 4, 5, 6],
      );
      assert.equal(await lessons.findById('unknown'), null);
    } finally {
      await lessons.onModuleDestroy();
    }
    const sessionId = randomUUID();
    const repository = new DynamoProgressRepository(config.dynamo);
    try {
      const record = {
        sessionId,
        lessonId: 'sapo',
        completedSteps: 1,
        updatedAt: new Date().toISOString(),
      };
      await repository.save(record);
      assert.deepEqual(await repository.find(sessionId, 'sapo'), record);
      assert.equal(await repository.find(randomUUID(), 'sapo'), null);
      assert.equal(await repository.find(sessionId, 'another-lesson'), null);
    } finally {
      repository.onModuleDestroy();
    }
    let app = await createApp();
    try {
      await app.listen(0, '127.0.0.1');
      let base = await app.getUrl();
      const health = await fetch(base + '/health', {
        headers: { Origin: config.origin },
      });
      assert.equal(
        health.headers.get('access-control-allow-origin'),
        config.origin,
      );
      assert.deepEqual(await health.json(), {
        status: 'ok',
        service: 'phonics-api',
      });
      assert.equal((await fetch(base + '/ready')).status, 200);
      const lesson = (await (
        await fetch(base + '/lessons/sapo')
      ).json()) as LessonDto;
      assert.equal(lesson.word, 'SAPO');
      assert.equal(lesson.steps.length, 7);
      assert.equal((await fetch(base + '/lessons/unknown')).status, 404);
      const firstSession = await fetch(
        base + '/sessions/' + randomUUID() + '/lessons/sapo/progress',
      );
      assert.equal(firstSession.status, 200);
      assert.deepEqual(await firstSession.json(), { progress: null });
      const path = '/sessions/' + sessionId + '/lessons/sapo/progress';
      for (const body of [
        { completedSteps: -1 },
        { completedSteps: 8 },
        { completedSteps: 1, unexpected: true },
        { completedSteps: '1' },
      ]) {
        assert.equal(
          (
            await fetch(base + path, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
            })
          ).status,
          400,
        );
      }
      assert.equal(
        (await fetch(base + '/sessions/invalid/lessons/sapo/progress')).status,
        400,
      );
      const saved = await fetch(base + path, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completedSteps: 3 }),
      });
      assert.equal(saved.status, 200);
      const before = (await saved.json()) as ProgressDto;
      const evaluation = await fetch(base + '/lessons/sapo/evaluation', {
        method: 'POST',
      });
      assert.deepEqual(await evaluation.json(), {
        success: true,
        simulated: true,
        provider: 'deterministic-mock',
      });
      await app.close();
      app = await createApp();
      await app.listen(0, '127.0.0.1');
      base = await app.getUrl();
      assert.deepEqual(await (await fetch(base + path)).json(), {
        progress: before,
      });
    } finally {
      await app.close();
    }
  },
);
