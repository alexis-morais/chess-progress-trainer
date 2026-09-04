import { fireEvent, render, screen } from '@testing-library/react';
import { Chess, type Move } from 'chess.js';
import { describe, expect, it, vi } from 'vitest';
import { MoveHistory } from '../computer/MoveHistory';
import { getLessonMoves, openings } from '../data/openings';

function longLine(): Move[] {
  const game = new Chess();
  return getLessonMoves(openings[0].variations[0], 'extended').map(({ san }) =>
    game.move(san, { strict: true }),
  );
}

describe('Historique scrollable de l’Ouverture libre', () => {
  it('aligne les coups courts et les numéros à deux chiffres dans trois colonnes', () => {
    render(<MoveHistory moves={longLine()} selected={20} onSelect={() => {}} />);
    expect(screen.getByText('1.')).toBeVisible();
    expect(screen.getByText('10.')).toBeVisible();
    expect(document.querySelectorAll('.history-row').length).toBeGreaterThanOrEqual(10);
    expect(document.querySelector('.history-row')?.children).toHaveLength(3);
  });

  it('rend directement sélectionnable un ancien demi-coup', () => {
    const onSelect = vi.fn();
    render(<MoveHistory moves={longLine()} selected={12} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: /^Afficher 2\. Cf3/ }));
    expect(onSelect).toHaveBeenCalledWith(3);
  });

  it('fait défiler uniquement l’historique afin de garder le coup actif visible', () => {
    const moves = longLine();
    const { rerender } = render(<MoveHistory moves={moves} selected={1} onSelect={() => {}} />);
    const container = screen.getByLabelText('Historique des coups');
    const target = container.querySelector<HTMLElement>('[data-ply="20"]')!;
    Object.defineProperties(container, {
      clientHeight: { configurable: true, value: 120 },
      scrollHeight: { configurable: true, value: 620 },
    });
    Object.defineProperties(target, {
      offsetTop: { configurable: true, value: 500 },
      offsetHeight: { configurable: true, value: 44 },
    });
    rerender(<MoveHistory moves={moves} selected={20} onSelect={() => {}} />);
    expect(container.scrollTop).toBe(462);
    expect(document.scrollingElement?.scrollTop ?? 0).toBe(0);
  });
});
