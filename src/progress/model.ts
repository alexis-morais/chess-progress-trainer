import { openings, type LessonMode } from '../data/openings';
import tacticsData from '../data/tactics.json';
import type { Difficulty, GameRecord, ReviewReport } from '../computer/types';

export const PROGRESS_KEY = 'chess-progress:progress:v1';
export const PROGRESS_VERSION = 1;

export type TrainingResult = {
  openingId: string;
  variationId: string;
  mode: LessonMode;
  errors: number;
  clues: number;
  solutions: number;
};

export type ProgressData = {
  version: 1;
  unlocked: Record<string, string>;
  discoveries: string[];
  training: Record<string, {
    completions: number;
    bestErrors: number;
    withoutSolution: boolean;
    perfect: boolean;
    replayedWithoutError?: boolean;
  }>;
  tactics: string[];
  games: number;
  reviews: number;
  // Game ids whose review was completed, so reopening a saved bilan never counts twice.
  reviewedGames: string[];
  wonLevels: Difficulty[];
  underpromotion: boolean;
  comeback: boolean;
};

export const emptyProgress = (): ProgressData => ({
  version: PROGRESS_VERSION,
  unlocked: {},
  discoveries: [],
  training: {},
  tactics: [],
  games: 0,
  reviews: 0,
  reviewedGames: [],
  wonLevels: [],
  underpromotion: false,
  comeback: false,
});

const stringList = (value: unknown, max: number) =>
  Array.isArray(value)
    ? [...new Set(value.filter((item): item is string => typeof item === 'string' && item.length <= 100))].slice(0, max)
    : [];

const openingIds = new Set(openings.map((opening) => opening.id));
const trainingKeys = new Set(
  openings.flatMap((opening) =>
    opening.variations.flatMap((variation) => [
      `${opening.id}/${variation.id}/essential`,
      `${opening.id}/${variation.id}/extended`,
    ]),
  ),
);
const tacticIds = new Set((tacticsData as Array<{ id: string }>).map((tactic) => tactic.id));

export function parseProgress(value: unknown): ProgressData {
  const clean = emptyProgress();
  if (!value || typeof value !== 'object') return clean;
  const input = value as Partial<ProgressData>;
  if ((input as { version?: unknown }).version === 0) {
    const legacy = input as unknown as {
      discoveries?: unknown;
      completedVariants?: unknown;
      solvedTactics?: unknown;
      games?: unknown;
      reviews?: unknown;
    };
    clean.discoveries = stringList(legacy.discoveries, 10).filter((id) => openingIds.has(id));
    clean.tactics = stringList(legacy.solvedTactics, 20).filter((id) => tacticIds.has(id));
    for (const key of stringList(legacy.completedVariants, 120))
      if (trainingKeys.has(key))
        clean.training[key] = { completions: 1, bestErrors: 0, withoutSolution: false, perfect: false };
    clean.games = Number.isInteger(legacy.games) ? Math.min(100_000, Math.max(0, Number(legacy.games))) : 0;
    clean.reviews = Number.isInteger(legacy.reviews) ? Math.min(clean.games, Math.max(0, Number(legacy.reviews))) : 0;
    return clean;
  }
  if (input.version !== PROGRESS_VERSION) return clean;
  clean.discoveries = stringList(input.discoveries, 10).filter((id) => openingIds.has(id));
  clean.tactics = stringList(input.tactics, 20).filter((id) => tacticIds.has(id));
  clean.games = Number.isInteger(input.games) ? Math.min(100_000, Math.max(0, Number(input.games))) : 0;
  clean.reviews = Number.isInteger(input.reviews) ? Math.min(clean.games, Math.max(0, Number(input.reviews))) : 0;
  clean.reviewedGames = stringList(input.reviewedGames, 200);
  clean.wonLevels = Array.isArray(input.wonLevels)
    ? [...new Set(input.wonLevels.filter((item): item is Difficulty => Number.isInteger(item) && item >= 1 && item <= 25))]
    : [];
  clean.underpromotion = input.underpromotion === true;
  clean.comeback = input.comeback === true;
  if (input.unlocked && typeof input.unlocked === 'object')
    for (const [id, date] of Object.entries(input.unlocked))
      if (/^[a-z0-9-]{2,40}$/.test(id) && typeof date === 'string' && !Number.isNaN(Date.parse(date)))
        clean.unlocked[id] = date;
  if (input.training && typeof input.training === 'object')
    for (const [key, record] of Object.entries(input.training)) {
      if (!trainingKeys.has(key) || !record || typeof record !== 'object') continue;
      const item = record as {
        completions?: unknown;
        bestErrors?: unknown;
        withoutSolution?: unknown;
        perfect?: unknown;
        replayedWithoutError?: unknown;
      };
      const completions = Number(item.completions);
      const bestErrors = Number(item.bestErrors);
      if (Number.isInteger(completions) && completions > 0 && Number.isInteger(bestErrors) && bestErrors >= 0)
        clean.training[key] = {
          completions: Math.min(10_000, completions),
          bestErrors: Math.min(10_000, bestErrors),
          withoutSolution: item.withoutSolution === true,
          perfect: item.perfect === true,
          replayedWithoutError: item.replayedWithoutError === true,
        };
    }
  return clean;
}

