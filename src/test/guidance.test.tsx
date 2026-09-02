import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Trainer } from '../components/Trainer';
import { HomePage } from '../components/HomePage';
import { lessonModes, openings } from '../data/openings';
import { compileLesson } from '../trainer/model';
import { contextualHint } from '../trainer/hints';
import { COMPUTER_DELAY, CORRECT_FEEDBACK_DELAY } from '../trainer/useTrainer';

function play(from: string, to: string) {
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${from},`) }));
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${to},`) }));
}

describe('Indice → réflexion → Solution → explication', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'Worker',
      class {
        constructor() {
          throw new Error('offline');
        }
      },
    );
  });
  for (const side of ['w', 'b'] as const)
    for (const mode of lessonModes) {
      it(`${side} / ${mode.name} : indice gratuit, révélation unique et nouvel indice`, () => {
        const opening = openings.find((candidate) => candidate.side === side)!;
        const lesson = compileLesson(opening, opening.variations[0], mode.id);
        render(
          <Trainer lesson={lesson} onRestart={vi.fn()} onHome={vi.fn()} onVariants={vi.fn()} />,
        );
        const reveal = screen.getByRole('button', { name: 'Solution' });
        if (side === 'b') {
          expect(screen.queryByTestId('pedagogical-hint')).not.toBeInTheDocument();
          expect(reveal).toBeDisabled();
          act(() => vi.advanceTimersByTime(COMPUTER_DELAY));
        }
        const first = lesson.moves[side === 'w' ? 0 : 1];
        expect(screen.queryByTestId('pedagogical-hint')).not.toBeInTheDocument();
        const clue = screen.getByRole('button', { name: 'Indice' });
        clue.focus();
        expect(clue).toHaveFocus();
        fireEvent.click(clue, { detail: 0 });
        fireEvent.click(clue);
        const instruction = screen.getByTestId('pedagogical-hint').textContent;
        expect(instruction).toContain('contrôle au centre');
        expect(instruction).not.toMatch(/pion|roi|[a-h][1-8]/);
        expect(screen.getByTestId('hints')).toHaveTextContent('0');
        expect(screen.queryByTestId('exact-move')).not.toBeInTheDocument();
        expect(document.querySelector('[id*="arrowhead-0-"]')).toBeNull();
        const assistance = screen.getByRole('region', { name: 'Aide à ton prochain coup' });
        expect(
          assistance.compareDocumentPosition(document.querySelector('.training-board')!) &
            Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBeTruthy();
        play(side === 'w' ? 'd2' : 'e7', side === 'w' ? 'd4' : 'e5');
        expect(screen.getByTestId('errors')).toHaveTextContent('1');
        expect(screen.getByTestId('pedagogical-hint')).toHaveTextContent(instruction!);
        expect(screen.getByTestId('hints')).toHaveTextContent('0');
        fireEvent.click(reveal);
        fireEvent.click(reveal);
        expect(screen.getByTestId('hints')).toHaveTextContent('1');
        expect(screen.getByTestId('exact-move')).toHaveTextContent(
          `Pion : ${first.from} → ${first.to}`,
        );
        expect(reveal).toHaveAttribute('aria-pressed', 'true');
        expect(
          document.querySelector(`[id*="arrowhead-0-${first.from}-${first.to}"]`),
        ).toBeInTheDocument();
        play(first.from, first.to);
        expect(screen.getByText('✓ Bon coup !')).toBeVisible();
        expect(screen.getByRole('complementary', { name: 'Ta séance' })).toHaveTextContent(
          lesson.steps[side === 'w' ? 0 : 1].explanation,
        );
        expect(screen.queryByTestId('pedagogical-hint')).not.toBeInTheDocument();
        expect(screen.queryByTestId('exact-move')).not.toBeInTheDocument();
        expect(reveal).toBeDisabled();
        act(() => vi.advanceTimersByTime(CORRECT_FEEDBACK_DELAY));
        expect(screen.queryByTestId('pedagogical-hint')).not.toBeInTheDocument();
        expect(clue).toHaveAttribute('aria-pressed', 'false');
        fireEvent.click(clue);
        const nextPly = side === 'w' ? 2 : 3;
        expect(screen.getByTestId('pedagogical-hint').textContent).toBe(
          contextualHint(
            lesson.moves[nextPly],
            lesson.steps[nextPly].explanation,
            nextPly,
            lesson.steps[nextPly].hint,
          ),
        );
        expect(screen.getByTestId('hints')).toHaveTextContent('1');
        expect(reveal).toHaveAttribute('aria-pressed', 'false');
        expect(document.querySelector('[id*="arrowhead-0-"]')).toBeNull();
        fireEvent.click(reveal);
        expect(screen.getByTestId('hints')).toHaveTextContent('2');
      });
    }
});

describe('Cartes d’accueil accessibles dans leur totalité', () => {
  it.each([
    ['OUVERTURES', '#/ouvertures', 'openings-card-arrow'],
    ['ENTRAÎNEMENT LIBRE', '#/partie', 'computer-card-arrow'],
  ])('%s : texte, surface et flèche partagent une seule action', (name, href, arrow) => {
    const open = vi.fn(),
      computer = vi.fn();
    render(<HomePage onOpenings={open} onComputer={computer} />);
    const card = screen.getByRole('link', { name });
    const action = href === '#/ouvertures' ? open : computer;
    expect(screen.getByRole('heading', { name })).toBeVisible();
    expect(card).toHaveAttribute('href', href);
    expect(card.querySelector('button, a, input, [role="button"]')).toBeNull();
    expect(card.contains(screen.getByTestId(arrow))).toBe(true);
    fireEvent.click(screen.getByRole('heading', { name }));
    fireEvent.click(card);
    fireEvent.click(screen.getByTestId(arrow));
    expect(action).toHaveBeenCalledTimes(3);
    card.focus();
    expect(card).toHaveFocus();
    expect(card.tabIndex).toBe(0);
    // Native Enter activation on a link dispatches a click with detail 0.
    fireEvent.click(card, { detail: 0 });
    expect(action).toHaveBeenCalledTimes(4);
  });
  it('conserve les liens natifs pour ouvrir un nouvel onglet sans changer la vue courante', () => {
    const navigate = vi.fn();
    render(<HomePage onOpenings={navigate} onComputer={navigate} />);
    fireEvent.click(screen.getByRole('link', { name: 'OUVERTURES' }), { ctrlKey: true });
    expect(navigate).not.toHaveBeenCalled();
  });
});
