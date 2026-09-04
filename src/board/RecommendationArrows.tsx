import { useId } from 'react';
import type { BoardArrow } from './InteractiveBoard';
import type { Orientation } from './geometry';

export type ArrowPoint = { x: number; y: number };
export type RecommendationRoute = {
  start: ArrowPoint;
  control: ArrowPoint;
  end: ArrowPoint;
  offset: number;
  curved: boolean;
  rank: number;
};

const VIEWBOX = 800;
const CELL = VIEWBOX / 8;
const NEAR_DISTANCE = 34;

const point = (square: string, orientation: Orientation): ArrowPoint => {
  const file = square.charCodeAt(0) - 97;
  const rank = Number(square[1]) - 1;
  return {
    x: (orientation === 'white' ? file + 0.5 : 7.5 - file) * CELL,
    y: (orientation === 'white' ? 7.5 - rank : rank + 0.5) * CELL,
  };
};

const distance = (left: ArrowPoint, right: ArrowPoint) =>
  Math.hypot(left.x - right.x, left.y - right.y);

function distanceToSegment(target: ArrowPoint, start: ArrowPoint, end: ArrowPoint) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  if (!lengthSquared) return distance(target, start);
  const ratio = Math.max(
    0,
    Math.min(1, ((target.x - start.x) * dx + (target.y - start.y) * dy) / lengthSquared),
  );
  return distance(target, { x: start.x + ratio * dx, y: start.y + ratio * dy });
}

