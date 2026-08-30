import { describe, expect, it } from 'vitest';
import { Chess } from 'chess.js';
import { openings, frenchSan, getLessonMoves, lessonModes } from '../data/openings';
import { compileLesson } from '../trainer/model';
import originals from './fixtures/original-variations.json';
import references from './fixtures/opening-references.json';

describe('Le répertoire : 60 variantes, 120 séquences', () => {
  it('contient 10 ouvertures, 5 par camp et exactement 6 variantes chacune', () => {
    expect(openings).toHaveLength(10);
    expect(openings.filter((o) => o.side === 'w')).toHaveLength(5);
    expect(openings.filter((o) => o.side === 'b')).toHaveLength(5);
    openings.forEach((opening) => expect(opening.variations).toHaveLength(6));
    expect(new Set(openings.flatMap((o) => o.variations.map((v) => v.id))).size).toBe(60);
    expect(new Set(openings.map((o) => o.id)).size).toBe(10);
  });
  for (const original of originals)
    it(`préserve intégralement la variante d’origine ${original.id}`, () => {
      const variation = openings
        .find((o) => o.id === original.openingId)!
        .variations.find((v) => v.id === original.id)!;
      expect(variation.name).toBe(original.name);
      expect(variation.moves).toEqual(original.moves);
    });
  for (const opening of openings)
    for (const variation of opening.variations) {
      for (const { id: mode } of lessonModes)
        it(`${opening.name} — ${variation.name} / ${mode} : séquence entièrement légale`, () => {
          const game = new Chess();
          const steps = getLessonMoves(variation, mode);
          expect(steps.length).toBeGreaterThanOrEqual(mode === 'essential' ? 8 : 18);
          expect(steps.length).toBeLessThanOrEqual(mode === 'essential' ? 14 : 30);
          for (const step of steps) {
            expect(game.moves()).toContain(step.san);
            expect(game.move(step.san, { strict: true })).toBeTruthy();
            expect(step.explanation.length).toBeGreaterThan(10);
          }
          const lesson = compileLesson(opening, variation, mode);
          expect(lesson.positions.at(-1)).toBe(game.fen());
          expect(lesson.total).toBe(
            lesson.moves.filter((move) => move.color === opening.side).length,
          );
        });
      it(`${variation.id} : préfixe essentiel exact et prolongement pédagogique`, () => {
        const full = getLessonMoves(variation, 'extended');
        expect(full.slice(0, variation.moves.length)).toEqual(variation.moves);
        expect(full.length).toBeGreaterThan(variation.moves.length);
        const lesson = compileLesson(opening, variation, 'extended');
        const notes = lesson.steps
          .filter((_, i) => i >= variation.moves.length && lesson.moves[i].color === opening.side)
          .map((step) => step.explanation);
        expect(new Set(notes).size).toBe(notes.length);
        expect(notes.every((note) => note.length > 25 && note.length < 240)).toBe(true);
      });
      it(`${variation.id} : atteint la position de référence de la variante nommée`, () => {
        const reference = references.find((r) => r.id === variation.id)!;
        expect(reference).toBeDefined();
        const game = new Chess();
        game.loadPgn(reference.pgn);
        const actual = new Chess();
        variation.moves.slice(0, reference.atPly).forEach((step) => actual.move(step.san));
        // Les ordres de coups peuvent transposer ; les compteurs de coups ne définissent pas l’ouverture.
        expect(actual.fen().split(' ').slice(0, 4)).toEqual(game.fen().split(' ').slice(0, 4));
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
    expect(() => compileLesson(opening, { ...variation, extension: [] }, 'extended')).toThrow(
      'Prolongement vide',
    );
    expect(() =>
      compileLesson(
        opening,
        { ...variation, extension: [{ san: 'Ka8', explanation: 'Un coup impossible.' }] },
        'extended',
      ),
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
