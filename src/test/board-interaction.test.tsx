import { useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Chess, type Move } from 'chess.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComputerBoard } from '../computer/ComputerBoard';
import { Trainer } from '../components/Trainer';
import { TacticTrainer } from '../tactics/TacticTrainer';
import { openings } from '../data/openings';
import { compileLesson } from '../trainer/model';
import { compileTactic, tactics } from '../tactics/model';
import { CORRECT_FEEDBACK_DELAY } from '../trainer/useTrainer';
import { SNAP_MS } from '../board/useBoardPointer';

class TestPointerEvent extends MouseEvent {
  pointerId: number;
  pointerType: string;
  isPrimary: boolean;
  constructor(type: string, options: PointerEventInit = {}) {
    super(type, options);
    this.pointerId = options.pointerId ?? 1;
    this.pointerType = options.pointerType ?? 'mouse';
    this.isPrimary = options.isPrimary ?? true;
  }
}
const initial = new Chess().fen();
const square = (name: string) => screen.getByRole('button', { name: new RegExp(`^${name},`) });
const marks = () =>
  screen
    .queryAllByTestId('legal-move')
    .map((el) => el.dataset.square)
    .sort();
const clickMove = (from: string, to: string) => {
  fireEvent.click(square(from));
  fireEvent.click(square(to));
};
function FreeBoard({
  fen = initial,
  player = 'w',
  observe = vi.fn(),
}: {
  fen?: string;
  player?: 'w' | 'b';
  observe?: (from: string, to: string, promotion?: string) => void;
}) {
  const [position, setPosition] = useState(fen),
    [last, setLast] = useState<Move>();
  return (
    <>
      <ComputerBoard
        fen={position}
        player={player}
        enabled
        last={last}
        onMove={(from, to, promotion) => {
          observe(from, to, promotion);
          const game = new Chess(position);
          try {
            const move = game.move({ from, to, promotion });
            setPosition(game.fen());
            setLast(move);
            return true;
          } catch {
            return false;
          }
        }}
      />
      <output data-testid="position">{position}</output>
    </>
  );
}
function pointer(type = 'mouse', black = false) {
  const root = document.querySelector<HTMLElement>('.interactive-board')!;
  const surface = root.querySelector<HTMLElement>('[data-board-surface]')!;
  Object.defineProperty(surface, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({ left: 8, top: 100, width: 400, height: 400 }),
  });
  const captured = new Set<number>();
  root.setPointerCapture = vi.fn((id) => {
    captured.add(id);
  });
  root.hasPointerCapture = (id) => captured.has(id);
  root.releasePointerCapture = vi.fn((id) => {
    captured.delete(id);
  });
  const point = (sq: string) => {
    const file = sq.charCodeAt(0) - 97,
      rank = Number(sq[1]) - 1;
    return {
      clientX: 8 + (black ? 7 - file : file) * 50 + 25,
      clientY: 100 + (black ? rank : 7 - rank) * 50 + 25,
    };
  };
  const data = (sq: string) => ({
    ...point(sq),
    pointerId: 1,
    pointerType: type,
    isPrimary: true,
    button: 0,
    bubbles: true,
    cancelable: true,
  });
  return {
    root,
    point,
    data,
    down: (sq: string) => fireEvent.pointerDown(square(sq), data(sq)),
    move: (sq: string) => fireEvent.pointerMove(root, data(sq)),
    up: (sq: string) => fireEvent.pointerUp(root, data(sq)),
    tap: (sq: string) => {
      fireEvent.pointerDown(square(sq), data(sq));
      fireEvent.pointerUp(root, data(sq));
      fireEvent.click(square(sq), { detail: 1 });
    },
  };
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('PointerEvent', TestPointerEvent);
  vi.stubGlobal(
    'Worker',
    class {
      constructor() {
        throw Error('offline');
      }
    },
  );
});

