import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/chess-progress-trainer/',
  build: {
    target: ['chrome107', 'firefox104', 'safari16'],
    rollupOptions: { output: { manualChunks: { chessboard: ['react-chessboard'] } } },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    restoreMocks: true,
    // Bound concurrent jsdom/board renders to avoid CPU contention on laptops and CI.
    maxWorkers: 2,
    // The real chessboard UI can exceed 5 s on shared GitHub runners. Keep local failures fast.
    testTimeout: process.env.CI ? 20_000 : 5_000,
  },
});
