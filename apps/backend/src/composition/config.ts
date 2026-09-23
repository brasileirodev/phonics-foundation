import 'dotenv/config';
import { z } from 'zod';
const schema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  FRONTEND_ORIGIN: z.url(),
  DATABASE_URL: z.string().regex(/^postgres(ql)?:\/\//),
  DYNAMODB_ENDPOINT: z.url(),
  DYNAMODB_TABLE: z.string().regex(/^[a-zA-Z0-9_.-]{3,255}$/),
  AWS_REGION: z.string().min(1),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
});
export function readConfig(env: NodeJS.ProcessEnv = process.env) {
  const result = schema.safeParse(env);
  if (!result.success)
    throw new Error(
      'Invalid environment: ' +
        result.error.issues.map((issue) => issue.path.join('.')).join(', '),
    );
  const value = result.data;
  return {
    port: value.PORT,
    origin: value.FRONTEND_ORIGIN,
    databaseUrl: value.DATABASE_URL,
    dynamo: {
      endpoint: value.DYNAMODB_ENDPOINT,
      table: value.DYNAMODB_TABLE,
      region: value.AWS_REGION,
      accessKeyId: value.AWS_ACCESS_KEY_ID,
      secretAccessKey: value.AWS_SECRET_ACCESS_KEY,
    },
  };
}
