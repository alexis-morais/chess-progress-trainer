import { useEffect, useRef, useState, type PointerEvent, type RefObject } from 'react';
import { Chess, type Square } from 'chess.js';
import { squareAtPoint, squareCenter, type Orientation } from './geometry';

export const SNAP_MS = 140;
export const TOUCH_DRAG_SCALE = 1.42;
export const dragThreshold = (type: string) => (type === 'touch' ? 10 : 5);
export const touchLift = (size: number) => Math.min(96, Math.max(44, size * 1.05));
const reducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
type Gesture = {
  id: number;
  type: string;
  square: Square;
  source: Square | null;
  previous: Square | null;
  fen: string;
  x: number;
  y: number;
  dragging: boolean;
};
export type DragVisual = {
  piece: string;
  source: Square;
  hidden: Square;
  fen: string;
  nextFen?: string;
  type: string;
  size: number;
  transform: string;
  phase: 'dragging' | 'settling';
};
type Options = {
  root: RefObject<HTMLDivElement | null>;
  game: Chess;
  fen: string;
  player: 'w' | 'b';
  orientation: Orientation;
  enabled: boolean;
  selected: Square | null;
  select: (square: Square | null) => void;
  submit: (from: Square, to: Square) => boolean;
};

export function useBoardPointer(options: Options) {
  const latest = useRef(options);
  latest.current = options;
  const gesture = useRef<Gesture | null>(null);
  const ghost = useRef<HTMLDivElement>(null);
  const visualRef = useRef<DragVisual | null>(null);
  const [visual, setVisual] = useState<DragVisual | null>(null);
  const [over, setOver] = useState<Square | null>(null);
  const settling = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ignoreClickUntil = useRef(0);
  function show(value: DragVisual | null) {
    visualRef.current = value;
    setVisual(value);
  }
  function release(id: number) {
    const root = latest.current.root.current;
    if (root?.hasPointerCapture?.(id)) root.releasePointerCapture(id);
  }
  function clear() {
    if (settling.current) clearTimeout(settling.current);
    settling.current = null;
    const current = gesture.current;
    gesture.current = null;
    if (current) release(current.id);
    show(null);
    setOver(null);
  }
  function cancel() {
    clear();
    latest.current.select(null);
    ignoreClickUntil.current = performance.now() + 600;
  }
  const rect = () =>
    latest.current.root.current?.querySelector('[data-board-surface]')?.getBoundingClientRect();
  function moveVisual(x: number, y: number, value: DragVisual) {
    const touch = value.type === 'touch';
    if (touch) {
      const margin = (value.size * TOUCH_DRAG_SCALE) / 2 + 3;
      x = Math.max(margin, Math.min(window.innerWidth - margin, x));
      y = Math.max(margin + touchLift(value.size), y);
    }
    const transform = `translate3d(${x - value.size / 2}px, ${y - value.size / 2 - (touch ? touchLift(value.size) : 0)}px, 0) scale(${touch ? TOUCH_DRAG_SCALE : 1.04})`;
    value.transform = transform;
    if (ghost.current) ghost.current.style.transform = transform;
  }
  function settle(to: Square, accepted: boolean) {
    const value = visualRef.current;
    const bounds = rect();
    if (!value || !bounds) {
      clear();
      return;
    }
    const o = latest.current;
    let nextFen: string | undefined;
    if (accepted) {
      const copy = new Chess(value.fen);
      try {
        copy.move({ from: value.source, to });
        nextFen = copy.fen();
      } catch {
        /* Promotions return to the origin until chosen. */
      }
    }
    const end = squareCenter(accepted ? to : value.source, bounds, o.orientation);
    const duration = reducedMotion() ? 0 : SNAP_MS;
    show({
      ...value,
      hidden: accepted ? to : value.source,
      nextFen,
      phase: 'settling',
      transform: `translate3d(${end.x - value.size / 2}px, ${end.y - value.size / 2}px, 0) scale(1)`,
    });
    settling.current = setTimeout(() => {
      show(null);
      settling.current = null;
    }, duration);
  }
  function down(event: PointerEvent<HTMLDivElement>) {
    const o = latest.current;
    if (event.isPrimary === false) {
      cancel();
      return;
    }
    if (!o.enabled || event.button !== 0 || visualRef.current?.phase === 'settling') return;
    const element = (event.target as Element).closest<HTMLElement>('[data-key-square]');
    if (!element) return;
    const square = element.dataset.keySquare as Square;
    const source = o.game.get(square)?.color === o.player ? square : null;
    gesture.current = {
      id: event.pointerId,
      type: event.pointerType,
      square,
      source,
      previous: o.selected,
      fen: o.fen,
      x: event.clientX,
      y: event.clientY,
      dragging: false,
    };
    if (source) {
      o.select(source);
      o.root.current?.setPointerCapture?.(event.pointerId);
      element.focus({ preventScroll: true });
    }
  }
  function move(event: PointerEvent<HTMLDivElement>) {
    const current = gesture.current;
    const o = latest.current;
    if (!current || current.id !== event.pointerId) return;
    if (!o.enabled || current.fen !== o.fen) {
      cancel();
      return;
    }
    if (
      !current.dragging &&
      Math.hypot(event.clientX - current.x, event.clientY - current.y) < dragThreshold(current.type)
    )
      return;
    if (!current.source) {
      cancel();
      return;
    }
    const bounds = rect();
    if (!bounds) return;
    if (!current.dragging) {
      current.dragging = true;
      const piece = o.game.get(current.source)!;
      const value: DragVisual = {
        piece: piece.color + piece.type.toUpperCase(),
        source: current.source,
        hidden: current.source,
        fen: o.fen,
        type: current.type,
        size: bounds.width / 8,
        transform: '',
        phase: 'dragging',
      };
      moveVisual(event.clientX, event.clientY, value);
      show(value);
    } else if (visualRef.current) moveVisual(event.clientX, event.clientY, visualRef.current);
    setOver(squareAtPoint(event.clientX, event.clientY, bounds, o.orientation));
    if (event.cancelable) event.preventDefault();
  }
  function up(event: PointerEvent<HTMLDivElement>) {
    const current = gesture.current;
    if (!current || current.id !== event.pointerId) return;
    const o = latest.current;
    gesture.current = null;
    release(current.id);
    ignoreClickUntil.current = performance.now() + 600;
    setOver(null);
    if (!o.enabled || o.fen !== current.fen) {
      cancel();
      return;
    }
    const bounds = rect();
    const destination =
      bounds && squareAtPoint(event.clientX, event.clientY, bounds, o.orientation);
    if (current.dragging && current.source) {
      o.select(null);
      const accepted =
        !!destination && destination !== current.source && o.submit(current.source, destination);
      settle(destination ?? current.source, accepted);
    } else if (current.source) {
      o.select(current.previous === current.source ? null : current.source);
    } else if (destination === current.square) {
      if (current.previous) o.submit(current.previous, destination);
      else o.select(null);
    }
  }
  useEffect(() => {
    if (gesture.current && (!options.enabled || gesture.current.fen !== options.fen)) cancel();
    const value = visualRef.current;
    if (value && options.fen !== value.fen && options.fen !== value.nextFen) clear();
  }, [options.fen, options.enabled]);
  useEffect(() => {
    window.addEventListener('blur', cancel);
    window.addEventListener('resize', cancel);
    return () => {
      window.removeEventListener('blur', cancel);
      window.removeEventListener('resize', cancel);
      if (settling.current) clearTimeout(settling.current);
      const current = gesture.current;
      gesture.current = null;
      if (current) release(current.id);
    };
  }, []);
  return {
    visual,
    ghost,
    over,
    cancel,
    ignoreClickUntil,
    handlers: {
      onPointerDown: down,
      onPointerMove: move,
      onPointerUp: up,
      onPointerCancel: cancel,
      onLostPointerCapture: () => {
        if (gesture.current) cancel();
      },
    },
  };
}
