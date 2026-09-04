import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { BoardArrow } from './InteractiveBoard';
import type { Orientation } from './geometry';

type Size = { width: number; height: number };
export type LabelRect = { left: number; top: number; right: number; bottom: number };
export type LabelPlacement = {
  x: number;
  y: number;
  rect: LabelRect;
  candidate: number;
};

const EDGE_GAP = 5;
const LABEL_GAP = 6;
// Natural position first, then longitudinal and perpendicular alternatives.
const candidateOffsets = [
  [0.6, 0],
  [0.46, 0],
  [0.74, 0],
  [0.6, 0.78],
  [0.6, -0.78],
  [0.45, 0.9],
  [0.45, -0.9],
  [0.75, 0.9],
  [0.75, -0.9],
  [0.3, 0],
  [0.88, 0],
  [0.34, 1.25],
  [0.34, -1.25],
  [0.82, 1.25],
  [0.82, -1.25],
] as const;

function squareCenter(square: string, orientation: Orientation, boardSize: number) {
  const cell = boardSize / 8;
  const file = square.charCodeAt(0) - 97;
  const rank = Number(square[1]) - 1;
  return {
    x: (orientation === 'white' ? file + 0.5 : 7.5 - file) * cell,
    y: (orientation === 'white' ? 7.5 - rank : rank + 0.5) * cell,
  };
}

function intersectionArea(a: LabelRect, b: LabelRect, gap = 0) {
  const width = Math.max(0, Math.min(a.right, b.right + gap) - Math.max(a.left, b.left - gap));
  const height = Math.max(0, Math.min(a.bottom, b.bottom + gap) - Math.max(a.top, b.top - gap));
  return width * height;
}

function labelRect(x: number, y: number, size: Size): LabelRect {
  return {
    left: x - size.width / 2,
    top: y - size.height / 2,
    right: x + size.width / 2,
    bottom: y + size.height / 2,
  };
}

function occupiedRects(squares: string[], orientation: Orientation, boardSize: number) {
  const cell = boardSize / 8;
  return squares.map((square) => {
    const center = squareCenter(square, orientation, boardSize);
    return labelRect(center.x, center.y, { width: cell * 0.78, height: cell * 0.78 });
  });
}

/**
 * Places labels in recommendation order. Earlier ranks keep priority while following labels
 * explore longitudinal and perpendicular alternatives before accepting an overlap.
 */
export function placeRecommendationLabels(
  arrows: Pick<BoardArrow, 'from' | 'to' | 'rank'>[],
  orientation: Orientation,
  boardSize: number,
  sizes: Size[],
  occupiedSquares: string[] = [],
): LabelPlacement[] {
  const result: LabelPlacement[] = new Array(arrows.length);
  const placed: LabelRect[] = [];
  const busy = occupiedRects(occupiedSquares, orientation, boardSize);
  const order = arrows
    .map((arrow, index) => ({ arrow, index }))
    .sort(
      (left, right) => (left.arrow.rank ?? left.index + 1) - (right.arrow.rank ?? right.index + 1),
    );

  for (const { arrow, index } of order) {
    const from = squareCenter(arrow.from, orientation, boardSize);
    const to = squareCenter(arrow.to, orientation, boardSize);
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.max(boardSize / 8, Math.hypot(dx, dy));
    const normal = { x: -dy / length, y: dx / length };
    const size = sizes[index] ?? { width: 76, height: 34 };
    const cell = boardSize / 8;
    let best: { placement: LabelPlacement; score: number } | null = null;

    candidateOffsets.forEach(([along, across], candidate) => {
      const naturalX = from.x + dx * along + normal.x * across * cell;
      const naturalY = from.y + dy * along + normal.y * across * cell;
      const x = Math.min(
        boardSize - size.width / 2 - EDGE_GAP,
        Math.max(size.width / 2 + EDGE_GAP, naturalX),
      );
      const y = Math.min(
        boardSize - size.height / 2 - EDGE_GAP,
        Math.max(size.height / 2 + EDGE_GAP, naturalY),
      );
      const rect = labelRect(x, y, size);
      const collisions = placed.filter((other) => intersectionArea(rect, other, LABEL_GAP) > 0);
      const overlap = collisions.reduce(
        (total, other) => total + intersectionArea(rect, other, LABEL_GAP),
        0,
      );
      const busyArea = busy.reduce((total, square) => total + intersectionArea(rect, square), 0);
      const clampDistance = Math.abs(x - naturalX) + Math.abs(y - naturalY);
      // A collision always costs more than every aesthetic preference combined.
      const score =
        collisions.length * 1_000_000 +
        overlap * 1_000 +
        busyArea * 0.04 +
        candidate * 18 +
        clampDistance;
      const placement = { x, y, rect, candidate };
      if (!best || score < best.score) best = { placement, score };
    });
    result[index] = best!.placement;
    placed.push(best!.placement.rect);
  }
  return result;
}

