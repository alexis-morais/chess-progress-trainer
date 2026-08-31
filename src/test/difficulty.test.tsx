import { fireEvent, render, screen } from '@testing-library/react';
import { Chess } from 'chess.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DifficultySelector } from '../computer/DifficultySelector';
import {
  DEFAULT_LEVEL,
  LEVEL_STORAGE_KEY,
  difficulties,
  difficultyInfo,
  difficultyShortcuts,
  loadLevel,
  migrateDifficulty,
  saveLevel,
  validLevel,
} from '../computer/difficulty';
import {
  plausibility,
  seededRandom,
  selectCandidate,
  searchForLevel,
} from '../computer/chooseMove';
import { ComputerEngine } from '../computer/ComputerEngine';
import { loadLastGame } from '../computer/storage';
import { REVIEW_SETTINGS, type PositionAnalysis, type SearchEngine } from '../computer/types';
import { matedGame, exampleAnalyses } from './fixtures/computer';

const expectedElo = [
  250, 400, 550, 700, 850, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000, 2100,
  2200, 2300, 2400, 2500, 2600, 2700, 2900, 3200,
];
const input = { fen: new Chess().fen(), history: [] as string[] };
const analysis: PositionAnalysis = {
  score: { cp: 30, depth: 8 },
  bestMove: 'e2e4',
  pv: ['e2e4'],
  candidates: [
    { move: 'e2e4', score: { cp: 30, depth: 8 }, pv: ['e2e4'] },
    { move: 'd2d4', score: { cp: -40, depth: 8 }, pv: ['d2d4'] },
    { move: 'g1f3', score: { cp: -170, depth: 8 }, pv: ['g1f3'] },
    { move: 'b1c3', score: { cp: -330, depth: 8 }, pv: ['b1c3'] },
    { move: 'a2a3', score: { cp: -780, depth: 8 }, pv: ['a2a3'] },
  ],
};
beforeEach(() => localStorage.clear());
describe('Force 1–25 : profils et mémorisation', () => {
  it.each(difficulties)('$name : estimation et paramètres bornés', (profile) => {
    expect(profile.elo).toBe(expectedElo[profile.id - 1]);
    expect(profile.id).toBeGreaterThanOrEqual(1);
    expect(profile.id).toBeLessThanOrEqual(25);
    expect(profile.settings.skill).toBe(20);
    expect(profile.settings.depth).toBeGreaterThanOrEqual(8);
    expect(profile.settings.movetime).toBeLessThanOrEqual(1800);
    expect(profile.settings.multiPV ?? 1).toBeLessThanOrEqual(20);
    if (profile.id <= 11) expect(profile.selection?.errorRate).toBeGreaterThan(0);
    else if (profile.id < 25) {
      expect(profile.settings.elo).toBeGreaterThanOrEqual(1320);
      expect(profile.settings.elo).toBeLessThanOrEqual(3190);
    } else expect(profile.settings.elo).toBeUndefined();
  });
  it('couvre chaque catégorie et ses limites exactes', () => {
    expect(difficulties).toHaveLength(25);
    expect(difficulties.map((p) => p.category)).toEqual([
      ...Array(5).fill('Débutant'),
      ...Array(6).fill('Intermédiaire'),
      ...Array(4).fill('Avancé'),
      ...Array(4).fill('Expert'),
      ...Array(2).fill('Maître'),
      ...Array(2).fill('Grand maître'),
      'Super grand maître',
      'Maximum',
    ]);
    expect(REVIEW_SETTINGS).toEqual({ skill: 20, depth: 14, movetime: 350 });
  });
  it.each(difficultyShortcuts)('raccourci $name → $level', (shortcut) => {
    const change = vi.fn();
    render(<DifficultySelector level={6} onChange={change} />);
    fireEvent.click(screen.getByRole('button', { name: shortcut.name }));
    expect(change).toHaveBeenCalledWith(shortcut.level);
    expect(screen.getByRole('slider')).toHaveAttribute('min', '1');
    expect(screen.getByRole('slider')).toHaveAttribute('max', '25');
  });
  it('permet d’affiner le curseur et annonce catégorie et estimation', () => {
    const change = vi.fn();
    render(<DifficultySelector level={24} onChange={change} />);
    expect(screen.getByRole('slider')).toHaveAttribute(
      'aria-valuetext',
      'Niveau 24, Super grand maître, force estimée 2900 Elo',
    );
    fireEvent.change(screen.getByRole('slider'), { target: { value: '16' } });
    expect(change).toHaveBeenCalledWith(16);
    fireEvent.input(screen.getByRole('slider'), { target: { value: '1' } });
    expect(change).toHaveBeenLastCalledWith(1);
    expect(screen.getByText(/Force estimée —/)).toBeInTheDocument();
  });
  it.each([
    null,
    '',
    '0',
    '26',
    '-1',
    '8.5',
    'NaN',
    'Infinity',
    'null',
    '{}',
    '[8]',
    '8e0',
    ' 8',
    '8\n',
    '1'.repeat(10000),
  ])('ignore le niveau stocké invalide %s', (raw) => {
    expect(loadLevel({ getItem: () => raw })).toBe(DEFAULT_LEVEL);
  });
  it.each([1, 3, 6, 8, 12, 16, 20, 23, 24, 25] as const)('restaure le niveau %i', (level) => {
    saveLevel(level);
    expect(localStorage.getItem(LEVEL_STORAGE_KEY)).toBe(String(level));
    expect(loadLevel()).toBe(level);
  });
  it('tolère un stockage bloqué et ne persiste pas un nombre invalide', () => {
    const store = {
      getItem: () => {
        throw Error();
      },
      setItem: vi.fn(() => {
        throw Error();
      }),
    };
    expect(loadLevel(store)).toBe(DEFAULT_LEVEL);
    expect(() => saveLevel(8, store)).not.toThrow();
    expect(validLevel('8')).toBe(false);
    expect(validLevel(NaN)).toBe(false);
  });
  it.each([
    ['beginner', 3],
    ['intermediate', 8],
    ['expert', 25],
  ] as const)('migre %s en %i et conserve son bilan', (old, level) => {
    const game = { ...matedGame(), difficulty: old };
    const restored = loadLastGame({
      getItem: () => JSON.stringify({ version: 1, game, analyses: exampleAnalyses() }),
      setItem: vi.fn(),
    });
    expect(restored?.game.difficulty).toBe(level);
    expect(restored?.review?.positions).toEqual(exampleAnalyses());
    expect(restored?.game.moves).toEqual(game.moves);
    expect(migrateDifficulty(old)).toBe(level);
  });
  it.each([null, {}, [], true, '8', 'maximum', -1, 26, 1.5])(
    'refuse une ancienne difficulté inconnue %j',
    (value) => expect(migrateDifficulty(value)).toBeNull(),
  );
});
describe('Sélection évaluée, variée et plausible', () => {
  it('reproduit le hasard personnalisé avec une seed', () => {
    const one = seededRandom(42),
      two = seededRandom(42),
      three = seededRandom(43);
    const a = Array.from({ length: 20 }, () => selectCandidate(input, analysis, 3, one));
    expect(a).toEqual(Array.from({ length: 20 }, () => selectCandidate(input, analysis, 3, two)));
    expect(a).not.toEqual(
      Array.from({ length: 20 }, () => selectCandidate(input, analysis, 3, three)),
    );
    expect(new Set(a).size).toBeGreaterThan(1);
  });
  it.each([1, 3, 6, 8] as const)(
    'niveau %i : ne choisit que des candidats évalués et légaux',
    (level) => {
      const random = seededRandom(level);
      const poisoned = {
        ...analysis,
        candidates: [
          ...analysis.candidates!,
          { move: 'e2e5', score: { cp: 4000, depth: 8 }, pv: ['e2e5'] },
        ],
      };
      for (let i = 0; i < 24; i++)
        expect(analysis.candidates!.map((c) => c.move)).toContain(
          selectCandidate(input, poisoned, level, random),
        );
      expect(selectCandidate(input, { ...analysis, candidates: [] }, level, random)).toBe('e2e4');
    },
  );
  it('réduit les pertes pondérées et les grosses erreurs sans une frontière abrupte', () => {
    const means = ([1, 3, 6, 8] as const).map((level) => {
      const random = seededRandom(555);
      return (
        Array.from({ length: 90 }, () => {
          const move = selectCandidate(input, analysis, level, random);
          const score = analysis.candidates!.find((c) => c.move === move)!.score;
          return 'cp' in score ? 30 - score.cp : 0;
        }).reduce((a, b) => a + b, 0) / 90
      );
    });
    expect(means[0]).toBeGreaterThan(means[1]);
    expect(means[1]).toBeGreaterThan(means[2]);
    expect(means[2]).toBeGreaterThan(means[3]);
    expect(means[0]).toBeGreaterThan(means[3] * 2);
  });
  it('favorise développement et centre plutôt que pions de bord', () => {
    expect(plausibility(input, 'e2e4')).toBeGreaterThan(plausibility(input, 'a2a4'));
    expect(plausibility(input, 'g1f3')).toBeGreaterThan(plausibility(input, 'g1h3'));
  });
  it('laisse le moteur natif jouer les niveaux supérieurs et garde le bilan indépendant', async () => {
    const engine = {
      search: vi.fn().mockResolvedValue(analysis),
      dispose: vi.fn(),
    } satisfies SearchEngine;
    for (const level of [12, 16, 20, 23, 24, 25] as const) {
      expect(await searchForLevel(engine, input, level)).toBe('e2e4');
      expect(engine.search).toHaveBeenLastCalledWith(
        input,
        difficultyInfo(level).settings,
        undefined,
      );
    }
    const controller = new AbortController();
    controller.abort();
    await expect(searchForLevel(engine, input, 1, controller.signal)).rejects.toHaveProperty(
      'name',
      'AbortError',
    );
  });
});

