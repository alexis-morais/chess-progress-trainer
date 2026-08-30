import { describe, expect, it } from 'vitest';
import { Chess } from 'chess.js';
import { openings, frenchSan } from '../data/openings';
import { compileLesson } from '../trainer/model';

describe('Les 16 variantes pédagogiques', () => {
  it('contient quatre ouvertures et quatre variantes chacune, avec des identifiants uniques', () => {
    expect(openings).toHaveLength(4);
    openings.forEach((opening) => expect(opening.variations).toHaveLength(4));
    expect(new Set(openings.flatMap((o) => o.variations.map((v) => v.id))).size).toBe(16);
  });
  for (const opening of openings)
    for (const variation of opening.variations) {
      it(`${opening.name} — ${variation.name} : chaque coup est légal depuis la position initiale`, () => {
        const game = new Chess();
        expect(variation.moves.length).toBeGreaterThanOrEqual(8);
        expect(variation.moves.length).toBeLessThanOrEqual(14);
        for (const step of variation.moves) {
          expect(game.moves()).toContain(step.san);
          expect(game.move(step.san, { strict: true })).toBeTruthy();
          expect(step.explanation.length).toBeGreaterThan(10);
        }
        const lesson = compileLesson(opening, variation);
        expect(lesson.positions.at(-1)).toBe(game.fen());
        expect(lesson.total).toBe(
          lesson.moves.filter((move) => move.color === opening.side).length,
        );
      });
    }
  it('rejette clairement les variantes vides, illégales ou sans explication', () => {
    const opening = openings[0];
    const variation = opening.variations[0];
    expect(() => compileLesson(opening, { ...variation, moves: [] })).toThrow('Variante vide');
    expect(() =>
      compileLesson(opening, { ...variation, moves: [{ san: 'e5', explanation: 'Impossible.' }] }),
    ).toThrow('demi-coup 1 (e5)');
    expect(() =>
      compileLesson(opening, { ...variation, moves: [{ san: 'e4', explanation: '' }] }),
    ).toThrow('donnée invalide');
  });
  it('affiche la notation française, y compris les roques et les pièces désambiguïsées', () => {
    expect(['Nf3', 'Nge7', 'Qxd5', 'Bxe7', 'O-O', 'Re1', 'Kd8'].map(frenchSan)).toEqual([
      'Cf3',
      'Cge7',
      'Dxd5',
      'Fxe7',
      'O-O',
      'Te1',
      'Rd8',
    ]);
  });
});
