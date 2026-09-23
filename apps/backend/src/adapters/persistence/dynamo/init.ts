import {
  createProgressModel,
  type DynamoSettings,
} from './progress-repository';
import { readConfig } from '../../../composition/config';
export async function initializeTable(settings: DynamoSettings) {
  const { client } = createProgressModel(settings);
  try {
    try {
      await client.describeTable({ TableName: settings.table });
    } catch (error) {
      if (
        !(error instanceof Error) ||
        error.name !== 'ResourceNotFoundException'
      )
        throw error;
      try {
        await client.createTable({
          TableName: settings.table,
          BillingMode: 'PAY_PER_REQUEST',
          AttributeDefinitions: [
            { AttributeName: 'sessionId', AttributeType: 'S' },
            { AttributeName: 'lessonId', AttributeType: 'S' },
          ],
          KeySchema: [
            { AttributeName: 'sessionId', KeyType: 'HASH' },
            { AttributeName: 'lessonId', KeyType: 'RANGE' },
          ],
        });
      } catch (creationError) {
        if (
          !(creationError instanceof Error) ||
          creationError.name !== 'ResourceInUseException'
        )
          throw creationError;
      }
    }
    for (let attempt = 0; attempt < 30; attempt++) {
      const result = await client.describeTable({ TableName: settings.table });
      if (result.Table?.TableStatus === 'ACTIVE') return;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    throw new Error('DynamoDB table did not become active');
  } finally {
    client.destroy();
  }
}
if (require.main === module)
  initializeTable(readConfig().dynamo)
    .then(() => console.log('Progress table ready.'))
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
