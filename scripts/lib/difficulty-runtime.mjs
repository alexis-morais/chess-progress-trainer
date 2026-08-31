import { fork } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

// Compile the actual application policy/protocol, not a second calibration implementation.
export async function difficultyRuntime() {
  const require = createRequire(import.meta.url);
  const { build } = createRequire(require.resolve('vite/package.json'))('esbuild');
  const out = `${process.cwd()}/node_modules/.cache/difficulty/runtime.mjs`;
  await mkdir(`${process.cwd()}/node_modules/.cache/difficulty`, { recursive: true });
  await build({
    stdin: {
      contents:
        "export * from './src/computer/ComputerEngine'; export * from './src/computer/chooseMove'; export * from './src/computer/difficulty'; export * from './src/computer/game';",
      resolveDir: process.cwd(),
      loader: 'ts',
    },
    bundle: true,
    platform: 'node',
    format: 'esm',
    packages: 'external',
    outfile: out,
    define: { 'import.meta.env.BASE_URL': '"/chess-progress-trainer/"' },
  });
  return import(pathToFileURL(out).href);
}
export class NodeEngineWorker {
  onmessage = null;
  onerror = null;
  onmessageerror = null;
  constructor() {
    this.worker = fork(new URL('./difficulty-worker.mjs', import.meta.url), [], {
      execArgv: [],
      stdio: ['ignore', 'ignore', 'pipe', 'ipc'],
    });
    this.worker.stderr.on('data', (data) => process.stderr.write(data));
    this.worker.on('message', (data) => this.onmessage?.({ data }));
    this.worker.on('error', (error) => this.onerror?.(error));
    this.worker.on('messageerror', (error) => this.onmessageerror?.(error));
  }
  postMessage(line) {
    this.worker.send(line);
  }
  terminate() {
    this.worker.kill();
  }
}