function sameLayout(left: LabelPlacement[], right: LabelPlacement[]) {
  return (
    left.length === right.length &&
    left.every(
      (placement, index) =>
        Math.abs(placement.x - right[index].x) < 0.1 &&
        Math.abs(placement.y - right[index].y) < 0.1,
    )
  );
}

export function RecommendationLabels({
  arrows,
  orientation,
  occupiedSquares,
}: {
  arrows: BoardArrow[];
  orientation: Orientation;
  occupiedSquares: string[];
}) {
  const container = useRef<HTMLDivElement>(null);
  const nodes = useRef<(HTMLSpanElement | null)[]>([]);
  const signature = useMemo(
    () =>
      `${orientation}|${arrows
        .map((arrow) =>
          [arrow.from, arrow.to, arrow.rank, arrow.badge, arrow.moveLabel, arrow.evaluation].join(
            ':',
          ),
        )
        .join('|')}`,
    [arrows, orientation],
  );
  const [layout, setLayout] = useState<{ signature: string; placements: LabelPlacement[] }>({
    signature: '',
    placements: [],
  });

  useLayoutEffect(() => {
    const update = () => {
      const box = container.current?.getBoundingClientRect();
      let boardSize = Math.min(box?.width ?? 0, box?.height ?? 0);
      // jsdom has no real layout; the browser always supplies the measured board size.
      if (boardSize < 160) boardSize = 640;
      const sizes = arrows.map((_, index) => {
        const rect = nodes.current[index]?.getBoundingClientRect();
        return {
          width: rect && rect.width > 0 ? rect.width : 76,
          height: rect && rect.height > 0 ? rect.height : 34,
        };
      });
      const placements = placeRecommendationLabels(
        arrows,
        orientation,
        boardSize,
        sizes,
        occupiedSquares,
      );
      setLayout((current) =>
        current.signature === signature && sameLayout(current.placements, placements)
          ? current
          : { signature, placements },
      );
    };
    update();
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => update());
    if (container.current) observer?.observe(container.current);
    window.addEventListener('resize', update);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [arrows, occupiedSquares, orientation, signature]);

  return (
    <div
      ref={container}
      className="board-recommendation-labels"
      style={{ pointerEvents: 'none' }}
      aria-hidden="true"
    >
      {arrows.map((entry, index) => {
        if (!entry.badge && !entry.evaluation && !entry.moveLabel) return null;
        const placement = layout.signature === signature ? layout.placements[index] : null;
        return (
          <span
            ref={(node) => {
              nodes.current[index] = node;
            }}
            key={`${entry.from}-${entry.to}-${entry.rank ?? index}`}
            className={`board-recommendation-label rank-${entry.rank ?? index + 1}`}
            style={{
              left: placement ? `${placement.x}px` : '50%',
              top: placement ? `${placement.y}px` : '50%',
              visibility: placement ? 'visible' : 'hidden',
            }}
            data-placement={placement?.candidate}
            data-testid="board-recommendation-label"
          >
            {entry.badge && <strong>{entry.badge}</strong>}
            <span>
              {entry.moveLabel && <b>{entry.moveLabel}</b>}
              {entry.evaluation}
            </span>
          </span>
        );
      })}
    </div>
  );
}
