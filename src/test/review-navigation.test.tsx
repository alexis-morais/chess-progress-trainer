import { fireEvent, render, screen } from '@testing-library/react';
import { Chess } from 'chess.js';
import { describe, expect, it, vi } from 'vitest';
import { ReviewScreen } from '../computer/ReviewScreen';
import { attemptMove, createGame, replayGame, resign } from '../computer/game';
import {
  bestMoveArrow,
  buildReport,
  categoryPlies,
  navigateFilteredPly,
} from '../computer/review';
import { categories, categoryInfo } from '../computer/types';
import { legalAnalysis, matedGame, exampleAnalyses } from './fixtures/computer';

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

describe('Bilan : filtres de classifications synchronisés', () => {
  it('rend chaque catégorie présente interactive et ouvre immédiatement son premier coup', () => {
    const { report } = renderReview();
    categories.forEach((category) => {
      expect(report.counts[category]).toBe(1);
      expect(
        screen.getByRole('button', {
          name: `${categoryInfo[category].plural}, 1 coup`,
        }),
      ).toBeEnabled();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Gaffes, 1 coup' }));
    expect(screen.getByTestId('review-position')).toHaveTextContent('Gaffe 1 / 1');
    expect(screen.getByRole('button', { name: 'Gaffes, 1 coup' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: /Afficher 6\. O-O — Gaffe/ })).toHaveAttribute(
      'aria-current',
      'step',
    );
    expect(screen.getByRole('slider', { name: 'Position sur la courbe' })).toHaveValue('11');
    expect(screen.getByTestId('review-comment')).toHaveTextContent('Gaffe');
    expect(document.querySelector('.computer-board')).toHaveAttribute(
      'data-arrow-kind',
      'best-move',
    );
    expect(document.querySelector('[id*="arrowhead-0-c1-g5"]')).toBeInTheDocument();
    expect(screen.getByText('Meilleur coup · Fg5')).toBeVisible();
  });

  it('parcourt seulement les coups filtrés, puis revient à tous les coups', () => {
    const source = richReview();
    source.report.moves[1].category = 'inaccuracy';
    source.report.moves[3].category = 'inaccuracy';
    source.report.counts = Object.fromEntries(
      categories.map((category) => [
        category,
        source.report.moves.filter((move) => move.category === category).length,
      ]),
    ) as typeof source.report.counts;
    renderReview(source);
    fireEvent.click(screen.getByRole('button', { name: 'Imprécisions, 2 coups' }));
    expect(screen.getByTestId('review-position')).toHaveTextContent('Imprécision 1 / 2');
    expect(screen.getByRole('slider', { name: 'Position sur la courbe' })).toHaveValue('3');
    fireEvent.click(screen.getByRole('button', { name: 'Coup suivant' }));
    expect(screen.getByTestId('review-position')).toHaveTextContent('Imprécision 2 / 2');
    expect(screen.getByRole('slider', { name: 'Position sur la courbe' })).toHaveValue('7');
    fireEvent.click(screen.getByRole('button', { name: 'Coup précédent' }));
    expect(screen.getByRole('slider', { name: 'Position sur la courbe' })).toHaveValue('3');
    fireEvent.click(screen.getByRole('button', { name: 'Tous les coups' }));
    expect(screen.getByTestId('review-position')).toHaveTextContent('3 / 11');
    expect(screen.getByRole('button', { name: 'Tous les coups' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('désactive les catégories vides et conserve un focus clavier visible', () => {
    const game = matedGame();
    renderReview({ game, report: buildReport(game, exampleAnalyses()) });
    screen
      .getAllByRole('button', { name: /aucun coup à afficher/ })
      .forEach((empty) => expect(empty).toBeDisabled());
    const present = screen.getAllByRole('button', { name: /, 1 coup$/ })[0];
    present.focus();
    expect(present).toHaveFocus();
  });

  it('n’affiche aucune alternative quand le coup joué était déjà le meilleur', () => {
    renderReview();
    const best = screen.getByRole('button', { name: 'Meilleurs coups, 1 coup' });
    best.focus();
    expect(best).toHaveFocus();
    fireEvent.click(best);
    expect(screen.getByTestId('review-position')).toHaveTextContent('Meilleur coup 1 / 1');
    expect(screen.getByText('✓ Meilleur coup')).toBeVisible();
    expect(document.querySelector('.computer-board')).not.toHaveAttribute('data-arrow-kind');
    expect(screen.queryByRole('button', { name: 'Meilleur coup' })).toBeNull();
  });

  it('tolère un ancien bilan sans meilleur coup et garde le commentaire', () => {
    const source = richReview();
    source.report.positions[10] = {
      ...source.report.positions[10],
      bestMove: null,
      pv: [],
    };
    const last = source.report.moves.at(-1)!;
    last.bestSan = null;
    last.proposedLine = '';
    renderReview(source);
    fireEvent.click(screen.getByRole('button', { name: 'Gaffes, 1 coup' }));
    expect(screen.getByText('Meilleur coup : Non disponible')).toBeVisible();
    expect(screen.getByTestId('review-comment')).not.toBeEmptyDOMElement();
    expect(document.querySelector('.computer-board')).not.toHaveAttribute('data-arrow-kind');
  });

  it('réutilise le bilan calculé sans créer de Worker pendant la navigation', () => {
    const worker = vi.fn();
    vi.stubGlobal('Worker', worker);
    const { report } = renderReview();
    fireEvent.click(screen.getByRole('button', { name: 'Erreurs, 1 coup' }));
    fireEvent.click(screen.getByRole('button', { name: 'Coup suivant' }));
    fireEvent.click(screen.getByRole('button', { name: 'Coup précédent' }));
    fireEvent.click(screen.getByRole('button', { name: 'Tous les coups' }));
    const ply = report.moves.at(-1)!.ply;
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`^Afficher ${Math.ceil(ply / 2)}\\.`) }));
    fireEvent.change(screen.getByRole('slider', { name: 'Position sur la courbe' }), {
      target: { value: '4' },
    });
    expect(worker).not.toHaveBeenCalled();
  });

  it('n’offre plus de bascule Mon coup / Meilleur coup, ni sur desktop ni sur mobile', () => {
    renderReview();
    for (const label of ['Mon coup', 'Meilleur coup', 'Afficher', 'Réessayer']) {
      expect(screen.queryByRole('button', { name: label })).toBeNull();
    }
    expect(document.querySelector('.best-move-views')).toBeNull();
    expect(screen.queryByRole('group', { name: 'Vue de la décision' })).toBeNull();
  });

  it('synchronise la recommandation avec une orientation Noirs', () => {
    const game = matedGame('b');
    const positions = exampleAnalyses();
    positions[1] = { score: { cp: -20, depth: 14 }, bestMove: 'c7c5', pv: ['c7c5'] };
    positions[2] = { ...positions[2], score: { cp: 80, depth: 14 } };
    const report = buildReport(game, positions);
    renderReview({ game, report });
    const category = report.moves.find((move) => move.ply === 2)!.category;
    fireEvent.click(
      screen.getByRole('button', {
        name: new RegExp(`^${category === 'inaccuracy' ? 'Imprécisions' : category === 'mistake' ? 'Erreurs' : 'Gaffes'},`),
      }),
    );
    expect(document.querySelector('.computer-board')).toHaveAttribute('data-orientation', 'black');
    expect(document.querySelector('[id*="arrowhead-0-c7-c5"]')).toBeInTheDocument();
  });
});

describe('Bilan : données de navigation et flèches', () => {
  it('borne la navigation filtrée sans position inexistante', () => {
    expect(categoryPlies(richReview().report.moves, 'blunder')).toEqual([11]);
    expect(navigateFilteredPly(3, 'next', [3, 7, 11])).toBe(7);
    expect(navigateFilteredPly(11, 'next', [3, 7, 11])).toBe(11);
    expect(navigateFilteredPly(7, 'first', [3, 7, 11])).toBe(3);
    expect(navigateFilteredPly(7, 'last', [3, 7, 11])).toBe(11);
    expect(navigateFilteredPly(0, 'next', [])).toBeNull();
  });

  it.each([
    ['pion', new Chess().fen(), 'e2e4'],
    ['cavalier', new Chess().fen(), 'g1f3'],
    ['fou', 'r3k2r/8/8/8/8/8/8/RNBQKB1R w KQkq - 0 1', 'f1b5'],
    ['tour', '4k3/8/8/8/8/8/8/R3K3 w Q - 0 1', 'a1a8'],
    ['dame', '4k3/8/8/8/8/8/8/3QK3 w - - 0 1', 'd1d7'],
    ['roi', '4k3/8/8/8/8/8/8/4K3 w - - 0 1', 'e1e2'],
    ['capture', '4k3/8/8/8/8/8/4p3/3QK3 w - - 0 1', 'd1e2'],
    ['roque', 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1', 'e1g1'],
    ['promotion', '7k/P7/8/8/8/8/8/7K w - - 0 1', 'a7a8q'],
  ])('valide la flèche du meilleur coup : %s', (_kind, fen, token) => {
    expect(bestMoveArrow(fen, token)).toEqual({ from: token.slice(0, 2), to: token.slice(2, 4) });
  });

  it('refuse une donnée de flèche absente, mal formée ou illégale', () => {
    expect(bestMoveArrow(new Chess().fen(), null)).toBeNull();
    expect(bestMoveArrow(new Chess().fen(), 'e2e5')).toBeNull();
    expect(bestMoveArrow(new Chess().fen(), 'javascript:alert(1)')).toBeNull();
  });
});
