import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  GetLesson,
  GetProgress,
  SaveProgress,
  EvaluateLesson,
} from '../src/application/use-cases';
import { MemoryLessons, MemoryProgress } from './in-memory';
import { SimulatedEvaluator } from '../src/adapters/evaluation/simulated-evaluator';
import { ApplicationError } from '../src/domain/models';
import { readConfig } from '../src/composition/config';
function fixture() {
  const lesson = new GetLesson(
    new MemoryLessons({
      id: 'sapo',
      word: 'SAPO',
      language: 'pt-BR',
      steps: [
        {
          id: 'sapo-0',
          position: 0,
          kind: 'word',
          highlightedLetters: [0, 1, 2, 3],
          instruction: 'Say SAPO',
          referenceAudioUrl: null,
        },
      ],
    }),
  );
  const progress = new MemoryProgress();
  return {
    lesson,
    save: new SaveProgress(lesson, progress),
    read: new GetProgress(lesson, progress),
    evaluate: new EvaluateLesson(lesson, new SimulatedEvaluator()),
  };
}
test('retrieves a lesson and reports missing lessons', async () => {
  const { lesson } = fixture();
  assert.equal((await lesson.execute('sapo')).word, 'SAPO');
  await assert.rejects(
    lesson.execute('missing'),
    (error) => error instanceof ApplicationError && error.code === 'NOT_FOUND',
  );
});
test('saves, reads, overwrites and isolates anonymous progress', async () => {
  const { save, read } = fixture();
  assert.equal(await read.execute('one', 'sapo'), null);
  const progress = await save.execute('one', 'sapo', 1);
  assert.deepEqual(await read.execute('one', 'sapo'), progress);
  assert.equal(await read.execute('two', 'sapo'), null);
  await save.execute('one', 'sapo', 0);
  assert.equal((await read.execute('one', 'sapo'))?.completedSteps, 0);
});
test('rejects invalid step counts and unknown lessons before persistence', async () => {
  const { save, read } = fixture();
  for (const count of [-1, 0.5, 2, NaN])
    await assert.rejects(save.execute('one', 'sapo', count), ApplicationError);
  await assert.rejects(save.execute('one', 'missing', 0), ApplicationError);
  assert.equal(await read.execute('one', 'sapo'), null);
});
test('evaluation is deterministic and explicitly simulated', async () => {
  const { evaluate } = fixture();
  assert.deepEqual(await evaluate.execute('sapo'), {
    success: true,
    simulated: true,
    provider: 'deterministic-mock',
  });
  assert.deepEqual(
    await evaluate.execute('sapo'),
    await evaluate.execute('sapo'),
  );
  await assert.rejects(evaluate.execute('missing'), ApplicationError);
});
test('startup rejects invalid configuration without disclosing values', () => {
  assert.throws(
    () => readConfig({ DATABASE_URL: 'secret-value' }),
    /Invalid environment/,
  );
  try {
    readConfig({ DATABASE_URL: 'secret-value' });
  } catch (error) {
    assert.ok(!String(error).includes('secret-value'));
  }
});
