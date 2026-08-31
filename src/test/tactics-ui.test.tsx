import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Chess } from 'chess.js';
import App from '../App';
import { openings } from '../data/openings';
import { compileTactic, tactics, tacticsFor, type Tactic } from '../tactics/model';
import { CORRECT_FEEDBACK_DELAY } from '../trainer/useTrainer';

const worker = vi.fn();
function play(from: string, to: string) {
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${from},`) }));
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${to},`) }));
}
function start(puzzle: Tactic) {
  const opening = openings.find((opening) => opening.id === puzzle.openingId)!;
  fireEvent.click(screen.getByRole('button', { name: 'Ouvertures' }));
  fireEvent.click(screen.getByRole('button', { name: new RegExp(opening.name) }));
  fireEvent.click(screen.getByRole('button', { name: new RegExp(puzzle.title) }));
}
function finish(puzzle: Tactic, assistance = false) {
  const lesson = compileTactic(puzzle);
  for (const move of lesson.moves) {
    expect(screen.queryByTestId('exact-move')).not.toBeInTheDocument();
    expect(screen.queryByTestId('pedagogical-hint')).not.toBeInTheDocument();
    if (move.color === puzzle.side) {
      if (assistance) {
        const used = screen.getByTestId('hints').textContent;
        fireEvent.click(screen.getByRole('button', { name: 'Indice' }));
        expect(screen.getByTestId('pedagogical-hint')).toBeVisible();
        expect(screen.getByTestId('hints')).toHaveTextContent(used!);
        fireEvent.click(screen.getByRole('button', { name: 'Solution' }));
        fireEvent.click(screen.getByRole('button', { name: 'Solution' }));
        expect(screen.getByTestId('exact-move')).toHaveTextContent(`${move.from} → ${move.to}`);
        expect(
          document.querySelector(`[id*="arrowhead-0-${move.from}-${move.to}"]`),
        ).toBeInTheDocument();
      }
      play(move.from, move.to);
      expect(screen.getByTestId('move-badge')).toHaveTextContent('✓');
    } else act(() => vi.advanceTimersByTime(CORRECT_FEEDBACK_DELAY));
  }
  act(() => vi.advanceTimersByTime(CORRECT_FEEDBACK_DELAY));
  expect(screen.getByRole('dialog', { name: 'Tactique réussie' })).toBeVisible();
  expect(screen.getByText(puzzle.explanation)).toBeVisible();
  expect(screen.getByText(puzzle.gain)).toBeVisible();
}

describe('Tactiques : vrais parcours UI, réponses toujours scriptées', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    worker.mockReset();
    vi.stubGlobal('Worker', worker);
  });
  for (const opening of openings) {
    it(`${opening.name} : depuis le catalogue jusqu’au bilan, puis replay`, () => {
      render(<App />);
      const puzzle = tacticsFor(opening.id)[0];
      start(puzzle);
      expect(document.querySelector('.training-board')).toHaveAttribute(
        'data-orientation',
        puzzle.side === 'w' ? 'white' : 'black',
      );
      expect(
        screen.getByText(`Aux ${puzzle.side === 'w' ? 'Blancs' : 'Noirs'} de jouer`),
      ).toBeVisible();
      const wrong = new Chess(puzzle.fen)
        .moves({ verbose: true })
        .find((move) => move.san !== puzzle.sequence[0].san)!;
      play(wrong.from, wrong.to);
      expect(screen.getByTestId('errors')).toHaveTextContent('1');
      expect(screen.getByTestId('move-badge')).toHaveTextContent('✕');
      expect(screen.getByTestId('progress')).toHaveTextContent('0 /');
      finish(puzzle, true);
      expect(screen.getByTestId('hints')).toHaveTextContent(String(compileTactic(puzzle).total));
      fireEvent.click(screen.getByRole('button', { name: 'Rejouer' }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByTestId('progress')).toHaveTextContent('0 /');
      expect(screen.getByTestId('hints')).toHaveTextContent('0');
      expect(screen.getByTestId('errors')).toHaveTextContent('0');
      expect(screen.queryByTestId('pedagogical-hint')).not.toBeInTheDocument();
      expect(screen.queryByTestId('exact-move')).not.toBeInTheDocument();
      expect(worker).not.toHaveBeenCalled();
    });
  }
  it('termine le mat en un, sans réponse adverse superflue', () => {
    render(<App />);
    const puzzle = tactics.find((puzzle) => puzzle.sequence.length === 1)!;
    start(puzzle);
    finish(puzzle);
    expect(screen.getByTestId('progress')).toHaveTextContent('1 / 1');
    expect(screen.getByTestId('hints')).toHaveTextContent('0');
  });
  it('passe à la tactique suivante puis retrouve la bonne ouverture', () => {
    render(<App />);
    const [first, second] = tacticsFor('italian');
    start(first);
    finish(first);
    fireEvent.click(screen.getByRole('button', { name: 'Tactique suivante' }));
    expect(screen.getByRole('heading', { level: 1, name: second.title })).toBeVisible();
    expect(screen.getByTestId('progress')).toHaveTextContent('0 /');
    fireEvent.click(screen.getAllByRole('button', { name: 'Retour à l’ouverture' })[0]);
    expect(screen.getByRole('heading', { name: 'TACTIQUES' })).toBeVisible();
    expect(document.querySelector('#opening-italian')).toHaveClass('expanded');
    expect(screen.getByRole('button', { name: new RegExp(second.title) })).toBeVisible();
  });
  it('conserve l’indice, la solution et le compteur lors du changement de thème', () => {
    render(<App />);
    start(tactics[0]);
    const group = screen.getByRole('group', { name: 'Assistance facultative' });
    const hint = within(group).getByRole('button', { name: 'Indice' });
    const solution = within(group).getByRole('button', { name: 'Solution' });
    expect(within(group).getAllByRole('button')).toEqual([hint, solution]);
    hint.focus();
    expect(hint).toHaveFocus();
    fireEvent.click(hint, { detail: 0 });
    solution.focus();
    expect(solution).toHaveFocus();
    fireEvent.click(solution, { detail: 0 });
    const text = screen.getByTestId('exact-move').textContent;
    const toggle = screen.getByRole('button', { name: /Activer le thème/ });
    fireEvent.click(toggle);
    expect(screen.getByTestId('exact-move').textContent).toBe(text);
    fireEvent.click(toggle);
    expect(screen.getByTestId('hints')).toHaveTextContent('1');
    expect(screen.getByTestId('pedagogical-hint')).toBeVisible();
  });
});
