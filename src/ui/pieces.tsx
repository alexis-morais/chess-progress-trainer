import type { PieceRenderObject } from 'react-chessboard';

export const boardColors = { light: '#eee7d6', dark: '#789586' };
export const pieceUrl = (piece: string) =>
  `${import.meta.env.BASE_URL}pieces/cburnett/${piece}.svg`;
// Original, unmodified SVGs by Colin M. L. Burnett. See public/pieces/README.md.
export const chessPieces: PieceRenderObject = Object.fromEntries(
  ['wK', 'wQ', 'wR', 'wB', 'wN', 'wP', 'bK', 'bQ', 'bR', 'bB', 'bN', 'bP'].map((piece) => [
    piece,
    () => <img className="chess-piece" src={pieceUrl(piece)} alt="" draggable={false} />,
  ]),
);
