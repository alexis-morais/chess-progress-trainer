import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Chess } from 'chess.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import ComputerMode from '../computer/ComputerMode';
import { ComputerBoard } from '../computer/ComputerBoard';
import { EvaluationChart } from '../computer/EvaluationChart';
import { GameSession } from '../computer/GameSession';
import { playUci, uci } from '../computer/game';
import { loadLastGame } from '../computer/storage';
import { difficulties } from '../computer/types';
import { exampleAnalyses, legalAnalysis, matedGame } from './fixtures/computer';

// Real ComputerEngine and chessboard; only the Worker process is replaced in DOM tests.
class ProtocolWorker {
  static all: ProtocolWorker[] = [];
  static stall = false;
  onmessage: Worker['onmessage'] = null;
  onerror: Worker['onerror'] = null;
  onmessageerror: Worker['onmessageerror'] = null;
  game = new Chess();
  terminate = vi.fn();
  constructor() {
    ProtocolWorker.all.push(this);
  }
  emit(data: string) {
    this.onmessage?.call(this as unknown as Worker, { data } as MessageEvent);
  }
  postMessage = vi.fn((command: string) => {
    queueMicrotask(() => {
      if (this.terminate.mock.calls.length) return;
      if (command === 'uci')
        this.emit(
          'option name Skill Level type spin default 20 min 0 max 20\noption name MultiPV type spin default 1 min 1 max 256\noption name UCI_LimitStrength type check default false\noption name UCI_Elo type spin default 1320 min 1320 max 3190\nuciok',
        );
      else if (command === 'isready') this.emit('readyok');
      else if (command.startsWith('position startpos')) {
        this.game = new Chess();
        for (const token of command.split(' moves ')[1]?.split(' ') ?? [])
          playUci(this.game, token);
      } else if (command.startsWith('go ') && !ProtocolWorker.stall) {
        const legal = this.game.moves({ verbose: true });
        const best =
          legal.find((move) => move.san.endsWith('#')) ??
          legal.find((move) => uci(move) === 'c7c5');
        const token = best ? uci(best) : legalAnalysis(this.game.fen()).bestMove;
        this.emit(`info depth 10 score cp 20 pv ${token}\nbestmove ${token}`);
      } else if (command === 'stop') this.emit('bestmove e2e4');
    });
  });
}
function play(from: string, to: string) {
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${from},`) }));
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${to},`) }));
}
async function start() {
  fireEvent.click(screen.getByRole('button', { name: 'Commencer la partie' }));
  await waitFor(() =>
    expect(screen.getByTestId('computer-turn')).not.toHaveTextContent('Préparation'),
  );
}
async function resignGame() {
  fireEvent.click(screen.getByRole('button', { name: 'Abandonner' }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirmer l’abandon' }));
  await screen.findByRole('button', { name: 'Analyser ma partie' });
}
beforeEach(() => {
  localStorage.clear();
  ProtocolWorker.all = [];
  ProtocolWorker.stall = false;
  vi.stubGlobal('Worker', ProtocolWorker);
});

describe('Partie libre : parcours avec le véritable échiquier', () => {
  it('déclenche la fin de partie quand le moteur joue réellement un mat', async () => {
    const prefix = matedGame();
    prefix.moves = prefix.moves.slice(0, 3);
    prefix.result = null;
    delete prefix.completedAt;
    const onEnd = vi.fn();
    render(<GameSession initial={prefix} onEnd={onEnd} />);
    // The mated king stays on screen for a short beat (MATE_SEQUENCE_MS) before onEnd fires.
    await screen.findByTestId('mate-badge');
    expect(screen.getByRole('button', { name: /échec et mat/ })).toHaveAttribute(
      'data-mate',
      'true',
    );
    expect(onEnd).not.toHaveBeenCalled();
    await waitFor(() => expect(onEnd).toHaveBeenCalledOnce(), { timeout: 3000 });
    expect(onEnd.mock.calls[0][0].result).toEqual({ winner: 'b', reason: 'checkmate' });
    expect(onEnd.mock.calls[0][0].moves.at(-1)).toBe('d8h4');
    expect(screen.getByRole('button', { name: 'h2, pion blanc' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });
  it('respecte le délai maximum de 2 s entre le mat joué par le joueur et la fin de partie', async () => {
    const prefix = matedGame('b');
    prefix.moves = prefix.moves.slice(0, 3);
    prefix.result = null;
    delete prefix.completedAt;
    const onEnd = vi.fn();
    render(<GameSession initial={prefix} onEnd={onEnd} />);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'd8, dame noire' })).not.toHaveAttribute(
        'aria-disabled',
        'true',
      ),
    );
    const before = performance.now();
    play('d8', 'h4');
    await screen.findByTestId('mate-badge');
    expect(onEnd).not.toHaveBeenCalled();
    await waitFor(() => expect(onEnd).toHaveBeenCalledOnce(), { timeout: 3000 });
    const elapsed = performance.now() - before;
    // Comfortably inside the 2 s ceiling, and not an instant cut either.
    expect(elapsed).toBeGreaterThanOrEqual(1000);
    expect(elapsed).toBeLessThanOrEqual(2000);
  });
  it('ne retarde jamais une fin de partie qui n’est pas un mat', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('link', { name: 'ENTRAÎNEMENT LIBRE' }));
    fireEvent.click(await screen.findByRole('radio', { name: 'Blancs' }));
    await start();
    const before = performance.now();
    await resignGame();
    expect(performance.now() - before).toBeLessThan(400);
    expect(await screen.findByRole('heading', { name: 'Défaite' })).toBeVisible();
  });
  it('ajoute un accès séparé sans démarrer Stockfish sur l’accueil', async () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'ENTRAÎNEMENT LIBRE' })).toBeVisible();
    expect(ProtocolWorker.all).toHaveLength(0);
    fireEvent.click(screen.getByRole('link', { name: 'ENTRAÎNEMENT LIBRE' }));
    expect(await screen.findByRole('heading', { name: 'Prépare ta partie' })).toBeVisible();
    expect(ProtocolWorker.all).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'Retour à l’accueil' }));
    fireEvent.click(screen.getByRole('link', { name: 'OUVERTURES' }));
    expect(screen.getByRole('button', { name: /Ouverture italienne/ })).toBeVisible();
  });
  it('laisse les Blancs commencer, refuse un coup illégal et applique le choix libre du moteur', async () => {
    const { unmount } = render(<ComputerMode onHome={vi.fn()} />);
    expect(screen.getByText(/Ta partie, tes décisions/)).toBeVisible();
    await start();
    expect(screen.queryByText(/Ta partie, tes décisions/)).toBeNull();
    expect(document.querySelector('.computer-panel')?.firstElementChild).toHaveTextContent(
      'Les coups joués',
    );
    expect(screen.getByRole('button', { name: 'Abandonner' })).toBeVisible();
    expect(document.querySelector('.computer-board')).toHaveAttribute('data-orientation', 'white');
    expect(ProtocolWorker.all[0].postMessage).not.toHaveBeenCalledWith(
      expect.stringMatching(/^go /),
    );
    play('e2', 'e5');
    expect(screen.getByRole('alert')).toHaveTextContent('illégal');
    expect(screen.getByRole('button', { name: 'e2, pion blanc' })).toBeInTheDocument();
    expect(screen.getByTestId('computer-move-badge')).toHaveClass('incorrect');
    play('e2', 'e4');
    await screen.findByRole('button', { name: 'c5, pion noir' });
    expect(screen.getByTestId('computer-turn')).toBeEmptyDOMElement();
    expect(screen.getByRole('button', { name: 'e7, pion noir' })).toBeInTheDocument();
    expect(screen.getByText('c5')).toBeVisible();
    unmount();
    expect(ProtocolWorker.all[0].terminate).toHaveBeenCalled();
  });
  it.each(difficulties)(
    'joue automatiquement le premier coup avec les Noirs au niveau $name',
    async (level) => {
      render(<ComputerMode onHome={vi.fn()} />);
      fireEvent.click(screen.getByRole('radio', { name: 'Noirs' }));
      fireEvent.change(screen.getByRole('slider', { name: 'Niveau de l’ordinateur' }), {
        target: { value: level.id },
      });
      await start();
      await screen.findByRole('button', { name: 'e4, pion blanc' });
      expect(document.querySelector('.computer-board')).toHaveAttribute(
        'data-orientation',
        'black',
      );
      expect(document.querySelector('.computer-board [data-square]')).toHaveAttribute(
        'data-square',
        'h1',
      );
      expect(ProtocolWorker.all[0].postMessage).toHaveBeenCalledWith(
        `setoption name Skill Level value ${level.settings.skill}`,
      );
      play('c7', 'c5');
      expect(screen.getByRole('button', { name: 'c5, pion noir' })).toBeInTheDocument();
    },
  );
  it('permet un camp aléatoire et demande confirmation avant l’abandon', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9);
    render(<ComputerMode onHome={vi.fn()} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Aléatoire' }));
    await start();
    await screen.findByRole('button', { name: 'e4, pion blanc' });
    expect(document.querySelector('.computer-board')).toHaveAttribute('data-orientation', 'black');
    fireEvent.click(screen.getByRole('button', { name: 'Abandonner' }));
    expect(screen.getByRole('dialog', { name: 'Abandonner la partie ?' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Défaite' })).toBeNull();
    await resignGame();
    expect(screen.getByRole('heading', { name: 'Défaite' })).toBeVisible();
    expect(loadLastGame()?.game.result?.reason).toBe('resignation');
  });
  it('propose les quatre promotions et joue la pièce choisie', () => {
    const onMove = vi.fn(() => true);
    render(<ComputerBoard fen="7k/P7/8/8/8/8/8/7K w - - 0 1" player="w" enabled onMove={onMove} />);
    play('a7', 'a8');
    expect(screen.getByRole('dialog')).toHaveTextContent('promotion');
    expect(onMove).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Cavalier' }));
    expect(onMove).toHaveBeenCalledWith('a7', 'a8', 'n');
  });
  it('garde la partie en pause quand le Worker échoue, puis permet de le relancer', async () => {
    render(<ComputerMode onHome={vi.fn()} />);
    await start();
    act(() =>
      ProtocolWorker.all[0].onerror?.call(
        ProtocolWorker.all[0] as unknown as Worker,
        {} as ErrorEvent,
      ),
    );
    expect(screen.getByRole('alert')).toHaveTextContent('indisponible');
    expect(screen.getByRole('button', { name: 'e2, pion blanc' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Relancer Stockfish' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'e2, pion blanc' })).toHaveAttribute(
        'aria-disabled',
        'false',
      ),
    );
    expect(ProtocolWorker.all).toHaveLength(2);
  });
  it('analyse après la partie, affiche commentaire, meilleure suite et navigation, puis retrouve le bilan', async () => {
    const view = render(<ComputerMode onHome={vi.fn()} />);
    await start();
    play('e2', 'e4');
    await screen.findByRole('button', { name: 'c5, pion noir' });
    await resignGame();
    expect(ProtocolWorker.all).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Analyser ma partie' }));
    await screen.findByRole('region', { name: 'Résumé de tes coups' });
    expect(ProtocolWorker.all).toHaveLength(2);
    expect(ProtocolWorker.all.every((worker) => worker.terminate.mock.calls.length > 0)).toBe(true);
    // The bilan opens on the starting position, filter "Tous les coups", not on any move.
    expect(screen.getByTestId('review-position')).toHaveTextContent('0 / 2');
    expect(screen.getByRole('button', { name: 'Premier coup' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Coup précédent' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Coup suivant' }));
    expect(screen.getByTestId('review-position')).toHaveTextContent('1 / 2');
    expect(screen.getByTestId('review-comment')).toHaveTextContent('centre');
    expect(screen.getByText('✓ Meilleur coup')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Meilleur coup' })).toBeNull();
    // The played move was already the best: no arrow at all, the pawn simply stands on e4.
    expect(document.querySelector('.computer-board')).not.toHaveAttribute('data-arrow-kind');
    expect(document.querySelector('.computer-board')).not.toHaveAttribute('data-arrow-count');
    expect(document.querySelector('[id*="arrowhead-0-e2-e4"]')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Premier coup' }));
    expect(screen.getByTestId('review-position')).toHaveTextContent('0 / 2');
    expect(screen.getByRole('button', { name: 'Coup précédent' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Coup suivant' }));
    expect(screen.getByTestId('review-position')).toHaveTextContent('1 / 2');
    fireEvent.click(screen.getByRole('button', { name: 'Dernier coup' }));
    expect(screen.getByTestId('review-position')).toHaveTextContent('2 / 2');
    expect(screen.getByRole('button', { name: 'Dernier coup' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Coup suivant' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Coup précédent' }));
    expect(screen.getByTestId('review-position')).toHaveTextContent('1 / 2');
    fireEvent.change(screen.getByRole('slider', { name: 'Position sur la courbe' }), {
      target: { value: '2' },
    });
    expect(screen.getByTestId('review-position')).toHaveTextContent('2 / 2');
    expect(loadLastGame()?.review?.moves).toHaveLength(1);
    view.unmount();
    render(<ComputerMode onHome={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Revoir le bilan' }));
    expect(screen.getByRole('region', { name: 'Résumé de tes coups' })).toBeVisible();
    expect(ProtocolWorker.all).toHaveLength(2);
  });
  it('annule proprement une analyse quand on quitte son écran', async () => {
    render(<ComputerMode onHome={vi.fn()} />);
    await start();
    await resignGame();
    ProtocolWorker.stall = true;
    fireEvent.click(screen.getByRole('button', { name: 'Analyser ma partie' }));
    await waitFor(() =>
      expect(ProtocolWorker.all[1].postMessage).toHaveBeenCalledWith(expect.stringMatching(/^go /)),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Annuler l’analyse' }));
    expect(ProtocolWorker.all[1].terminate).toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Défaite' })).toBeVisible();
    expect(loadLastGame()?.review).toBeNull();
  });
  it('permet de choisir une position par le graphique, avec une échelle de mat bornée', () => {
    const onSelect = vi.fn();
    render(<EvaluationChart positions={exampleAnalyses()} selected={0} onSelect={onSelect} />);
    const chart = screen.getByRole('img');
    vi.spyOn(chart, 'getBoundingClientRect').mockReturnValue({ left: 100, width: 720 } as DOMRect);
    fireEvent.click(chart, { clientX: 808 });
    expect(onSelect).toHaveBeenLastCalledWith(4);
    fireEvent.click(chart, { clientX: 138 });
    expect(onSelect).toHaveBeenLastCalledWith(0);
    expect(chart.querySelector('polyline')?.getAttribute('points')).not.toMatch(/NaN|Infinity/);
    expect(screen.getAllByText('M')).toHaveLength(2);
  });
  it('adapte la courbe au téléphone sans étirer les libellés ni perdre la sélection', () => {
    let resize = () => {};
    const disconnect = vi.fn();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          resize = callback;
        }
        observe() {}
        disconnect = disconnect;
      },
    );
    const onSelect = vi.fn();
    const view = render(
      <EvaluationChart positions={exampleAnalyses()} selected={2} onSelect={onSelect} />,
    );
    const chart = screen.getByRole('img');
    vi.spyOn(chart, 'getBoundingClientRect').mockReturnValue({ left: 16, width: 320 } as DOMRect);
    act(() => resize());
    expect(chart).toHaveAttribute('viewBox', '0 0 320 170');
    expect(screen.getByRole('slider')).toHaveValue('2');
    expect(screen.getByText('Coup 2')).toHaveAttribute('text-anchor', 'end');
    fireEvent.click(chart, { clientX: 189 });
    expect(onSelect).toHaveBeenLastCalledWith(2);
    view.unmount();
    expect(disconnect).toHaveBeenCalled();
  });
});
