import { readFileSync } from 'node:fs';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Trainer } from '../components/Trainer';
import { TacticTrainer } from '../tactics/TacticTrainer';
import { lessonModes, openings } from '../data/openings';
import { compileLesson, initialState, reduceTrainer } from '../trainer/model';
import { assistanceMessage } from '../components/TrainingAssistance';
import { compileTactic, tacticsFor } from '../tactics/model';
import { COMPUTER_DELAY, CORRECT_FEEDBACK_DELAY } from '../trainer/useTrainer';

const play = (from: string, to: string) => {
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${from},`) }));
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${to},`) }));
};

// jsdom does not lay out, so stability is proven in two complementary ways here:
// the DOM above the board keeps a constant shape, and the stylesheets reserve a fixed
// height for every box that can change wording. The measured Y positions live in
// qa/product-finish-validation.json, recorded in a real browser.
function shapeAboveBoard() {
  const assistance = document.querySelector('.training-assistance')!;
  const slot = assistance.querySelector('.coach-slot')!;
  return {
    headings: assistance.querySelectorAll('.assistance-heading').length,
    slots: assistance.querySelectorAll('.coach-slot').length,
    lines: slot.querySelectorAll('.coach-line').length,
    // Every pedagogical state lives inside the single reserved slot.
    strays: document.querySelectorAll(
      '.training-assistance > :not(.assistance-heading):not(.coach-slot)',
    ).length,
    blocksBeforeBoard: [
      ...document.querySelectorAll('.trainer > *, .tactic-page > *'),
    ].findIndex((node) => node.querySelector('.training-board')),
  };
}

describe('Aucun déplacement vertical du plateau pendant une séance', () => {
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

  it.each([
    ['w', 'essential', true],
    ['w', 'extended', false],
    ['b', 'essential', false],
    ['b', 'extended', true],
  ] as const)(
    '%s / %s (première découverte : %s) garde la même structure au-dessus du plateau',
    (side, mode, guided) => {
      const opening = openings.find((entry) => entry.side === side)!;
      const lesson = compileLesson(opening, opening.variations[0], mode);
      render(
        <Trainer
          lesson={lesson}
          guided={guided}
          onRestart={vi.fn()}
          onVariants={vi.fn()}
          onHome={vi.fn()}
        />,
      );
      if (side === 'b') act(() => vi.advanceTimersByTime(COMPUTER_DELAY));
      const reference = shapeAboveBoard();
      expect(reference.slots).toBe(1);
      expect(reference.lines).toBe(1);
      const expected = lesson.moves[side === 'w' ? 0 : 1];
      // intention → mauvais coup → indice → solution → bon coup → réponse → intention suivante
      const steps: (() => void)[] = [
        () => play(expected.from, side === 'w' ? 'a3' : 'a6'),
        () => fireEvent.click(screen.getByRole('button', { name: 'Indice' })),
        () => fireEvent.click(screen.getByRole('button', { name: 'Solution' })),
        () => play(expected.from, expected.to),
        () => act(() => vi.advanceTimersByTime(CORRECT_FEEDBACK_DELAY)),
      ];
      for (const step of steps) {
        step();
        const shape = shapeAboveBoard();
        expect(shape.headings).toBe(reference.headings);
        expect(shape.slots).toBe(reference.slots);
        expect(shape.strays).toBe(0);
        expect(shape.blocksBeforeBoard).toBe(reference.blocksBeforeBoard);
        // One message, or the exact move plus the hint asked before it.
        expect(shape.lines).toBeGreaterThanOrEqual(1);
        expect(shape.lines).toBeLessThanOrEqual(2);
      }
    },
  );

  it('garde la même structure dans une tactique', () => {
    const lesson = compileTactic(tacticsFor('italian')[0]);
    render(<TacticTrainer lesson={lesson} onRestart={vi.fn()} onBack={vi.fn()} />);
    const reference = shapeAboveBoard();
    fireEvent.click(screen.getByRole('button', { name: 'Indice' }));
    expect(shapeAboveBoard()).toEqual(reference);
    fireEvent.click(screen.getByRole('button', { name: 'Solution' }));
    const revealed = shapeAboveBoard();
    expect(revealed.slots).toBe(1);
    expect(revealed.lines).toBe(2);
    expect(revealed.blocksBeforeBoard).toBe(reference.blocksBeforeBoard);
  });

  it('n’affiche jamais plus d’un message principal, quel que soit l’état', () => {
    const lesson = compileLesson(openings[0], openings[0].variations[0], lessonModes[0].id);
    let state = initialState();
    const seen = new Set<string>();
    seen.add(assistanceMessage(lesson, state, false, true));
    for (let index = 0; index < 3; index++)
      state = reduceTrainer(lesson, state, { type: 'attempt', from: 'd2', to: 'd4' });
    seen.add(assistanceMessage(lesson, state, false, true));
    seen.add(assistanceMessage(lesson, state, true, true));
    state = reduceTrainer(lesson, state, { type: 'hint' });
    seen.add(assistanceMessage(lesson, state, true, true));
    state = reduceTrainer(lesson, state, { type: 'solution' });
    seen.add(assistanceMessage(lesson, state, true, true));
    seen.add(assistanceMessage(lesson, initialState(), false, false));
    expect([...seen].sort()).toEqual(['hint', 'idle', 'incorrect', 'solution', 'waiting']);
  });
});

describe('Les feuilles de style réservent une hauteur fixe', () => {
  const desktop = readFileSync('src/styles.css', 'utf8');
  const mobile = readFileSync('src/ui/mobile.css', 'utf8');

  it('fixe la hauteur de la zone pédagogique et du bandeau d’assistance', () => {
    expect(desktop).toMatch(/\.coach-slot \{[^}]*height: calc\(var\(--coach-lines\)/);
    expect(desktop).toMatch(/\.assistance-turn \{[^}]*height: 30px/);
    expect(desktop).toMatch(/\.assistance-heading \{\s*min-height: 48px/);
  });

  it('réserve deux lignes sur téléphone, trois sur les écrans les plus étroits', () => {
    expect(mobile).toMatch(/\.mobile-focus \.coach-slot \{[^}]*height: calc\(2 \* 17px \+ 12px\)/);
    expect(mobile).toMatch(
      /@media \(max-width: 360px\) \{\s*\.mobile-focus \.coach-slot \{[^}]*height: calc\(3 \* 17px \+ 12px\)/,
    );
    expect(mobile).toMatch(/\.mobile-focus \.assistance-heading \{[^}]*min-height: 42px/);
  });
});
