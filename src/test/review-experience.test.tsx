import { readFileSync } from 'node:fs';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { Chess } from 'chess.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ReviewScreen } from '../computer/ReviewScreen';
import { attemptMove, createGame, replayGame, resign } from '../computer/game';
import { buildReport } from '../computer/review';
import { categories, categoryInfo, type Category } from '../computer/types';
import { BEST_MOVE_ARROW, BEST_MOVE_OUTLINE, classificationVisuals } from '../ui/classification';
import { legalAnalysis, matedGame, exampleAnalyses } from './fixtures/computer';

// One decision of every classification, with a distinct recommended move each time.
function richReview() {
  const tokens = [
    'e2e4',
    'e7e5',
    'g1f3',
    'b8c6',
    'f1c4',
    'g8f6',
    'd2d3',
    'f8c5',
    'c2c3',
    'd7d6',
    'e1g1',
  ];
  let game = createGame('w', 8);
  tokens.forEach((token, index) => {
    game = attemptMove(game, index % 2 === 0 ? 'player' : 'computer', token);
  });
  game = resign(game);
  const replay = replayGame(game);
  const positions = replay.positions.map(legalAnalysis);
  const decisions = [
    { index: 0, best: 'e2e4', before: 0, after: 0 },
    { index: 2, best: 'b1c3', before: 100, after: 90 },
    { index: 4, best: 'f1b5', before: 100, after: 60 },
    { index: 6, best: 'd2d4', before: 100, after: 0 },
    { index: 8, best: 'b1d2', before: 200, after: 0 },
    { index: 10, best: 'c1g5', before: 500, after: -100 },
  ];
  decisions.forEach(({ index, best, before, after }) => {
    positions[index] = { score: { cp: before, depth: 14 }, bestMove: best, pv: [best] };
    positions[index + 1] = { ...positions[index + 1], score: { cp: after, depth: 14 } };
  });
  return { game, report: buildReport(game, positions) };
}

function renderReview(source = richReview()) {
  render(
    <ReviewScreen game={source.game} cached={source.report} onComplete={vi.fn()} onExit={vi.fn()} />,
  );
  return source;
}

function useCompactViewport() {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('max-width: 900px'),
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
}

const board = () => document.querySelector('.computer-board')!;
const square = (name: RegExp) => screen.getByRole('button', { name });

