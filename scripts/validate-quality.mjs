import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Chess } from 'chess.js';
import { difficultyRuntime, NodeEngineWorker } from './lib/difficulty-runtime.mjs';
import { qualityPositions } from './lib/quality-positions.mjs';

const {
  ComputerEngine,
  difficulties,
  prepareCandidateSelection,
  seededRandom,
  playUci,
  playerScore,
  positionResult,
  materialExposure,
} = await difficultyRuntime();
const arg = (name, fallback) =>
  process.argv.find((x) => x.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const selected = arg('levels', '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25')
  .split(',')
  .map(Number);
if (selected.some((id) => !Number.isInteger(id) || id < 1 || id > 25))
  throw new Error('Niveaux invalides.');
const output = arg('output', 'calibration/quality-results.json');
const seed = Number(arg('seed', '20260901'));
const positions = await qualityPositions();
const profiles = difficulties.filter((p) => selected.includes(p.id));
const referenceSettings = { skill: 20, depth: 18, movetime: 850, nodes: 350000 };
const create = () =>
  new ComputerEngine(
    () => {},
    () => new NodeEngineWorker(),
  );
const inputAt = (board) => ({ fen: board.fen(), history: [], startFen: board.fen() });
const scalar = (score, side) => Math.max(-2000, Math.min(2000, playerScore(score, side)));
const mean = (a) => a.reduce((s, v) => s + v, 0) / Math.max(1, a.length);
const files = ['chooseMove.ts', 'difficulty.ts', 'ComputerEngine.ts', 'material.ts'];
const hash = createHash('sha256');
for (const file of files) hash.update(await readFile(`src/computer/${file}`));
const report = {
  version: 2,
  seed,
  createdAt: new Date().toISOString(),
  policyHash: hash.digest('hex'),
  profiles,
  positions,
  referenceSettings,
  rows: [],
  summary: [],
  openingHabits: [],
};
await mkdir('calibration', { recursive: true });
const checkpoint = () => writeFile(output, JSON.stringify(report, null, 2) + '\n');
const reference = create(),
  cache = new Map();
async function assess(position, token, best) {
  const key = position.fen + ' ' + token;
  if (cache.has(key)) return cache.get(key);
  const before = new Chess(position.fen),
    side = before.turn(),
    after = new Chess(position.fen);
  const moved = playUci(after, token),
    terminal = positionResult(after);
  const score = terminal
    ? terminal.winner
      ? { mate: 0, winner: terminal.winner, depth: 0 }
      : { cp: 0, depth: 0 }
    : (await reference.search(inputAt(after), referenceSettings)).score;
  const loss =
    token === best.bestMove ? 0 : Math.max(0, scalar(best.score, side) - scalar(score, side));
  const exposure = materialExposure(position.fen, token);
  const metric = {
    loss,
    exposure,
    offered: exposure >= 200 && loss >= 100,
    queenOffered: exposure >= 700 && loss >= 100,
    tactical: token === best.bestMove || loss <= 30,
    mate: after.isCheckmate(),
    preservesMate: 'mate' in score && score.winner === side,
    capture: !!moved.captured,
  };
  cache.set(key, metric);
  return metric;
}
try {
  for (const [index, position] of positions.entries()) {
    const board = new Chess(position.fen),
      input = inputAt(board);
    const best = await reference.search(input, referenceSettings);
    position.reference = { move: best.bestMove, score: best.score, pv: best.pv };
    for (const profile of profiles) {
      const engine = create();
      try {
        const analysis = await engine.search(input, profile.settings);
        const choose = prepareCandidateSelection(input, analysis, profile.id);
        const count = profile.selection ? 128 : 8;
        const random = seededRandom(seed + index * 1000 + profile.id),
          samples = [];
        const sampled = [];
        for (let i = 0; i < count; i++) {
          const token = profile.selection
            ? choose(random)
            : i === 0
              ? analysis.bestMove
              : (await engine.search(input, profile.settings)).bestMove;
          sampled.push(token);
          samples.push(await assess(position, token, best));
        }
        report.rows.push({
          position: position.id,
          phase: position.phase,
          kind: position.kind,
          level: profile.id,
          samples: count,
          meanLoss: mean(samples.map((s) => s.loss)),
          inaccuracyRate: mean(samples.map((s) => +(s.loss >= 30 && s.loss < 80))),
          errorRate: mean(samples.map((s) => +(s.loss >= 80 && s.loss < 200))),
          blunderRate: mean(samples.map((s) => +(s.loss >= 200))),
          offeredRate: mean(samples.map((s) => +s.offered)),
          queenOfferedRate: mean(samples.map((s) => +s.queenOffered)),
          tacticalRate: mean(samples.map((s) => +s.tactical)),
          mateRate: mean(samples.map((s) => +s.mate)),
          preservesMateRate: mean(samples.map((s) => +s.preservesMate)),
          meanExposure: mean(samples.map((s) => s.exposure)),
          choices: [...new Set(sampled)].map((move) => ({
            move,
            ...cache.get(position.fen + ' ' + move),
          })),
        });
      } finally {
        engine.dispose();
      }
    }
    console.log(`${index + 1}/${positions.length} ${position.phase} · ${position.id}`);
    await checkpoint();
  }
  for (const profile of profiles) {
    const engine = create();
    try {
      const input = inputAt(new Chess());
      const analysis = await engine.search(input, profile.settings);
      const choose = prepareCandidateSelection(input, analysis, profile.id);
      const random = seededRandom(seed + profile.id),
        choices = [];
      for (let i = 0; i < (profile.selection ? 512 : 8); i++)
        choices.push(
          profile.selection
            ? choose(random)
            : i
              ? (await engine.search(input, profile.settings)).bestMove
              : analysis.bestMove,
        );
      report.openingHabits.push({
        level: profile.id,
        samples: choices.length,
        naturalRate: mean(
          choices.map(
            (m) =>
              +['e2e4', 'd2d4', 'c2c4', 'g1f3', 'b1c3', 'e2e3', 'd2d3', 'g2g3', 'b2b3'].includes(m),
          ),
        ),
        edgePawnRate: mean(choices.map((m) => +/^[ah]2/.test(m))),
        edgeKnightRate: mean(choices.map((m) => +['g1h3', 'b1a3'].includes(m))),
        choices: Object.fromEntries(
          [...new Set(choices)].map((m) => [m, choices.filter((x) => x === m).length]),
        ),
      });
    } finally {
      engine.dispose();
    }
  }
} finally {
  reference.dispose();
}
const metrics = [
  'meanLoss',
  'inaccuracyRate',
  'errorRate',
  'blunderRate',
  'offeredRate',
  'queenOfferedRate',
  'tacticalRate',
  'mateRate',
  'preservesMateRate',
  'meanExposure',
];
const summarize = (rows) =>
  Object.fromEntries(metrics.map((key) => [key, mean(rows.map((r) => r[key]))]));
report.summary = profiles.map((p) => ({
  level: p.id,
  ...summarize(report.rows.filter((r) => r.level === p.id)),
  phases: Object.fromEntries(
    [...new Set(positions.map((p) => p.phase))].map((phase) => [
      phase,
      summarize(report.rows.filter((r) => r.level === p.id && r.phase === phase)),
    ]),
  ),
}));
report.completedAt = new Date().toISOString();
await checkpoint();
console.log(JSON.stringify(report.summary, null, 2));
