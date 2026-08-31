import { Chess } from 'chess.js';
import { describe, expect, it, vi } from 'vitest';
import {
  analyzeGame,
  buildReport,
  classifyMove,
  contextualValue,
  navigatePly,
  pedagogicalComment,
  proposedLine,
  scoreLabel,
} from '../computer/review';
import { createGame, replayGame, resign } from '../computer/game';
import {
  REVIEW_SETTINGS,
  type EngineScore,
  type PositionAnalysis,
  type SearchEngine,
} from '../computer/types';
import { exampleAnalyses, legalAnalysis, matedGame } from './fixtures/computer';

const cp = (value: number): EngineScore => ({ cp: value, depth: 12 });
const grade = (before: EngineScore, after: EngineScore, player: 'w' | 'b' = 'w') =>
  classifyMove(before, after, player, 'd2d4', 'e2e4');
describe('Bilan : catégories pédagogiques', () => {
  it.each([
    [20, 10, 'excellent'],
    [20, -20, 'good'],
    [50, -50, 'inaccuracy'],
    [50, -150, 'mistake'],
    [500, -400, 'blunder'],
    [1500, 1300, 'good'],
    [-1400, -1600, 'good'],
  ])('classe %i → %i : %s', (before, after, category) =>
    expect(grade(cp(before), cp(after)).category).toBe(category),
  );
  it('normalise les pertes pour les Noirs sans changer la convention affichée', () => {
    expect(grade(cp(-500), cp(400), 'b').category).toBe('blunder');
    expect(grade(cp(50), cp(-50), 'b').loss).toBe(0);
    expect(scoreLabel(cp(40))).toBe('+0.4');
    expect(scoreLabel(cp(-120))).toBe('-1.2');
  });
  it('distingue le meilleur coup trouvé et tolère une amélioration de score', () => {
    expect(classifyMove(cp(0), cp(-10), 'w', 'e2e4', 'e2e4').category).toBe('best');
    expect(grade(cp(0), cp(20))).toEqual({ category: 'excellent', loss: 0, cpLoss: 0 });
    expect(contextualValue(1000) - contextualValue(900)).toBeLessThan(100);
  });
  it('traite l’apparition et la disparition d’un mat, sans punir de nouveau une position déjà condamnée', () => {
    const mateW: EngineScore = { mate: 3, winner: 'w', depth: 12 },
      mateB: EngineScore = { mate: 2, winner: 'b', depth: 12 };
    expect(grade(cp(0), mateB).category).toBe('blunder');
    expect(grade(cp(-900), mateB).category).toBe('mistake');
    expect(grade(mateW, cp(700)).category).toBe('inaccuracy');
    expect(grade(mateW, cp(100)).category).toBe('mistake');
    expect(grade(mateW, cp(-400)).category).toBe('blunder');
    expect(grade(mateB, { mate: 1, winner: 'b', depth: 12 }).loss).toBe(0);
    expect(scoreLabel(mateW)).toBe('M3');
    expect(scoreLabel(mateB)).toBe('−M2');
    expect(scoreLabel({ mate: 0, winner: 'b', depth: 0 })).toBe('Mat Noirs');
  });
});

