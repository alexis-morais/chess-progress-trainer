import type { Move } from 'chess.js';
import { useEffect, useRef } from 'react';
import { frenchSan } from '../data/openings';
import { moveNumber } from './game';
import { categoryInfo, type ReviewedMove } from './types';

export function MoveHistory({
  moves,
  selected,
  onSelect,
  reviews = [],
}: {
  moves: Move[];
  selected?: number;
  onSelect?: (ply: number) => void;
  reviews?: ReviewedMove[];
}) {
  const history = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!onSelect && history.current) history.current.scrollTop = history.current.scrollHeight;
  }, [moves.length, onSelect]);
  return (
    <div ref={history} className="computer-history" aria-label="Historique des coups">
      {!moves.length && <p>Aucun coup pour le moment.</p>}
      {Array.from({ length: Math.ceil(moves.length / 2) }, (_, row) => (
        <div className="history-row" key={row}>
          <span>{row + 1}.</span>
          {moves.slice(row * 2, row * 2 + 2).map((move, col) => {
            const ply = row * 2 + col + 1,
              review = reviews.find((item) => item.ply === ply);
            const content = (
              <>
                <span>{frenchSan(move.san)}</span>
                {review && (
                  <span
                    className={`category-symbol ${review.category}`}
                    aria-label={categoryInfo[review.category].name}
                  >
                    {categoryInfo[review.category].symbol}
                  </span>
                )}
              </>
            );
            return onSelect ? (
              <button
                className={selected === ply ? 'selected' : ''}
                key={ply}
                aria-current={selected === ply ? 'step' : undefined}
                aria-label={`Afficher ${moveNumber(ply)} ${frenchSan(move.san)}${review ? ` — ${categoryInfo[review.category].name}` : ''}`}
                onClick={() => onSelect(ply)}
              >
                {content}
              </button>
            ) : (
              <span key={ply}>{content}</span>
            );
          })}
        </div>
      ))}
    </div>
  );
}