function cross(a: ArrowPoint, b: ArrowPoint, c: ArrowPoint) {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function onSegment(a: ArrowPoint, b: ArrowPoint, target: ArrowPoint) {
  const epsilon = 0.001;
  return (
    Math.abs(cross(a, b, target)) <= epsilon &&
    target.x >= Math.min(a.x, b.x) - epsilon &&
    target.x <= Math.max(a.x, b.x) + epsilon &&
    target.y >= Math.min(a.y, b.y) - epsilon &&
    target.y <= Math.max(a.y, b.y) + epsilon
  );
}

function segmentsIntersect(a: ArrowPoint, b: ArrowPoint, c: ArrowPoint, d: ArrowPoint) {
  const abC = cross(a, b, c);
  const abD = cross(a, b, d);
  const cdA = cross(c, d, a);
  const cdB = cross(c, d, b);
  const opposite = (left: number, right: number) =>
    (left > 0 && right < 0) || (left < 0 && right > 0);
  if (opposite(abC, abD) && opposite(cdA, cdB)) return true;
  return onSegment(a, b, c) || onSegment(a, b, d) || onSegment(c, d, a) || onSegment(c, d, b);
}

export function arrowSegmentsConflict(
  first: Pick<BoardArrow, 'from' | 'to'>,
  second: Pick<BoardArrow, 'from' | 'to'>,
  boardOrientation: Orientation,
) {
  const a = point(first.from, boardOrientation);
  const b = point(first.to, boardOrientation);
  const c = point(second.from, boardOrientation);
  const d = point(second.to, boardOrientation);
  if (segmentsIntersect(a, b, c, d)) return true;
  return (
    Math.min(
      distanceToSegment(a, c, d),
      distanceToSegment(b, c, d),
      distanceToSegment(c, a, b),
      distanceToSegment(d, a, b),
    ) < NEAR_DISTANCE
  );
}

function routeFor(
  arrow: Pick<BoardArrow, 'from' | 'to' | 'rank'>,
  boardOrientation: Orientation,
  offset: number,
) {
  const from = point(arrow.from, boardOrientation);
  const to = point(arrow.to, boardOrientation);
  const length = Math.max(CELL, distance(from, to));
  const normal = { x: -(to.y - from.y) / length, y: (to.x - from.x) / length };
  const edgeOffset = offset * 0.32;
  return {
    start: { x: from.x + normal.x * edgeOffset, y: from.y + normal.y * edgeOffset },
    control: {
      x: (from.x + to.x) / 2 + normal.x * offset,
      y: (from.y + to.y) / 2 + normal.y * offset,
    },
    end: { x: to.x + normal.x * edgeOffset, y: to.y + normal.y * edgeOffset },
    offset,
    curved: offset !== 0,
    rank: arrow.rank ?? 1,
  } satisfies RecommendationRoute;
}

function samples(route: RecommendationRoute) {
  return Array.from({ length: 13 }, (_, index) => {
    const t = index / 12;
    const inverse = 1 - t;
    return {
      x:
        inverse * inverse * route.start.x + 2 * inverse * t * route.control.x + t * t * route.end.x,
      y:
        inverse * inverse * route.start.y + 2 * inverse * t * route.control.y + t * t * route.end.y,
    };
  });
}

function routeClearance(route: RecommendationRoute, previous: RecommendationRoute[]) {
  const current = samples(route);
  let minimum = Number.POSITIVE_INFINITY;
  for (const other of previous) {
    const comparison = samples(other);
    for (let index = 1; index < current.length - 1; index += 1)
      for (let otherIndex = 1; otherIndex < comparison.length - 1; otherIndex += 1)
        minimum = Math.min(minimum, distance(current[index], comparison[otherIndex]));
  }
  return minimum;
}

/** Later ranks curve only when their straight trajectory conflicts with a higher priority one. */
export function routeRecommendationArrows(
  arrows: Pick<BoardArrow, 'from' | 'to' | 'rank'>[],
  boardOrientation: Orientation,
): RecommendationRoute[] {
  const result = new Array<RecommendationRoute>(arrows.length);
  const placed: { arrow: (typeof arrows)[number]; route: RecommendationRoute }[] = [];
  const order = arrows
    .map((arrow, index) => ({ arrow, index }))
    .sort(
      (left, right) => (left.arrow.rank ?? left.index + 1) - (right.arrow.rank ?? right.index + 1),
    );

  for (const { arrow, index } of order) {
    const conflicts = placed.some((entry) =>
      arrowSegmentsConflict(arrow, entry.arrow, boardOrientation),
    );
    if (!conflicts) {
      const route = routeFor(arrow, boardOrientation, 0);
      result[index] = route;
      placed.push({ arrow, route });
      continue;
    }
    const rank = arrow.rank ?? index + 1;
    const candidates = rank === 2 ? [15, -15, 23, -23] : [-18, 18, -27, 27, -34, 34];
    const routes = candidates.map((offset) => routeFor(arrow, boardOrientation, offset));
    const route = routes.reduce((best, candidate) =>
      routeClearance(
        candidate,
        placed.map((entry) => entry.route),
      ) >
      routeClearance(
        best,
        placed.map((entry) => entry.route),
      )
        ? candidate
        : best,
    );
    result[index] = route;
    placed.push({ arrow, route });
  }
  return result;
}

const visuals = {
  1: { width: 8.5, opacity: 0.72, head: 31 },
  2: { width: 7, opacity: 0.56, head: 28 },
  3: { width: 5.8, opacity: 0.44, head: 25 },
} as const;

export function RecommendationArrows({
  arrows,
  boardOrientation,
}: {
  arrows: BoardArrow[];
  boardOrientation: Orientation;
}) {
  const instance = useId().replaceAll(':', '');
  const routes = routeRecommendationArrows(arrows, boardOrientation);
  return (
    <svg
      className="board-recommendation-arrows"
      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{ pointerEvents: 'none' }}
      data-testid="board-recommendation-arrows"
    >
      <defs>
        {arrows.map((arrow, index) => {
          const rank = (arrow.rank ?? index + 1) as 1 | 2 | 3;
          const visual = visuals[rank] ?? visuals[3];
          return (
            <marker
              id={`${instance}-arrow-${index}`}
              key={index}
              viewBox={`0 0 ${visual.head} ${visual.head}`}
              markerWidth={visual.head}
              markerHeight={visual.head}
              refX={visual.head - 1}
              refY={visual.head / 2}
              markerUnits="userSpaceOnUse"
              orient="auto"
            >
              <path
                d={`M 1 1 L ${visual.head - 1} ${visual.head / 2} L 1 ${visual.head - 1} L ${Math.round(visual.head * 0.24)} ${visual.head / 2} Z`}
                fill={arrow.color ?? '#247a54'}
                fillOpacity={visual.opacity + 0.08}
              />
            </marker>
          );
        })}
      </defs>
      {[...arrows.keys()]
        .sort((left, right) => (arrows[right].rank ?? right + 1) - (arrows[left].rank ?? left + 1))
        .map((index) => {
          const arrow = arrows[index];
          const route = routes[index];
          const rank = (arrow.rank ?? index + 1) as 1 | 2 | 3;
          const visual = visuals[rank] ?? visuals[3];
          return (
            <path
              key={`${arrow.from}-${arrow.to}-${rank}`}
              d={`M ${route.start.x} ${route.start.y} Q ${route.control.x} ${route.control.y} ${route.end.x} ${route.end.y}`}
              fill="none"
              stroke={arrow.color ?? '#247a54'}
              strokeWidth={visual.width}
              strokeOpacity={visual.opacity}
              strokeLinecap="round"
              strokeLinejoin="round"
              markerEnd={`url(#${instance}-arrow-${index})`}
              data-arrow-rank={rank}
              data-arrow-offset={route.offset}
            />
          );
        })}
    </svg>
  );
}