class WorkerStub {
  onmessage: Worker['onmessage'] = null;
  onerror: Worker['onerror'] = null;
  onmessageerror: Worker['onmessageerror'] = null;
  postMessage = vi.fn();
  terminate = vi.fn();
  emit(data: string) {
    this.onmessage?.call(this as unknown as Worker, { data } as MessageEvent);
  }
  ready() {
    this.emit(
      'option name Skill Level type spin default 20 min 0 max 20\noption name MultiPV type spin default 1 min 1 max 256\noption name UCI_LimitStrength type check default false\noption name UCI_Elo type spin default 1320 min 1320 max 3190\nuciok\nreadyok',
    );
  }
}
describe('Options UCI et transition entre recherches', () => {
  it('réinitialise force et MultiPV avant une analyse forte et ignore les candidats périmés', async () => {
    const worker = new WorkerStub(),
      engine = new ComputerEngine(vi.fn(), () => worker);
    worker.ready();
    const first = engine.search(input, difficultyInfo(3).settings);
    worker.emit('readyok');
    worker.emit(
      'info depth 4 multipv 1 score cp 30 pv e2e4\ninfo depth 4 multipv 2 score cp 10 pv d2d4\ninfo depth 4 multipv 3 score cp 900 pv e2e5\nbestmove e2e4',
    );
    expect((await first).candidates?.map((c) => c.move)).toEqual(['e2e4', 'd2d4']);
    const native = engine.search(input, difficultyInfo(20).settings);
    worker.emit('readyok');
    worker.emit('info depth 10 score cp 22 pv g1f3\nbestmove g1f3');
    await native;
    const review = engine.search(input, REVIEW_SETTINGS);
    expect(worker.postMessage).toHaveBeenCalledWith('setoption name UCI_LimitStrength value false');
    expect(worker.postMessage).toHaveBeenCalledWith('setoption name MultiPV value 1');
    worker.emit('readyok');
    worker.emit('info depth 14 score cp 25 pv e2e4\nbestmove e2e4');
    expect((await review).candidates).toBeUndefined();
    engine.dispose();
  });
  it('refuse les paramètres injectés ou hors bornes avant tout envoi', async () => {
    const worker = new WorkerStub(),
      engine = new ComputerEngine(vi.fn(), () => worker);
    worker.ready();
    worker.postMessage.mockClear();
    for (const settings of [
      { ...REVIEW_SETTINGS, elo: 100 },
      { ...REVIEW_SETTINGS, multiPV: 999 },
      { ...REVIEW_SETTINGS, nodes: Infinity },
      { ...REVIEW_SETTINGS, depth: 1.5 },
    ])
      await expect(engine.search(input, settings)).rejects.toThrow('invalides');
    expect(worker.postMessage).not.toHaveBeenCalled();
    engine.dispose();
  });
});