describe('Sélection commune et clavier', () => {
  it('clic, changement de pièce, désélection et Escape nettoient les marqueurs', () => {
    render(<FreeBoard />);
    fireEvent.click(square('e2'));
    expect(marks()).toEqual(['e3', 'e4']);
    expect(square('e2')).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(square('g1'));
    expect(marks()).toEqual(['f3', 'h3']);
    fireEvent.click(square('g1'));
    expect(marks()).toEqual([]);
    fireEvent.keyDown(square('e2'), { key: 'Enter' });
    expect(marks()).toEqual(['e3', 'e4']);
    fireEvent.keyDown(square('e2'), { key: 'ArrowUp' });
    expect(square('e3')).toHaveFocus();
    fireEvent.keyDown(square('e3'), { key: 'Escape' });
    expect(marks()).toEqual([]);
    fireEvent.keyDown(square('e2'), { key: ' ' });
    fireEvent.keyDown(square('e4'), { key: 'Enter' });
    expect(square('e4')).toHaveAttribute('aria-label', 'e4, pion blanc');
    expect(marks()).toEqual([]);
  });
  it('distingue points et anneaux puis accepte la capture', () => {
    const game = new Chess();
    game.move('e4');
    game.move('d5');
    render(<FreeBoard fen={game.fen()} />);
    fireEvent.click(square('e4'));
    expect(square('d5').querySelector('.legal-destination')).toHaveClass('capture');
    expect(square('e5').querySelector('.legal-destination')).toHaveClass('move');
    fireEvent.click(square('d5'));
    expect(square('d5')).toHaveAttribute('aria-label', 'd5, pion blanc');
  });
});

