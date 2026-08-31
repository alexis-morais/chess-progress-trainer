import type { Difficulty, SearchSettings } from './types';

export const DEFAULT_LEVEL: Difficulty = 6;
export const LEVEL_STORAGE_KEY = 'chess-progress:level:v1';
export const strengthNotice = 'Force estimée — peut différer d’un classement humain réel.';
export const difficultyShortcuts = [
  { name: 'Débutant', level: 3 },
  { name: 'Intermédiaire', level: 8 },
  { name: 'Avancé', level: 14 },
  { name: 'Expert', level: 18 },
  { name: 'Maître', level: 20 },
  { name: 'Grand maître', level: 22 },
  { name: 'Super grand maître', level: 24 },
  { name: 'Maximum', level: 25 },
] as const;

export type LevelProfile = {
  id: Difficulty;
  name: string;
  category: string;
  elo: number | null;
  settings: SearchSettings;
  selection?: { bands: readonly number[]; hangingRate: number };
};
const estimates = [
  250,
  400,
  550,
  700,
  850,
  1000,
  1100,
  1200,
  1300,
  1400,
  1500,
  1600,
  1700,
  1800,
  1900,
  2000,
  2100,
  2200,
  2300,
  2400,
  2500,
  2600,
  2700,
  2900,
  null,
];
// Probability budgets for losses 0–20 / 20–60 / 60–130 / 130–250 / 250–500 / >500 cp.
// Missing bands fall back toward better moves, never toward larger errors.
const learnerProfiles = [
  [0.08, 0.13, 0.2, 0.24, 0.22, 0.13],
  [0.11, 0.16, 0.23, 0.245, 0.17, 0.085],
  [0.14, 0.2, 0.25, 0.25, 0.115, 0.045],
  [0.16, 0.24, 0.27, 0.23, 0.075, 0.025],
  [0.18, 0.27, 0.29, 0.195, 0.052, 0.013],
  [0.2, 0.3, 0.3, 0.161, 0.032, 0.007],
  [0.23, 0.32, 0.28, 0.145, 0.021, 0.004],
  [0.26, 0.35, 0.26, 0.115, 0.013, 0.002],
  [0.32, 0.36, 0.22, 0.091, 0.0075, 0.0015],
  [0.39, 0.355, 0.18, 0.068, 0.006, 0.001],
  [0.46, 0.335, 0.15, 0.05, 0.0045, 0.0005],
  [0.53, 0.305, 0.13, 0.032, 0.0028, 0.0002],
  [0.6, 0.28, 0.1, 0.0188, 0.0011, 0.0001],
  [0.67, 0.25, 0.067, 0.0123, 0.00065, 0.00005],
  [0.74, 0.21, 0.043, 0.0068, 0.00018, 0.00002],
];
const hangingRates = [
  0.2, 0.15, 0.1, 0.06, 0.035, 0.018, 0.012, 0.008, 0.005, 0.003, 0.002, 0.001, 0.0005, 0.0003,
  0.0001,
];
export const difficulties: LevelProfile[] = estimates.map((elo, index) => {
  const id = (index + 1) as Difficulty;
  const category =
    id <= 5
      ? 'Débutant'
      : id <= 11
        ? 'Intermédiaire'
        : id <= 15
          ? 'Avancé'
          : id <= 19
            ? 'Expert'
            : id <= 21
              ? 'Maître'
              : id <= 23
                ? 'Grand maître'
                : id === 24
                  ? 'Super grand maître'
                  : 'Maximum';
  const learner = learnerProfiles[index];
  return {
    id,
    name: `Niveau ${id}`,
    category,
    elo,
    settings: learner
      ? { skill: 20, depth: 10, movetime: 350 + id * 20, multiPV: 12, nodes: 30000 + id * 6000 }
      : {
          skill: 20,
          depth: id === 25 ? 26 : 12 + Math.floor((id - 10) / 2),
          movetime: id === 25 ? 4500 : 350 + (id - 10) * 70,
          nodes: id === 25 ? 1800000 : 22000 + (id - 10) * 18000,
          // UCI targets are technical settings, not the displayed human estimates.
          // A measured intermediate target bridges the custom/native boundary; the next
          // two targets extend that ramp instead of jumping directly to the strongest range.
          ...(id < 25
            ? { elo: [2750, 2820, 2920, 3020, 3060, 3095, 3130, 3160, 3190][id - 16] }
            : {}),
        },
    ...(learner ? { selection: { bands: learner, hangingRate: hangingRates[index] } } : {}),
  };
});
export const difficultyInfo = (id: Difficulty) => difficulties[id - 1];
export const difficultyLabel = (id: Difficulty) => {
  const level = difficultyInfo(id);
  return `${level.name} · ${level.category}${level.elo === null ? ' · Stockfish non affaibli' : ` · ≈ ${level.elo} Elo`}`;
};
export function validLevel(value: unknown): value is Difficulty {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 25;
}
export function migrateDifficulty(value: unknown): Difficulty | null {
  if (validLevel(value)) return value;
  if (value === 'beginner') return 3;
  if (value === 'intermediate') return 8;
  if (value === 'expert') return 25;
  return null;
}
export function loadLevel(storage?: Pick<Storage, 'getItem'>): Difficulty {
  try {
    const raw = (storage ?? localStorage).getItem(LEVEL_STORAGE_KEY);
    if (!raw || raw.length > 2 || !/^\d{1,2}$/.test(raw)) return DEFAULT_LEVEL;
    const value = Number(raw);
    return validLevel(value) ? value : DEFAULT_LEVEL;
  } catch {
    return DEFAULT_LEVEL;
  }
}
export function saveLevel(level: Difficulty, storage?: Pick<Storage, 'setItem'>) {
  if (!validLevel(level)) return;
  try {
    (storage ?? localStorage).setItem(LEVEL_STORAGE_KEY, String(level));
  } catch {
    /* The current session works when private browsing blocks storage. */
  }
}
