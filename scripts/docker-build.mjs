// Stream the context from an ASCII temporary working directory. Docker Desktop's
// BuildKit session headers can reject accented Windows project paths.
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
async function build(dockerfile, tag, args = []) {
  const docker = spawn(
    'docker',
    ['build', '--progress=plain', '-t', tag, '-f', dockerfile, ...args, '-'],
    { cwd: tmpdir(), stdio: ['pipe', 'inherit', 'inherit'] },
  );
  const tar = spawn(
    'tar',
    [
      '-cf',
      '-',
      '--exclude=.git',
      '--exclude=node_modules',
      '--exclude=dist',
      '--exclude=.turbo',
      '--exclude=.env',
      '--exclude=.env.*',
      '--exclude=generated',
      '--exclude=.log',
      '.',
    ],
    { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'inherit'] },
  );
  tar.stdout.pipe(docker.stdin);
  docker.stdin.on('error', () => {});
  const completion = (process) =>
    new Promise((resolve, reject) => {
      process.on('error', reject);
      process.on('close', (code) =>
        code === 0
          ? resolve()
          : reject(new Error('Build process exited with ' + code)),
      );
    });
  await Promise.all([completion(tar), completion(docker)]);
}
try {
  await build('apps/backend/Dockerfile', 'phonics-backend:local');
  await build('apps/frontend/Dockerfile', 'phonics-frontend:local', [
    '--build-arg',
    'VITE_API_URL=' + (process.env.VITE_API_URL || 'http://localhost:4000'),
  ]);
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