describe('Pointer Events souris et tactiles', () => {
  it('ne prévient le déplacement du pointeur que pendant un vrai drag de pièce', () => {
    render(<FreeBoard />);
    const p = pointer('touch');
    p.down('e2');
    expect(
      fireEvent.pointerMove(p.root, { ...p.data('e2'), clientX: p.point('e2').clientX + 4 }),
    ).toBe(true);
    expect(screen.queryByTestId('drag-piece')).toBeNull();
    expect(p.move('e4')).toBe(false);
    expect(document.body.style.overflow).toBe('');
    p.up('e4');
    expect(fireEvent.pointerMove(document.body, p.data('e5'))).toBe(true);
  });
  it('la source reste fixe et la destination suit le doigt, y compris hors plateau', () => {
    render(<FreeBoard />);
    const p = pointer('touch');
    p.down('e2');
    p.move('e3');
    expect(square('e2')).toHaveAttribute('data-drag-source', 'true');
    expect(square('e3')).toHaveAttribute('data-drag-target', 'true');
    p.move('d4');
    expect(square('e3')).not.toHaveAttribute('data-drag-target');
    expect(square('d4')).toHaveAttribute('data-drag-target', 'true');
    expect(square('e2')).toHaveAttribute('data-drag-source', 'true');
    expect(marks()).toEqual(['e3', 'e4']);
    fireEvent.pointerMove(p.root, { ...p.data('d4'), clientX: 0, clientY: 0 });
    expect(document.querySelector('[data-drag-target]')).toBeNull();
    expect(screen.getByTestId('drag-piece').style.transform).toContain(
      'translate3d(13.5px, 13.5px',
    );
    fireEvent.pointerCancel(p.root, p.data('d4'));
    expect(screen.queryByTestId('drag-halo')).toBeNull();
    expect(document.querySelector('[data-drag-source]')).toBeNull();
  });
  it.each(['mouse', 'touch'])(
    '%s : marqueurs dès le contact, pendant le drag, snap et aucun clic parasite',
    (type) => {
      const observe = vi.fn();
      render(<FreeBoard observe={observe} />);
      const p = pointer(type);
      p.down('e2');
      expect(marks()).toEqual(['e3', 'e4']);
      expect(p.root.setPointerCapture).toHaveBeenCalledWith(1);
      p.move('e4');
      expect(marks()).toEqual(['e3', 'e4']);
      const ghost = screen.getByTestId('drag-piece');
      expect(ghost).toHaveAttribute('data-phase', 'dragging');
      expect(ghost.style.transform).toContain(type === 'touch' ? 'scale(1.42)' : 'scale(1.04)');
      if (type === 'touch') expect(ghost.style.transform).toContain('247.5px'); // Center y=325, half-size 25, lift 52.5.
      expect(square('e2')).toHaveAttribute('data-drag-source', 'true');
      expect(square('e4')).toHaveAttribute('data-drag-target', 'true');
      if (type === 'touch') expect(screen.getByTestId('drag-halo')).toBeInTheDocument();
      else expect(screen.queryByTestId('drag-halo')).not.toBeInTheDocument();
      expect(p.root).toHaveAttribute('data-dragging', 'true');
      p.up('e4');
      expect(ghost).toHaveAttribute('data-phase', 'settling');
      expect(ghost.style.transform).toContain('scale(1)');
      expect(square('e2')).not.toHaveAttribute('data-drag-source');
      expect(square('e4')).not.toHaveAttribute('data-drag-target');
      fireEvent.click(square('e4'), { detail: 1 });
      expect(observe).toHaveBeenCalledTimes(1);
      expect(marks()).toEqual([]);
      expect(square('e4')).toHaveAttribute('aria-label', 'e4, pion blanc');
      expect(p.root.releasePointerCapture).toHaveBeenCalledWith(1);
      act(() => vi.advanceTimersByTime(SNAP_MS));
      expect(screen.queryByTestId('drag-piece')).not.toBeInTheDocument();
      expect(square('e4').querySelector('[data-piece]')).toHaveStyle({ opacity: 1 });
    },
  );
  it('un micro-mouvement tactile reste un tap, suivi d’un tap destination', () => {
    const observe = vi.fn();
    render(<FreeBoard observe={observe} />);
    const p = pointer('touch');
    p.down('e2');
    fireEvent.pointerMove(p.root, { ...p.data('e2'), clientX: p.point('e2').clientX + 4 });
    p.up('e2');
    fireEvent.click(square('e2'), { detail: 1 });
    expect(marks()).toEqual(['e3', 'e4']);
    expect(screen.queryByTestId('drag-piece')).not.toBeInTheDocument();
    p.tap('e4');
    expect(observe).toHaveBeenCalledTimes(1);
    expect(square('e4')).toHaveAttribute('aria-label', 'e4, pion blanc');
  });
  it.each(['illegal', 'outside'] as const)(
    '%s : retour origine sans changer la position',
    (destination) => {
      const observe = vi.fn();
      render(<FreeBoard observe={observe} />);
      const p = pointer();
      p.down('e2');
      p.move('e5');
      if (destination === 'outside') fireEvent.pointerUp(p.root, { ...p.data('e5'), clientX: 450 });
      else p.up('e5');
      expect(screen.getByTestId('position')).toHaveTextContent(initial);
      expect(screen.getByTestId('drag-piece').style.transform).toBe(
        'translate3d(208px, 400px, 0) scale(1)',
      );
      expect(observe).toHaveBeenCalledTimes(destination === 'outside' ? 0 : 1);
      act(() => vi.advanceTimersByTime(SNAP_MS));
      expect(screen.queryByTestId('drag-piece')).not.toBeInTheDocument();
    },
  );
  it.each(['cancel', 'capture', 'blur', 'resize', 'unmount'] as const)(
    '%s interrompt proprement un geste',
    (reason) => {
      const observe = vi.fn();
      const view = render(<FreeBoard observe={observe} />);
      const p = pointer('touch');
      p.down('e2');
      p.move('e4');
      if (reason === 'cancel') fireEvent.pointerCancel(p.root, p.data('e4'));
      if (reason === 'capture') fireEvent.lostPointerCapture(p.root, p.data('e4'));
      if (reason === 'blur') fireEvent(window, new Event('blur'));
      if (reason === 'resize') fireEvent(window, new Event('resize'));
      if (reason === 'unmount') view.unmount();
      expect(screen.queryByTestId('drag-piece')).not.toBeInTheDocument();
      expect(marks()).toEqual([]);
      expect(observe).not.toHaveBeenCalled();
    },
  );
  it('un changement de position pendant un geste ignore sa destination obsolète', () => {
    const observe = vi.fn();
    const game = new Chess();
    const view = render(<ComputerBoard fen={game.fen()} player="w" enabled onMove={observe} />);
    const p = pointer();
    p.down('e2');
    p.move('e4');
    game.move('d4');
    view.rerender(<ComputerBoard fen={game.fen()} player="w" enabled onMove={observe} />);
    p.up('e4');
    expect(screen.queryByTestId('drag-piece')).not.toBeInTheDocument();
    expect(observe).not.toHaveBeenCalled();
  });
  it('Noirs : le décalage reste vers le haut et le contact détermine la case', () => {
    const game = new Chess();
    game.move('e4');
    render(<FreeBoard fen={game.fen()} player="b" />);
    const p = pointer('touch', true);
    p.down('e7');
    expect(marks()).toEqual(['e5', 'e6']);
    p.move('e5');
    expect(screen.getByTestId('drag-piece').style.transform).toContain('247.5px');
    p.up('e5');
    expect(square('e5')).toHaveAttribute('aria-label', 'e5, pion noir');
  });
  it('ne capture ni ne bloque un geste commencé sur une case vide ou adverse', () => {
    render(<FreeBoard />);
    const p = pointer('touch');
    p.down('e4');
    expect(p.move('e5')).toBe(true);
    expect(p.root.setPointerCapture).not.toHaveBeenCalled();
    p.down('e7');
    expect(p.move('e5')).toBe(true);
    expect(screen.queryByTestId('drag-piece')).not.toBeInTheDocument();
    expect(square('e2')).toHaveAttribute('data-draggable', 'true');
    expect(square('e7')).not.toHaveAttribute('data-draggable');
  });
});

