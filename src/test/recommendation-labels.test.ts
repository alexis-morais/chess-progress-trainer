import { describe, expect, it } from 'vitest';
import { placeRecommendationLabels, type LabelRect } from '../board/RecommendationLabels';
import type { BoardArrow } from '../board/InteractiveBoard';

const denseArrows: BoardArrow[] = [
  { from: 'c2', to: 'd4', rank: 1 },
  { from: 'f1', to: 'd3', rank: 2 },
  { from: 'f1', to: 'c4', rank: 3 },
];
const sizes = [
  { width: 82, height: 34 },
  { width: 82, height: 34 },
  { width: 72, height: 34 },
];

function overlap(left: LabelRect, right: LabelRect) {
  return !(
    left.right <= right.left ||
    right.right <= left.left ||
    left.bottom <= right.top ||
    right.bottom <= left.top
  );
}

describe('Placement des cartouches de recommandations', () => {
  it.each(['white', 'black'] as const)(
    'évite les superpositions dans une position dense, orientation %s',
    (orientation) => {
      const placements = placeRecommendationLabels(denseArrows, orientation, 640, sizes);
      expect(placements).toHaveLength(3);
      for (let first = 0; first < placements.length; first += 1)
        for (let second = first + 1; second < placements.length; second += 1)
          expect(overlap(placements[first].rect, placements[second].rect)).toBe(false);
    },
  );

  it('réserve la position naturelle au meilleur coup avant de déplacer les rangs suivants', () => {
    const placements = placeRecommendationLabels(denseArrows, 'white', 640, sizes);
    expect(placements[0].candidate).toBe(0);
    expect(placements.slice(1).some(({ candidate }) => candidate > 0)).toBe(true);
  });

  it.each([
    ['white', 304],
    ['black', 304],
    ['white', 680],
    ['black', 680],
  ] as const)(
    'maintient chaque cartouche dans un plateau %s de %i px',
    (orientation, boardSize) => {
      const placements = placeRecommendationLabels(denseArrows, orientation, boardSize, sizes);
      for (const { rect } of placements) {
        expect(rect.left).toBeGreaterThanOrEqual(0);
        expect(rect.top).toBeGreaterThanOrEqual(0);
        expect(rect.right).toBeLessThanOrEqual(boardSize);
        expect(rect.bottom).toBeLessThanOrEqual(boardSize);
      }
    },
  );

  it('miroite le placement naturel lorsque les Noirs sont en bas', () => {
    const white = placeRecommendationLabels([denseArrows[0]], 'white', 640, [sizes[0]])[0];
    const black = placeRecommendationLabels([denseArrows[0]], 'black', 640, [sizes[0]])[0];
    expect(white.x + black.x).toBeCloseTo(640, 3);
    expect(white.y + black.y).toBeCloseTo(640, 3);
  });
});
