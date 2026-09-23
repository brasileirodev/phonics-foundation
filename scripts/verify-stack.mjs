import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const base = 'http://localhost:4000';
const path = '/sessions/' + randomUUID() + '/lessons/sapo/progress';
async function request(path, init) {
  const response = await fetch(base + path, {
    ...init,
    signal: AbortSignal.timeout(5000),
  });
  assert.equal(response.ok, true, 'HTTP request failed: ' + response.status);
  return response.json();
}
assert.equal((await fetch('http://localhost:3000')).status, 200);
assert.deepEqual(await request(path), { progress: null });
const saved = await request(path, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ completedSteps: 4 }),
});
await promisify(execFile)('docker', [
  'compose',
  'restart',
  'backend',
  'dynamodb',
  'postgres',
]);
let ready = false;
for (let attempt = 0; attempt < 60; attempt++) {
  try {
    await request('/ready');
    ready = true;
    break;
  } catch {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}
assert.equal(ready, true, 'Stack did not recover after restart');
assert.deepEqual(await request(path), { progress: saved });
assert.equal((await request('/lessons/sapo')).steps.length, 7);
console.log(
  'Stack verification passed: frontend HTTP, new session JSON, progress write/read, backend and both database restarts, lesson retained.',
);
