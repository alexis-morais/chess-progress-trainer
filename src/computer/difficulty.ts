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
  elo: number;
  settings: SearchSettings;
  selection?: { errorRate: number; targetLoss: number; maxLoss: number };
};
const estimates = [
  250, 400, 550, 700, 850, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000, 2100,
  2200, 2300, 2400, 2500, 2600, 2700, 2900, 3200,
];
// Below Stockfish's native minimum (1320), choose among evaluated alternatives.
// Levels 10–11 bridge to native weakening: the initial native 1400 trial regressed.
// Separate profiles make the progression auditable and adjustable after calibration.
const learnerProfiles = [
  [0.9, 330, 1000],
  [0.87, 300, 900],
  [0.84, 270, 800],
  [0.79, 240, 740],
  [0.74, 210, 670],
  [0.68, 185, 600],
  [0.62, 160, 530],
  [0.55, 140, 460],
  [0.48, 120, 400],
  [0.41, 100, 340],
  [0.34, 80, 280],
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
      ? { skill: 20, depth: 8, movetime: 220, multiPV: 20, nodes: 12000 }
      : {
          skill: 20,
          depth: id === 25 ? 22 : 12 + Math.floor((id - 10) / 2),
          movetime: id === 25 ? 1800 : 350 + (id - 10) * 70,
          nodes: id === 25 ? 450000 : 22000 + (id - 10) * 18000,
          // Native UCI Elo is calibrated at a different time control. Browser match
          // calibration needs a stronger native target at the custom/native boundary.
          ...(id < 25 ? { elo: id === 24 ? 3150 : elo + 300 } : {}),
        },
    ...(learner
      ? { selection: { errorRate: learner[0], targetLoss: learner[1], maxLoss: learner[2] } }
      : {}),
  };
});
export const difficultyInfo = (id: Difficulty) => difficulties[id - 1];
export const difficultyLabel = (id: Difficulty) => {
  const level = difficultyInfo(id);
  return `${level.name} · ${level.category} · ≈ ${level.elo} Elo`;
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
