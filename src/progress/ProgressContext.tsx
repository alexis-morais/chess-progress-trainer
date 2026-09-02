import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import type { GameRecord, ReviewReport } from '../computer/types';
import { badges } from './badges';
import {
  emptyProgress,
  loadProgress,
  playerUnderpromoted,
  saveProgress,
  trainingKey,
  wasComebackWin,
  type ProgressData,
  type TrainingResult,
} from './model';

type ProgressApi = {
  data: ProgressData;
  notice: string | null;
  discover: (openingId: string) => boolean;
  trainingComplete: (result: TrainingResult) => void;
  tacticComplete: (id: string) => void;
  gameComplete: (game: GameRecord) => void;
  moveComplete: (game: GameRecord) => void;
  reviewComplete: (game: GameRecord, review: ReviewReport) => void;
  dismiss: () => void;
};
const standalone: ProgressApi = {
  data: emptyProgress(),
  notice: null,
  discover: () => true,
  trainingComplete: () => undefined,
  tacticComplete: () => undefined,
  gameComplete: () => undefined,
  moveComplete: () => undefined,
  reviewComplete: () => undefined,
  dismiss: () => undefined,
};
const Context = createContext<ProgressApi>(standalone);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState(loadProgress);
  const dataRef = useRef(data);
  const [notices, setNotices] = useState<string[]>([]);
  const update = useCallback((recipe: (draft: ProgressData) => void) => {
    const current = dataRef.current;
    const alreadyUnlocked = new Set(Object.keys(current.unlocked));
    const next: ProgressData = JSON.parse(JSON.stringify(current));
    recipe(next);
    const now = new Date().toISOString();
    for (const badge of badges)
      if (badge.achieved(next) && !next.unlocked[badge.id]) next.unlocked[badge.id] = now;
    const newBadges = badges.filter(
      (badge) => next.unlocked[badge.id] && !alreadyUnlocked.has(badge.id),
    );
    dataRef.current = next;
    setData(next);
    if (newBadges.length)
      setNotices((queue) => [...queue, ...newBadges.map((badge) => badge.name)]);
    saveProgress(next);
  }, []);
  const dismiss = useCallback(() => setNotices((current) => current.slice(1)), []);
  const api = useMemo<ProgressApi>(() => ({
    data,
    notice: notices[0] ?? null,
    dismiss,
    discover(openingId) {
      const first = !dataRef.current.discoveries.includes(openingId);
      update((draft) => {
        if (!draft.discoveries.includes(openingId)) draft.discoveries.push(openingId);
      });
      return first;
    },
    trainingComplete(result) {
      update((draft) => {
        const key = trainingKey(result);
        const old = draft.training[key];
        draft.training[key] = {
          completions: (old?.completions ?? 0) + 1,
          bestErrors: Math.min(old?.bestErrors ?? Number.MAX_SAFE_INTEGER, result.errors),
          withoutSolution: (old?.withoutSolution ?? false) || result.solutions === 0,
          replayedWithoutError:
            (old?.replayedWithoutError ?? false) || (!!old && result.errors === 0),
          perfect:
            (old?.perfect ?? false) ||
            (result.mode === 'extended' && result.errors === 0 && result.clues === 0 && result.solutions === 0),
        };
        if (result.mode === 'extended' && result.errors === 0 && result.clues === 0 && result.solutions === 0)
          draft.unlocked.perfectionist ||= new Date().toISOString();
      });
    },
    tacticComplete(id) {
      update((draft) => { if (!draft.tactics.includes(id)) draft.tactics.push(id); });
    },
    gameComplete(game) {
      update((draft) => {
        draft.games += 1;
        if (playerUnderpromoted(game)) draft.underpromotion = true;
        if (game.result?.winner === game.player) {
          const previous = draft.wonLevels.length ? Math.max(...draft.wonLevels) : 0;
          if (previous > 0 && game.difficulty >= previous + 4) draft.unlocked.david ||= new Date().toISOString();
          if (!draft.wonLevels.includes(game.difficulty)) draft.wonLevels.push(game.difficulty);
        }
      });
    },
    // A real under-promotion is a finished event by itself: the badge lands on the move.
    moveComplete(game) {
      if (dataRef.current.underpromotion || !playerUnderpromoted(game)) return;
      update((draft) => {
        draft.underpromotion = true;
      });
    },
    reviewComplete(game, review) {
      if (
        dataRef.current.reviewedGames.includes(game.id) &&
        (dataRef.current.comeback || !wasComebackWin(game, review))
      )
        return;
      update((draft) => {
        if (!draft.reviewedGames.includes(game.id)) {
          draft.reviewedGames.push(game.id);
          draft.reviews += 1;
        }
        if (wasComebackWin(game, review)) draft.comeback = true;
      });
    },
  }), [data, dismiss, notices, update]);
  return <Context.Provider value={api}>{children}</Context.Provider>;
}

export function useProgress() {
  return useContext(Context);
}
