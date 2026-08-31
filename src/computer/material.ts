import { Chess, type PieceSymbol } from 'chess.js';
import { playUci } from './game';

const value: Record<PieceSymbol, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

// A conservative, shallow safety signal, not a claim that a sacrifice is unsound.
// Only legal captures count; a defended landing square allows for a recapture.
export function materialExposure(fen: string, token: string): number {
  const board = new Chess(fen);
  const played = playUci(board, token);
  const gained =
    (played.captured ? value[played.captured] : 0) +
    (played.promotion ? value[played.promotion] - value.p : 0);
  let risk = 0;
  for (const reply of board.moves({ verbose: true })) {
    if (!reply.captured) continue;
    const defended = board.isAttacked(reply.to, played.color);
    const exchange = value[reply.captured] - (defended ? value[reply.promotion ?? reply.piece] : 0);
    risk = Math.max(risk, exchange - gained);
  }
  return risk;
}
