import { describe, expect, it } from 'vitest';
import { Chess } from 'chess.js';
import { openings, lessonModes } from '../data/openings';
import {
  compileLesson,
  initialState,
  isComplete,
  isExpectedMove,
  isPlayerTurn,
  reduceTrainer,
} from '../trainer/model';

const lessons = openings.flatMap((o) =>
  o.variations.flatMap((v) => lessonModes.map((mode) => compileLesson(o, v, mode.id))),
);
const white = lessons[0];
const black = lessons.find((lesson) => lesson.opening.side === 'b')!;

describe('Moteur pédagogique indépendant de Stockfish', () => {
  it('oriente les 120 séances du côté de l’élève', () => {
    for (const lesson of lessons)
      expect(lesson.orientation).toBe(lesson.opening.side === 'w' ? 'white' : 'black');
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
    expect(state.boardFeedback).toMatchObject({ kind: 'incorrect', square: 'e5' });
    expect(isExpectedMove(white, state, 'e2', 'e4', 'q')).toBe(false);
  });
  it('une ancienne minuterie ne supprime pas le feedback d’une tentative plus récente', () => {
    let state = reduceTrainer(white, initialState(), { type: 'attempt', from: 'd2', to: 'd4' });
    const oldId = state.boardFeedback!.id;
    state = reduceTrainer(white, state, { type: 'attempt', from: 'e2', to: 'e4' });
    expect(state.boardFeedback).toMatchObject({ kind: 'correct', square: 'e4' });
    expect(reduceTrainer(white, state, { type: 'clearFeedback', id: oldId })).toBe(state);
    const cleared = reduceTrainer(white, state, {
      type: 'clearFeedback',
      id: state.boardFeedback!.id,
    });
    expect(cleared.boardFeedback).toBeNull();
    expect(cleared.feedback).toBe('correct');
    expect(cleared.errors).toBe(1);
  });
  it('ne compte qu’une aide par décision, même après une erreur', () => {
    let state = reduceTrainer(white, initialState(), { type: 'solution' });
    state = reduceTrainer(white, state, { type: 'solution' });
    state = reduceTrainer(white, state, { type: 'attempt', from: 'd2', to: 'd4' });
    state = reduceTrainer(white, state, { type: 'solution' });
    expect(state.hints).toBe(1);
    expect(state.solutionVisible).toBe(true);
    state = reduceTrainer(white, state, { type: 'attempt', from: 'e2', to: 'e4' });
    expect(state.solutionVisible).toBe(false);
    expect(state.completed).toBe(1);
    state = reduceTrainer(white, state, { type: 'computer', expectedPly: 1 });
    state = reduceTrainer(white, state, { type: 'solution' });
    expect(state.hints).toBe(2);
  });
  it('ignore les clics, les aides et les messages retardés pendant le tour adverse', () => {
    const state = initialState();
    expect(reduceTrainer(black, state, { type: 'solution' })).toBe(state);
    expect(reduceTrainer(black, state, { type: 'attempt', from: 'e7', to: 'e6' })).toBe(state);
    expect(reduceTrainer(black, state, { type: 'computer', expectedPly: 9 })).toBe(state);
    expect(reduceTrainer(white, state, { type: 'computer', expectedPly: 0 })).toBe(state);
  });
  it('remet absolument tous les compteurs et la position à zéro', () => {
    let state = reduceTrainer(white, initialState(), { type: 'solution' });
    state = reduceTrainer(white, state, { type: 'attempt', from: 'e2', to: 'e5' });
    state = reduceTrainer(white, state, { type: 'attempt', from: 'e2', to: 'e4' });
    expect(reduceTrainer(white, state, { type: 'reset' })).toEqual(initialState());
  });
  for (const lesson of lessons) {
    it(`${lesson.opening.name} / ${lesson.variation.name} / ${lesson.mode} : réponses scriptées, fin et restart`, () => {
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
          expect(state.explanation).toBe(lesson.steps[before.ply].explanation);
          expect(state.boardFeedback).toMatchObject({ kind: 'correct', square: expected.to });
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
      expect(reduceTrainer(lesson, state, { type: 'solution' })).toBe(state);
      expect(reduceTrainer(lesson, state, { type: 'attempt', from: 'e2', to: 'e4' })).toBe(state);
      expect(reduceTrainer(lesson, state, { type: 'computer', expectedPly: state.ply })).toBe(
        state,
      );
      expect(reduceTrainer(lesson, state, { type: 'reset' })).toEqual(initialState());
    });
  }
});
