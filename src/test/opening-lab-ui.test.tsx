import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Chess } from 'chess.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { playUci, uci } from '../computer/game';
import { emptyProgress, PROGRESS_KEY } from '../progress/model';

class LabWorker {
  static all: LabWorker[] = [];
  onmessage: Worker['onmessage'] = null;
  onerror: Worker['onerror'] = null;
  onmessageerror: Worker['onmessageerror'] = null;
  postMessage = vi.fn((command: string) => {
    queueMicrotask(() => {
      if (this.terminate.mock.calls.length) return;
      if (command === 'uci')
        this.emit(
          'option name Skill Level type spin default 20 min 0 max 20\noption name MultiPV type spin default 1 min 1 max 256\noption name UCI_LimitStrength type check default false\noption name UCI_Elo type spin default 1320 min 1320 max 3190\nuciok',
        );
      else if (command === 'isready') this.emit('readyok');
      else if (command.startsWith('setoption name MultiPV value '))
        this.multiPV = Number(command.at(-1));
      else if (command.startsWith('position startpos')) {
        this.game = new Chess();
        for (const token of command.split(' moves ')[1]?.split(' ') ?? [])
          playUci(this.game, token);
      } else if (command.startsWith('go ')) {
        const moves = this.game.moves({ verbose: true }).slice(0, this.multiPV);
        const lines = moves.map(
          (move, index) =>
            `info depth 13 multipv ${index + 1} score cp ${120 - index * 35} pv ${uci(move)}`,
        );
        this.emit(`${lines.join('\n')}\nbestmove ${uci(moves[0])}`);
      } else if (command === 'stop') this.emit('bestmove e2e4');
    });
  });
  terminate = vi.fn();
  game = new Chess();
  multiPV = 1;
  constructor() {
    LabWorker.all.push(this);
  }
  emit(data: string) {
    this.onmessage?.call(this as unknown as Worker, { data } as MessageEvent);
  }
}

const square = (name: string) => screen.getByRole('button', { name: new RegExp(`^${name},`) });
const play = (from: string, to: string) => {
  fireEvent.click(square(from));
  fireEvent.click(square(to));
};
async function openLab(side: 'Blancs' | 'Noirs') {
  fireEvent.click(screen.getByRole('link', { name: 'OUVERTURES' }));
  fireEvent.click(await screen.findByRole('button', { name: /Explorer librement/ }));
  fireEvent.click(await screen.findByRole('button', { name: `Étudier les ${side}` }));
}
const board = () => document.querySelector<HTMLElement>('.computer-board')!;

beforeEach(() => {
  localStorage.clear();
  LabWorker.all = [];
  vi.stubGlobal('Worker', LabWorker);
});

