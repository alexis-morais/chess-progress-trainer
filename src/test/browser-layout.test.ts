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
  // Vertical position of the openings board through a whole pedagogical sequence.
  trainer: {
    width: number;
    height: number;
    side: 'w' | 'b';
    mode: string;
    boardWidth: number;
    top: number;
    bottom: number;
    deltaY: number;
    messages: string[];
  }[];
  // Composition of the Game Review, desktop and phone.
  review: {
    width: number;
    height: number;
    theme: string;
    compact: boolean;
    // Measured before any classification is touched: the bilan's actual opening state.
    initialPosition: string;
    initialCaption: string | null;
    navButtons: (string | null)[];
    evalBar: Box;
    board: Box;
    insight: Box;
    history: Box;
    nav: Box;
    detail: Box;
    panel: Box;
    boardVisible: boolean;
    navVisible: boolean;
    threadVisible: boolean;
    arrows: number;
    arrowKind: string | null;
    playedLabel: string;
    playedColor: string;
    originLabel: string;
    switchRemoved: boolean;
    overflow: boolean;
  }[];
};
type Box = { x: number; y: number; w: number; h: number; bottom: number };
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

  it.each(report.trainer)(
    '$width px / $side / $mode : le plateau ne bouge pas d’un pixel pendant la séance',
    (row) => {
      // intention → coup refusé → indice → solution → bon coup → réponse de l’ordinateur
      expect(row.messages).toEqual([
        'intention',
        'incorrect',
        'hint',
        'solution',
        'correct',
        'intention',
      ]);
      expect(row.deltaY).toBe(0);
      expect(row.bottom - row.top).toBeCloseTo(row.boardWidth, 0);
      if (row.width <= 430) {
        expect(row.boardWidth).toBe(row.width - 16);
        // The whole board stays on the first screen of a phone.
        expect(row.bottom).toBeLessThanOrEqual(row.height);
      }
    },
  );

  it('couvre les trois largeurs et les deux camps pour la stabilité du plateau', () => {
    expect(report.trainer.map((row) => row.width).sort((a, b) => a - b)).toEqual([320, 390, 1440]);
    expect(new Set(report.trainer.map((row) => row.side))).toEqual(new Set(['w', 'b']));
  });

  it.each(report.review)(
    '$width × $height / $theme : plateau complet visible, un seul repère pour le meilleur coup',
    (row) => {
      expect(row.overflow).toBe(false);
      expect(row.switchRemoved).toBe(true);
      // The played move is never an arrow: exactly one arrow, the recommendation.
      expect(row.arrows).toBe(1);
      expect(row.arrowKind).toBe('best-move');
      // The king really stands on its destination, which carries the blunder colour.
      expect(row.playedLabel).toBe('g1, roi blanc');
      expect(row.playedColor).toBe('rgba(191, 58, 68, 0.44)');
      expect(row.originLabel).toBe('e1, case vide');
      // The eight ranks and the navigation are reachable without scrolling.
      expect(row.boardVisible).toBe(true);
      expect(row.navVisible).toBe(true);
      expect(row.board.h).toBe(row.board.w);
      if (row.compact) {
        expect(row.threadVisible).toBe(false);
        expect(row.evalBar.y).toBeLessThanOrEqual(8);
        expect(row.insight.y).toBeLessThan(row.board.y);
        if (row.width <= 430) expect(row.board.w).toBe(row.width - 16);
      } else {
        expect(row.threadVisible).toBe(true);
        expect(row.evalBar.x).toBeLessThan(row.board.x);
        expect(row.board.x + row.board.w).toBeLessThanOrEqual(row.insight.x);
        // The bar's own box includes the padding that lines its top up with the board,
        // past the caption sitting above the board: same bottom edge, taller box.
        expect(row.evalBar.bottom).toBe(row.board.bottom);
        expect(row.evalBar.h).toBeGreaterThan(row.board.h);
        expect(row.board.w).toBeGreaterThanOrEqual(560);
        expect(row.insight.y).toBeLessThan(row.detail.y);
      }
    },
  );

  it('couvre les six largeurs demandées pour le bilan', () => {
    expect([...new Set(report.review.map((row) => row.width))].sort((a, b) => a - b)).toEqual([
      320, 375, 390, 430, 820, 1440,
    ]);
  });

  it('rend les huit rangées visibles à 320 × 568, sans les 40 px de défilement précédents', () => {
    const narrow = report.review.find((row) => row.width === 320 && row.height === 568)!;
    expect(narrow.board.w).toBe(304);
    expect(narrow.board.bottom).toBeLessThanOrEqual(narrow.height);
    expect(narrow.nav.bottom).toBeLessThanOrEqual(narrow.height);
  });

  it('garde le plateau entier dans le viewport à 1440 × 900', () => {
    const desktop = report.review.filter((row) => row.width === 1440 && row.height === 900);
    expect(desktop).toHaveLength(2);
    for (const row of desktop) {
      expect(row.board.bottom).toBeLessThanOrEqual(row.height);
      expect(row.nav.bottom).toBeLessThanOrEqual(row.height);
    }
  });

  it('conserve les plateaux mobiles et tablette déjà validés', () => {
    const sizes = Object.fromEntries(report.review.map((row) => [row.width, row.board.w]));
    expect(sizes[375]).toBe(359);
    expect(sizes[390]).toBe(374);
    expect(sizes[430]).toBe(414);
    expect(sizes[820]).toBe(740);
  });

  it('couvre le bilan en clair et en sombre, sur téléphone et sur ordinateur', () => {
    expect(new Set(report.review.map((row) => row.theme))).toEqual(new Set(['light', 'dark']));
    expect(report.review.some((row) => row.compact)).toBe(true);
    expect(report.review.some((row) => !row.compact)).toBe(true);
  });

  it.each(report.review)(
    '$width × $height : le bilan ouvre sur la position initiale, filtre Tous les coups',
    (row) => {
      expect(row.initialPosition).toBe('0 / 11');
      expect(row.initialCaption).toBe('Position initiale');
    },
  );

  it.each(report.review)(
    '$width × $height : quatre contrôles de navigation, dans cet ordre, sur une ligne',
    (row) => {
      expect(row.navButtons).toEqual(['Premier coup', 'Coup précédent', 'Coup suivant', 'Dernier coup']);
      expect(row.nav.h).toBeLessThanOrEqual(56);
    },
  );

  it('le panneau d’analyse desktop suit exactement la hauteur du plateau', () => {
    const desktop = report.review.filter((row) => !row.compact);
    for (const row of desktop) expect(row.panel.h).toBe(row.board.h);
  });
});
