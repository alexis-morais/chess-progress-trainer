import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { difficultyRuntime } from './lib/difficulty-runtime.mjs';
import { qualityMarkdown } from './lib/quality-report.mjs';
import { verifyNativeRevision } from './lib/native-revision.mjs';
const { difficulties } = await difficultyRuntime();
const positions = JSON.parse(await readFile('calibration/quality-results.json', 'utf8'));
const games = JSON.parse(await readFile('calibration/quality-games.json', 'utf8'));
const neighbors = JSON.parse(await readFile('calibration/quality-neighbors.json', 'utf8'));
const adjacent = JSON.parse(
  await readFile('calibration/quality-native-final-adjacent.json', 'utf8'),
);
const hash = createHash('sha256');
for (const file of ['chooseMove.ts', 'difficulty.ts', 'ComputerEngine.ts', 'material.ts'])
  hash.update(await readFile(`src/computer/${file}`));
const policyHash = hash.digest('hex');
for (const report of [positions, games, neighbors, adjacent])
  await verifyNativeRevision(report, difficulties);
for (const report of [positions, games, neighbors, adjacent])
  if (
    !report.completedAt ||
    report.nativeTrial ||
    report.policyHash !== policyHash ||
    JSON.stringify(report.profiles) !== JSON.stringify(difficulties)
  )
    throw new Error('Mesures incomplètes ou profils modifiés : relancer la phase concernée.');
if (
  positions.seed !== games.seed ||
  positions.positions.length !== 40 ||
  positions.rows.length !== 1000 ||
  games.matches.length !== 114 ||
  neighbors.matches.length !== 48 ||
  adjacent.matches.length !== 18
)
  throw new Error(
    'La validation finale nécessite 40 positions × 25 niveaux, 114 parties, 48 confirmations et 18 parties de raccord.',
  );
const average = (values) => values.reduce((a, b) => a + b, 0) / Math.max(1, values.length);
const allMatches = [...games.matches, ...neighbors.matches, ...adjacent.matches];
const audits = allMatches.flatMap((m) => m.audits);
const report = {
  version: 2,
  policyHash,
  completedAt: new Date().toISOString(),
  seed: positions.seed,
  sources: [
    'quality-results.json',
    'quality-games.json',
    'quality-neighbors.json',
    'quality-native-final-adjacent.json',
  ],
  nativeRevisions: [positions, games, neighbors].flatMap((report) =>
    report.nativeRevision ? [report.nativeRevision] : [],
  ),
  positions: 40,
  distinctPositions: new Set(positions.positions.map((p) => p.fen.split(' ').slice(0, 4).join(' ')))
    .size,
  decisions: positions.rows.reduce((sum, row) => sum + row.samples, 0),
  games: allMatches.length,
  naturalEnds: allMatches.filter((m) => !m.adjudicated).length,
  higherScore: average(
    allMatches.filter((m) => m.higher !== 'reference').map((m) => m.higherPoints),
  ),
  levels: positions.summary,
  pairs: games.summary,
  neighborPairs: neighbors.summary,
  adjacentPairs: adjacent.summary,
  gameQuality: difficulties.map((p) => ({
    level: p.id,
    phases: Object.fromEntries(
      ['opening', 'post-opening', 'middlegame', 'endgame'].map((phase) => {
        const rows = audits.filter((a) => a.level === p.id && a.phase === phase);
        return [
          phase,
          {
            samples: rows.length,
            meanLoss: average(rows.map((r) => r.loss)),
            inaccuracyRate: average(rows.map((r) => +(r.loss >= 30 && r.loss < 80))),
            errorRate: average(rows.map((r) => +(r.loss >= 80 && r.loss < 200))),
            blunderRate: average(rows.map((r) => +(r.loss >= 200))),
            offeredRate: average(rows.map((r) => +r.offered)),
          },
        ];
      }),
    ),
  })),
};
await writeFile('calibration/quality-summary.json', JSON.stringify(report, null, 2) + '\n');
await writeFile('calibration/QUALITY.md', qualityMarkdown(report, positions, games, neighbors));
console.log(
  JSON.stringify(
    {
      positions: report.positions,
      decisions: report.decisions,
      games: report.games,
      naturalEnds: report.naturalEnds,
      higherScore: report.higherScore,
    },
    null,
    2,
  ),
);