describe('Ouverture libre : parcours utilisateur', () => {
  it('offre un accès distinct dans les Ouvertures sans demander de variante', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('link', { name: 'OUVERTURES' }));
    expect(await screen.findByRole('heading', { name: 'Ouverture libre' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: /Explorer librement/ }));
    expect(await screen.findByRole('heading', { name: /Une position/ })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Étudier les Blancs' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Étudier les Noirs' })).toBeVisible();
    expect(LabWorker.all).toHaveLength(0);
  });

  it('étudie les Blancs, garde l’orientation et masque toute aide au tour noir', async () => {
    render(<App />);
    await openLab('Blancs');
    expect(board()).toHaveAttribute('data-orientation', 'white');
    expect(board()).toHaveAttribute('aria-label', 'Échiquier d’ouverture libre, Blancs en bas');
    await waitFor(() => expect(board()).toHaveAttribute('data-arrow-count', '3'));
    expect(screen.getAllByText('MEILLEUR').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('EXCELLENT').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('BON').length).toBeGreaterThanOrEqual(1);
    play('e2', 'e4');
    expect(board()).toHaveAttribute('data-orientation', 'white');
    expect(board()).not.toHaveAttribute('data-arrow-count');
    expect(screen.getByTestId('opponent-turn-no-help')).toHaveTextContent(
      'Aucune aide moteur n’est affichée',
    );
    expect(screen.queryByText('MEILLEUR')).toBeNull();
    await waitFor(() =>
      expect(LabWorker.all[0].postMessage).toHaveBeenCalledWith('setoption name MultiPV value 1'),
    );
    play('e7', 'e5');
    await waitFor(() => expect(board()).toHaveAttribute('data-arrow-count', '3'));
    expect(board()).toHaveAttribute('data-orientation', 'white');
  });

  it('étudie les Noirs sans aide initiale puis recommande après le premier coup blanc', async () => {
    render(<App />);
    await openLab('Noirs');
    expect(board()).toHaveAttribute('data-orientation', 'black');
    expect(board()).toHaveAttribute('aria-label', 'Échiquier d’ouverture libre, Noirs en bas');
    expect(board()).not.toHaveAttribute('data-arrow-count');
    expect(screen.getByTestId('opponent-turn-no-help')).toBeVisible();
    play('e2', 'e4');
    await waitFor(() => expect(board()).toHaveAttribute('data-arrow-count', '3'));
    expect(board()).toHaveAttribute('data-orientation', 'black');
    expect(screen.getAllByText('+1.20').length).toBeGreaterThanOrEqual(1);
    expect(LabWorker.all[0].postMessage).toHaveBeenCalledWith('setoption name MultiPV value 3');
  });

  it('contrôle réellement les deux camps et refuse seulement un déplacement illégal', async () => {
    render(<App />);
    await openLab('Blancs');
    play('e2', 'e5');
    expect(square('e2')).toHaveTextContent('');
    expect(screen.getByTestId('computer-move-badge')).toBeVisible();
    play('e2', 'e4');
    expect(square('e4')).toHaveAttribute('aria-label', 'e4, pion blanc');
    play('e7', 'e5');
    play('g1', 'f3');
    play('b8', 'c6');
    play('d2', 'd4');
    play('e5', 'd4');
    play('f3', 'd4');
    play('a7', 'a6');
    expect(square('a6')).toHaveAttribute('aria-label', 'a6, pion noir');
    expect(screen.getByText('Ouverture écossaise')).toBeVisible();
    expect(screen.getByText('Hors répertoire')).toBeVisible();
  });

  it('présente les deux parcours sans modifier la navigation principale', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('link', { name: 'OUVERTURES' }));
    expect(await screen.findByText('DEUX FAÇONS D’APPRENDRE')).toBeVisible();
    expect(screen.getByText('ENTRAÎNEMENT GUIDÉ')).toBeVisible();
    expect(screen.getByText('LABORATOIRE D’OUVERTURES')).toBeVisible();
    expect(screen.getByRole('button', { name: /Voir le répertoire/ })).toBeVisible();
    expect(screen.getByRole('button', { name: /Explorer librement/ })).toBeVisible();
    const nav = screen.getByRole('navigation', { name: 'Navigation principale' });
    expect(nav).toHaveTextContent('AccueilOuverturesPartie libreProgression');
    expect(nav).not.toHaveTextContent('Ouverture libre');
  });

  it('fait défiler le CTA guidé vers le répertoire et conserve le focus clavier', async () => {
    const scrollIntoView = vi.fn();
    vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockImplementation(scrollIntoView);
    render(<App />);
    fireEvent.click(screen.getByRole('link', { name: 'OUVERTURES' }));
    const title = await screen.findByRole('heading', { name: 'Choisis ton ouverture' });
    fireEvent.click(screen.getByRole('button', { name: /Voir le répertoire/ }));
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    expect(title).toHaveFocus();
  });

  it('navigue dans la ligne puis tronque l’ancienne continuation pour une nouvelle branche', async () => {
    render(<App />);
    await openLab('Blancs');
    play('e2', 'e4');
    play('e7', 'e5');
    play('g1', 'f3');
    play('g7', 'g5');
    fireEvent.click(screen.getByRole('button', { name: /Afficher 2\. Cf3/ }));
    expect(square('g7')).toHaveAttribute('aria-label', 'g7, pion noir');
    expect(square('f3')).toHaveAttribute('aria-label', 'f3, cavalier blanc');
    play('b8', 'c6');
    expect(screen.queryByText('g5')).toBeNull();
    expect(screen.getByText('Cc6')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Coup suivant' })).toBeDisabled();
  });

  it('recalcule le nom de variante après un retour puis une nouvelle branche', async () => {
    render(<App />);
    await openLab('Blancs');
    for (const [from, to] of [
      ['e2', 'e4'],
      ['e7', 'e5'],
      ['g1', 'f3'],
      ['b8', 'c6'],
      ['d2', 'd4'],
      ['e5', 'd4'],
      ['f3', 'd4'],
      ['f8', 'c5'],
    ])
      play(from, to);
    expect(screen.getByText('Variante classique')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Coup précédent' }));
    expect(screen.queryByText('Variante classique')).toBeNull();
    play('g8', 'f6');
    play('b1', 'c3');
    expect(screen.getByText('Variante Schmidt')).toBeVisible();
    expect(screen.queryByText('Fc5')).toBeNull();
  });

  it('restaure précédent/suivant et remet entièrement la session à zéro', async () => {
    render(<App />);
    await openLab('Blancs');
    play('e2', 'e4');
    play('e7', 'e5');
    fireEvent.click(screen.getByRole('button', { name: 'Coup précédent' }));
    expect(square('e7')).toHaveAttribute('aria-label', 'e7, pion noir');
    fireEvent.click(screen.getByRole('button', { name: 'Coup suivant' }));
    expect(square('e5')).toHaveAttribute('aria-label', 'e5, pion noir');
    fireEvent.click(screen.getByRole('button', { name: 'Recommencer' }));
    expect(square('e2')).toHaveAttribute('aria-label', 'e2, pion blanc');
    expect(screen.getByText('Aucun coup pour le moment.')).toBeVisible();
  });

  it('arrête les recommandations après un mat et propose de recommencer', async () => {
    render(<App />);
    await openLab('Blancs');
    play('f2', 'f3');
    play('e7', 'e5');
    play('g2', 'g4');
    play('d8', 'h4');
    expect(await screen.findByText('Partie terminée')).toBeVisible();
    expect(screen.getAllByText('Échec et mat').length).toBeGreaterThanOrEqual(1);
    expect(board()).not.toHaveAttribute('data-arrow-count');
    expect(square('a2')).toHaveAttribute('aria-disabled', 'true');
  });

  it('ne modifie ni la progression guidée ni les badges', async () => {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(emptyProgress()));
    render(<App />);
    await openLab('Blancs');
    const before = localStorage.getItem(PROGRESS_KEY);
    play('e2', 'e4');
    play('e7', 'e5');
    expect(localStorage.getItem(PROGRESS_KEY)).toBe(before);
    expect(screen.queryByRole('status', { name: /badge/i })).toBeNull();
  });

  it.each(['light', 'dark'] as const)('reste utilisable avec le thème %s', async (theme) => {
    localStorage.setItem('chess-progress:theme:v1', theme);
    render(<App />);
    await openLab('Blancs');
    expect(document.documentElement).toHaveAttribute('data-theme', theme);
    await waitFor(() => expect(board()).toHaveAttribute('data-arrow-count', '3'));
    expect(document.querySelectorAll('.board-recommendation-label')).toHaveLength(3);
    expect(
      getComputedStyle(document.querySelector('.board-recommendation-labels')!).pointerEvents,
    ).toBe('none');
  });

  it('retire immédiatement les résultats devenus obsolètes lors d’un retour dans l’historique', async () => {
    render(<App />);
    await openLab('Blancs');
    await waitFor(() => expect(board()).toHaveAttribute('data-arrow-count', '3'));
    play('e2', 'e4');
    expect(board()).not.toHaveAttribute('data-arrow-count');
    fireEvent.click(screen.getByRole('button', { name: 'Coup précédent' }));
    await waitFor(() => expect(board()).toHaveAttribute('data-arrow-count', '3'));
    play('d2', 'd4');
    expect(board()).not.toHaveAttribute('data-arrow-count');
  });
});
