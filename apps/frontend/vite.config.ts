import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const url = new URL(env.VITE_API_URL || 'http://localhost:4000');
  if (!['http:', 'https:'].includes(url.protocol))
    throw new Error('VITE_API_URL must use HTTP or HTTPS');
  return {
    plugins: [react()],
    server: { port: 3000, strictPort: true },
    test: {
      pool: 'threads',
      maxWorkers: 2,
      environment: 'jsdom',
      setupFiles: ['./src/test-setup.ts'],
      restoreMocks: true,
    },
  };
});