describe('Bilan : une seule vue, coup joué et meilleur coup ensemble', () => {
  afterEach(() => vi.unstubAllGlobals());

  it.each(categories)(
    '%s : la case d’arrivée porte sa couleur, son symbole et son nom',
    (category: Category) => {
      const { report } = renderReview();
      fireEvent.click(
        screen.getByRole('button', { name: `${categoryInfo[category].plural}, 1 coup` }),
      );
      const move = report.moves.find((entry) => entry.category === category)!;
      const played = replayGame(richReview().game).moves[move.ply - 1];
      const visual = classificationVisuals[category];
      const badge = screen.getByTestId('computer-move-badge');
      expect(badge).toHaveAttribute('data-square', played.to);
      expect(badge).toHaveAttribute('data-tone', category);
      // The board, summary, detail and history all reuse the same optically centred SVG family.
      expect(badge.querySelector(`[data-classification="${category}"] svg`)).toBeInTheDocument();
      expect(square(new RegExp(`^${played.to},`))).toHaveStyle({
        backgroundColor: visual.square,
      });
      // Never colour alone: the full name remains written next to the medallion.
      const chip = document.querySelector('.review-category')!;
      expect(chip).toHaveClass(category);
      expect(chip).toHaveTextContent(categoryInfo[category].name);
      expect(chip.querySelector(`[data-classification="${category}"]`)).toBeInTheDocument();
    },
  );

  it('n’affiche aucune flèche pour le coup joué, seulement celle du meilleur coup', () => {
    renderReview();
    fireEvent.click(screen.getByRole('button', { name: 'Gaffes, 1 coup' }));
    // Exactly one arrow, and it is the recommendation.
    expect(board()).toHaveAttribute('data-arrow-count', '1');
    expect(board()).toHaveAttribute('data-arrow-kind', 'best-move');
    expect(document.querySelector('[id*="arrowhead-0-c1-g5"]')).toBeInTheDocument();
    // No arrow drawn for O-O, the move actually played.
    expect(document.querySelector('[id*="arrowhead-1"]')).toBeNull();
    expect(document.querySelector('[id*="-e1-g1"]')).toBeNull();
    expect(screen.getByText('Meilleur coup · Fg5')).toBeVisible();
    expect(screen.getByText(/La flèche verte montre le coup recommandé/)).toBeVisible();
  });

  it('montre la position APRÈS le coup joué, la pièce sur sa case d’arrivée', () => {
    renderReview();
    fireEvent.click(screen.getByRole('button', { name: 'Gaffes, 1 coup' }));
    expect(screen.getByText('Position après ton coup')).toBeVisible();
    // O-O has really been played: king on g1, rook on f1, e1 and h1 empty.
    expect(square(/^g1, roi blanc/)).toBeInTheDocument();
    expect(square(/^f1, tour blanche/)).toBeInTheDocument();
    expect(square(/^e1, case vide/)).toBeInTheDocument();
    // The recommendation still starts from its own, untouched square.
    expect(square(/^c1, fou blanc/)).toBeInTheDocument();
  });

  it('confirme un coup déjà optimal sans aucune flèche', () => {
    renderReview();
    fireEvent.click(screen.getByRole('button', { name: 'Meilleurs coups, 1 coup' }));
    expect(screen.getByText('✓ Meilleur coup')).toBeVisible();
    expect(board()).not.toHaveAttribute('data-arrow-kind');
    expect(board()).not.toHaveAttribute('data-arrow-count');
    expect(document.querySelector('[id*="arrowhead-"]')).toBeNull();
    // The pawn really stands on e4, coloured as the best move.
    expect(square(/^e4, pion blanc/)).toHaveStyle({
      backgroundColor: classificationVisuals.best.square,
    });
  });

  it('centralise la palette : aucune couleur de classification écrite dans les composants', () => {
    const review = readFileSync('src/computer/ReviewScreen.tsx', 'utf8');
    const styles = readFileSync('src/computer/computer.css', 'utf8');
    expect(review).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(review).toContain('classificationVisuals');
    expect(review).toContain('BEST_MOVE_ARROW');
    expect(BEST_MOVE_ARROW).toBe(classificationVisuals.best.arrow);
    for (const category of categories) {
      expect(styles).toContain(`var(--class-${category})`);
      expect(styles).toContain(`var(--class-${category}-soft)`);
    }
    const theme = readFileSync('src/ui/theme.css', 'utf8');
    for (const category of categories) {
      expect(theme.match(new RegExp(`--class-${category}:`, 'g'))).toHaveLength(2);
      expect(theme.match(new RegExp(`--class-${category}-soft:`, 'g'))).toHaveLength(2);
    }
  });

  it('sélectionne un coup depuis l’historique, la courbe et les commandes', () => {
    renderReview();
    fireEvent.click(screen.getByRole('button', { name: /Afficher 3\. Fc4/ }));
    expect(screen.getByTestId('review-position')).toHaveTextContent('5 / 11');
    expect(screen.getByRole('slider', { name: 'Position sur la courbe' })).toHaveValue('5');
    fireEvent.change(screen.getByRole('slider', { name: 'Position sur la courbe' }), {
      target: { value: '9' },
    });
    expect(screen.getByTestId('review-position')).toHaveTextContent('9 / 11');
    fireEvent.click(screen.getByRole('button', { name: 'Coup précédent' }));
    expect(screen.getByTestId('review-position')).toHaveTextContent('8 / 11');
    fireEvent.click(screen.getByRole('button', { name: 'Coup suivant' }));
    expect(screen.getByTestId('review-position')).toHaveTextContent('9 / 11');
  });

  it('propose Premier, Précédent, Suivant et Dernier, dans cet ordre, sur une seule ligne', () => {
    renderReview();
    const controls = screen.getByLabelText('Navigation dans la partie');
    expect(within(controls).getAllByRole('button').map((node) => node.getAttribute('aria-label')))
      .toEqual(['Premier coup', 'Coup précédent', 'Coup suivant', 'Dernier coup']);
  });

  it('garde la barre d’évaluation verticale et la courbe visibles sur desktop', () => {
    renderReview();
    expect(document.querySelector('.review-eval .evaluation')).toBeInTheDocument();
    expect(document.querySelector('.review-eval-toggle')).toBeNull();
    expect(screen.getByLabelText('Courbe d’évaluation de la partie')).toBeVisible();
    expect(document.querySelector('.review-thread')).toHaveAttribute('data-open', 'false');
  });

  it('rend la barre interactive sur mobile et ouvre puis referme le fil de la partie', () => {
    useCompactViewport();
    renderReview();
    const toggle = screen.getByRole('button', { name: /fil de la partie/ });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAttribute('aria-controls', 'review-thread');
    expect(document.querySelector('.review-thread')).toHaveAttribute('aria-hidden', 'true');
    toggle.focus();
    expect(toggle).toHaveFocus();
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(document.querySelector('.review-thread')).toHaveAttribute('data-open', 'true');
    expect(document.querySelector('.review-thread')).not.toHaveAttribute('aria-hidden');
    fireEvent.click(screen.getByRole('button', { name: /Masquer le fil de la partie/ }));
    expect(document.querySelector('.review-thread')).toHaveAttribute('data-open', 'false');
  });

  it('conserve le coup sélectionné en ouvrant le fil de la partie', () => {
    useCompactViewport();
    renderReview();
    fireEvent.click(screen.getByRole('button', { name: 'Erreurs, 1 coup' }));
    const position = screen.getByTestId('review-position').textContent;
    fireEvent.click(screen.getByRole('button', { name: /Voir le fil de la partie/ }));
    expect(screen.getByTestId('review-position')).toHaveTextContent(position!);
  });

  it('suit l’orientation Noirs sans changer la logique', () => {
    const game = matedGame('b');
    const positions = exampleAnalyses();
    positions[1] = { score: { cp: -20, depth: 14 }, bestMove: 'c7c5', pv: ['c7c5'] };
    positions[2] = { ...positions[2], score: { cp: 80, depth: 14 } };
    const report = buildReport(game, positions);
    renderReview({ game, report });
    const category = report.moves.find((move) => move.ply === 2)!.category;
    fireEvent.click(
      screen.getByRole('button', { name: `${categoryInfo[category].plural}, 1 coup` }),
    );
    expect(board()).toHaveAttribute('data-orientation', 'black');
    // Black played e7-e5: the pawn really stands on e5, e7 is empty.
    expect(square(/^e5, pion noir/)).toBeInTheDocument();
    expect(square(/^e7, case vide/)).toBeInTheDocument();
    expect(square(/^e5, pion noir/)).toHaveStyle({
      backgroundColor: classificationVisuals[category].square,
    });
    // One single arrow: the recommendation c7-c5.
    expect(board()).toHaveAttribute('data-arrow-count', '1');
    expect(document.querySelector('[id*="arrowhead-0-c7-c5"]')).toBeInTheDocument();
    expect(document.querySelector('[id*="-e7-e5"]')).toBeNull();
  });

  it.each(categories)(
    '%s : la pièce jouée est réellement sur sa destination dans la position affichée',
    (category: Category) => {
      const { report } = renderReview();
      fireEvent.click(
        screen.getByRole('button', { name: `${categoryInfo[category].plural}, 1 coup` }),
      );
      const move = report.moves.find((entry) => entry.category === category)!;
      const replay = replayGame(richReview().game);
      const played = replay.moves[move.ply - 1];
      // The displayed FEN is the one after the played move.
      const shown = new Chess(replay.positions[move.ply]);
      expect(shown.get(played.to as never)).toBeDefined();
      expect(square(new RegExp(`^${played.to}, (?!case vide)`))).toBeInTheDocument();
      expect(square(new RegExp(`^${played.from}, case vide`))).toBeInTheDocument();
      // The departure square keeps a soft tint, never the classification colour.
      expect(square(new RegExp(`^${played.from},`))).toHaveStyle({
        backgroundColor: classificationVisuals[category].origin,
      });
      // At most one arrow, and never one drawn for the played move.
      const count = board().getAttribute('data-arrow-count');
      expect(count === null || count === '1').toBe(true);
      expect(document.querySelector(`[id*="-${played.from}-${played.to}"]`)).toBeNull();
    },
  );

  it('tolère un ancien bilan sans meilleur coup', () => {
    const source = richReview();
    source.report.positions[10] = { ...source.report.positions[10], bestMove: null, pv: [] };
    source.report.moves.at(-1)!.bestSan = null;
    renderReview(source);
    fireEvent.click(screen.getByRole('button', { name: 'Gaffes, 1 coup' }));
    expect(screen.getByText('Meilleur coup : Non disponible')).toBeVisible();
    expect(board()).not.toHaveAttribute('data-arrow-kind');
    expect(screen.getByTestId('review-comment')).not.toBeEmptyDOMElement();
  });

  it('n’ouvre aucun Worker, même en changeant de coup, de filtre et de fil', () => {
    const worker = vi.fn();
    vi.stubGlobal('Worker', worker);
    useCompactViewport();
    renderReview();
    fireEvent.click(screen.getByRole('button', { name: 'Imprécisions, 1 coup' }));
    fireEvent.click(screen.getByRole('button', { name: /Voir le fil de la partie/ }));
    fireEvent.click(screen.getByRole('button', { name: /Afficher 3\. Fc4/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Coup suivant' }));
    fireEvent.click(screen.getByRole('button', { name: 'Tous les coups' }));
    expect(worker).not.toHaveBeenCalled();
  });

  it('sépare l’essentiel du détail pour que le coup se comprenne au-dessus du plateau', () => {
    renderReview();
    fireEvent.click(screen.getByRole('button', { name: 'Gaffes, 1 coup' }));
    const headline = screen.getByLabelText('Détail du coup sélectionné');
    const detail = screen.getByLabelText('Commentaire et évaluations');
    expect(headline).toHaveTextContent('Gaffe');
    expect(headline).toHaveTextContent('Meilleur coup : Fg5');
    expect(detail).toContainElement(screen.getByTestId('review-comment'));
    expect(detail).toHaveTextContent('Évaluation avant');
    expect(detail).toHaveTextContent('Évaluation après');
    // The board sits between the two on phones; the headline always comes first.
    const workspace = document.querySelector('.review-workspace')!;
    const order = [...workspace.querySelectorAll('.review-insight, .review-detail-block')];
    expect(order[0]).toBe(headline);
    expect(order[1]).toBe(detail);
  });

  it('amène la décision à l’écran quand une classification est choisie sur mobile', () => {
    useCompactViewport();
    const scroll = vi.fn();
    const original = HTMLElement.prototype.scrollIntoView;
    HTMLElement.prototype.scrollIntoView = function (this: HTMLElement, ...args: unknown[]) {
      scroll(this, args[0]);
    } as typeof original;
    try {
      renderReview();
      fireEvent.click(screen.getByRole('button', { name: 'Erreurs, 1 coup' }));
      const target = scroll.mock.calls.find(
        ([node]) => (node as HTMLElement).className === 'review-workspace',
      );
      expect(target).toBeTruthy();
      expect(target![1]).toEqual({ block: 'start', behavior: 'instant' });
    } finally {
      HTMLElement.prototype.scrollIntoView = original;
    }
  });

  it('ne déplace pas la page en synchronisant la bande d’historique', () => {
    const scroll = vi.fn();
    const original = HTMLElement.prototype.scrollIntoView;
    HTMLElement.prototype.scrollIntoView = function (this: HTMLElement, ...args: unknown[]) {
      scroll(this, args[0]);
    } as typeof original;
    try {
      renderReview();
      fireEvent.click(screen.getByRole('button', { name: /Afficher 3\. Fc4/ }));
      expect(
        scroll.mock.calls.some(([node]) =>
          (node as HTMLElement).closest?.('.computer-history'),
        ),
      ).toBe(false);
    } finally {
      HTMLElement.prototype.scrollIntoView = original;
    }
  });

  it('annote le meilleur coup même quand il part de la case que le coup joué a quittée', () => {
    // Bc4 was played from f1; the recommendation Bf1-b5 starts from that very square, which
    // the played move has just emptied. The arrow stays, plus a discreet outline of its origin.
    const { report } = renderReview();
    fireEvent.click(screen.getByRole('button', { name: 'Bons, 1 coup' }));
    const move = report.moves.find((entry) => entry.category === 'good')!;
    expect(move.ply).toBe(5);
    // The bishop really is on c4 now, and f1 is empty on the displayed board.
    expect(square(/^c4, fou blanc/)).toBeInTheDocument();
    expect(square(/^f1, case vide/)).toBeInTheDocument();
    expect(new Chess(replayGame(richReview().game).positions[5]).get('f1')).toBeUndefined();
    expect(document.querySelector('[id*="arrowhead-0-f1-b5"]')).toBeInTheDocument();
    expect(board()).toHaveAttribute('data-arrow-count', '1');
    // Discreet origin outline, never a ghost piece.
    expect(square(/^f1, case vide/)).toHaveStyle({
      boxShadow: `inset 0 0 0 2px ${BEST_MOVE_OUTLINE}`,
    });
    expect(document.querySelectorAll('[data-piece-square="f1"]')).toHaveLength(0);
  });

  it('n’ajoute aucun repère d’origine quand la case de départ du meilleur coup est intacte', () => {
    renderReview();
    fireEvent.click(screen.getByRole('button', { name: 'Gaffes, 1 coup' }));
    // Bc1-g5 recommended after O-O: c1 was never touched by the played move.
    expect(square(/^c1, fou blanc/)).not.toHaveStyle({
      boxShadow: `inset 0 0 0 2px ${BEST_MOVE_OUTLINE}`,
    });
  });
});
