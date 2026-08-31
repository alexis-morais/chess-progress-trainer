import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Chess } from 'chess.js';
import { difficultyRuntime, NodeEngineWorker } from './lib/difficulty-runtime.mjs';
const {
  ComputerEngine,
  difficulties,
  searchForLevel,
  seededRandom,
  playUci,
  positionResult,
  playerScore,
  materialExposure,
} = await difficultyRuntime();
const arg = (name, fallback) =>
  process.argv.find((x) => x.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const output = arg('output', 'calibration/quality-games.json');
const nativeTrial = process.argv.some((a) => a.startsWith('--native16='))
  ? Number(arg('native16', '0'))
  : null;
if (nativeTrial !== null) {
  if (
    !Number.isInteger(nativeTrial) ||
    nativeTrial < 1320 ||
    nativeTrial > 3190 ||
    output === 'calibration/quality-games.json'
  )
    throw new Error('Essai natif invalide ou sortie finale interdite.');
  difficulties[15].settings = { ...difficulties[15].settings, elo: nativeTrial };
}
const seed = Number(arg('seed', '20260901')),
  rounds = Number(arg('rounds', '6'));
const pairs = arg(
  'pairs',
  '1-3,3-5,5-6,6-8,7-8,8-9,9-10,8-11,11-12,12-15,15-16,16-19,19-20,20-21,21-22,22-23,23-24,24-25,8-reference',
)
  .split(',')
  .map((p) => p.split('-').map((n) => (n === 'reference' ? 'reference' : Number(n))));
if (
  !Number.isInteger(rounds) ||
  rounds < 2 ||
  rounds > 30 ||
  rounds % 2 ||
  pairs.some(
    (p) =>
      p.length !== 2 ||
      p.some((n) => n !== 'reference' && (!Number.isInteger(n) || n < 1 || n > 25)),
  )
)
  throw new Error('Paires/rondes invalides.');
const maxPlies = Number(arg('max-plies', '140'));
if (!Number.isInteger(maxPlies) || maxPlies < 80 || maxPlies > 300)
  throw new Error('Durée de match invalide.');
const referenceSettings = { skill: 20, depth: 18, movetime: 850, nodes: 350000 };
const referenceElo = Number(arg('reference-elo', '1600'));
if (!Number.isInteger(referenceElo) || referenceElo < 1320 || referenceElo > 3190)
  throw new Error('Cible native de contrôle invalide.');
const opponentSettings = { skill: 20, elo: referenceElo, depth: 14, movetime: 500, nodes: 100000 };
const create = () =>
  new ComputerEngine(
    () => {},
    () => new NodeEngineWorker(),
  );
const hash = createHash('sha256');
for (const file of ['chooseMove.ts', 'difficulty.ts', 'ComputerEngine.ts', 'material.ts'])
  hash.update(await readFile(`src/computer/${file}`));
const openings = [
  ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5'],
  ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6'],
  ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6'],
];
const report = {
  version: 2,
  nativeTrial,
  seed,
  profiles: difficulties,
  policyHash: hash.digest('hex'),
  referenceSettings,
  opponentSettings,
  maxPlies,
  createdAt: new Date().toISOString(),
  matches: [],
  summary: [],
};
const checkpoint = () => writeFile(output, JSON.stringify(report, null, 2) + '\n');
const input = (board) => ({ fen: board.fen(), history: [], startFen: board.fen() });
const scalar = (score, side) => Math.max(-2000, Math.min(2000, playerScore(score, side)));
const reference = create();
try {
  for (const [pairIndex, [lower, higher]] of pairs.entries())
    for (let round = 0; round < rounds; round++) {
      const white = round % 2 ? higher : lower,
        black = round % 2 ? lower : higher;
      const board = new Chess(),
        opening = openings[Math.floor(round / 2) % openings.length];
      const allHistory = [];
      for (const san of opening) {
        const m = board.move(san);
        allHistory.push(m.from + m.to + (m.promotion ?? ''));
      }
      const engines = { w: create(), b: create() },
        random = seededRandom(seed + pairIndex * 100 + round);
      const moves = [],
        audits = [];
      let adjudicated = false,
        result = null;
      try {
        while (!board.isGameOver() && moves.length < maxPlies) {
          const side = board.turn(),
            level = side === 'w' ? white : black,
            fen = board.fen();
          const request = { fen, history: allHistory };
          const token =
            level === 'reference'
              ? (await engines[side].search(request, opponentSettings)).bestMove
              : await searchForLevel(engines[side], request, level, undefined, random);
          const shouldAudit =
            level === 8 ||
            [0, 1, 16, 17, 40, 41, 70, 71, 100, 101, 126, 127].includes(moves.length);
          const best = shouldAudit ? await reference.search(input(board), referenceSettings) : null;
          const exposure = shouldAudit ? materialExposure(fen, token) : null;
          playUci(board, token);
          moves.push(token);
          allHistory.push(token);
          result = positionResult(board);
          if (best) {
            const score = result
              ? result.winner
                ? { mate: 0, winner: result.winner, depth: 0 }
                : { cp: 0, depth: 0 }
              : (await reference.search(input(board), referenceSettings)).score;
            const loss =
              token === best.bestMove
                ? 0
                : Math.max(0, scalar(best.score, side) - scalar(score, side));
            const fullMove = Number(fen.split(' ')[5]);
            audits.push({
              ply: allHistory.length,
              level,
              fen,
              move: token,
              loss,
              exposure,
              offered: exposure >= 200 && loss >= 100,
              phase:
                fullMove <= 8
                  ? 'opening'
                  : fullMove <= 20
                    ? 'post-opening'
                    : board.board().flat().filter(Boolean).length <= 12
                      ? 'endgame'
                      : 'middlegame',
            });
          }
        }
        if (!result) {
          adjudicated = true;
          const score = (await reference.search(input(board), referenceSettings)).score;
          const cp = scalar(score, 'w');
          result = {
            winner: Math.abs(cp) >= 300 ? (cp > 0 ? 'w' : 'b') : null,
            reason: 'adjudication',
          };
        }
        const winner = result.winner === 'w' ? white : result.winner === 'b' ? black : null;
        report.matches.push({
          lower,
          higher,
          round,
          white,
          black,
          opening,
          moves,
          result,
          adjudicated,
          audits,
          higherPoints: winner === higher ? 1 : winner === null ? 0.5 : 0,
        });
        console.log(
          `${lower}–${higher} ${round + 1}/${rounds} : ${moves.length} demi-coups, ${result.reason}, gagnant ${winner ?? 'nul'}`,
        );
        await checkpoint();
      } finally {
        engines.w.dispose();
        engines.b.dispose();
      }
    }
} finally {
  reference.dispose();
}
report.summary = pairs.map(([lower, higher]) => {
  const matches = report.matches.filter((m) => m.lower === lower && m.higher === higher);
  return {
    lower,
    higher,
    games: matches.length,
    higherScore: matches.reduce((s, m) => s + m.higherPoints, 0) / matches.length,
  };
});
report.completedAt = new Date().toISOString();
await checkpoint();
console.log(JSON.stringify(report.summary, null, 2));
