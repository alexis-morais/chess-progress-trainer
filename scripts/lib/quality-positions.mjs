import { readFile } from 'node:fs/promises';
import { Chess } from 'chess.js';

// Retain tactical probes and add non-tactical positions from recorded, legal games.
export async function qualityPositions() {
  const old = JSON.parse(await readFile('calibration/difficulty-results.json', 'utf8'));
  const unique = [...new Map(old.benchmark.map((p) => [p.position, p])).values()];
  const result = unique.map((p) => ({
    id: p.position,
    kind: p.kind,
    phase: 'tactics',
    fen: p.fen,
  }));
  const longGames = old.matches.filter((m) => m.lower >= 12 && m.moves.length >= 64).slice(0, 4);
  if (longGames.length < 4) throw new Error('Quatre parties longues de référence sont requises.');
  for (const [i, match] of longGames.entries()) {
    const board = new Chess();
    for (const san of match.opening) board.move(san);
    for (const [ply, token] of match.moves.entries()) {
      board.move({ from: token.slice(0, 2), to: token.slice(2, 4), promotion: token[4] });
      if ([1, 7, 19, 39, 59].includes(ply) && !board.isGameOver())
        result.push({
          id: `partie-${i + 1}-${ply + 1}`,
          kind: 'Partie enregistrée',
          phase: ply < 8 ? 'opening' : ply < 24 ? 'post-opening' : 'middlegame',
          fen: board.fen(),
          source: { opening: match.opening, moves: match.moves.slice(0, ply + 1) },
        });
    }
  }
  result.push(
    {
      id: 'finale-roi-pions',
      kind: 'Finale de pions',
      phase: 'endgame',
      fen: '8/5pk1/6p1/3K4/4P3/5P2/8/8 w - - 0 42',
    },
    {
      id: 'finale-tours',
      kind: 'Finale de tours',
      phase: 'endgame',
      fen: '6k1/5pp1/7p/8/4P3/6P1/5P1P/4R1K1 b - - 0 40',
    },
    {
      id: 'finale-tours-equilibree',
      kind: 'Tours et pions',
      phase: 'endgame',
      fen: '8/5pk1/4r1p1/7p/4P3/5KP1/5P1P/4R3 w - - 0 41',
    },
    {
      id: 'finale-cavalier',
      kind: 'Cavalier et pions',
      phase: 'endgame',
      fen: '8/5pk1/6p1/3n3p/4P3/3N1KP1/5P1P/8 b - - 0 37',
    },
  );
  for (const p of result) {
    const board = new Chess(p.fen);
    if (board.isGameOver()) throw new Error(`Position terminée : ${p.id}`);
  }
  return result;
}