describe('Règles spéciales avec les deux interactions', () => {
  for (const method of ['click', 'drag']) {
    it.each(['g1', 'c1'])(`${method} : roque vers %s`, (to) => {
      render(<FreeBoard fen="r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1" />);
      if (method === 'click') clickMove('e1', to);
      else {
        const p = pointer();
        p.down('e1');
        expect(marks()).toContain(to);
        p.move(to);
        p.up(to);
      }
      expect(square(to)).toHaveAttribute('aria-label', `${to}, roi blanc`);
      expect(square(to === 'g1' ? 'f1' : 'd1')).toHaveAttribute(
        'aria-label',
        `${to === 'g1' ? 'f1' : 'd1'}, tour blanche`,
      );
    });
    it(`${method} : prise en passant`, () => {
      render(<FreeBoard fen="4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 2" />);
      if (method === 'click') clickMove('e5', 'd6');
      else {
        const p = pointer('touch');
        p.down('e5');
        expect(square('d6').querySelector('.legal-destination')).toHaveClass('capture');
        p.move('d6');
        p.up('d6');
      }
      expect(square('d6')).toHaveAttribute('aria-label', 'd6, pion blanc');
      expect(square('d5')).toHaveAttribute('aria-label', 'd5, case vide');
    });
    it.each([
      ['Dame', 'q'],
      ['Tour', 'r'],
      ['Fou', 'b'],
      ['Cavalier', 'n'],
    ])(`${method} : promotion en %s`, (name, piece) => {
      const observe = vi.fn();
      render(<FreeBoard fen="7k/P7/8/8/8/8/8/7K w - - 0 1" observe={observe} />);
      if (method === 'click') clickMove('a7', 'a8');
      else {
        const p = pointer('touch');
        p.down('a7');
        p.move('a8');
        p.up('a8');
      }
      expect(observe).not.toHaveBeenCalled();
      expect(screen.getByRole('dialog')).toBeVisible();
      fireEvent.click(screen.getByRole('button', { name }));
      expect(observe).toHaveBeenCalledWith('a7', 'a8', piece);
      expect(square('a8').querySelector('[data-piece]')).toHaveAttribute(
        'data-piece',
        `w${piece.toUpperCase()}`,
      );
    });
  }
  it('annuler la promotion laisse la position et la sélection propres', () => {
    const observe = vi.fn();
    render(<FreeBoard fen="7k/P7/8/8/8/8/8/7K w - - 0 1" observe={observe} />);
    clickMove('a7', 'a8');
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(observe).not.toHaveBeenCalled();
    expect(marks()).toEqual([]);
    expect(square('a7')).toHaveAttribute('aria-label', 'a7, pion blanc');
  });
});

