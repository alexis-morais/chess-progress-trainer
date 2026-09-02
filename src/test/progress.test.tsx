import { StrictMode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { ProgressProvider, useProgress } from '../progress/ProgressContext';
import { BadgeToast, ProgressPage } from '../progress/ProgressPage';
import { badges } from '../progress/badges';
import {
  PROGRESS_KEY,
  emptyProgress,
  loadProgress,
  parseProgress,
  playerUnderpromoted,
  saveProgress,
  wasComebackWin,
} from '../progress/model';
import type { GameRecord, ReviewReport } from '../computer/types';

const wonGame = (difficulty = 8): GameRecord => ({
  id: 'g', startedAt: '2026-01-01T00:00:00.000Z', completedAt: '2026-01-01T00:10:00.000Z',
  player: 'w', difficulty: difficulty as GameRecord['difficulty'], moves: ['e2e4'],
  result: { winner: 'w', reason: 'resignation' },
});

function Harness() {
  const progress = useProgress();
  return <>
    <button onClick={() => progress.discover('italian')}>Découvrir</button>
    <button onClick={() => progress.trainingComplete({ openingId: 'italian', variationId: 'giuoco-piano', mode: 'essential', errors: 1, clues: 1, solutions: 1 })}>Terminer</button>
    <button onClick={() => progress.trainingComplete({ openingId: 'italian', variationId: 'giuoco-piano', mode: 'extended', errors: 0, clues: 0, solutions: 0 })}>Parfait</button>
    <button onClick={() => progress.tacticComplete('t1')}>Tactique</button>
    <button onClick={() => progress.gameComplete(wonGame())}>Duel</button>
    <ProgressPage onHome={() => undefined} /><BadgeToast />
  </>;
}

describe('Progression locale et badges', () => {
  beforeEach(() => localStorage.clear());

  it('récupère sans planter après JSON corrompu, ancienne version ou valeurs impossibles', () => {
    localStorage.setItem(PROGRESS_KEY, '{cassé');
    expect(loadProgress()).toEqual(emptyProgress());
    expect(parseProgress({ version: -1, games: 9 })).toEqual(emptyProgress());
    const parsed = parseProgress({
      version: 1,
      games: -8,
      reviews: 99,
      discoveries: ['italian', 'ouverture-inconnue', 2],
      tactics: ['tactique-inconnue'],
      training: {
        'inconnue/fausse/essential': {
          completions: 99,
          bestErrors: 0,
          withoutSolution: true,
          perfect: true,
        },
      },
      wonLevels: [0, 8, 26],
    });
    expect(parsed.games).toBe(0);
    expect(parsed.reviews).toBe(0);
    expect(parsed.discoveries).toEqual(['italian']);
    expect(parsed.tactics).toEqual([]);
    expect(parsed.training).toEqual({});
    expect(parsed.wonLevels).toEqual([8]);
  });

  it('migre une ancienne structure connue vers la version actuelle', () => {
    const migrated = parseProgress({
      version: 0,
      discoveries: ['italian'],
      completedVariants: ['italian/giuoco-piano/essential'],
      solvedTactics: ['italian-tactic-1'],
      games: 2,
      reviews: 1,
    });
    expect(migrated.version).toBe(1);
    expect(migrated.training['italian/giuoco-piano/essential']?.completions).toBe(1);
    expect(migrated.tactics).toEqual(['italian-tactic-1']);
    expect(migrated.reviews).toBe(1);
  });

  it('sauvegarde une structure validée et ne dépend d’aucun compte', () => {
    const data = emptyProgress(); data.games = 1;
    expect(saveProgress(data)).toBe(true);
    expect(loadProgress().games).toBe(1);
  });

  it('débloque les vrais premiers accomplissements avec notification et date', () => {
    render(<ProgressProvider><Harness /></ProgressProvider>);
    expect(screen.getAllByRole('heading', { name: '???' })).toHaveLength(5);
    fireEvent.click(screen.getByRole('button', { name: 'Terminer' }));
    expect(screen.getByText('Badge débloqué').parentElement).toHaveTextContent('Premier pas');
    expect(screen.getByRole('heading', { name: 'Premier pas' }).closest('article')).toHaveClass('unlocked');
    expect(screen.getByRole('heading', { name: 'Premier pas' }).closest('article')).toHaveTextContent('Débloqué le');
    fireEvent.click(screen.getByRole('button', { name: 'Fermer la notification' }));
    expect(screen.getByText('Badge débloqué').parentElement).toHaveTextContent(
      'Découverte · Ouverture italienne',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Fermer la notification' }));
    fireEvent.click(screen.getByRole('button', { name: 'Duel' }));
    expect(screen.getByText('Badge débloqué').parentElement).toHaveTextContent('Premier duel');
  });

  it('conserve les badges secrets masqués avant leur obtention', () => {
    render(<ProgressProvider><ProgressPage onHome={() => undefined} /></ProgressProvider>);
    expect(screen.getAllByRole('heading', { name: '???' })).toHaveLength(5);
    expect(screen.queryByText('Sous-promotion')).toBeNull();
  });

  it('notifie chaque badge simultané une fois, y compris Perfectionniste', () => {
    render(<ProgressProvider><Harness /></ProgressProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Parfait' }));
    for (const expected of [
      'Premier pas',
      'Sans filet',
      'Découverte · Ouverture italienne',
      'Perfectionniste',
    ]) {
      expect(screen.getByRole('status')).toHaveTextContent(expected);
      fireEvent.click(screen.getByRole('button', { name: 'Fermer la notification' }));
    }
    expect(screen.queryByText('Badge débloqué')).toBeNull();
  });

  it('n’enregistre qu’une séance sous StrictMode', () => {
    render(<StrictMode><ProgressProvider><Harness /></ProgressProvider></StrictMode>);
    fireEvent.click(screen.getByRole('button', { name: 'Terminer' }));
    expect(loadProgress().training['italian/giuoco-piano/essential']?.completions).toBe(1);
  });

  it('ne redébloque pas un accomplissement déjà acquis', () => {
    render(<ProgressProvider><Harness /></ProgressProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Terminer' }));
    fireEvent.click(screen.getByRole('button', { name: 'Fermer la notification' }));
    fireEvent.click(screen.getByRole('button', { name: 'Fermer la notification' }));
    fireEvent.click(screen.getByRole('button', { name: 'Terminer' }));
    fireEvent.click(screen.getByRole('button', { name: 'Découvrir' }));
    fireEvent.click(screen.getByRole('button', { name: 'Découvrir' }));
    expect(screen.queryByText('Badge débloqué')).toBeNull();
  });

  it('applique exactement les cinq conditions secrètes prévues', () => {
    const data = emptyProgress();
    data.underpromotion = true;
    data.training['italian/giuoco-piano/extended'] = {
      completions: 1, bestErrors: 0, withoutSolution: true, perfect: true,
    };
    data.comeback = true;
    data.unlocked.david = '2026-01-01T00:00:00.000Z';
    data.wonLevels = [25];
    const secrets = badges.filter((badge) => badge.secret);
    expect(secrets.map((badge) => badge.name)).toEqual([
      'Sous-promotion', 'Perfectionniste', 'Retour gagnant', 'David contre Goliath', 'Défier l’impossible',
    ]);
    expect(secrets.every((badge) => badge.achieved(data))).toBe(true);
  });

  it('réserve Seconde lecture à une répétition réellement terminée sans erreur', () => {
    const badge = badges.find((entry) => entry.id === 'second-reading')!;
    const data = emptyProgress();
    data.training['italian/giuoco-piano/essential'] = {
      completions: 2,
      bestErrors: 0,
      withoutSolution: true,
      perfect: false,
      replayedWithoutError: false,
    };
    expect(badge.achieved(data)).toBe(false);
    data.training['italian/giuoco-piano/essential'].replayedWithoutError = true;
    expect(badge.achieved(data)).toBe(true);
  });

  it('détecte une vraie sous-promotion du joueur uniquement', () => {
    expect(playerUnderpromoted({ ...wonGame(), moves: ['a2a4', 'b7b8n'] })).toBe(false);
    expect(playerUnderpromoted({ ...wonGame(), moves: ['a7a8n'] })).toBe(true);
    expect(playerUnderpromoted({ ...wonGame(), moves: ['a7a8q'] })).toBe(false);
  });

  it('détecte un retour gagnant à partir du bilan moteur', () => {
    const report = {
      positions: [
        { score: { cp: 0, depth: 12 }, bestMove: null, pv: [] },
        { score: { cp: -420, depth: 12 }, bestMove: null, pv: [] },
      ], moves: [], counts: { best: 0, excellent: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 }, accuracy: 70,
    } satisfies ReviewReport;
    expect(wasComebackWin(wonGame(), report)).toBe(true);
    expect(wasComebackWin({ ...wonGame(), result: { winner: 'b', reason: 'checkmate' } }, report)).toBe(false);
  });

  it('propose un ensemble sobre de caps, sans badge pour chacun des 25 niveaux', () => {
    expect(badges.filter((badge) => badge.id.startsWith('cap-')).map((badge) => badge.name)).toEqual([
      'Cap des 1000', 'Cap des 1200', 'Cap des 1600', 'Cap des 2000',
    ]);
    expect(badges).toHaveLength(41);
  });
});
