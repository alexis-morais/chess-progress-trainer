import { memo } from 'react';
import { Chess } from 'chess.js';
import { boardColors, chessPieces } from '../ui/pieces';

// A static preview avoids mounting ten drag-and-drop controllers in the catalogue.
export const OpeningPreview = memo(function OpeningPreview({
  fen,
  black,
}: {
  fen: string;
  black: boolean;
}) {
  const squares = new Chess(fen).board().flat();
  if (black) squares.reverse();
  return (
    <div className="mini-board preview-grid" aria-hidden="true">
      {squares.map((piece, i) => {
        const Piece = piece ? chessPieces[`${piece.color}${piece.type.toUpperCase()}`] : null;
        return (
          <span
            key={i}
            style={{
              backgroundColor:
                (Math.floor(i / 8) + (i % 8)) % 2 ? boardColors.dark : boardColors.light,
            }}
          >
            {Piece && <Piece />}
          </span>
        );
      })}
    </div>
  );
});
