import { Chess } from 'chess.js';
import { describe, expect, it, vi } from 'vitest';
import { materialExposure } from '../computer/material';
import {
  prepareCandidateSelection,
  plausibility,
  seededRandom,
  searchForLevel,
} from '../computer/chooseMove';
import { difficulties, difficultyInfo } from '../computer/difficulty';
import type { PositionAnalysis } from '../computer/types';

const knightFen = '4k3/8/8/8/3p4/8/4N3/4K3 w - - 0 20';
const analysis = (moves: [string, number][]): PositionAnalysis => ({
  bestMove: moves[0][0],
  score: { cp: moves[0][1], depth: 10 },
  pv: [moves[0][0]],
  candidates: moves.map(([move, cp]) => ({ move, score: { cp, depth: 10 }, pv: [move] })),
});
const draws =
  (...values: number[]) =>
  () =>
    values.shift() ?? 0;

describe('Protection matérielle, sans interdire les sacrifices compensés', () => {
  it('détecte une pièce immédiatement offerte, même si une autre pièce a bougé', () => {
    expect(materialExposure(knightFen, 'e2c3')).toBe(320);
    expect(materialExposure(knightFen, 'e2g3')).toBe(0);
    const b = new Chess(knightFen);
    b.move('Nc3');
    b.move('Kf7');
    expect(materialExposure(b.fen(), 'e1f2')).toBe(320);
  });
  it('compte la compensation déjà obtenue et la valeur du capturant repris', () => {
    expect(materialExposure('3rk3/8/8/3q4/8/8/3Q4/4K3 w - - 0 20', 'd2d5')).toBe(0);
    expect(materialExposure('4k3/8/8/8/3p4/8/1P2N3/4K3 w - - 0 20', 'e2c3')).toBe(220);
  });
  it('détecte une dame offerte sans confondre un échec avec une capture disponible', () => {
    const fen = '3rk3/8/8/8/8/8/8/3QK3 w - - 0 20';
    expect(materialExposure(fen, 'd1d4')).toBe(900);
    expect(materialExposure(fen, 'd1h5')).toBe(0);
  });
  it('garde la promotion et le mat valides', () => {
    expect(materialExposure('7k/P7/8/8/8/8/8/7K w - - 0 1', 'a7a8q')).toBe(0);
    expect(materialExposure('7k/5Q2/6K1/8/8/8/8/8 w - - 0 1', 'f7g7')).toBe(0);
  });
});

describe('Budgets de gravité progressifs', () => {
  it('ne remplace jamais une petite erreur indisponible par une grosse gaffe', () => {
    const choose = prepareCandidateSelection(
      { fen: new Chess().fen(), history: [] },
      analysis([
        ['e2e4', 0],
        ['d2d4', -800],
      ]),
      8,
    );
    for (const draw of [0.27, 0.5, 0.62, 0.86, 0.98])
      expect(choose(draws(draw, 0, 0, 0))).toBe('e2e4');
  });
  it('filtre normalement un don de pièce au niveau 8 mais conserve une rare possibilité d’oubli', () => {
    const choose = prepareCandidateSelection(
      { fen: knightFen, history: [] },
      analysis([
        ['e2g3', 0],
        ['e2c3', -180],
      ]),
      8,
    );
    expect(choose(draws(0.95, 0.5, 0.5, 0))).toBe('e2g3');
    expect(choose(draws(0.95, 0, 0.5, 0))).toBe('e2c3');
    const random = seededRandom(2026),
      choices = Array.from({ length: 10000 }, () => choose(random));
    expect(choices.filter((x) => x === 'e2c3').length).toBeGreaterThan(0);
    expect(choices.filter((x) => x === 'e2c3').length).toBeLessThan(80);
  });
  it('ne bloque pas un sacrifice confirmé comme quasi équivalent par le moteur', () => {
    const choose = prepareCandidateSelection(
      { fen: knightFen, history: [] },
      analysis([
        ['e2g3', 0],
        ['e2c3', -10],
      ]),
      8,
    );
    expect(choose(draws(0, 0.99, 0.99, 0.99))).toBe('e2c3');
  });
  it('diminue progressivement tous les budgets cumulés d’erreur entre voisins', () => {
    const profiles = difficulties.filter((p) => p.selection);
    for (let i = 1; i < profiles.length; i++) {
      for (let severity = 1; severity < 6; severity++)
        expect(
          profiles[i].selection!.bands.slice(severity).reduce((a, b) => a + b, 0),
        ).toBeLessThanOrEqual(
          profiles[i - 1].selection!.bands.slice(severity).reduce((a, b) => a + b, 0),
        );
      expect(profiles[i].selection!.hangingRate).toBeLessThan(
        profiles[i - 1].selection!.hangingRate,
      );
    }
  });
  it('atténue graduellement les habitudes d’ouverture, sans rupture au neuvième coup', () => {
    const weight = (move: number) =>
      plausibility({ fen: new Chess().fen().replace('0 1', `0 ${move}`), history: [] }, 'a2a4');
    expect(weight(9) - weight(8)).toBeCloseTo(weight(8) - weight(7));
    expect(weight(16)).toBe(1);
  });
  it('le Maximum ignore le hasard, toute sélection inférieure et la limitation native', async () => {
    const result = analysis([
        ['e2e4', 0],
        ['d2d4', -1],
      ]),
      random = vi.fn(() => {
        throw Error('Affaiblissement interdit');
      });
    const engine = { search: vi.fn().mockResolvedValue(result), dispose: vi.fn() };
    expect(
      await searchForLevel(engine, { fen: new Chess().fen(), history: [] }, 25, undefined, random),
    ).toBe('e2e4');
    expect(random).not.toHaveBeenCalled();
    expect(difficultyInfo(25)).toMatchObject({
      elo: null,
      settings: { skill: 20, depth: 26, movetime: 4500, nodes: 1800000 },
    });
    expect(difficultyInfo(25).selection).toBeUndefined();
    expect(difficultyInfo(25).settings.elo).toBeUndefined();
    expect(difficultyInfo(25).settings.multiPV ?? 1).toBe(1);
  });
});
