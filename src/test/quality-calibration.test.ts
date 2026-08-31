import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { Chess } from 'chess.js';
import { describe, expect, it } from 'vitest';
import { difficulties } from '../computer/difficulty';
import { playUci, positionResult } from '../computer/game';

const positions = JSON.parse(readFileSync('calibration/quality-results.json', 'utf8'));
const games = JSON.parse(readFileSync('calibration/quality-games.json', 'utf8'));
const neighbors = JSON.parse(readFileSync('calibration/quality-neighbors.json', 'utf8'));
const adjacent = JSON.parse(readFileSync('calibration/quality-native-final-adjacent.json', 'utf8'));
const before = JSON.parse(readFileSync('calibration/quality-before.json', 'utf8'));
type Row = {
  position: string;
  level: number;
  samples: number;
  meanLoss: number;
  blunderRate: number;
  offeredRate: number;
  choices: { move: string; loss: number }[];
};
type Game = {
  lower: number;
  higher: number | string;
  round: number;
  white: number | string;
  black: number | string;
  opening: string[];
  moves: string[];
  adjudicated: boolean;
  result: unknown;
  audits: { level: number; ply: number; fen: string; move: string }[];
};
type Probe = { id: string; fen: string; phase: string };
describe('Qualité absolue mesurée avec le vrai moteur', () => {
  it('confirme le mat en deux du corpus par toutes les réponses légales', () => {
    const position = positions.positions.find((p: Probe) => p.id === 'mat-deux');
    const choices = new Map<string, boolean>();
    for (const row of positions.rows.filter((r: Row) => r.position === 'mat-deux'))
      for (const choice of row.choices) choices.set(choice.move, choice.preservesMate);
    for (const [token, announced] of choices) {
      const board = new Chess(position.fen);
      playUci(board, token);
      const replies = board.moves();
      const forced =
        replies.length > 0 &&
        replies.every((reply) => {
          board.move(reply);
          const mate = board.moves().some((move) => {
            board.move(move);
            const result = board.isCheckmate();
            board.undo();
            return result;
          });
          board.undo();
          return mate;
        });
      expect(forced).toBe(announced);
    }
  });
  it('valide les 25 profils actuels sur 40 positions et plusieurs phases', () => {
    const hash = createHash('sha256');
    for (const file of ['chooseMove.ts', 'difficulty.ts', 'ComputerEngine.ts', 'material.ts'])
      hash.update(readFileSync(`src/computer/${file}`));
    const fingerprint = hash.digest('hex');
    for (const report of [positions, games, neighbors, adjacent]) {
      expect(report.policyHash).toBe(fingerprint);
      expect(report.profiles).toEqual(difficulties);
      expect(report.completedAt).toBeTruthy();
    }
    expect(positions.rows).toHaveLength(1000);
    expect(new Set(positions.rows.map((r: Row) => `${r.position}/${r.level}`)).size).toBe(1000);
    expect(new Set(positions.positions.map((p: Probe) => p.phase)).size).toBe(5);
    expect(positions.referenceSettings).toEqual({
      skill: 20,
      depth: 18,
      movetime: 850,
      nodes: 350000,
    });
  });
  it.each(positions.positions as Probe[])('$id : tous les candidats observés sont légaux', (p) => {
    const rows: Row[] = positions.rows.filter((r: Row) => r.position === p.id);
    expect(rows).toHaveLength(25);
    for (const row of rows) {
      expect(row.samples).toBe(row.level <= 15 ? 128 : 8);
      for (const choice of row.choices) {
        expect(() => playUci(new Chess(p.fen), choice.move)).not.toThrow();
        expect(Number.isFinite(choice.loss)).toBe(true);
      }
    }
  });
  it('réduit les dons de matériel du niveau 8 sans le rendre infaillible', () => {
    const now = positions.summary.find((s: { level: number }) => s.level === 8);
    const old = before.summary.find((s: { level: number }) => s.level === 8);
    expect(now.meanLoss).toBeGreaterThan(25);
    expect(now.meanLoss).toBeLessThan(90);
    expect(now.blunderRate).toBeGreaterThan(0.01);
    expect(now.blunderRate).toBeLessThan(0.1);
    expect(now.offeredRate).toBeLessThan(old.offeredRate / 2);
    expect(now.phases['post-opening'].offeredRate).toBeLessThan(0.03);
    expect(now.phases['post-opening'].meanLoss).toBeLessThan(
      old.phases['post-opening'].meanLoss * 0.75,
    );
    expect(now.phases.tactics.tacticalRate).toBeGreaterThan(0.7);
  });
  it('mesure les habitudes du premier coup sans une ouverture imposée', () => {
    expect(positions.openingHabits).toHaveLength(25);
    for (const row of positions.openingHabits) {
      expect(row.naturalRate).toBeGreaterThan(0.6);
      expect(row.edgePawnRate).toBeLessThan(0.2);
      expect(row.edgeKnightRate).toBeLessThan(0.2);
    }
    expect(
      Object.keys(positions.openingHabits.find((r: { level: number }) => r.level === 8).choices)
        .length,
    ).toBeGreaterThan(1);
  });
  it('compare des groupes avec davantage de précision, sans imposer le vainqueur de chaque partie', () => {
    const average = (min: number, max: number) =>
      positions.summary
        .filter((s: { level: number }) => s.level >= min && s.level <= max)
        .reduce((n: number, s: { meanLoss: number }) => n + s.meanLoss, 0) /
      (max - min + 1);
    expect(average(1, 5)).toBeGreaterThan(average(6, 11));
    expect(average(6, 11)).toBeGreaterThan(average(12, 19));
    expect(average(12, 19)).toBeGreaterThan(average(20, 25));
    // Small search/time noise is expected across adjacent settings, not a strength cliff.
    const levels = positions.summary;
    for (let i = 14; i <= 16; i++)
      expect(Math.abs(levels[i].meanLoss - levels[i - 1].meanLoss)).toBeLessThan(15);
    expect(levels[15].meanLoss).toBeLessThan(levels[14].meanLoss);
    for (let i = 6; i <= 9; i++)
      expect(Math.abs(levels[i].meanLoss - levels[i - 1].meanLoss)).toBeLessThan(20);
  });
  it('conserve 114 parties longues, couleurs alternées et 3 débuts par paire', () => {
    expect(games.matches).toHaveLength(114);
    expect(games.maxPlies).toBe(140);
    for (const pair of games.summary) {
      const matches = (games.matches as Game[]).filter(
        (m) => m.lower === pair.lower && m.higher === pair.higher,
      );
      expect(matches).toHaveLength(6);
      expect(matches.filter((m) => m.white === pair.higher)).toHaveLength(3);
      expect(new Set(matches.map((m) => m.opening.join(' '))).size).toBe(3);
    }
  });
  it('prolonge la mesure des voisins sur une seconde seed, sans écarter les défaites', () => {
    expect(neighbors.matches).toHaveLength(48);
    expect(neighbors.seed).not.toBe(games.seed);
    expect(
      neighbors.summary.map((p: { lower: number; higher: number }) => `${p.lower}-${p.higher}`),
    ).toEqual(['7-8', '8-9', '9-10', '15-16']);
    for (const pair of neighbors.summary) expect(pair.games).toBe(12);
  });
  it('ne reproduit pas la régression du raccord natif et conserve un maximum plus fort', () => {
    const boundary = [...games.matches, ...neighbors.matches].filter(
      (m) => m.lower === 15 && m.higher === 16,
    );
    expect(boundary).toHaveLength(18);
    // A short match series is noisy. Reject the measured collapse (22%), not every upset.
    const score = boundary.reduce((sum, m) => sum + m.higherPoints, 0) / boundary.length;
    expect(score).toBeGreaterThanOrEqual(0.4);
    // Also reject the excessive jump observed with the discarded native 2900 setting.
    expect(score).toBeLessThanOrEqual(0.8);
    const maximum = games.summary.find((p: { higher: number }) => p.higher === 25);
    expect(maximum.higherScore).toBeGreaterThan(0.5);
  });
  it('contrôle aussi les voisins immédiats du raccord, sans censurer leurs résultats', () => {
    expect(adjacent.matches).toHaveLength(18);
    expect(
      adjacent.summary.map((p: { lower: number; higher: number }) => `${p.lower}-${p.higher}`),
    ).toEqual(['14-15', '16-17', '17-18']);
    for (const pair of adjacent.summary) {
      expect(pair.games).toBe(6);
      const matches = adjacent.matches.filter(
        (m: Game) => m.lower === pair.lower && m.higher === pair.higher,
      );
      expect(matches.filter((m: Game) => m.white === pair.higher)).toHaveLength(3);
    }
  });
  it.each([...games.matches, ...neighbors.matches, ...adjacent.matches] as Game[])(
    '$lower–$higher / $round : partie et positions auditées légales',
    (match) => {
      const board = new Chess();
      for (const san of match.opening) board.move(san);
      const audits = new Map(match.audits.map((audit) => [audit.ply, audit]));
      for (const [index, token] of match.moves.entries()) {
        expect(board.isGameOver()).toBe(false);
        playUci(board, token);
        const audit = audits.get(match.opening.length + index + 1);
        if (audit) {
          const replay = new Chess(audit.fen);
          playUci(replay, audit.move);
          expect(replay.fen()).toBe(board.fen());
        }
      }
      if (!match.adjudicated) expect(positionResult(board)).toEqual(match.result);
    },
  );
});