describe('La pédagogie conserve son autorité', () => {
  it('un coup légal refusé en ouverture reste jouable dans une partie libre', () => {
    const lesson = compileLesson(openings[0], openings[0].variations[0], 'essential');
    const view = render(
      <Trainer lesson={lesson} onHome={vi.fn()} onRestart={vi.fn()} onVariants={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Indice' }));
    expect(screen.getByTestId('hints')).toHaveTextContent('0');
    const p = pointer();
    p.down('e2');
    expect(marks()).toEqual(['e3', 'e4']);
    p.move('e3');
    p.up('e3');
    expect(screen.getByTestId('errors')).toHaveTextContent('1');
    expect(screen.getByTestId('move-badge')).toHaveTextContent('✕');
    expect(square('e2')).toHaveAttribute('aria-label', 'e2, pion blanc');
    expect(marks()).toEqual([]);
    act(() => vi.advanceTimersByTime(SNAP_MS));
    fireEvent.click(screen.getByRole('button', { name: 'Solution' }));
    fireEvent.click(screen.getByRole('button', { name: 'Solution' }));
    expect(screen.getByTestId('hints')).toHaveTextContent('1');
    expect(document.querySelector('[id*="arrowhead-0-e2-e4"]')).toBeInTheDocument();
    p.down('e2');
    p.move('e4');
    p.up('e4');
    act(() => vi.advanceTimersByTime(CORRECT_FEEDBACK_DELAY));
    expect(square('e5')).toHaveAttribute('aria-label', 'e5, pion noir');
    expect(marks()).toEqual([]);
    expect(screen.queryByTestId('exact-move')).not.toBeInTheDocument();
    view.unmount();
    render(<FreeBoard />);
    clickMove('e2', 'e3');
    expect(square('e3')).toHaveAttribute('aria-label', 'e3, pion blanc');
  });
  it('les tactiques montrent toutes les destinations sans révéler la solution', () => {
    const lesson = compileTactic(tactics[0]);
    render(<TacticTrainer lesson={lesson} onRestart={vi.fn()} onBack={vi.fn()} />);
    const expected = lesson.moves[0],
      game = new Chess(lesson.positions[0]);
    const wrong = game
      .moves({ square: expected.from, verbose: true })
      .find((move) => move.to !== expected.to)!;
    expect(wrong).toBeDefined();
    const p = pointer('touch', lesson.player === 'b');
    p.down(expected.from);
    expect(marks()).toContain(expected.to);
    expect(marks()).toContain(wrong.to);
    p.move(wrong.to);
    p.up(wrong.to);
    expect(screen.getByTestId('errors')).toHaveTextContent('1');
    act(() => vi.advanceTimersByTime(SNAP_MS));
    p.down(expected.from);
    p.move(expected.to);
    p.up(expected.to);
    expect(screen.getByTestId('move-badge')).toHaveTextContent('✓');
    act(() => vi.advanceTimersByTime(CORRECT_FEEDBACK_DELAY));
    expect(marks()).toEqual([]);
    expect(screen.queryByTestId('drag-piece')).not.toBeInTheDocument();
  });
});
