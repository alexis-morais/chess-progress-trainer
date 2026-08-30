import { Chess } from 'chess.js';
import { attemptMove, createGame, replayGame, terminalScore, uci } from '../../computer/game';
import type { PositionAnalysis } from '../../computer/types';

export function matedGame(player: 'w' | 'b' = 'w') {
  let game = createGame(player, 'intermediate');
  ['f2f3', 'e7e5', 'g2g4', 'd8h4'].forEach((move, index) => {
    game = attemptMove(game, (index % 2 ? 'b' : 'w') === player ? 'player' : 'computer', move);
  });
  return game;
}
export function legalAnalysis(fen: string): PositionAnalysis {
  const game = new Chess(fen),
    terminal = terminalScore(game);
  if (terminal) return { score: terminal, bestMove: null, pv: [] };
  const moves = game.moves({ verbose: true });
  const best =
    moves.find((move) => move.san.endsWith('#')) ??
    moves.find((move) => ['e4', 'e5', 'Nf3'].includes(move.san)) ??
    moves[0];
  return { score: { cp: 20, depth: 10 }, bestMove: uci(best), pv: [uci(best)] };
}
export function exampleAnalyses() {
  const positions = replayGame(matedGame()).positions.map(legalAnalysis);
  positions[0].score = { cp: 40, depth: 10 };
  positions[1].score = { cp: 20, depth: 10 };
  positions[2].score = { cp: 0, depth: 10 };
  positions[3].score = { mate: 1, winner: 'b', depth: 10 };
  return positions;
}
