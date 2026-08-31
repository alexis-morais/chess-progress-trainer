import { readFileSync, writeFileSync } from 'node:fs';
import { Chess } from 'chess.js';
import { createValidationEngine } from './lib/stockfish-node.mjs';
import { tacticFingerprint } from './lib/tactic-fingerprint.mjs';

const puzzles = JSON.parse(
  readFileSync(new URL('../src/data/tactics.json', import.meta.url), 'utf8'),
);
const settings = { depth: 18, movetime: 1500 };
const report = {
  engine: 'Stockfish.js 18 Lite Single-Threaded',
  settings: { ...settings, multiPV: 3, skill: 20, hashMB: 32 },
  checkedAt: new Date().toISOString(),
  puzzles: [],
};
const engine = await createValidationEngine();
try {
  for (const puzzle of puzzles) {
    const game = new Chess();
    puzzle.provenance.moves.forEach((san) => game.move(san, { strict: true }));
    if (game.fen() !== puzzle.fen || game.turn() !== puzzle.side)
      throw new Error(`Provenance incohérente : ${puzzle.id}`);
    const checked = [];
    for (const step of puzzle.sequence) {
      const fen = game.fen();
      const move = game.move(step.san, { strict: true });
      const uci = move.from + move.to + (move.promotion || '');
      const result = await engine.analyze(fen, settings);
      const best = result.lines[0];
      const played = result.lines.find((line) => line.pv[0] === uci);
      const playerMove = move.color === puzzle.side;
      if (!best || !played || best.depth < 14 || played.depth < 14)
        throw new Error(`Analyse insuffisante pour ${puzzle.id} / ${step.san}`);
      if (playerMove && result.bestmove !== uci)
        throw new Error(
          `Solution à revoir : ${puzzle.id} / ${step.san}, Stockfish préfère ${result.bestmove}`,
        );
      if (
        played.type !== best.type ||
        (best.type === 'mate' ? played.value !== best.value : best.value - played.value > 50)
      )
        throw new Error(`Réponse trop faible : ${puzzle.id} / ${step.san}`);
      if (playerMove && (best.type === 'cp' ? best.value < 150 : best.value <= 0))
        throw new Error(`Gain tactique insuffisant : ${puzzle.id} / ${step.san}`);
      checked.push({ fen, san: step.san, uci, playerMove, ...result });
    }
    report.puzzles.push({ id: puzzle.id, fingerprint: tacticFingerprint(puzzle), checked });
    console.log(`✓ ${puzzle.id} : ${checked.length} demi-coups vérifiés`);
  }
  if (process.argv.includes('--write')) {
    writeFileSync(
      new URL('../src/test/fixtures/tactics-verification.json', import.meta.url),
      JSON.stringify(report, null, 2) + '\n',
    );
    console.log('Rapport de validation enregistré.');
  }
  console.log(`${report.puzzles.length}/${puzzles.length} tactiques validées. Aucun appel réseau.`);
} finally {
  engine.dispose();
}
