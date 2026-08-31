import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';

// Recorded in the real browser. jsdom cannot measure layout; changes invalidate the evidence.
type LayoutReport = {
  files: string[];
  uiHash: string;
  home: {
    width: number;
    height: number;
    theme: string;
    overflow: boolean;
    cards: {
      inside: boolean;
      arrowHit: boolean;
      textClipped: boolean;
      artVisible: boolean;
      bottom: number;
    }[];
  }[];
  freeplay: { width: number; boardWidth: number; overflow: boolean }[];
};
const report: LayoutReport = JSON.parse(readFileSync('qa/product-finish-validation.json', 'utf8'));
describe('Mesures de rendu dans Chromium, pas des dimensions simulées par jsdom', () => {
  it('correspond aux composants visuels actuels', () => {
    const hash = createHash('sha256');
    for (const file of report.files) hash.update(readFileSync(file));
    expect(report.uiHash).toBe(hash.digest('hex'));
    expect(report.home).toHaveLength(12);
  });
  it.each(report.home)(
    '$width px / $theme : cartes lisibles, action entière et premier écran mobile',
    (row) => {
      expect(row.overflow).toBe(false);
      expect(row.cards).toHaveLength(2);
      for (const card of row.cards) {
        expect(card.inside).toBe(true);
        expect(card.arrowHit).toBe(true);
        expect(card.textClipped).toBe(false);
        if (row.width <= 430) {
          expect(card.artVisible).toBe(true);
          expect(card.bottom).toBeLessThanOrEqual(row.height);
        }
      }
    },
  );
  it.each(report.freeplay)('$width px : grand plateau conservé sans débordement', (row) => {
    expect(row.overflow).toBe(false);
    if (row.width <= 430) expect(row.boardWidth).toBe(row.width - 16);
    else expect(row.boardWidth).toBeGreaterThan(700);
  });
});
