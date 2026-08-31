import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { Chess } from 'chess.js';
import { createHash } from 'node:crypto';
import { difficultyRuntime, NodeEngineWorker } from './lib/difficulty-runtime.mjs';

const {
  ComputerEngine,
  difficulties,
  prepareCandidateSelection,
  seededRandom,
  searchForLevel,
  playUci,
  uci,
  playerScore,
  positionResult,
} = await difficultyRuntime();
const seed = Number(process.env.CALIBRATION_SEED ?? 20260831);
if (!Number.isSafeInteger(seed)) throw new Error('CALIBRATION_SEED doit être un entier.');
const quick = process.argv.includes('--quick');
const only = process.argv.find((arg) => arg.startsWith('--only='))?.split('=')[1];
if (only && !['benchmark', 'matches'].includes(only)) throw new Error('Mode de calibration inconnu.');
const selectedPair = process.argv.find((arg) => arg.startsWith('--pair='))?.slice(7);
const nativeTrial = Number(process.argv.find((arg) => arg.startsWith('--native-elo='))?.slice(13));
if (nativeTrial) {
  if (!selectedPair || !Number.isInteger(nativeTrial) || nativeTrial < 1320 || nativeTrial > 3190)
    throw new Error('Cible UCI expérimentale invalide.');
  difficulties[Number(selectedPair.split('-')[1]) - 1].settings.elo = nativeTrial;
}
const rounds = Number(
  process.argv.find((arg) => arg.startsWith('--rounds='))?.slice(9) ?? (quick ? 2 : 6),
);
const roundOffset = Number(
  process.argv.find((arg) => arg.startsWith('--round-offset='))?.slice(15) ?? 0,
);
if (
  !Number.isInteger(rounds) ||
  rounds < 2 ||
  rounds > 60 ||
  rounds % 2 ||
  !Number.isInteger(roundOffset) ||
  roundOffset < 0
)
  throw new Error('Nombre de rondes invalide (pair, entre 2 et 60).');
const output =
  process.argv.find((arg) => arg.startsWith('--output='))?.slice(9) ??
  'calibration/difficulty-results.json';
const referenceSettings = { skill: 20, depth: 16, movetime: 500, nodes: 180000 };
const createEngine = () =>
  new ComputerEngine(
    () => {},
    () => new NodeEngineWorker(),
  );
