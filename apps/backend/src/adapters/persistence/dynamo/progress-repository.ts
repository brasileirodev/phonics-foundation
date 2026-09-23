import dynamoose from 'dynamoose';
import { Item } from 'dynamoose/dist/Item';
import type { ProgressRepository } from '../../../application/ports';
import { ApplicationError, type Progress } from '../../../domain/models';
export interface DynamoSettings {
  endpoint: string;
  table: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
}
class ProgressItem extends Item {
  sessionId!: string;
  lessonId!: string;
  completedSteps!: number;
  updatedAt!: string;
}
export function createProgressModel(settings: DynamoSettings) {
  const instance = new dynamoose.Instance();
  const client = new dynamoose.aws.ddb.DynamoDB({
    endpoint: settings.endpoint,
    region: settings.region,
    credentials: {
      accessKeyId: settings.accessKeyId,
      secretAccessKey: settings.secretAccessKey,
    },
    maxAttempts: 3,
  });
  instance.aws.ddb.set(client);
  const model = dynamoose.model<ProgressItem>(
    settings.table,
    new dynamoose.Schema({
      sessionId: { type: String, hashKey: true },
      lessonId: { type: String, rangeKey: true },
      completedSteps: { type: Number, required: true },
      updatedAt: { type: String, required: true },
    }),
  );
  new instance.Table(settings.table, [model], {
    create: false,
    update: false,
    waitForActive: false,
  });
  return { model, client };
}
export class DynamoProgressRepository implements ProgressRepository {
  private readonly connection;
  constructor(settings: DynamoSettings) {
    this.connection = createProgressModel(settings);
  }
  async save(progress: Progress): Promise<void> {
    try {
      await this.connection.model.create(progress, { overwrite: true });
    } catch {
      throw new ApplicationError(
        'PERSISTENCE_UNAVAILABLE',
        'Progress storage is unavailable.',
      );
    }
  }
  async find(sessionId: string, lessonId: string): Promise<Progress | null> {
    try {
      const row = await this.connection.model.get(
        { sessionId, lessonId },
        { consistent: true },
      );
      return row
        ? {
            sessionId: row.sessionId,
            lessonId: row.lessonId,
            completedSteps: row.completedSteps,
            updatedAt: row.updatedAt,
          }
        : null;
    } catch {
      throw new ApplicationError(
        'PERSISTENCE_UNAVAILABLE',
        'Progress storage is unavailable.',
      );
    }
  }
  onModuleDestroy() {
    this.connection.client.destroy();
  }
}
