import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

// Offline authoring tool only. The application continues to use its browser Web Workers.
export async function createUciEngine(listener) {
  const script = new URL('../../public/engine/stockfish-18-lite-single.js', import.meta.url);
  const filename = fileURLToPath(script);
  const module = { exports: {} };
  const require = createRequire(script);
  // The unmodified upstream file exports a CommonJS factory; this repo uses ES modules.
  new Function(
    'module',
    'exports',
    'require',
    '__filename',
    '__dirname',
    readFileSync(script, 'utf8'),
  )(module, module.exports, require, filename, fileURLToPath(new URL('.', script)));
  const engine = await module.exports()({
    locateFile: () => fileURLToPath(new URL('stockfish-18-lite-single.wasm', script)),
    listener,
  });
  const command = (line) =>
    engine.ccall('command', null, ['string'], [line], { async: line.startsWith('go ') });
  return { command };
}

export async function createValidationEngine() {
  let receive = () => {};
  const { command } = await createUciEngine((line) => receive(line));
  const waitFor = (expected, send) =>
    new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(`Stockfish : délai ${expected}`)), 15_000);
      receive = (line) => {
        if (line === expected) {
          clearTimeout(timeout);
          resolve();
        }
      };
      send();
    });
  await waitFor('uciok', () => command('uci'));
  command('setoption name Hash value 32');
  command('setoption name Skill Level value 20');
  command('setoption name MultiPV value 3');
  await waitFor('readyok', () => command('isready'));
  let busy = false;
  return {
    async analyze(fen, { depth = 18, movetime = 1500 } = {}) {
      if (busy) throw new Error('Les validations doivent être séquentielles.');
      busy = true;
      command('ucinewgame');
      await waitFor('readyok', () => command('isready'));
      return new Promise((resolve, reject) => {
        const lines = new Map();
        const timeout = setTimeout(() => {
          command('stop');
          busy = false;
          reject(new Error('Analyse trop longue'));
        }, movetime + 10_000);
        receive = (line) => {
          const match = line.match(
            /^info depth (\d+).*?multipv (\d+) score (cp|mate) (-?\d+).*? pv (.+)$/,
          );
          if (match && !/bound/.test(line))
            lines.set(Number(match[2]), {
              depth: Number(match[1]),
              type: match[3],
              value: Number(match[4]),
              pv: match[5].trim().split(/\s+/),
            });
          if (line.startsWith('bestmove ')) {
            clearTimeout(timeout);
            busy = false;
            resolve({ bestmove: line.split(' ')[1], lines: [...lines.values()] });
          }
        };
        command(`position fen ${fen}`);
        command(`go depth ${depth} movetime ${movetime}`);
      });
    },
    dispose() {
      command('quit');
    },
  };
}