const inputAt = (game, history = [], startFen = game.fen()) => ({
  fen: game.fen(),
  history,
  startFen,
});
const scalar = (score, side) => Math.max(-2000, Math.min(2000, playerScore(score, side)));
const mean = (values) => values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
const report = {
  version: 1,
  seed,
  nativeTrial: nativeTrial || null,
  quick,
  createdAt: new Date().toISOString(),
  profiles: difficulties,
  policyHash: createHash('sha256')
    .update(await readFile('src/computer/chooseMove.ts'))
    .update(await readFile('src/computer/difficulty.ts'))
    .update(await readFile('src/computer/ComputerEngine.ts'))
    .digest('hex'),
  engine: 'Stockfish.js 18.0.8 Lite Single-Threaded',
  benchmark: [],
  matches: [],
  openingHabits: [],
  summary: {},
  limitations: [
    'Elo humains non mesurés.',
    'Seed appliquée à la sélection personnalisée ; le hasard interne de Stockfish natif n’est pas exposé.',
    'Recherches bornées en nœuds et en temps : le matériel et la table de transposition peuvent influencer le résultat.',
    'Les parties plafonnées sont arbitrées séparément par une recherche forte ; ce ne sont pas toutes des mats.',
  ],
};
await mkdir('calibration', { recursive: true });
async function checkpoint() {
  await writeFile(output, JSON.stringify(report, null, 2) + '\n');
}
const puzzles = JSON.parse(await readFile('src/data/tactics.json', 'utf8'));
const basic = [
  {
    id: 'capture-dame',
    kind: 'Dame gratuite',
    fen: '4k3/ppp2ppp/8/3q4/8/8/PPP2PPP/3QK3 w - - 0 1',
  },
  {
    id: 'capture-tour',
    kind: 'Tour gratuite',
    fen: '4k3/ppp2ppp/8/3r4/8/8/PPP2PPP/3QK3 w - - 0 1',
  },
  { id: 'mat-un', kind: 'Mat en un', fen: '6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1' },
  {
    id: 'mat-deux',
    kind: 'Mat en deux',
    fen: 'r3r1k1/ppq2pp1/2p1b3/6b1/3PQ3/4P3/PPB2PP1/R3K2R w KQ - 0 18',
  },
  { id: 'fourchette', kind: 'Fourchette', fen: 'r3k3/ppp2ppp/8/3N4/8/8/PPP2PPP/4K3 w - - 0 1' },
  {
    id: 'dame-attaquee',
    kind: 'Dame attaquée',
    fen: 'rnbqkbnr/ppp1pppp/8/8/3pQ3/8/PPP2PPP/RNB1KBNR w KQkq - 0 4',
  },
  {
    id: 'defense-mat',
    kind: 'Défense contre un mat',
    fen: 'rnb1k1nr/pppp1ppp/8/2b1p3/4P2q/5N2/PPPP1PPP/RNBQKB1R w KQkq - 3 4',
  },
  {
    id: 'piece-attaquee',
    kind: 'Pièce attaquée',
    fen: 'r1bqkbnr/pppp1ppp/8/4p3/3nP3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 3 4',
  },
];
const positions = [
  ...basic,
  ...puzzles
    .filter((_, i) => i % 2 === 0)
    .slice(0, 8)
    .map((p) => ({ id: p.id, kind: p.motif, fen: p.fen })),
].slice(0, quick ? 4 : 16);
if (only !== 'matches') {
  const reference = createEngine();
  try {
    for (const [positionIndex, position] of positions.entries()) {
      const game = new Chess(position.fen),
        side = game.turn(),
        input = inputAt(game);
      const best = await reference.search(input, referenceSettings);
      const scores = new Map();
      async function assess(token) {
        if (scores.has(token)) return scores.get(token);
        const after = new Chess(position.fen);
        playUci(after, token);
        const terminal = positionResult(after);
        const score = terminal
          ? terminal.winner
            ? { mate: 0, winner: terminal.winner, depth: 0 }
            : { cp: 0, depth: 0 }
          : (await reference.search(inputAt(after), referenceSettings)).score;
        const loss = Math.max(0, scalar(best.score, side) - scalar(score, side));
        const measured = {
          loss,
          tactical: token === best.bestMove || loss <= 30,
          blunder: loss >= 200,
        };
        scores.set(token, measured);
        return measured;
      }
      for (const level of difficulties) {
        const engine = createEngine(),
          random = seededRandom(seed + positionIndex * 1000 + level.id);
        const samples = [];
        try {
          const analysis = await engine.search(input, level.settings);
          const choose = prepareCandidateSelection(input, analysis, level.id);
          const count = level.selection ? (quick ? 32 : 128) : quick ? 2 : 8;
          for (let sample = 0; sample < count; sample++) {
            const token = level.selection
              ? choose(random)
              : sample === 0
                ? analysis.bestMove
                : (await engine.search(input, level.settings)).bestMove;
            const measured = await assess(token);
            samples.push({ move: token, ...measured });
          }
          report.benchmark.push({
            position: position.id,
            kind: position.kind,
            fen: position.fen,
            level: level.id,
            bestMove: best.bestMove,
            candidates: analysis.candidates?.length ?? 1,
            samples: samples.length,
            meanLoss: mean(samples.map((item) => item.loss)),
            blunderRate: mean(samples.map((item) => Number(item.blunder))),
            tacticalRate: mean(samples.map((item) => Number(item.tactical))),
            choices: [...new Set(samples.map((item) => item.move))],
          });
        } finally {
          engine.dispose();
        }
      }
      console.log(`Positions ${positionIndex + 1}/${positions.length} : ${position.kind}`);
      await checkpoint();
    }
  } finally {
    reference.dispose();
  }
}
if (only !== 'matches') {
  const engine = createEngine();
  try {
    const board = new Chess(),
      input = { fen: board.fen(), history: [] };
    for (const level of difficulties.filter((level) => level.selection)) {
      const analysis = await engine.search(input, level.settings);
      const choose = prepareCandidateSelection(input, analysis, level.id),
        random = seededRandom(seed + level.id);
      const moves = Array.from({ length: 512 }, () => choose(random));
      report.openingHabits.push({
        level: level.id,
        samples: moves.length,
        naturalRate: mean(
          moves.map((move) =>
            Number(
              ['e2e4', 'd2d4', 'g1f3', 'b1c3', 'c2c4', 'g2g3', 'b2b3', 'e2e3', 'd2d3'].includes(
                move,
              ),
            ),
          ),
        ),
        edgeKnightRate: mean(moves.map((move) => Number(['b1a3', 'g1h3'].includes(move)))),
        edgePawnRate: mean(moves.map((move) => Number(/^[ah]2/.test(move)))),
        choices: [...new Set(moves)],
      });
    }
  } finally {
    engine.dispose();
  }
}
const pairs = [
  [1, 3],
  [3, 5],
  [5, 6],
  [6, 8],
  [8, 11],
  [11, 12],
  [12, 15],
  [15, 16],
  [16, 19],
  [19, 20],
  [20, 21],
  [21, 22],
  [22, 23],
  [23, 24],
  [24, 25],
];
const openings = [
  ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'c3', 'Nf6'],
  ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Nf3', 'Be7'],
  ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6'],
];
if (selectedPair && !pairs.some(pair => pair.join('-') === selectedPair)) throw new Error('Paire de niveaux inconnue.');
if (only !== 'benchmark') {
  for (const [pairIndex, [lower, higher]] of pairs.entries()) {
    if (selectedPair && selectedPair !== `${lower}-${higher}`) continue;
    for (let round = roundOffset; round < roundOffset + rounds; round++) {
      const opening = openings[Math.floor(round / 2) % openings.length];
      const game = new Chess(),
        history = [];
      for (const san of opening) history.push(uci(game.move(san)));
      const white = round % 2 ? higher : lower,
        black = round % 2 ? lower : higher;
      const engine = createEngine(),
        reference = createEngine(),
        random = seededRandom(seed + pairIndex * 100 + round);
      const moves = [];
      let result = null,
        adjudicated = false,
        evaluation = 0;
      try {
        for (let ply = 0; ply < (quick ? 32 : 80); ply++) {
          result = positionResult(game);
          if (result) break;
          const level = game.turn() === 'w' ? white : black;
          const token = await searchForLevel(
            engine,
            { fen: game.fen(), history },
            level,
            undefined,
            random,
          );
          playUci(game, token);
          history.push(token);
          moves.push(token);
          if (ply >= 23 && ply % 8 === 7 && !positionResult(game)) {
            evaluation = scalar(
              (await reference.search({ fen: game.fen(), history }, referenceSettings)).score,
              'w',
            );
            if (Math.abs(evaluation) >= 650) {
              result = { winner: evaluation > 0 ? 'w' : 'b', reason: 'strong-evaluation' };
              adjudicated = true;
              break;
            }
          }
        }
        result ??= positionResult(game);
        if (!result) {
          evaluation = scalar(
            (await reference.search({ fen: game.fen(), history }, referenceSettings)).score,
            'w',
          );
          result = {
            winner: Math.abs(evaluation) >= 250 ? (evaluation > 0 ? 'w' : 'b') : null,
            reason: 'ply-limit',
          };
          adjudicated = true;
        }
        const higherScore =
          result.winner === null ? 0.5 : result.winner === (white === higher ? 'w' : 'b') ? 1 : 0;
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
          evaluation,
          higherScore,
        });
        console.log(
          `Match ${report.matches.length}/${(selectedPair ? 1 : pairs.length) * rounds} : ${lower}–${higher}, score haut ${higherScore}, ${moves.length} demi-coups (${result.reason})`,
        );
        await checkpoint();
      } finally {
        engine.dispose();
        reference.dispose();
      }
    }
  }
}
report.summary = {
  levels: difficulties.map((level) => {
    const rows = report.benchmark.filter((row) => row.level === level.id);
    return {
      level: level.id,
      meanLoss: mean(rows.map((r) => r.meanLoss)),
      blunderRate: mean(rows.map((r) => r.blunderRate)),
      tacticalRate: mean(rows.map((r) => r.tacticalRate)),
    };
  }),
  pairs: pairs.map(([lower, higher]) => {
    const matches = report.matches.filter((m) => m.lower === lower && m.higher === higher);
    return {
      lower,
      higher,
      games: matches.length,
      higherScore: mean(matches.map((m) => m.higherScore)),
    };
  }),
  games: report.matches.length,
  positions: new Set(report.benchmark.map(row => row.position)).size,
  naturalEnds: report.matches.filter((m) => !m.adjudicated).length,
  higherScore: mean(report.matches.map((m) => m.higherScore)),
};
report.completedAt = new Date().toISOString();
await checkpoint();
console.log(JSON.stringify(report.summary, null, 2));
