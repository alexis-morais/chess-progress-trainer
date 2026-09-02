import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProgressProvider, useProgress } from '../progress/ProgressContext';
import { BadgeToast, NOTICE_MS, ProgressPage } from '../progress/ProgressPage';
import { badges } from '../progress/badges';
import { loadProgress } from '../progress/model';
import type { GameRecord, ReviewReport } from '../computer/types';

const record = (moves: string[], winner: 'w' | 'b' | null = 'w'): GameRecord => ({
  id: 'game-1',
  startedAt: '2026-01-01T00:00:00.000Z',
  completedAt: '2026-01-01T00:20:00.000Z',
  player: 'w',
  difficulty: 8,
  moves,
  result: winner ? { winner, reason: 'resignation' } : { winner: null, reason: 'draw' },
});

const losingThenWon: ReviewReport = {
  positions: [
    { score: { cp: 0, depth: 12 }, bestMove: null, pv: [] },
    { score: { cp: -450, depth: 12 }, bestMove: null, pv: [] },
  ],
  moves: [],
  counts: { best: 0, excellent: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 },
  accuracy: 62,
};

function Harness() {
  const progress = useProgress();
  const game = record(['a7a8n']);
  return (
    <>
      <button onClick={() => progress.moveComplete(game)}>Coup joué</button>
      <button onClick={() => progress.gameComplete(game)}>Fin de partie</button>
      <button onClick={() => progress.reviewComplete(game, losingThenWon)}>Bilan</button>
      <span data-testid="reviews">{progress.data.reviews}</span>
      <span data-testid="underpromotion">{String(progress.data.underpromotion)}</span>
      <ProgressPage onHome={() => undefined} />
      <BadgeToast />
    </>
  );
}

describe('Badges réellement événementiels', () => {
  beforeEach(() => localStorage.clear());

  it('débloque la sous-promotion au coup joué, sans attendre la fin de la partie', () => {
    render(
      <ProgressProvider>
        <Harness />
      </ProgressProvider>,
    );
    expect(screen.getByTestId('underpromotion')).toHaveTextContent('false');
    fireEvent.click(screen.getByRole('button', { name: 'Coup joué' }));
    expect(screen.getByTestId('underpromotion')).toHaveTextContent('true');
    expect(loadProgress().underpromotion).toBe(true);
    expect(screen.getByRole('status')).toHaveTextContent('Sous-promotion');
    // The badge is already visible in Progression, with no reload and no page change.
    expect(screen.getByRole('heading', { name: 'Sous-promotion' })).toBeVisible();
  });

  it('ne persiste rien de plus quand le coup n’est pas une sous-promotion', () => {
    render(
      <ProgressProvider>
        <Harness />
      </ProgressProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Coup joué' }));
    fireEvent.click(screen.getByRole('button', { name: 'Coup joué' }));
    expect(loadProgress().underpromotion).toBe(true);
    expect(loadProgress().games).toBe(0);
  });

  it('compte un bilan une seule fois, même en rouvrant la sauvegarde locale', () => {
    render(
      <ProgressProvider>
        <Harness />
      </ProgressProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Fin de partie' }));
    fireEvent.click(screen.getByRole('button', { name: 'Bilan' }));
    expect(screen.getByTestId('reviews')).toHaveTextContent('1');
    expect(loadProgress().reviewedGames).toEqual(['game-1']);
    fireEvent.click(screen.getByRole('button', { name: 'Bilan' }));
    fireEvent.click(screen.getByRole('button', { name: 'Bilan' }));
    expect(screen.getByTestId('reviews')).toHaveTextContent('1');
    expect(loadProgress().comeback).toBe(true);
  });

  it('met tous les badges simultanés en file, sans perte ni doublon', () => {
    render(
      <ProgressProvider>
        <Harness />
      </ProgressProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Coup joué' }));
    fireEvent.click(screen.getByRole('button', { name: 'Fin de partie' }));
    fireEvent.click(screen.getByRole('button', { name: 'Bilan' }));
    const announced: string[] = [];
    for (let guard = 0; guard < 12; guard++) {
      const toast = screen.queryByText('Badge débloqué');
      if (!toast) break;
      announced.push(toast.parentElement!.textContent!.replace('Badge débloqué', ''));
      fireEvent.click(screen.getByRole('button', { name: 'Fermer la notification' }));
    }
    expect(new Set(announced).size).toBe(announced.length);
    expect(announced).toContain('Sous-promotion');
    expect(announced).toContain('Premier duel');
    expect(announced).toContain('Première analyse');
    expect(announced).toContain('Retour gagnant');
    expect(announced).toContain('Cap des 1200');
    const unlocked = loadProgress().unlocked;
    for (const badge of badges.filter((entry) => entry.achieved(loadProgress())))
      expect(unlocked[badge.id]).toBeDefined();
  });

  it('enchaîne les notifications sans exiger un clic', () => {
    vi.useFakeTimers();
    render(
      <ProgressProvider>
        <Harness />
      </ProgressProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Fin de partie' }));
    const first = screen.getByRole('status').textContent;
    act(() => vi.advanceTimersByTime(NOTICE_MS));
    expect(screen.getByRole('status').textContent).not.toBe(first);
    vi.useRealTimers();
  });
});
