import { describe, expect, it } from 'vitest';
import { arrowSegmentsConflict, routeRecommendationArrows } from '../board/RecommendationArrows';
import type { BoardArrow } from '../board/InteractiveBoard';

const initialRecommendations: BoardArrow[] = [
  { from: 'e2', to: 'e4', rank: 1 },
  { from: 'g1', to: 'f3', rank: 2 },
  { from: 'e2', to: 'e3', rank: 3 },
];

describe('Routage des flèches de recommandations', () => {
  it('détecte une intersection et un recouvrement de trajectoire', () => {
    expect(arrowSegmentsConflict({ from: 'a1', to: 'h8' }, { from: 'a8', to: 'h1' }, 'white')).toBe(
      true,
    );
    expect(arrowSegmentsConflict({ from: 'e2', to: 'e4' }, { from: 'e2', to: 'e3' }, 'white')).toBe(
      true,
    );
  });

  it('conserve droites deux trajectoires suffisamment éloignées', () => {
    expect(arrowSegmentsConflict({ from: 'a2', to: 'a4' }, { from: 'h2', to: 'h4' }, 'white')).toBe(
      false,
    );
    expect(arrowSegmentsConflict({ from: 'e2', to: 'e3' }, { from: 'e6', to: 'e7' }, 'white')).toBe(
      false,
    );
    expect(
      routeRecommendationArrows(
        [
          { from: 'a2', to: 'a4', rank: 1 },
          { from: 'h2', to: 'h4', rank: 2 },
        ],
        'white',
      ).map(({ curved }) => curved),
    ).toEqual([false, false]);
  });

  it('réserve la trajectoire directe à MEILLEUR et décale le coup superposé', () => {
    const routes = routeRecommendationArrows(initialRecommendations, 'white');
    expect(routes[0].offset).toBe(0);
    expect(routes[0].curved).toBe(false);
    expect(routes[2].offset).not.toBe(0);
    expect(routes[2].curved).toBe(true);
  });

  it.each(['white', 'black'] as const)(
    'sépare trois recommandations convergentes et reste dans le plateau, orientation %s',
    (orientation) => {
      const routes = routeRecommendationArrows(
        [
          { from: 'c2', to: 'd4', rank: 1 },
          { from: 'f3', to: 'd4', rank: 2 },
          { from: 'e2', to: 'd4', rank: 3 },
        ],
        orientation,
      );
      expect(routes[0].offset).toBe(0);
      expect(routes[1].offset).not.toBe(0);
      expect(routes[2].offset).not.toBe(0);
      for (const route of routes)
        for (const point of [route.start, route.control, route.end]) {
          expect(point.x).toBeGreaterThanOrEqual(0);
          expect(point.y).toBeGreaterThanOrEqual(0);
          expect(point.x).toBeLessThanOrEqual(800);
          expect(point.y).toBeLessThanOrEqual(800);
        }
    },
  );
});
