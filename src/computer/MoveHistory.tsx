import type { Move } from 'chess.js';
import { useEffect, useRef } from 'react';
import { frenchSan } from '../data/openings';
import { moveNumber } from './game';
import { categoryInfo, type ReviewedMove } from './types';
import { ClassificationMedallion } from '../ui/ClassificationMedallion';

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
  // The strip brings the selected move into view by scrolling itself only: using
  // scrollIntoView here would also drag the whole page towards the history.
  useEffect(() => {
    const container = history.current;
    const target = container?.querySelector<HTMLElement>('button.selected');
    if (!onSelect || !container || !target) return;
    const left = target.offsetLeft - container.clientWidth / 2 + target.offsetWidth / 2;
    const top = target.offsetTop - container.clientHeight / 2 + target.offsetHeight / 2;
    if (container.scrollWidth > container.clientWidth) container.scrollLeft = Math.max(0, left);
    if (container.scrollHeight > container.clientHeight) container.scrollTop = Math.max(0, top);
  }, [onSelect, selected]);
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
                  <ClassificationMedallion
                    category={review.category}
                    className="history-medallion"
                  />
                )}
              </>
            );
            return onSelect ? (
              <button
                className={selected === ply ? 'selected' : ''}
                key={ply}
                data-ply={ply}
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