describe('Bilan : calcul séquentiel et navigation', () => {
  it.each(['w', 'b'] as const)(
    'analyse les positions avant/après chaque coup de %s, une seule à la fois',
    async (player) => {
      const record = matedGame(player),
        replay = replayGame(record),
        analyses = exampleAnalyses();
      let busy = false;
      const search = vi.fn(async (input) => {
        expect(busy).toBe(false);
        busy = true;
        await Promise.resolve();
        busy = false;
        return analyses[input.history.length];
      });
      const progress = vi.fn();
      const report = await analyzeGame(
        record,
        { search, dispose: vi.fn() },
        new AbortController().signal,
        progress,
      );
      expect(search).toHaveBeenCalledTimes(4); // Mat final connu exactement par chess.js.
      search.mock.calls.forEach(([input], index) => {
        expect(input).toEqual({
          fen: replay.positions[index],
          history: record.moves.slice(0, index),
        });
        expect((search.mock.calls[index] as unknown[])[1]).toEqual(REVIEW_SETTINGS);
      });
      expect(report.positions).toHaveLength(5);
      expect(report.moves).toHaveLength(2);
      expect(report.moves.map((move) => move.ply)).toEqual(player === 'w' ? [1, 3] : [2, 4]);
      expect(Object.values(report.counts).reduce((a, b) => a + b, 0)).toBe(2);
      expect(report.accuracy).toBeGreaterThanOrEqual(0);
      expect(report.accuracy).toBeLessThanOrEqual(100);
      expect(progress).toHaveBeenLastCalledWith(2, 2);
      expect(report.moves.every((move) => move.comment.length > 20)).toBe(true);
    },
  );
  it('ne lance aucune analyse avant la fin de la partie', async () => {
    const search = vi.fn();
    await expect(
      analyzeGame(
        createGame('w', 25),
        { search, dispose: vi.fn() },
        new AbortController().signal,
        vi.fn(),
      ),
    ).rejects.toThrow('Termine');
    expect(search).not.toHaveBeenCalled();
  });
  it('abandonne la boucle à l’annulation, même si un ancien moteur résout ensuite sa promesse', async () => {
    const controller = new AbortController();
    const search = vi.fn(async () => {
      controller.abort();
      return legalAnalysis(new Chess().fen());
    });
    await expect(
      analyzeGame(matedGame(), { search, dispose: vi.fn() }, controller.signal, vi.fn()),
    ).rejects.toHaveProperty('name', 'AbortError');
    expect(search).toHaveBeenCalledOnce();
  });
  it('propage la panne au lieu de fabriquer un bilan', async () => {
    const engine: SearchEngine = {
      search: vi.fn().mockRejectedValue(new Error('indisponible')),
      dispose: vi.fn(),
    };
    await expect(
      analyzeGame(matedGame(), engine, new AbortController().signal, vi.fn()),
    ).rejects.toThrow('indisponible');
    expect(() => buildReport(matedGame(), [])).toThrow('incomplète');
  });
  it('gère l’abandon sans coup, sans précision arbitraire', async () => {
    const record = resign(createGame('b', 3));
    const report = await analyzeGame(
      record,
      { search: async (input) => legalAnalysis(input.fen), dispose() {} },
      new AbortController().signal,
      vi.fn(),
    );
    expect(report.moves).toHaveLength(0);
    expect(report.accuracy).toBeNull();
  });
  it('borne les commandes de navigation et produit une courte suite légale en français', () => {
    expect(navigatePly(0, 'previous', 4)).toBe(0);
    expect(navigatePly(4, 'next', 4)).toBe(4);
    expect(navigatePly(3, 'previous', 4)).toBe(2);
    expect(navigatePly(2, 'next', 4)).toBe(3);
    expect(navigatePly(3, 'first', 4)).toBe(0);
    expect(navigatePly(0, 'last', 4)).toBe(4);
    expect(
      proposedLine(new Chess().fen(), ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4', 'g8f6', 'd2d3']),
    ).toBe('1. e4 e5 2. Cf3 Cc6 3. Fc4 Cf6');
    expect(proposedLine(new Chess().fen(), ['e2e4', 'e7e4'])).toBe('1. e4');
  });
});

describe('Commentaires : faits observables, sans tactiques inventées', () => {
  const analysis = (value = 0): PositionAnalysis => ({ score: cp(value), bestMove: null, pv: [] });
  it('explique le développement et le roque', () => {
    const move = new Chess().move('Nf3');
    expect(
      pedagogicalComment(
        move,
        { category: 'excellent', loss: 0, cpLoss: 0 },
        analysis(),
        analysis(),
        null,
      ),
    ).toContain('développes un cavalier');
    const castle = new Chess('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1').move('O-O');
    expect(
      pedagogicalComment(
        castle,
        { category: 'good', loss: 30, cpLoss: 30 },
        analysis(),
        analysis(),
        null,
      ),
    ).toContain('roi à l’abri');
  });
  it('reste prudent sans preuve de perte de matériel et donne le meilleur coup en français', () => {
    const report = buildReport(matedGame(), exampleAnalyses());
    expect(report.moves[0].bestSan).toBe('e4');
    const move = new Chess().move('f3');
    const comment = pedagogicalComment(
      move,
      { category: 'mistake', loss: 200, cpLoss: 200 },
      analysis(20),
      analysis(-180),
      'e4',
    );
    expect(comment).toContain('analyse limitée');
    expect(comment).toContain('Stockfish préférait e4');
    expect(comment).not.toMatch(/sans défense|perte de matériel|fourchette/);
    expect(report.moves[1].comment).toContain('mat forcé');
  });
  it('ne mentionne une perte matérielle que si la suite analysée la montre', () => {
    const board = new Chess('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
    const move = board.move('Ra7');
    const after = { ...analysis(-500), pv: ['a8a7'] };
    expect(
      pedagogicalComment(
        move,
        { category: 'blunder', loss: 500, cpLoss: 500 },
        analysis(),
        after,
        'O-O',
      ),
    ).toContain('suite analysée montre une perte de matériel');
  });
});
