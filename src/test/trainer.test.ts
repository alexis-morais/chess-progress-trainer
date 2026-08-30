import { describe, expect, it } from 'vitest';
import { Chess } from 'chess.js';
import { openings } from '../data/openings';
import {
  compileLesson,
  initialState,
  isComplete,
  isExpectedMove,
  isPlayerTurn,
  reduceTrainer,
} from '../trainer/model';

const lessons = openings.flatMap((o) => o.variations.map((v) => compileLesson(o, v)));
const white = lessons[0];
const black = lessons[8];

describe('Moteur pédagogique indépendant de Stockfish', () => {
  it('oriente les Blancs en bas pour les deux ouvertures et les Noirs en bas pour les défenses', () => {
    expect(lessons.map((l) => l.orientation)).toEqual([
      ...Array(8).fill('white'),
      ...Array(8).fill('black'),
    ]);
  });
  it('réserve le premier coup aux Blancs', () => {
    expect(isPlayerTurn(white, initialState())).toBe(true);
    expect(isPlayerTurn(black, initialState())).toBe(false);
    const next = reduceTrainer(black, initialState(), { type: 'computer', expectedPly: 0 });
    expect(black.moves[next.ply - 1].san).toBe('e4');
    expect(next.completed).toBe(0);
    expect(isPlayerTurn(black, next)).toBe(true);
  });
  it('refuse un autre coup légal et un coup illégal sans changer la position', () => {
    let state = initialState();
    state = reduceTrainer(white, state, { type: 'attempt', from: 'd2', to: 'd4' });
    state = reduceTrainer(white, state, { type: 'attempt', from: 'e2', to: 'e5' });
    expect(state.ply).toBe(0);
    expect(state.completed).toBe(0);
    expect(state.errors).toBe(2);
    expect(white.positions[state.ply]).toBe(new Chess().fen());
    expect(state.feedback).toBe('incorrect');
    expect(isExpectedMove(white, state, 'e2', 'e4', 'q')).toBe(false);
  });
  it('ne compte qu’une aide par décision, même après une erreur', () => {
    let state = reduceTrainer(white, initialState(), { type: 'hint' });
    state = reduceTrainer(white, state, { type: 'hint' });
    state = reduceTrainer(white, state, { type: 'attempt', from: 'd2', to: 'd4' });
    state = reduceTrainer(white, state, { type: 'hint' });
    expect(state.hints).toBe(1);
    expect(state.hintVisible).toBe(true);
    state = reduceTrainer(white, state, { type: 'attempt', from: 'e2', to: 'e4' });
    expect(state.hintVisible).toBe(false);
    expect(state.completed).toBe(1);
    state = reduceTrainer(white, state, { type: 'computer', expectedPly: 1 });
    state = reduceTrainer(white, state, { type: 'hint' });
    expect(state.hints).toBe(2);
  });
  it('ignore les clics, les aides et les messages retardés pendant le tour adverse', () => {
    const state = initialState();
    expect(reduceTrainer(black, state, { type: 'hint' })).toBe(state);
    expect(reduceTrainer(black, state, { type: 'attempt', from: 'e7', to: 'e6' })).toBe(state);
    expect(reduceTrainer(black, state, { type: 'computer', expectedPly: 9 })).toBe(state);
    expect(reduceTrainer(white, state, { type: 'computer', expectedPly: 0 })).toBe(state);
  });
  it('remet absolument tous les compteurs et la position à zéro', () => {
    let state = reduceTrainer(white, initialState(), { type: 'hint' });
    state = reduceTrainer(white, state, { type: 'attempt', from: 'e2', to: 'e5' });
    state = reduceTrainer(white, state, { type: 'attempt', from: 'e2', to: 'e4' });
    expect(reduceTrainer(white, state, { type: 'reset' })).toEqual(initialState());
  });
  for (const lesson of lessons) {
    it(`${lesson.variation.name} : réponses strictement prévues, progression et fin exactes`, () => {
      let state = initialState();
      const replay = new Chess();
      for (const expected of lesson.moves) {
        const before = state;
        if (isPlayerTurn(lesson, state)) {
          expect(
            isExpectedMove(lesson, state, expected.from, expected.to, expected.promotion),
          ).toBe(true);
          state = reduceTrainer(lesson, state, {
            type: 'attempt',
            from: expected.from,
            to: expected.to,
            promotion: expected.promotion,
          });
          expect(state.completed).toBe(before.completed + 1);
          expect(state.explanation).toBe(lesson.variation.moves[before.ply].explanation);
        } else {
          state = reduceTrainer(lesson, state, { type: 'computer', expectedPly: state.ply });
          expect(state.completed).toBe(before.completed);
        }
        replay.move(expected.san);
        expect(lesson.positions[state.ply]).toBe(replay.fen());
        expect(state.ply).toBe(before.ply + 1);
      }
      expect(isComplete(lesson, state)).toBe(true);
      expect(state.completed).toBe(lesson.total);
      expect(state.errors).toBe(0);
      expect(isPlayerTurn(lesson, state)).toBe(false);
      expect(reduceTrainer(lesson, state, { type: 'hint' })).toBe(state);
      expect(reduceTrainer(lesson, state, { type: 'attempt', from: 'e2', to: 'e4' })).toBe(state);
      expect(reduceTrainer(lesson, state, { type: 'computer', expectedPly: state.ply })).toBe(
        state,
      );
    });
  }
});
