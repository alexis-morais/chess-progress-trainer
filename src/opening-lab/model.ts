import { Chess, type Move } from 'chess.js';
import { frenchSan, getLessonMoves, openings, type Side } from '../data/openings';
import { playUci, positionResult, uci } from '../computer/game';
import type { Candidate, EngineScore, PositionAnalysis, SearchSettings } from '../computer/types';
import type { Evaluation } from '../engine/StockfishEngine';

export const LAB_RECOMMENDATION_SETTINGS: SearchSettings = {
  skill: 20,
  depth: 13,
  movetime: 320,
  multiPV: 3,
};
export const LAB_EVALUATION_SETTINGS: SearchSettings = {
  skill: 20,
  depth: 11,
  movetime: 180,
  multiPV: 1,
};

export type LabTimeline = { moves: string[]; cursor: number };
export type RecommendationRank = 1 | 2 | 3;
export type LabRecommendation = {
  rank: RecommendationRank;
  badge: 'MEILLEUR' | 'EXCELLENT' | 'BON';
  move: string;
  san: string;
  from: string;
  to: string;
  promotion?: string;
  score: EngineScore;
  label: string;
};

export function replayTimeline(timeline: LabTimeline) {
  const complete = new Chess();
  const current = new Chess();
  const positions = [complete.fen()];
  const moves: Move[] = [];
  timeline.moves.forEach((token, index) => {
    const move = playUci(complete, token);
    moves.push(move);
    positions.push(complete.fen());
    // Replaying the prefix preserves repetition history; loading its final FEN alone would not.
    if (index < timeline.cursor) playUci(current, token);
  });
  return { game: current, positions, moves };
}

export function playLabMove(
  timeline: LabTimeline,
  from: string,
  to: string,
  promotion?: string,
): LabTimeline {
  if (positionResult(replayTimeline(timeline).game)) return timeline;
  const prefix = timeline.moves.slice(0, timeline.cursor);
  const game = new Chess();
  try {
    prefix.forEach((token) => playUci(game, token));
    const played = game.move({ from, to, ...(promotion ? { promotion } : {}) });
    return { moves: [...prefix, uci(played)], cursor: prefix.length + 1 };
  } catch {
    return timeline;
  }
}

export function moveCursor(timeline: LabTimeline, cursor: number): LabTimeline {
  return { ...timeline, cursor: Math.max(0, Math.min(cursor, timeline.moves.length)) };
}

export function scoreForStudiedSide(score: EngineScore, side: Side): Evaluation {
  if ('cp' in score) return { cp: side === 'w' ? score.cp : -score.cp, depth: score.depth };
  const signedMate = (score.winner === side ? 1 : -1) * score.mate;
  return { mate: signedMate, depth: score.depth };
}

