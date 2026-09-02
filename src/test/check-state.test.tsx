import { act, render, screen } from '@testing-library/react';
import { Chess } from 'chess.js';
import { describe, expect, it, vi } from 'vitest';
import { ComputerBoard } from '../computer/ComputerBoard';
import { TrainingBoard } from '../components/TrainingBoard';
import { compileLesson, initialState } from '../trainer/model';
import { openings } from '../data/openings';
import { matedGame } from './fixtures/computer';
import { replayGame } from '../computer/game';

// A single-rook-versus-king check with an open escape square: check, not mate. The rook
// sweeps the defender's back rank, but a rank behind stays free for the king to step into.
function checkNotMateFen(defender: 'w' | 'b') {
  const start = defender === 'b' ? '4k3/8/8/8/8/8/8/4K2R w - - 0 1' : '4k2r/8/8/8/8/8/8/4K3 b - - 0 1';
  const game = new Chess(start);
  game.move(defender === 'b' ? 'Rh8' : 'Rh1');
  return { fen: game.fen() };
}
// Scholar's mate, played out through chess.js so the position is guaranteed legal: the only
// widely known short line that mates the Black king (Fool's mate below always mates White).
function blackMatedFen() {
  const game = new Chess();
  for (const san of ['e4', 'e5', 'Qh5', 'Nc6', 'Bc4', 'Nf6', 'Qxf7']) game.move(san);
  return game.fen();
}

