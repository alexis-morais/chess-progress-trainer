import type { Side } from '../data/openings';

export type Difficulty =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24
  | 25;
export type ColorChoice = Side | 'random';
export type SearchSettings = {
  skill: number;
  depth: number;
  movetime: number;
  multiPV?: number;
  elo?: number;
  nodes?: number;
};
export { difficulties, difficultyInfo } from './difficulty';
export const REVIEW_SETTINGS: SearchSettings = { skill: 20, depth: 14, movetime: 350 };
export type GameResult = {
  winner: Side | null;
  reason: 'checkmate' | 'stalemate' | 'repetition' | 'fifty' | 'material' | 'resignation' | 'draw';
};
export type GameRecord = {
  id: string;
  startedAt: string;
  completedAt?: string;
  player: Side;
  difficulty: Difficulty;
  moves: string[];
  result: GameResult | null;
};
export type EngineScore = ({ cp: number } | { mate: number; winner: Side }) & { depth: number };
export type Candidate = { move: string; score: EngineScore; pv: string[] };
export type PositionAnalysis = {
  score: EngineScore;
  bestMove: string | null;
  pv: string[];
  candidates?: Candidate[];
};
export type EngineStatus = 'loading' | 'ready' | 'thinking' | 'unavailable';
export type SearchInput = { fen: string; history: string[]; startFen?: string };
export interface SearchEngine {
  search(
    input: SearchInput,
    settings: SearchSettings,
    signal?: AbortSignal,
  ): Promise<PositionAnalysis>;
  dispose(): void;
}

export const categories = [
  'best',
  'excellent',
  'good',
  'inaccuracy',
  'mistake',
  'blunder',
] as const;
export type Category = (typeof categories)[number];
export const categoryInfo: Record<
  Category,
  { name: string; plural: string; symbol: string; good: boolean }
> = {
  best: { name: 'Meilleur coup', plural: 'Meilleurs coups', symbol: '★', good: true },
  excellent: { name: 'Excellent', plural: 'Excellents', symbol: '✓', good: true },
  good: { name: 'Bon', plural: 'Bons', symbol: '✓', good: true },
  inaccuracy: { name: 'Imprécision', plural: 'Imprécisions', symbol: '?!', good: false },
  mistake: { name: 'Erreur', plural: 'Erreurs', symbol: '?', good: false },
  blunder: { name: 'Gaffe', plural: 'Gaffes', symbol: '✕', good: false },
};
export type Assessment = { category: Category; loss: number; cpLoss: number | null };
export type ReviewedMove = Assessment & {
  ply: number;
  played: string;
  bestSan: string | null;
  comment: string;
  proposedLine: string;
};
export type ReviewReport = {
  positions: PositionAnalysis[];
  moves: ReviewedMove[];
  counts: Record<Category, number>;
  accuracy: number | null;
};
