import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { difficultyRuntime } from './lib/difficulty-runtime.mjs';

// Join independently executed phases only when both measured the current policy.
const { difficulties } = await difficultyRuntime();
const benchmark = JSON.parse(
  await readFile('calibration/difficulty-positions-calibrated.json', 'utf8'),
);
const matches = JSON.parse(
  await readFile('calibration/difficulty-matches-calibrated.json', 'utf8'),
);
const hash = createHash('sha256')
  .update(await readFile('src/computer/chooseMove.ts'))
  .update(await readFile('src/computer/difficulty.ts'))
  .update(await readFile('src/computer/ComputerEngine.ts'))
  .digest('hex');
for (const phase of [benchmark, matches]) {
  if (
    !phase.completedAt ||
    phase.quick ||
    phase.nativeTrial ||
    phase.policyHash !== hash ||
    JSON.stringify(phase.profiles) !== JSON.stringify(difficulties)
  )
    throw new Error('Calibration incomplète ou paramètres modifiés : relancer les mesures.');
}
if (
  benchmark.seed !== matches.seed ||
  benchmark.benchmark.length !== 400 ||
  matches.matches.length !== 90
)
  throw new Error('Phases non comparables.');
const report = {
  ...benchmark,
  matches: matches.matches,
  createdAt: [benchmark.createdAt, matches.createdAt].sort()[0],
  completedAt: [benchmark.completedAt, matches.completedAt].sort().at(-1),
  summary: { ...matches.summary, levels: benchmark.summary.levels, positions: 16 },
  phases: ['difficulty-positions-calibrated.json', 'difficulty-matches-calibrated.json'],
};
await writeFile('calibration/difficulty-results.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report.summary, null, 2));
