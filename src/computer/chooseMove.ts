import { Chess } from 'chess.js';
import { playUci, uci } from './game';
import { difficultyInfo } from './difficulty';
import { materialExposure } from './material';
import type { Difficulty, EngineScore, PositionAnalysis, SearchEngine, SearchInput } from './types';

export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
export function playerScore(score: EngineScore, side: 'w' | 'b'): number {
  return 'cp' in score
    ? score.cp * (side === 'w' ? 1 : -1)
    : (score.winner === side ? 1 : -1) * (10000 - Math.min(score.mate, 100));
}
const choiceScore = (score: EngineScore, side: 'w' | 'b') =>
  'cp' in score
    ? Math.max(-1800, Math.min(1800, playerScore(score, side)))
    : score.winner === side
      ? 2000
      : -2000;

// Only simple, observable opening habits. Never invent a tactic or a legal move.
export function plausibility(input: SearchInput, token: string): number {
  const board = new Chess(input.fen);
  const move = playUci(board, token);
  if (move.san.includes('+') || move.captured) return 1;
  let weight = 1;
  if (move.piece === 'q') weight *= 0.25;
  if (move.piece === 'r' && !move.flags.includes('k') && !move.flags.includes('q')) weight *= 0.18;
  if (move.piece === 'k') weight *= move.isKingsideCastle() || move.isQueensideCastle() ? 2.5 : 0.2;
  if (move.piece === 'p')
    weight *= /^[de]/.test(move.from) ? 2 : /^[ah]/.test(move.from) ? 0.25 : 0.7;
  if (['n', 'b'].includes(move.piece) && ['1', '8'].includes(move.from[1])) weight *= 2;
  if (move.piece === 'n' && /^[ah]/.test(move.to)) weight *= 0.45;
  const openingWeight = Math.max(0, Math.min(1, (16 - Number(input.fen.split(' ')[5])) / 12));
  weight = 1 + (weight - 1) * openingWeight;
  const ownPrevious = input.history.at(-2);
  if (ownPrevious?.slice(2, 4) === move.from) weight *= 0.25;
  if (ownPrevious === `${move.to}${move.from}`) weight *= 0.15;
  return weight;
}
export function selectCandidate(
  input: SearchInput,
  analysis: PositionAnalysis,
  level: Difficulty,
  random = Math.random,
): string | null {
  return prepareCandidateSelection(input, analysis, level)(random);
}

// Calibration can sample the same evaluated position without repeating chess computations.
export function prepareCandidateSelection(
  input: SearchInput,
  analysis: PositionAnalysis,
  level: Difficulty,
) {
  const profile = difficultyInfo(level).selection;
  if (!profile || !analysis.bestMove) return () => analysis.bestMove;
  const board = new Chess(input.fen);
  const legal = new Set(board.moves({ verbose: true }).map(uci));
  const candidates = (analysis.candidates ?? []).filter((candidate) => legal.has(candidate.move));
  if (candidates.length < 2) return () => analysis.bestMove;
  const side = board.turn();
  const best = Math.max(...candidates.map((candidate) => choiceScore(candidate.score, side)));
  const options = candidates.map((candidate) => ({
    candidate,
    loss: Math.max(0, best - choiceScore(candidate.score, side)),
    exposure: materialExposure(input.fen, candidate.move),
  }));
  const limits = [20, 60, 130, 250, 500, Infinity];
  const safest = Math.min(...options.map((o) => o.exposure));
  const buckets = limits.map((max, index) =>
    options
      .filter((o) => o.loss <= max && (index === 0 || o.loss > limits[index - 1]))
      .map((o) => ({
        move: o.candidate.move,
        weight: plausibility(input, o.candidate.move),
        // A sound sacrifice (near the best evaluation) is not a free gift.
        risk: o.loss > 35 ? Math.max(0, o.exposure - safest) : 0,
      })),
  );
  return (random = Math.random) => {
    let draw = random(),
      band = 0;
    for (; band < profile.bands.length - 1; band++) {
      draw -= profile.bands[band];
      if (draw < 0) break;
    }
    const oversight = random(),
      habit = random();
    for (; band >= 0; band--) {
      const allowed = buckets[band].filter(
        (o) =>
          (o.risk < 200 || oversight < profile.hangingRate / (o.risk >= 700 ? 5 : 1)) &&
          (o.weight >= 1 || habit < o.weight),
      );
      if (allowed.length) return weighted(allowed, random) ?? analysis.bestMove;
    }
    return analysis.bestMove;
  };
}
function weighted(options: { move: string; weight: number }[], random: () => number) {
  let choice =
    Math.min(0.999999999, Math.max(0, random())) *
    options.reduce((sum, item) => sum + item.weight, 0);
  for (const option of options) {
    choice -= option.weight;
    if (choice < 0) return option.move;
  }
  return options.at(-1)?.move;
}
export async function searchForLevel(
  engine: SearchEngine,
  input: SearchInput,
  level: Difficulty,
  signal?: AbortSignal,
  random = Math.random,
): Promise<string | null> {
  const analysis = await engine.search(input, difficultyInfo(level).settings, signal);
  if (signal?.aborted) throw new DOMException('Analyse annulée.', 'AbortError');
  return selectCandidate(input, analysis, level, random);
}
