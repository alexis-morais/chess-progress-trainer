import { Chess, type Move, type Square } from 'chess.js';

export type Orientation = 'white' | 'black';
export type BoardRect = Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>;

export function squareAtPoint(x: number, y: number, rect: BoardRect, orientation: Orientation) {
  if (!rect.width || !rect.height) return null;
  const col = Math.floor(((x - rect.left) / rect.width) * 8);
  const row = Math.floor(((y - rect.top) / rect.height) * 8);
  if (col < 0 || col > 7 || row < 0 || row > 7) return null;
  return `${'abcdefgh'[orientation === 'white' ? col : 7 - col]}${orientation === 'white' ? 8 - row : row + 1}` as Square;
}

export function squareCenter(square: string, rect: BoardRect, orientation: Orientation) {
  const file = square.charCodeAt(0) - 97;
  const rank = Number(square[1]) - 1;
  return {
    x: rect.left + (((orientation === 'white' ? file : 7 - file) + 0.5) * rect.width) / 8,
    y: rect.top + (((orientation === 'white' ? 7 - rank : rank) + 0.5) * rect.height) / 8,
  };
}

export function legalDestinations(game: Chess, square: Square) {
  const destinations = new Map<Square, 'move' | 'capture'>();
  for (const move of game.moves({ square, verbose: true }))
    destinations.set(move.to, move.captured ? 'capture' : 'move');
  return destinations;
}

// Animate only a verified transition, never a reset or an unrelated review position.
export function animatedMoves(before: string, after: string, last?: Pick<Move, 'from' | 'to'>) {
  if (!last || before === after) return [];
  try {
    const game = new Chess(before);
    const target = new Chess(after).get(last.to);
    const move = game.move({ ...last, promotion: target?.type });
    if (game.fen() !== after) return [];
    const moves = [{ from: move.from, to: move.to }];
    const rank = move.color === 'w' ? '1' : '8';
    if (move.isKingsideCastle())
      moves.push({ from: `h${rank}` as Square, to: `f${rank}` as Square });
    if (move.isQueensideCastle())
      moves.push({ from: `a${rank}` as Square, to: `d${rank}` as Square });
    return moves;
  } catch {
    return [];
  }
}
