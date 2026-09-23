import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? files(join(directory, entry.name))
      : [join(directory, entry.name)],
  );
}
const core = resolve('apps/backend/src');
for (const layer of ['domain', 'application']) {
  for (const file of files(join(core, layer))) {
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(
      /(?:from\s+|import\s*\()['"]([^'"]+)['"]/g,
    )) {
      const dependency = match[1];
      const target = relative(core, resolve(file, '..', dependency)).replaceAll(
        '\\',
        '/',
      );
      if (
        !dependency.startsWith('.') ||
        !/^(domain|application)\//.test(target) ||
        (layer === 'domain' && target.startsWith('application/'))
      )
        throw new Error('Boundary violation: ' + file + ' -> ' + dependency);
    }
  }
}
for (const file of files('packages/shared/src')) {
  if (/\b(from|require|import)\b/.test(readFileSync(file, 'utf8')))
    throw new Error('Shared contracts must be standalone: ' + file);
}
for (const file of files('apps/backend/src').filter(
  (file) => !file.replaceAll('\\', '/').includes('/adapters/persistence/'),
)) {
  if (
    /from\s+['"](?:@prisma|prisma|dynamoose)/.test(readFileSync(file, 'utf8'))
  )
    throw new Error('Persistence dependency outside adapter: ' + file);
}
console.log('Architecture boundaries passed.');
