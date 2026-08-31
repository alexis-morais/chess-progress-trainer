import { Chess } from 'chess.js';
import { legalPv } from './ComputerEngine';
import { otherSide, playUci, positionResult, replayGame } from './game';
import { buildReport } from './review';
import { type GameRecord, type PositionAnalysis, type ReviewReport } from './types';
import { migrateDifficulty } from './difficulty';

export const STORAGE_KEY = 'chess-progress:last-game:v1';
type SavedGame = { game: GameRecord; review: ReviewReport | null };
type StorageAccess = Pick<Storage, 'getItem' | 'setItem'>;
export function saveLastGame(
  game: GameRecord,
  review: ReviewReport | null,
  storage?: StorageAccess,
): boolean {
  if (!game.result) return false;
  try {
    (storage ?? localStorage).setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, game, analyses: review?.positions ?? null }),
    );
    return true;
  } catch {
    return false;
  }
}
export function loadLastGame(storage?: StorageAccess): SavedGame | null {
  try {
    const raw = (storage ?? localStorage).getItem(STORAGE_KEY);
    if (!raw || raw.length > 2_000_000) return null;
    const data = JSON.parse(raw);
    const game = data.game as GameRecord;
    const level = migrateDifficulty(game?.difficulty);
    if (
      data.version !== 1 ||
      !game ||
      typeof game.id !== 'string' ||
      game.id.length > 100 ||
      !['w', 'b'].includes(game.player) ||
      level === null ||
      typeof game.startedAt !== 'string' ||
      typeof game.completedAt !== 'string' ||
      game.startedAt.length > 40 ||
      game.completedAt.length > 40 ||
      !Number.isFinite(Date.parse(game.startedAt)) ||
      !Number.isFinite(Date.parse(game.completedAt ?? '')) ||
      !Array.isArray(game.moves) ||
      game.moves.length > 2000 ||
      !game.result
    )
      return null;
    const board = new Chess();
    for (const token of game.moves) {
      if (positionResult(board)) return null;
      playUci(board, token);
    }
    const expected = positionResult(board);
    if (expected) {
      if (expected.reason !== game.result.reason || expected.winner !== game.result.winner)
        return null;
    } else if (
      game.result.reason !== 'resignation' ||
      game.result.winner !== otherSide(game.player)
    )
      return null;
    let review: ReviewReport | null = null;
    try {
      const fens = replayGame(game).positions;
      const analyses = data.analyses as PositionAnalysis[];
      if (
        Array.isArray(analyses) &&
        analyses.length === fens.length &&
        analyses.every((item, index) => {
          if (
            !item ||
            !item.score ||
            typeof item.score !== 'object' ||
            Array.isArray(item.score) ||
            ('cp' in item.score && 'mate' in item.score) ||
            !Number.isInteger(item.score.depth) ||
            item.score.depth < 0 ||
            item.score.depth > 100
          )
            return false;
          const score = item.score;
          if (
            'cp' in score
              ? !Number.isFinite(score.cp) || Math.abs(score.cp) > 100000
              : !Number.isInteger(score.mate) ||
                score.mate < 0 ||
                score.mate > 1000 ||
                !['w', 'b'].includes(score.winner)
          )
            return false;
          if (
            !Array.isArray(item.pv) ||
            item.pv.length > 6 ||
            legalPv(fens[index], item.pv).length !== item.pv.length
          )
            return false;
          if (item.bestMove !== null) playUci(new Chess(fens[index]), item.bestMove);
          else if (!new Chess(fens[index]).isGameOver() && index !== game.moves.length)
            return false;
          return true;
        })
      )
        review = buildReport(
          game,
          analyses.map((item) => ({
            score:
              'cp' in item.score
                ? { cp: item.score.cp, depth: item.score.depth }
                : { mate: item.score.mate, winner: item.score.winner, depth: item.score.depth },
            bestMove: item.bestMove,
            pv: [...item.pv],
          })),
        );
    } catch {
      /* Keep the legal game even if its cached review is damaged. */
    }
    // Rebuild a small record instead of retaining arbitrary persisted properties.
    return {
      game: {
        id: game.id,
        player: game.player,
        difficulty: level,
        startedAt: game.startedAt,
        completedAt: game.completedAt,
        moves: [...game.moves],
        result: { winner: game.result.winner, reason: game.result.reason },
      },
      review,
    };
  } catch {
    return null;
  }
}
