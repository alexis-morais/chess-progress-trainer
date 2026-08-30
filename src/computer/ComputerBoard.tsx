import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';
import { Chess, type Move, type Square } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import type { Side } from '../data/openings';
import { legalPromotions } from './game';

const names: Record<string, string> = {
  p: 'pion',
  n: 'cavalier',
  b: 'fou',
  r: 'tour',
  q: 'dame',
  k: 'roi',
};
export type BoardMark = { square: string; good: boolean; symbol: string };
type Props = {
  fen: string;
  player: Side;
  enabled?: boolean;
  last?: Pick<Move, 'from' | 'to'>;
  arrow?: { from: string; to: string };
  mark?: BoardMark | null;
  onMove?: (from: string, to: string, promotion?: string) => boolean;
};

export function ComputerBoard({ fen, player, enabled = false, last, arrow, mark, onMove }: Props) {
  const game = useMemo(() => new Chess(fen), [fen]);
  const root = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<{ square: string; fen: string } | null>(null);
  const [promotion, setPromotion] = useState<{
    from: string;
    to: string;
    fen: string;
    choices: string[];
  } | null>(null);
  const selected = selection?.fen === fen ? selection.square : null;
  const pending = promotion?.fen === fen ? promotion : null;
  const active = enabled && !pending;
  useEffect(() => {
    root.current?.querySelectorAll<HTMLElement>('.piece-content [tabindex]').forEach((piece) => {
      piece.tabIndex = -1;
    });
  }, [fen, active]);
  const styles: Record<string, CSSProperties> = {};
  if (last) {
    styles[last.from] = { backgroundColor: '#bfcc77' };
    styles[last.to] = { backgroundColor: '#cdd989' };
  }
  if (selected)
    styles[selected] = { boxShadow: 'inset 0 0 0 4px #f4df89', backgroundColor: '#91a67d' };
  if (mark)
    styles[mark.square] = {
      backgroundColor: mark.good ? '#a8d8a4' : '#e5a4a0',
      boxShadow: `inset 0 0 0 3px ${mark.good ? '#39804d' : '#b33b44'}`,
    };
  function submit(from: string, to: string) {
    setSelection(null);
    if (!active || from === to || game.get(from as Square)?.color !== player) return false;
    const choices = legalPromotions(game, from, to);
    if (choices.length) {
      setPromotion({ from, to, fen, choices });
      return false;
    }
    return onMove?.(from, to) ?? false;
  }
  function select(square: string) {
    if (!active) return;
    if (selected === square) setSelection(null);
    else if (selected && game.get(square as Square)?.color !== player) submit(selected, square);
    else if (game.get(square as Square)?.color === player) setSelection({ square, fen });
  }
  function key(event: KeyboardEvent<HTMLDivElement>, square: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      select(square);
    } else if (event.key === 'Escape') setSelection(null);
    else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault();
      const squares = Array.from(
        root.current?.querySelectorAll<HTMLElement>('[data-key-square]') ?? [],
      );
      const delta = { ArrowUp: -8, ArrowDown: 8, ArrowLeft: -1, ArrowRight: 1 }[event.key]!;
      squares[squares.indexOf(event.currentTarget) + delta]?.focus();
    }
  }
  return (
    <>
      <div
        ref={root}
        className="training-board computer-board"
        data-orientation={player === 'w' ? 'white' : 'black'}
        aria-label={`Échiquier de partie libre, ${player === 'w' ? 'Blancs' : 'Noirs'} en bas`}
      >
        <Chessboard
          options={{
            id: 'computer-board',
            position: fen,
            boardOrientation: player === 'w' ? 'white' : 'black',
            allowDragging: active,
            allowDrawingArrows: false,
            allowDragOffBoard: false,
            allowAutoScroll: false,
            animationDurationInMs: 200,
            darkSquareStyle: { backgroundColor: '#718676' },
            lightSquareStyle: { backgroundColor: '#e2e7d5' },
            squareStyles: styles,
            darkSquareNotationStyle: { color: '#e8eedb', fontWeight: 600, fontSize: 12 },
            lightSquareNotationStyle: { color: '#536450', fontWeight: 600, fontSize: 12 },
            canDragPiece: ({ piece }) => active && piece.pieceType[0] === player,
            onPieceDrop: ({ sourceSquare, targetSquare }) =>
              targetSquare ? submit(sourceSquare, targetSquare) : false,
            onSquareClick: ({ square }) => select(square),
            arrows: arrow
              ? [{ startSquare: arrow.from, endSquare: arrow.to, color: 'rgba(247,183,67,.94)' }]
              : [],
            clearArrowsOnClick: false,
            squareRenderer: ({ square, children }) => {
              const piece = game.get(square as Square);
              return (
                <div
                  className="accessible-square"
                  style={styles[square]}
                  data-key-square={square}
                  role="button"
                  tabIndex={active ? 0 : -1}
                  aria-disabled={!active}
                  aria-pressed={selected === square}
                  aria-label={`${square}, ${piece ? `${names[piece.type]} ${piece.color === 'w' ? 'blanc' : 'noir'}${['q', 'r'].includes(piece.type) ? (piece.color === 'w' ? 'he' : 'e') : ''}` : 'case vide'}`}
                  onKeyDown={(event) => key(event, square)}
                >
                  <div className="piece-content" aria-hidden="true">
                    {children}
                  </div>
                  {mark?.square === square && (
                    <span
                      className={`move-badge ${mark.good ? 'correct' : 'incorrect'}`}
                      data-testid="computer-move-badge"
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

export function ChoiceDialog({
  title,
  children,
  onCancel,
}: {
  title: string;
  children: React.ReactNode;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const cancelButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    cancelButton.current?.focus();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="completion-dialog computer-confirm"
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      <h2>{title}</h2>
      {children}
      <button ref={cancelButton} className="button secondary" onClick={onCancel}>
        Annuler
      </button>
    </dialog>
  );
}
