import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client';
export async function seed(url: string) {
  const client = new PrismaClient({
    adapter: new PrismaPg({ connectionString: url }),
  });
  const definitions = [
    {
      kind: 'sound',
      highlightedLetters: [0],
      instruction: 'Listen to the sound of S.',
    },
    {
      kind: 'sound',
      highlightedLetters: [1],
      instruction: 'Listen to the sound of A.',
    },
    {
      kind: 'sound',
      highlightedLetters: [2],
      instruction: 'Listen to the sound of P.',
    },
    {
      kind: 'sound',
      highlightedLetters: [3],
      instruction: 'Listen to the sound of O.',
    },
    {
      kind: 'combination',
      highlightedLetters: [0, 1],
      instruction: 'Combine S and A.',
    },
    {
      kind: 'combination',
      highlightedLetters: [2, 3],
      instruction: 'Combine P and O.',
    },
    {
      kind: 'word',
      highlightedLetters: [0, 1, 2, 3],
      instruction: 'Say the complete word: SAPO.',
    },
  ];
  try {
    await client.$transaction(async (tx) => {
      await tx.lesson.upsert({
        where: { id: 'sapo' },
        create: { id: 'sapo', word: 'SAPO', language: 'pt-BR' },
        update: { word: 'SAPO', language: 'pt-BR' },
      });
      await tx.lessonStep.deleteMany({ where: { lessonId: 'sapo' } });
      await tx.lessonStep.createMany({
        data: definitions.map((step, position) => ({
          ...step,
          id: 'sapo-' + position,
          lessonId: 'sapo',
          position,
          referenceAudioUrl: null,
        })),
      });
    });
  } finally {
    await client.$disconnect();
  }
}
if (require.main === module) {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  seed(process.env.DATABASE_URL)
    .then(() => console.log('SAPO lesson seeded.'))
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
