import { Chess, type Move, type Square } from 'chess.js';
import type { Side } from '../data/openings';
import type { ColorChoice, Difficulty, EngineScore, GameRecord, GameResult } from './types';

export const otherSide = (side: Side): Side => (side === 'w' ? 'b' : 'w');
export function resolveColor(choice: ColorChoice, random = Math.random): Side {
  return choice === 'random' ? (random() < 0.5 ? 'w' : 'b') : choice;
}
export function createGame(
  choice: ColorChoice,
  difficulty: Difficulty,
  random = Math.random,
): GameRecord {
  return {
    id: crypto.randomUUID(),
    startedAt: new Date().toISOString(),
    player: resolveColor(choice, random),
    difficulty,
    moves: [],
    result: null,
  };
}
export const uci = (move: Pick<Move, 'from' | 'to' | 'promotion'>) =>
  move.from + move.to + (move.promotion ?? '');
export function playUci(game: Chess, move: string): Move {
  if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(move)) throw new Error('Coup moteur invalide.');
  const played = game.move({ from: move.slice(0, 2), to: move.slice(2, 4), promotion: move[4] });
  if (uci(played) !== move) {
    game.undo();
    throw new Error('Promotion invalide.');
  }
  return played;
}
export function replayGame(record: Pick<GameRecord, 'moves'>) {
  const game = new Chess();
  const positions = [game.fen()];
  const moves = record.moves.map((token) => {
    const move = playUci(game, token);
    positions.push(game.fen());
    return move;
  });
  return { game, positions, moves };
}
export function positionResult(game: Chess): GameResult | null {
  if (game.isCheckmate()) return { winner: otherSide(game.turn()), reason: 'checkmate' };
  if (game.isStalemate()) return { winner: null, reason: 'stalemate' };
  if (game.isInsufficientMaterial()) return { winner: null, reason: 'material' };
  if (game.isThreefoldRepetition()) return { winner: null, reason: 'repetition' };
  if (game.isDrawByFiftyMoves()) return { winner: null, reason: 'fifty' };
  if (game.isDraw()) return { winner: null, reason: 'draw' };
  return null;
}
export function terminalScore(game: Chess): EngineScore | null {
  const result = positionResult(game);
  if (!result) return null;
  return result.winner ? { mate: 0, winner: result.winner, depth: 0 } : { cp: 0, depth: 0 };
}
export function attemptMove(
  record: GameRecord,
  actor: 'player' | 'computer',
  token: string,
  expectedPly = record.moves.length,
): GameRecord {
  if (record.result || expectedPly !== record.moves.length) return record;
  const { game } = replayGame(record);
  if (game.turn() !== (actor === 'player' ? record.player : otherSide(record.player)))
    return record;
  try {
    const move = playUci(game, token);
    const result = positionResult(game);
    return {
      ...record,
      moves: [...record.moves, uci(move)],
      result,
      ...(result ? { completedAt: new Date().toISOString() } : {}),
    };
  } catch {
    return record;
  }
}
export function resign(record: GameRecord): GameRecord {
  return record.result
    ? record
    : {
        ...record,
        result: { winner: otherSide(record.player), reason: 'resignation' },
        completedAt: new Date().toISOString(),
      };
}
export const resultTitle = (record: GameRecord) =>
  !record.result
    ? 'Partie en cours'
    : record.result.winner === null
      ? 'Match nul'
      : record.result.winner === record.player
        ? 'Victoire'
        : 'Défaite';
export const resultReason = (result: GameResult) =>
  ({
    checkmate: 'Échec et mat',
    stalemate: 'Pat',
    repetition: 'Répétition de position',
    fifty: 'Règle des 50 coups',
    material: 'Matériel insuffisant',
    resignation: 'Abandon',
    draw: 'Position nulle',
  })[result.reason];
export const moveNumber = (ply: number) => `${Math.ceil(ply / 2)}${ply % 2 ? '.' : '…'}`;
export function legalPromotions(game: Chess, from: string, to: string) {
  return game
    .moves({ square: from as Square, verbose: true })
    .filter((move) => move.to === to && move.promotion)
    .map((move) => move.promotion!);
}