export function loadProgress(storage: Pick<Storage, 'getItem'> = localStorage) {
  try {
    const raw = storage.getItem(PROGRESS_KEY);
    return raw && raw.length < 500_000 ? parseProgress(JSON.parse(raw)) : emptyProgress();
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(data: ProgressData, storage: Pick<Storage, 'setItem'> = localStorage) {
  try {
    storage.setItem(PROGRESS_KEY, JSON.stringify(parseProgress(data)));
    return true;
  } catch {
    return false;
  }
}

export const trainingKey = (result: Pick<TrainingResult, 'openingId' | 'variationId' | 'mode'>) =>
  `${result.openingId}/${result.variationId}/${result.mode}`;

// Catalogue-driven counters: nothing is hard coded, adding a variation updates every total.
export const catalogueTotal = openings.reduce(
  (total, opening) => total + opening.variations.length,
  0,
);
export const modeCompleted = (
  data: ProgressData,
  openingId: string,
  variationId: string,
  mode: LessonMode,
) => Boolean(data.training[`${openingId}/${variationId}/${mode}`]);
// One variation counts once, whichever of its two formats was finished.
export const variationCompleted = (data: ProgressData, openingId: string, variationId: string) =>
  modeCompleted(data, openingId, variationId, 'essential') ||
  modeCompleted(data, openingId, variationId, 'extended');
export function openingCompletion(data: ProgressData, openingId: string) {
  const opening = openings.find((entry) => entry.id === openingId);
  if (!opening) return { done: 0, total: 0 };
  return {
    done: opening.variations.filter((variation) =>
      variationCompleted(data, openingId, variation.id),
    ).length,
    total: opening.variations.length,
  };
}
export const openingMastered = (data: ProgressData, openingId: string) => {
  const { done, total } = openingCompletion(data, openingId);
  return total > 0 && done === total;
};
export const openingStarted = (data: ProgressData, openingId: string) =>
  openingCompletion(data, openingId).done > 0;
export function catalogueCompletion(data: ProgressData) {
  return {
    done: openings.reduce((total, opening) => total + openingCompletion(data, opening.id).done, 0),
    total: catalogueTotal,
  };
}

export function playerUnderpromoted(game: GameRecord) {
  const parity = game.player === 'w' ? 0 : 1;
  return game.moves.some((move, index) => index % 2 === parity && /[rbn]$/.test(move));
}

export function wasComebackWin(game: GameRecord, report: ReviewReport) {
  if (game.result?.winner !== game.player) return false;
  const losing = report.positions.some((position) => {
    if ('mate' in position.score) return position.score.winner !== game.player;
    return game.player === 'w' ? position.score.cp <= -300 : position.score.cp >= 300;
  });
  return losing;
}
