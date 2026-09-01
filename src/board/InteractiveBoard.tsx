import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { Chess, type Move, type Square } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { boardColors, pieceUrl } from '../ui/pieces';
import { animatedMoves, legalDestinations, type Orientation } from './geometry';
import { useBoardPointer, SNAP_MS } from './useBoardPointer';
import { ChoiceDialog } from './ChoiceDialog';
import './board.css';

const names = { p: 'pion', n: 'cavalier', b: 'fou', r: 'tour', q: 'dame', k: 'roi' };
export type BoardMark = { square: string; good: boolean; symbol: string; id?: number };
type Props = {
  id: string;
  label: string;
  className?: string;
  fen: string;
  player: 'w' | 'b';
  enabled?: boolean;
  last?: Pick<Move, 'from' | 'to'>;
  arrow?: { from: string; to: string; color?: string; kind?: string };
  mark?: BoardMark | null;
  badgeTestId: string;
  onMove?: (from: string, to: string, promotion?: string) => boolean;
};

export function InteractiveBoard({
  id,
  label,
  className = '',
  fen,
  player,
  enabled = false,
  last,
  arrow,
  mark,
  badgeTestId,
  onMove,
}: Props) {
  const root = useRef<HTMLDivElement>(null);
  const game = useMemo(() => new Chess(fen), [fen]);
  const orientation: Orientation = player === 'w' ? 'white' : 'black';
  const [selection, setSelection] = useState<{ square: Square; fen: string } | null>(null);
  const [promotion, setPromotion] = useState<{
    from: Square;
    to: Square;
    fen: string;
    choices: string[];
  } | null>(null);
  const pending = promotion?.fen === fen && enabled ? promotion : null;
  const active = enabled && game.turn() === player && !pending;
  const selected = active && selection?.fen === fen ? selection.square : null;
  const destinations = useMemo(
    () => (selected ? legalDestinations(game, selected) : new Map<Square, 'move' | 'capture'>()),
    [game, selected],
  );
  function select(square: Square | null) {
    setSelection(square ? { square, fen } : null);
  }
  function submit(from: Square, to: Square) {
    select(null);
    if (!active || from === to || game.get(from)?.color !== player) return false;
    const choices = game
      .moves({ square: from, verbose: true })
      .filter((move) => move.to === to && move.promotion)
      .map((move) => move.promotion!);
    if (choices.length) {
      setPromotion({ from, to, fen, choices });
      return false;
    }
    // The exercise/party still decides acceptance. Legal markers never choose the expected move.
    return onMove?.(from, to) ?? false;
  }
  const pointer = useBoardPointer({
    root,
    game,
    fen,
    player,
    orientation,
    enabled: active,
    selected,
    select,
    submit,
  });
  const settling = pointer.visual?.phase === 'settling';
  const interactive = active && !settling;
  function click(square: Square) {
    if (!interactive) return;
    if (square === selected) select(null);
    else if (game.get(square)?.color === player) select(square);
    else if (selected) submit(selected, square);
    else select(null);
  }
  function key(event: KeyboardEvent<HTMLDivElement>, square: Square) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      click(square);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      pointer.cancel();
    } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault();
      const squares = Array.from(
        root.current?.querySelectorAll<HTMLElement>('[data-key-square]') ?? [],
      );
      const delta = { ArrowUp: -8, ArrowDown: 8, ArrowLeft: -1, ArrowRight: 1 }[event.key]!;
      squares[squares.indexOf(event.currentTarget) + delta]?.focus();
    }
  }
  const previousFen = useRef(fen);
  const previousPlayer = useRef(player);
  useLayoutEffect(() => {
    const before = previousFen.current;
    previousFen.current = fen;
    const sameOrientation = previousPlayer.current === player;
    previousPlayer.current = player;
    const node = root.current;
    if (
      !node ||
      !sameOrientation ||
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    )
      return;
    const animations: Animation[] = [];
    for (const move of animatedMoves(before, fen, last)) {
      if (pointer.visual?.hidden === move.to) continue;
      const element = node.querySelector<HTMLElement>(`[data-piece-square="${move.to}"]`);
      if (!element?.animate) continue;
      const direction = player === 'w' ? 1 : -1;
      const x = (move.from.charCodeAt(0) - move.to.charCodeAt(0)) * direction * 100;
      const y = (Number(move.to[1]) - Number(move.from[1])) * direction * 100;
      animations.push(
        element.animate(
          [{ transform: `translate(${x}%,${y}%)` }, { transform: 'translate(0,0)' }],
          { duration: 170, easing: 'cubic-bezier(.2,.7,.3,1)' },
        ),
      );
    }
    if (animations.length) {
      node.dataset.motion = 'true';
      Promise.allSettled(animations.map((animation) => animation.finished)).then(() => {
        if (previousFen.current === fen) delete node.dataset.motion;
      });
    }
    return () => {
      animations.forEach((animation) => animation.cancel());
      delete node.dataset.motion;
    };
  }, [fen, player, last?.from, last?.to]);
  useEffect(() => {
    if (!active) setSelection(null);
    if (promotion && promotion.fen !== fen) setPromotion(null);
  }, [active, fen]);

  return (
    <>
      <div
        ref={root}
        className={`training-board interactive-board ${className}`}
        data-orientation={orientation}
        data-arrow-kind={arrow?.kind}
        data-dragging={pointer.visual?.phase === 'dragging' || undefined}
        data-settling={settling || undefined}
        aria-label={label}
        {...pointer.handlers}
        onTouchStartCapture={(event) => event.stopPropagation()}
        onTouchEndCapture={(event) => event.stopPropagation()}
        onContextMenu={(event) => event.preventDefault()}
        onClickCapture={(event) => {
          event.stopPropagation();
          if (event.detail > 0 && performance.now() < pointer.ignoreClickUntil.current) return;
          const square = (event.target as Element).closest<HTMLElement>('[data-key-square]')
            ?.dataset.keySquare as Square | undefined;
          if (square) click(square);
        }}
      >
        <div data-board-surface>
          <Chessboard
            options={{
              id,
              position: fen,
              boardOrientation: orientation,
              allowDragging: false,
              showAnimations: false,
              allowDrawingArrows: false,
              allowDragOffBoard: false,
              allowAutoScroll: false,
              darkSquareStyle: { backgroundColor: boardColors.dark },
              lightSquareStyle: { backgroundColor: boardColors.light },
              darkSquareNotationStyle: { color: '#10291e', fontWeight: 600, fontSize: 12 },
              lightSquareNotationStyle: { color: '#344a3c', fontWeight: 600, fontSize: 12 },
              arrows: arrow
                ? [
                    {
                      startSquare: arrow.from,
                      endSquare: arrow.to,
                      color: arrow.color ?? 'rgba(247,183,67,.94)',
                    },
                  ]
                : [],
              clearArrowsOnClick: false,
              squareRenderer: ({ square }) => {
                const sq = square as Square;
                const piece = game.get(sq);
                const style: CSSProperties = {};
                if (last?.from === sq) style.backgroundColor = '#bfcc77';
                if (last?.to === sq) style.backgroundColor = '#cdd989';
                if (mark?.square === sq) {
                  style.backgroundColor = mark.good ? '#a8d8a4' : '#e5a4a0';
                  style.boxShadow = `inset 0 0 0 3px ${mark.good ? '#39804d' : '#b33b44'}`;
                }
                if (selected === sq) {
                  style.backgroundColor = '#afc3a4';
                  style.boxShadow = 'inset 0 0 0 2px #efe4b0';
                }
                if (pointer.over === sq) {
                  style.backgroundColor = '#bfd0b1';
                  style.boxShadow = 'inset 0 0 0 2px #34594b, inset 0 0 0 4px #fcf5dc';
                }
                const destination = destinations.get(sq);
                const pieceName = piece
                  ? `${names[piece.type]} ${piece.color === 'w' ? 'blanc' : 'noir'}${['q', 'r'].includes(piece.type) ? (piece.color === 'w' ? 'he' : 'e') : ''}`
                  : 'case vide';
                return (
                  <div
                    className="accessible-square"
                    style={style}
                    data-key-square={sq}
                    data-drag-source={
                      (pointer.visual?.phase === 'dragging' && pointer.visual.source === sq) ||
                      undefined
                    }
                    data-drag-target={pointer.over === sq || undefined}
                    data-draggable={(interactive && piece?.color === player) || undefined}
                    role="button"
                    tabIndex={interactive ? 0 : -1}
                    aria-disabled={!interactive}
                    aria-pressed={selected === sq}
                    aria-label={`${sq}, ${pieceName}`}
                    aria-description={
                      destination === 'capture'
                        ? 'Capture légale'
                        : destination === 'move'
                          ? 'Déplacement légal'
                          : undefined
                    }
                    onKeyDown={(event) => key(event, sq)}
                  >
                    <div className="piece-content" aria-hidden="true">
                      {piece && (
                        <div
                          data-piece={piece.color + piece.type.toUpperCase()}
                          data-piece-square={sq}
                          className="board-piece"
                          style={{ opacity: pointer.visual?.hidden === sq ? 0 : 1 }}
                        >
                          <img
                            className="chess-piece"
                            src={pieceUrl(piece.color + piece.type.toUpperCase())}
                            alt=""
                            draggable={false}
                          />
                        </div>
                      )}
                    </div>
                    {destination && (
                      <span
                        className={`legal-destination ${destination}`}
                        data-testid="legal-move"
                        data-square={sq}
                        data-kind={destination}
                        aria-hidden="true"
                      />
                    )}
                    {mark?.square === sq && (
                      <span
                        key={mark.id}
                        className={`move-badge ${mark.good ? 'correct' : 'incorrect'}`}
                        data-testid={badgeTestId}
                        data-square={sq}
                        aria-hidden="true"
                      >
                        {mark.symbol}
                      </span>
                    )}
                  </div>
                );
              },
            }}
          />
        </div>
      </div>
      {pointer.visual &&
        createPortal(
          <div className="drag-layer" aria-hidden="true">
            <div
              ref={pointer.ghost}
              className="drag-piece"
              data-testid="drag-piece"
              data-pointer-type={pointer.visual.type}
              data-phase={pointer.visual.phase}
              style={{
                width: pointer.visual.size,
                height: pointer.visual.size,
                transform: pointer.visual.transform,
                transition: settling ? `transform ${SNAP_MS}ms cubic-bezier(.2,.7,.3,1)` : 'none',
              }}
            >
              {pointer.visual.type === 'touch' && (
                <span className="drag-halo" data-testid="drag-halo" />
              )}
              <img
                src={pieceUrl(pointer.visual.piece)}
                className="chess-piece"
                alt=""
                draggable={false}
              />
            </div>
          </div>,
          document.body,
        )}
      {pending && (
        <ChoiceDialog title="Choisis la promotion de ton pion" onCancel={() => setPromotion(null)}>
          <div className="promotion-options">
            {(['q', 'r', 'b', 'n'] as const)
              .filter((piece) => pending.choices.includes(piece))
              .map((piece) => (
                <button
                  key={piece}
                  className="button secondary"
                  onClick={() => {
                    setPromotion(null);
                    onMove?.(pending.from, pending.to, piece);
                  }}
                >
                  {{ q: 'Dame', r: 'Tour', b: 'Fou', n: 'Cavalier' }[piece]}
                </button>
              ))}
          </div>
        </ChoiceDialog>
      )}
    </>
  );
}
