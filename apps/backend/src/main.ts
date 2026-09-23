import { createApp } from './composition/bootstrap';
import { readConfig } from './composition/config';
async function main() {
  const app = await createApp();
  await app.listen(readConfig().port, '0.0.0.0');
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