describe('État visuel d’échec, partagé par tous les échiquiers interactifs', () => {
  it('roi blanc en échec : la case porte l’état visuel, orientation Blancs', () => {
    const { fen } = checkNotMateFen('w');
    render(<ComputerBoard fen={fen} player="w" />);
    const square = screen.getByRole('button', { name: /^e1, roi blanc, roi en échec/ });
    expect(square).toHaveAttribute('data-check', 'true');
    expect(square).not.toHaveAttribute('data-mate');
  });

  it('roi noir en échec : la case porte l’état visuel, orientation Noirs', () => {
    const { fen } = checkNotMateFen('b');
    render(<ComputerBoard fen={fen} player="b" />);
    const square = screen.getByRole('button', { name: /^e8, roi noir, roi en échec/ });
    expect(square).toHaveAttribute('data-check', 'true');
  });

  it('fonctionne à l’orientation Blancs comme à l’orientation Noirs pour le même échec', () => {
    const { fen } = checkNotMateFen('b');
    const white = render(<ComputerBoard fen={fen} player="w" />);
    expect(
      white.getByRole('button', { name: /^e8, roi noir, roi en échec/ }),
    ).toHaveAttribute('data-check', 'true');
    white.unmount();
    const black = render(<ComputerBoard fen={fen} player="b" />);
    expect(
      black.getByRole('button', { name: /^e8, roi noir, roi en échec/ }),
    ).toHaveAttribute('data-check', 'true');
  });

  it('retire l’état dès que l’échec est levé', () => {
    const { fen } = checkNotMateFen('b');
    const view = render(<ComputerBoard fen={fen} player="b" />);
    expect(screen.getByRole('button', { name: /roi en échec/ })).toBeInTheDocument();
    const resolved = new Chess(fen);
    resolved.move('Kd7');
    view.rerender(<ComputerBoard fen={resolved.fen()} player="b" />);
    expect(screen.queryByRole('button', { name: /roi en échec/ })).toBeNull();
    expect(document.querySelector('[data-check="true"]')).toBeNull();
  });

  it('déclenche une seule pulsation courte au moment où l’échec apparaît, pas au montage', () => {
    render(<ComputerBoard fen={new Chess().fen()} player="w" />);
    expect(document.querySelector('[data-check-pulse="true"]')).toBeNull();
  });

  it('pulse au moment de la transition vers l’échec, puis se stabilise', () => {
    vi.useFakeTimers();
    const start = new Chess('4k3/8/8/8/8/8/8/4K2R w - - 0 1');
    const view = render(<ComputerBoard fen={start.fen()} player="b" />);
    expect(document.querySelector('[data-check-pulse="true"]')).toBeNull();
    start.move('Rh8');
    act(() => {
      view.rerender(<ComputerBoard fen={start.fen()} player="b" />);
    });
    expect(
      screen.getByRole('button', { name: /^e8, roi noir, roi en échec/ }),
    ).toHaveAttribute('data-check-pulse', 'true');
    act(() => {
      vi.advanceTimersByTime(700);
    });
    expect(document.querySelector('[data-check-pulse="true"]')).toBeNull();
    expect(
      screen.getByRole('button', { name: /^e8, roi noir, roi en échec/ }),
    ).toHaveAttribute('data-check', 'true');
    vi.useRealTimers();
  });

  it('ne pulse jamais avec « reduced motion »', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
    const start = new Chess('4k3/8/8/8/8/8/8/4K2R w - - 0 1');
    const view = render(<ComputerBoard fen={start.fen()} player="b" />);
    start.move('Rh8');
    act(() => {
      view.rerender(<ComputerBoard fen={start.fen()} player="b" />);
    });
    expect(document.querySelector('[data-check-pulse="true"]')).toBeNull();
    expect(
      screen.getByRole('button', { name: /^e8, roi noir, roi en échec/ }),
    ).toHaveAttribute('data-check', 'true');
    vi.unstubAllGlobals();
  });

  it('fonctionne aussi sur le plateau des Ouvertures, coup scripté ou réponse ordinateur', () => {
    // The Vienna game reaches a real, non-scripted-check-free position early; instead of
    // relying on a specific opening line, drive the shared primitive directly with a lesson
    // board and a FEN that puts its own player in check, exactly like a live board would.
    const opening = openings.find((entry) => entry.side === 'w')!;
    const lesson = compileLesson(opening, opening.variations[0], 'essential');
    const state = initialState();
    const { fen } = checkNotMateFen('w');
    render(
      <TrainingBoard
        lesson={lesson}
        state={state}
        fen={fen}
        enabled={false}
        onMove={() => false}
      />,
    );
    expect(
      screen.getByRole('button', { name: /^e1, roi blanc, roi en échec/ }),
    ).toHaveAttribute('data-check', 'true');
  });

  it('affiche l’état renforcé et le marqueur de mat sur une vraie position matée', () => {
    const game = matedGame('w');
    const fen = replayGame(game).positions.at(-1)!;
    render(<ComputerBoard fen={fen} player="w" />);
    const square = screen.getByRole('button', { name: /^e1, roi blanc, échec et mat/ });
    expect(square).toHaveAttribute('data-mate', 'true');
    expect(square).not.toHaveAttribute('data-check');
    expect(screen.getByTestId('mate-badge')).toBeInTheDocument();
  });

  it('colore le marqueur de mat selon le camp du roi maté', () => {
    const white = matedGame('w');
    const whiteFen = replayGame(white).positions.at(-1)!;
    const view = render(<ComputerBoard fen={whiteFen} player="w" />);
    // The medallion uses the exact same king asset as the board instead of approximating it.
    const whitePiece = view.getByTestId('mate-badge').querySelector('.mate-piece');
    expect(whitePiece).toHaveAttribute('data-mated-side', 'w');
    expect(whitePiece).toHaveAttribute('src', expect.stringMatching(/pieces\/cburnett\/wK\.svg$/));
    view.unmount();
    render(<ComputerBoard fen={blackMatedFen()} player="b" />);
    const blackPiece = screen.getByTestId('mate-badge').querySelector('.mate-piece');
    expect(blackPiece).toHaveAttribute('data-mated-side', 'b');
    expect(blackPiece).toHaveAttribute('src', expect.stringMatching(/pieces\/cburnett\/bK\.svg$/));
  });

  it('ne montre jamais le marqueur de mat pour un simple échec', () => {
    const { fen } = checkNotMateFen('w');
    render(<ComputerBoard fen={fen} player="w" />);
    expect(screen.queryByTestId('mate-badge')).toBeNull();
  });
});