export function scoreLabelForStudiedSide(score: EngineScore, side: Side) {
  const normalized = scoreForStudiedSide(score, side);
  if (normalized.mate !== undefined)
    return `${normalized.mate < 0 ? '−' : ''}M${Math.abs(normalized.mate)}`;
  const value = (normalized.cp ?? 0) / 100;
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}`;
}

export function scoreForEvaluationBar(score: EngineScore): Evaluation {
  return 'cp' in score
    ? { cp: score.cp, depth: score.depth }
    : {
        mate: (score.winner === 'w' ? 1 : -1) * score.mate,
        depth: score.depth,
      };
}

const badges = ['MEILLEUR', 'EXCELLENT', 'BON'] as const;

export function recommendationsFrom(
  analysis: PositionAnalysis,
  fen: string,
  studiedSide: Side,
): LabRecommendation[] {
  const seen = new Set<string>();
  const candidates = [...(analysis.candidates ?? [])].sort((left, right) => {
    if (left.move === analysis.bestMove) return -1;
    if (right.move === analysis.bestMove) return 1;
    return scoreStrength(right.score, studiedSide) - scoreStrength(left.score, studiedSide);
  });
  // Without MultiPV rank 1 there is no safe way to relabel a partial rank 2 as "MEILLEUR".
  if (!candidates.length || candidates[0].move !== analysis.bestMove) return [];
  return candidates
    .filter((candidate) => {
      if (seen.has(candidate.move)) return false;
      seen.add(candidate.move);
      return legalCandidate(candidate, fen);
    })
    .slice(0, 3)
    .map((candidate, index) => {
      const game = new Chess(fen);
      const played = playUci(game, candidate.move);
      const rank = (index + 1) as RecommendationRank;
      return {
        rank,
        badge: badges[index],
        move: candidate.move,
        san: frenchSan(played.san),
        from: candidate.move.slice(0, 2),
        to: candidate.move.slice(2, 4),
        ...(candidate.move[4] ? { promotion: candidate.move[4] } : {}),
        score: candidate.score,
        label: scoreLabelForStudiedSide(candidate.score, studiedSide),
      };
    });
}

function scoreStrength(score: EngineScore, side: Side) {
  if ('cp' in score) return side === 'w' ? score.cp : -score.cp;
  return score.winner === side ? 100_000 - score.mate : -100_000 + score.mate;
}

function legalCandidate(candidate: Candidate, fen: string) {
  try {
    const game = new Chess(fen);
    playUci(game, candidate.move);
    return true;
  } catch {
    return false;
  }
}

type KnownLine = { opening: string; variation: string; moves: string[] };
const knownLines: KnownLine[] = openings.flatMap((opening) =>
  opening.variations.map((variation) => {
    const game = new Chess();
    return {
      opening: opening.name,
      variation: variation.name,
      moves: getLessonMoves(variation, 'extended').map((entry) => {
        const played = game.move(entry.san, { strict: true });
        return uci(played);
      }),
    };
  }),
);

export type OpeningRecognition =
  | { kind: 'free'; opening: null; variation: null; inBook: false }
  | { kind: 'catalogue'; opening: string; variation: string | null; inBook: boolean };

const commonPrefixLength = (left: string[], right: string[]) => {
  let length = 0;
  while (length < left.length && length < right.length && left[length] === right[length])
    length += 1;
  return length;
};

export function recognizeOpening(moves: string[]): OpeningRecognition {
  if (!moves.length) return { kind: 'free', opening: null, variation: null, inBook: false };
  const exactMatches = knownLines.filter(
    (line) =>
      moves.length <= line.moves.length && moves.every((move, index) => line.moves[index] === move),
  );
  if (exactMatches.length) {
    const openingNames = new Set(exactMatches.map((line) => line.opening));
    if (openingNames.size !== 1)
      return { kind: 'free', opening: null, variation: null, inBook: false };
    const variationNames = new Set(exactMatches.map((line) => line.variation));
    return {
      kind: 'catalogue',
      opening: exactMatches[0].opening,
      variation: variationNames.size === 1 ? exactMatches[0].variation : null,
      inBook: true,
    };
  }

  const prefixLengths = knownLines.map((line) => ({
    line,
    length: commonPrefixLength(moves, line.moves),
  }));
  const longest = Math.max(...prefixLengths.map(({ length }) => length));
  const closest = prefixLengths.filter(({ length }) => length === longest && length > 0);
  const openingNames = new Set(closest.map(({ line }) => line.opening));
  if (openingNames.size !== 1)
    return { kind: 'free', opening: null, variation: null, inBook: false };
  return {
    kind: 'catalogue',
    opening: closest[0].line.opening,
    variation: null,
    inBook: false,
  };
}

export function identifyOpening(moves: string[]) {
  const recognition = recognizeOpening(moves);
  if (recognition.kind === 'free') return 'Exploration libre';
  if (!recognition.inBook) return `${recognition.opening} · Hors répertoire`;
  return recognition.variation
    ? `${recognition.opening} · ${recognition.variation}`
    : recognition.opening;
}
