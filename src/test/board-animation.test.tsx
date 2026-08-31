import { act, fireEvent, render, screen } from '@testing-library/react';
import { Chess } from 'chess.js';
import { describe, expect, it, vi } from 'vitest';
import { ComputerBoard } from '../computer/ComputerBoard';

describe('Animations des transitions légales', () => {
  it.each(['w', 'b'] as const)(
    '%s : anime un coup automatique dans le bon sens et annule au démontage',
    (player) => {
      const cancel = vi.fn();
      const animate = vi.fn(() => ({ cancel, finished: new Promise(() => {}) }));
      vi.stubGlobal('Animation', class {});
      Object.defineProperty(HTMLElement.prototype, 'animate', {
        configurable: true,
        value: animate,
      });
      try {
        const game = new Chess();
        if (player === 'b') game.move('e4');
        const view = render(<ComputerBoard fen={game.fen()} player={player} />);
        const last = game.move(player === 'w' ? 'e4' : 'e5');
        view.rerender(<ComputerBoard fen={game.fen()} player={player} last={last} />);
        expect(animate).toHaveBeenCalledWith(
          [{ transform: 'translate(0%,200%)' }, { transform: 'translate(0,0)' }],
          expect.objectContaining({ duration: 170 }),
        );
        expect(document.querySelector('.interactive-board')).toHaveAttribute('data-motion', 'true');
        view.unmount();
        expect(cancel).toHaveBeenCalledTimes(1);
      } finally {
        delete (HTMLElement.prototype as Partial<HTMLElement>).animate;
      }
    },
  );
  it('respecte la préférence de réduction des animations', () => {
    const animate = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'animate', { configurable: true, value: animate });
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    try {
      const game = new Chess(),
        view = render(<ComputerBoard fen={game.fen()} player="w" />);
      const last = game.move('e4');
      view.rerender(<ComputerBoard fen={game.fen()} player="w" last={last} />);
      expect(animate).not.toHaveBeenCalled();
    } finally {
      delete (HTMLElement.prototype as Partial<HTMLElement>).animate;
    }
  });
  it('rend le badge visible après la fin de la transition', async () => {
    let finish!: () => void;
    const animate = vi.fn(() => ({
      cancel: vi.fn(),
      finished: new Promise<void>((resolve) => {
        finish = resolve;
      }),
    }));
    Object.defineProperty(HTMLElement.prototype, 'animate', { configurable: true, value: animate });
    try {
      const game = new Chess(),
        view = render(<ComputerBoard fen={game.fen()} player="w" />);
      const last = game.move('e4');
      view.rerender(
        <ComputerBoard
          fen={game.fen()}
          player="w"
          last={last}
          mark={{ square: 'e4', good: true, symbol: '✓' }}
        />,
      );
      expect(document.querySelector('.interactive-board')).toHaveAttribute('data-motion', 'true');
      await act(async () => {
        finish();
      });
      expect(document.querySelector('.interactive-board')).not.toHaveAttribute('data-motion');
      expect(screen.getByTestId('computer-move-badge')).toHaveTextContent('✓');
      fireEvent.click(screen.getByRole('button', { name: 'e4, pion blanc' }));
      expect(screen.queryAllByTestId('legal-move')).toHaveLength(0);
    } finally {
      delete (HTMLElement.prototype as Partial<HTMLElement>).animate;
    }
  });
});
