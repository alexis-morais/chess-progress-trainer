import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { Chess } from 'chess.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Trainer } from '../components/Trainer';
import { TacticTrainer } from '../tactics/TacticTrainer';
import { openings } from '../data/openings';
import { compileLesson, initialState, reduceTrainer } from '../trainer/model';
import { COMPUTER_DELAY, CORRECT_FEEDBACK_DELAY } from '../trainer/useTrainer';
import { compileTactic, tacticsFor } from '../tactics/model';
import { mistakeMessage } from '../components/ExerciseFeedback';

const play = (from: string, to: string) => {
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${from},`) }));
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${to},`) }));
};
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal(
    'Worker',
    class {
      constructor() {
        throw Error('offline');
      }
    },
  );
});
describe('Focus : feedback immédiatement près du plateau', () => {
  it.each([
    ['w', 'essential'],
    ['w', 'extended'],
    ['b', 'essential'],
    ['b', 'extended'],
  ] as const)(
    '%s / %s distingue illégalité et sortie de ligne sans révéler l’aide',
    (side, mode) => {
      const opening = openings.find((o) => o.side === side)!;
      const lesson = compileLesson(opening, opening.variations[0], mode);
      render(<Trainer lesson={lesson} onRestart={vi.fn()} onVariants={vi.fn()} onHome={vi.fn()} />);
      if (side === 'b') act(() => vi.advanceTimersByTime(COMPUTER_DELAY));
      const from = side === 'w' ? 'e2' : 'e7',
        illegalTo = side === 'w' ? 'e5' : 'e4';
      play(from, illegalTo);
      expect(screen.getByTestId('compact-feedback')).toHaveTextContent(
        'Ce déplacement n’est pas légal.',
      );
      const wrong = side === 'w' ? ['d2', 'd4'] : ['e7', 'e5'];
      play(wrong[0], wrong[1]);
      play(wrong[0], wrong[1]);
      expect(screen.getByTestId('compact-feedback')).toHaveTextContent(
        'Coup légal, mais il sort de la ligne travaillée.',
      );
      expect(screen.getByTestId('errors')).toHaveTextContent('3');
      expect(screen.getByTestId('hints')).toHaveTextContent('0');
      expect(screen.getByText('Besoin d’un coup de pouce ?')).toBeVisible();
      const hint = screen.getByRole('button', { name: 'Indice' }),
        solution = screen.getByRole('button', { name: 'Solution' });
      expect(hint).toHaveClass('hint-nudge');
      expect(solution).not.toHaveClass('hint-nudge');
      expect(hint).toHaveAttribute('aria-pressed', 'false');
      expect(solution).toHaveAttribute('aria-pressed', 'false');
      expect(screen.queryByTestId('exact-move')).toBeNull();
      expect(screen.queryByTestId('pedagogical-hint')).toBeNull();
      play(wrong[0], wrong[1]);
      expect(hint).not.toHaveClass('hint-nudge');
      const expected = lesson.moves[side === 'w' ? 0 : 1];
      play(expected.from, expected.to);
      expect(screen.getByTestId('compact-feedback')).toHaveTextContent('✓ Bon coup.');
      expect(screen.queryByText('Besoin d’un coup de pouce ?')).toBeNull();
      act(() => vi.advanceTimersByTime(CORRECT_FEEDBACK_DELAY));
      expect(screen.getByTestId('errors')).toHaveTextContent('4');
      expect(screen.getByTestId('hints')).toHaveTextContent('0');
      expect(
        screen
          .getByTestId('compact-feedback')
          .compareDocumentPosition(document.querySelector('.training-board')!) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    },
  );
  it('la tactique refuse un coup légal hors combinaison avec son propre message', () => {
    const lesson = compileTactic(tacticsFor('italian')[0]);
    render(<TacticTrainer lesson={lesson} onRestart={vi.fn()} onBack={vi.fn()} />);
    const wrong = new Chess(lesson.positions[0])
      .moves({ verbose: true })
      .find((move) => move.from !== lesson.moves[0].from)!;
    play(wrong.from, wrong.to);
    expect(screen.getByTestId('compact-feedback')).toHaveTextContent(
      'Ce coup est possible, mais il ne résout pas la tactique.',
    );
    expect(screen.getByTestId('errors')).toHaveTextContent('1');
    expect(
      within(screen.getByRole('complementary', { name: 'Ton exercice tactique' })).getByText(
        'Ce coup est possible, mais il ne résout pas la tactique.',
      ),
    ).toBeVisible();
  });
  it('remet à zéro le compteur par coup au bon coup, à la réponse et au restart', () => {
    const lesson = compileLesson(openings[0], openings[0].variations[0]);
    let state = initialState();
    for (let i = 0; i < 3; i++)
      state = reduceTrainer(lesson, state, { type: 'attempt', from: 'd2', to: 'd4' });
    expect(state.moveErrors).toBe(3);
    expect(state.ply).toBe(0);
    expect(state.mistake).toBe('off-line');
    state = reduceTrainer(lesson, state, { type: 'attempt', from: 'e2', to: 'e4' });
    expect(state.moveErrors).toBe(0);
    state = reduceTrainer(lesson, state, { type: 'computer', expectedPly: 1 });
    expect(state.moveErrors).toBe(0);
    expect(reduceTrainer(lesson, state, { type: 'reset' })).toEqual(initialState());
    expect(mistakeMessage({ ...state, mistake: 'illegal' }, 'tactic')).toBe(
      'Ce déplacement n’est pas légal.',
    );
  });
});
