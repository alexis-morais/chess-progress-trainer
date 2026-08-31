import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { Chess } from 'chess.js';
import { describe, expect, it } from 'vitest';
import { difficulties } from '../computer/difficulty';
import { playUci, positionResult } from '../computer/game';

const report = JSON.parse(readFileSync(resolve('calibration/difficulty-results.json'), 'utf8'));
type Metrics = { level: number; meanLoss: number; tacticalRate: number; blunderRate: number };
type Match = {
  lower: number;
  higher: number;
  round: number;
  white: number;
  black: number;
  opening: string[];
  moves: string[];
  adjudicated: boolean;
  result: unknown;
};
const levels = report.summary.levels as Metrics[];
const average = (list: number[]) => list.reduce((a, b) => a + b, 0) / list.length;

describe('Calibration réelle conservée : tendances, sans résultat de partie imposé', () => {
  it('mesure le protocole et les profils actuels, sans essai rapide ni cible expérimentale', () => {
    const hash = createHash('sha256');
    for (const file of ['chooseMove.ts', 'difficulty.ts', 'ComputerEngine.ts'])
      hash.update(readFileSync(resolve('src/computer', file)));
    expect(report.policyHash).toBe(hash.digest('hex'));
    expect(report.profiles).toEqual(difficulties);
    expect(report.quick).toBe(false);
    expect(report.nativeTrial).toBeNull();
    expect(report.completedAt).toBeTruthy();
    expect(report.benchmark).toHaveLength(400);
    expect(report.matches).toHaveLength(90);
    expect(new Set(report.benchmark.map((r: { position: string }) => r.position)).size).toBe(16);
  });
  it('diminue les pertes par grands groupes et distingue clairement 3 de 8', () => {
    const groups = [
      [1, 5],
      [6, 11],
      [12, 19],
      [20, 25],
    ].map(([min, max]) =>
      average(levels.filter((l) => l.level >= min && l.level <= max).map((l) => l.meanLoss)),
    );
    for (let i = 1; i < groups.length; i++) expect(groups[i]).toBeLessThan(groups[i - 1]);
    expect(levels[2].meanLoss).toBeGreaterThan(levels[7].meanLoss * 1.5);
    expect(levels[7].tacticalRate).toBeGreaterThan(levels[2].tacticalRate + 0.15);
    expect(levels[24].tacticalRate).toBeGreaterThan(0.9);
    expect(report.summary.higherScore).toBeGreaterThan(0.55);
  });
  it('alterne les couleurs et mesure plusieurs débuts pour chaque paire', () => {
    for (const pair of report.summary.pairs) {
      const games = (report.matches as Match[]).filter(
        (m) => m.lower === pair.lower && m.higher === pair.higher,
      );
      expect(games).toHaveLength(6);
      expect(games.filter((m) => m.white === pair.higher)).toHaveLength(3);
      expect(new Set(games.map((m) => m.opening.join(' '))).size).toBe(3);
    }
  });
  it('garde des premiers coups plausibles, même au niveau 1', () => {
    expect(report.openingHabits).toHaveLength(11);
    for (const habits of report.openingHabits) {
      expect(habits.samples).toBe(512);
      expect(habits.naturalRate).toBeGreaterThan(0.65);
      expect(habits.edgePawnRate).toBeLessThan(0.15);
      expect(habits.edgeKnightRate).toBeLessThan(0.15);
    }
  });
  it.each(report.matches as Match[])('rejoue légalement $lower–$higher, ronde $round', (match) => {
    const game = new Chess();
    for (const move of match.opening) game.move(move);
    for (const move of match.moves) {
      expect(game.isGameOver()).toBe(false);
      playUci(game, move);
    }
    if (!match.adjudicated) expect(positionResult(game)).toEqual(match.result);
  });
});
