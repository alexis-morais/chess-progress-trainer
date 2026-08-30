import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess, type Square } from 'chess.js';
import type { CompiledLesson, TrainerState } from '../trainer/model';

type Props = {
  lesson: CompiledLesson;
  state: TrainerState;
  fen: string;
  enabled: boolean;
  onMove: (from: string, to: string, promotion?: string) => boolean;
};
const pieceNames: Record<string, string> = {
  p: 'pion',
  n: 'cavalier',
  b: 'fou',
  r: 'tour',
  q: 'dame',
  k: 'roi',
};

export function TrainingBoard({ lesson, state, fen, enabled, onMove }: Props) {
  const boardRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<{ square: string; fen: string } | null>(null);
  const selected = selection?.fen === fen ? selection.square : null;
  const game = new Chess(fen);
  const expected = lesson.moves[state.ply];
  const last = lesson.moves[state.ply - 1];
  useEffect(() => {
    // The squares provide French keyboard controls; avoid duplicate DnD tab stops.
    boardRef.current
      ?.querySelectorAll<HTMLElement>('.piece-content [tabindex]')
      .forEach((piece) => {
        piece.tabIndex = -1;
      });
  }, [fen, enabled]);
  const squareStyles: Record<string, CSSProperties> = {};
  if (last) {
    squareStyles[last.from] = { backgroundColor: '#bfcc77' };
    squareStyles[last.to] = { backgroundColor: '#cdd989' };
  }
  if (selected)
    squareStyles[selected] = { boxShadow: 'inset 0 0 0 4px #f4df89', backgroundColor: '#91a67d' };

  function submit(from: string, to: string) {
    setSelection(null);
    if (!enabled || from === to) return false;
    // These short lessons contain no promotion. This also supports a future scripted promotion.
    const promotion =
      expected?.from === from && expected.to === to ? expected.promotion : undefined;
    return onMove(from, to, promotion);
  }

  function clickSquare(square: string) {
    if (!enabled) return;
    if (selected === square) {
      setSelection(null);
      return;
    }
    const piece = game.get(square as Square);
    if (selected && piece?.color !== lesson.opening.side) {
      submit(selected, square);
      return;
    }
    if (piece?.color === lesson.opening.side) setSelection({ square, fen });
  }

  function keySquare(event: KeyboardEvent<HTMLDivElement>, square: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      clickSquare(square);
    } else if (event.key === 'Escape') setSelection(null);
    else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault();
      const squares = Array.from(
        event.currentTarget
          .closest('.training-board')!
          .querySelectorAll<HTMLElement>('[data-key-square]'),
      );
      const index = squares.indexOf(event.currentTarget);
      const delta = { ArrowUp: -8, ArrowDown: 8, ArrowLeft: -1, ArrowRight: 1 }[event.key]!;
      squares[index + delta]?.focus();
    }
  }

  return (
    <div
      ref={boardRef}
      className="training-board"
      data-orientation={lesson.orientation}
      aria-label={`Échiquier, ${lesson.orientation === 'white' ? 'Blancs' : 'Noirs'} en bas`}
    >
      <Chessboard
        options={{
          id: 'training-board',
          position: fen,
          boardOrientation: lesson.orientation,
          allowDragging: enabled,
          allowDrawingArrows: false,
          allowDragOffBoard: false,
          allowAutoScroll: false,
          animationDurationInMs: 220,
          darkSquareStyle: { backgroundColor: '#718676' },
          lightSquareStyle: { backgroundColor: '#e2e7d5' },
          squareStyles,
          darkSquareNotationStyle: { color: '#e8eedb', fontWeight: 600, fontSize: 12 },
          lightSquareNotationStyle: { color: '#536450', fontWeight: 600, fontSize: 12 },
          canDragPiece: ({ piece }) => enabled && piece.pieceType[0] === lesson.opening.side,
          onPieceDrop: ({ sourceSquare, targetSquare }) =>
            targetSquare ? submit(sourceSquare, targetSquare) : false,
          onSquareClick: ({ square }) => clickSquare(square),
          arrows:
            state.hintVisible && expected
              ? [
                  {
                    startSquare: expected.from,
                    endSquare: expected.to,
                    color: 'rgba(247, 183, 67, 0.94)',
                  },
                ]
              : [],
          clearArrowsOnClick: false,
          squareRenderer: ({ square, children }) => {
            const piece = game.get(square as Square);
            const label = `${square}${piece ? `, ${pieceNames[piece.type]} ${piece.color === 'w' ? 'blanc' : 'noir'}${piece.type === 'r' || piece.type === 'q' ? (piece.color === 'w' ? 'he' : 'e') : ''}` : ', case vide'}`;
            return (
              <div
                className="accessible-square"
                style={squareStyles[square]}
                data-key-square={square}
                role="button"
                tabIndex={enabled ? 0 : -1}
                aria-label={label}
                aria-disabled={!enabled}
                aria-pressed={selected === square}
                onKeyDown={(event) => keySquare(event, square)}
              >
                <div className="piece-content" aria-hidden="true">
                  {children}
                </div>
              </div>
            );
          },
        }}
      />
    </div>
  );
}
