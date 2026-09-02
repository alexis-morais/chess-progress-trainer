import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProgressProvider, useProgress } from '../progress/ProgressContext';
import { BadgeToast, ProgressPage } from '../progress/ProgressPage';
import { badges, openingBadges } from '../progress/badges';
import {
  catalogueCompletion,
  catalogueTotal,
  emptyProgress,
  loadProgress,
  openingCompletion,
  variationCompleted,
  type ProgressData,
} from '../progress/model';
import { openings, type LessonMode } from '../data/openings';
import { OpeningLibrary } from '../components/OpeningLibrary';

const scotch = openings.find((opening) => opening.id === 'scotch')!;

function complete(data: ProgressData, openingId: string, variationId: string, mode: LessonMode) {
  data.training[`${openingId}/${variationId}/${mode}`] = {
    completions: 1,
    bestErrors: 0,
    withoutSolution: false,
    perfect: false,
  };
  return data;
}

function Harness({ openingId, variationId }: { openingId: string; variationId: string }) {
  const progress = useProgress();
  return (
    <>
      {(['essential', 'extended'] as const).map((mode) => (
        <button
          key={mode}
          onClick={() =>
            progress.trainingComplete({
              openingId,
              variationId,
              mode,
              errors: 1,
              clues: 0,
              solutions: 1,
            })
          }
        >
          Terminer {mode}
        </button>
      ))}
      <ProgressPage onHome={() => undefined} />
      <BadgeToast />
    </>
  );
}

describe('Progression des variantes d’ouvertures', () => {
  beforeEach(() => localStorage.clear());

  it('calcule le total depuis le catalogue, sans valeur codée en dur', () => {
    expect(catalogueTotal).toBe(
      openings.reduce((total, opening) => total + opening.variations.length, 0),
    );
    expect(catalogueCompletion(emptyProgress())).toEqual({ done: 0, total: catalogueTotal });
  });

  it('compte une variante une seule fois, quel que soit le format terminé', () => {
    const data = emptyProgress();
    complete(data, 'scotch', 'scotch-classical', 'essential');
    expect(variationCompleted(data, 'scotch', 'scotch-classical')).toBe(true);
    expect(openingCompletion(data, 'scotch')).toEqual({ done: 1, total: 6 });
    complete(data, 'scotch', 'scotch-classical', 'extended');
    expect(openingCompletion(data, 'scotch')).toEqual({ done: 1, total: 6 });
    expect(catalogueCompletion(data).done).toBe(1);
    complete(data, 'scotch', 'schmidt', 'extended');
    expect(openingCompletion(data, 'scotch')).toEqual({ done: 2, total: 6 });
  });

  it('affiche le compteur et une coche discrète dans le catalogue', () => {
    const data = emptyProgress();
    complete(data, 'scotch', 'scotch-classical', 'essential');
    complete(data, 'scotch', 'schmidt', 'extended');
    complete(data, 'scotch', 'steinitz', 'essential');
    localStorage.setItem('chess-progress:progress:v1', JSON.stringify(data));
    render(
      <ProgressProvider>
        <OpeningLibrary
          onHome={vi.fn()}
          openings={openings}
          expanded="scotch"
          selected={null}
          mode={null}
          onMode={vi.fn()}
          onExpand={vi.fn()}
          onSelect={vi.fn()}
          onStart={vi.fn()}
          onTactic={vi.fn()}
        />
      </ProgressProvider>,
    );
    expect(screen.getByTestId('opening-progress-scotch')).toHaveTextContent(
      '3 / 6 variantes terminées',
    );
    expect(screen.getByTestId('opening-progress-italian')).toHaveTextContent(
      '0 / 6 variantes terminées',
    );
    expect(screen.getByTestId('catalogue-progress')).toHaveTextContent(`3 / ${catalogueTotal}`);
    expect(screen.getByTestId('variation-done-scotch-classical')).toBeInTheDocument();
    expect(screen.getByTestId('variation-done-schmidt')).toBeInTheDocument();
    expect(screen.queryByTestId('variation-done-scotch-gambit')).toBeNull();
    // Never colour or icon alone: a screen reader gets the same information.
    expect(screen.getByTestId('opening-progress-scotch')).toHaveAttribute(
      'aria-label',
      '3 sur 6 variantes terminées',
    );
  });

  it('affiche 6 / 6 avec une coche quand l’ouverture est complète', () => {
    const data = emptyProgress();
    scotch.variations.forEach((variation) => complete(data, 'scotch', variation.id, 'essential'));
    localStorage.setItem('chess-progress:progress:v1', JSON.stringify(data));
    render(
      <ProgressProvider>
        <OpeningLibrary
          onHome={vi.fn()}
          openings={openings}
          expanded={null}
          selected={null}
          mode={null}
          onMode={vi.fn()}
          onExpand={vi.fn()}
          onSelect={vi.fn()}
          onStart={vi.fn()}
          onTactic={vi.fn()}
        />
      </ProgressProvider>,
    );
    const counter = screen.getByTestId('opening-progress-scotch');
    expect(counter).toHaveTextContent('6 / 6');
    expect(counter).toHaveClass('complete');
    expect(counter).toHaveAttribute('aria-label', '6 sur 6 variantes terminées, ouverture complète');
  });

  it('propose une Découverte et une Maîtrise par ouverture, plus le Grand Théoricien', () => {
    expect(openingBadges).toHaveLength(openings.length * 2);
    expect(badges.filter((badge) => badge.id.startsWith('opening-'))).toHaveLength(openings.length);
    expect(badges.filter((badge) => badge.id.startsWith('mastery-'))).toHaveLength(openings.length);
    expect(badges.find((badge) => badge.id === 'opening-scotch')!.name).toBe(
      `Découverte · ${scotch.name}`,
    );
    expect(badges.find((badge) => badge.id === 'mastery-scotch')!.name).toBe(
      `Maîtrise · ${scotch.name}`,
    );
    // No two badges share exactly the same condition.
    const data = emptyProgress();
    scotch.variations.forEach((variation) => complete(data, 'scotch', variation.id, 'essential'));
    expect(badges.find((badge) => badge.id === 'mastery-scotch')!.achieved(data)).toBe(true);
    expect(badges.find((badge) => badge.id === 'mastery-italian')!.achieved(data)).toBe(false);
    expect(badges.find((badge) => badge.id === 'grand-theorist')!.achieved(data)).toBe(false);
    expect(badges.find((badge) => badge.id === 'theorist')!.achieved(data)).toBe(true);
    expect(badges.find((badge) => badge.id === 'explorer')!.achieved(data)).toBe(false);
  });

  it('débloque le Grand Théoricien et l’Explorateur sur des conditions du catalogue', () => {
    const data = emptyProgress();
    for (const opening of openings)
      complete(data, opening.id, opening.variations[0].id, 'essential');
    expect(badges.find((badge) => badge.id === 'explorer')!.achieved(data)).toBe(true);
    expect(badges.find((badge) => badge.id === 'grand-theorist')!.achieved(data)).toBe(false);
    for (const opening of openings)
      for (const variation of opening.variations)
        complete(data, opening.id, variation.id, 'essential');
    expect(badges.find((badge) => badge.id === 'grand-theorist')!.achieved(data)).toBe(true);
    expect(badges.find((badge) => badge.id === 'grand-theorist')!.progress(data)).toEqual([
      catalogueTotal,
      catalogueTotal,
    ]);
  });

  it('enregistre, coche, compte et notifie dès la fin de la variante', () => {
    render(
      <ProgressProvider>
        <Harness openingId="scotch" variationId="scotch-classical" />
      </ProgressProvider>,
    );
    expect(screen.getByTestId('catalogue-progress')).toHaveTextContent(`0 / ${catalogueTotal}`);
    fireEvent.click(screen.getByRole('button', { name: 'Terminer essential' }));
    // Persisted, counted and announced without changing page or reloading.
    expect(loadProgress().training['scotch/scotch-classical/essential']?.completions).toBe(1);
    expect(screen.getByTestId('repertoire-scotch')).toHaveTextContent('1 / 6');
    expect(screen.getByTestId('catalogue-progress')).toHaveTextContent(`1 / ${catalogueTotal}`);
    expect(screen.getByRole('status')).toHaveTextContent('Premier pas');
    fireEvent.click(screen.getByRole('button', { name: 'Fermer la notification' }));
    expect(screen.getByRole('status')).toHaveTextContent(`Découverte · ${scotch.name}`);
    fireEvent.click(screen.getByRole('button', { name: 'Fermer la notification' }));
    // The second format of the same variation must not move the counter again.
    fireEvent.click(screen.getByRole('button', { name: 'Terminer extended' }));
    expect(screen.getByTestId('repertoire-scotch')).toHaveTextContent('1 / 6');
    expect(screen.getByTestId('catalogue-progress')).toHaveTextContent(`1 / ${catalogueTotal}`);
  });

  it('regroupe les accomplissements sans mur de badges', () => {
    const data = emptyProgress();
    complete(data, 'scotch', 'scotch-classical', 'essential');
    localStorage.setItem('chess-progress:progress:v1', JSON.stringify(data));
    render(
      <ProgressProvider>
        <ProgressPage onHome={() => undefined} />
      </ProgressProvider>,
    );
    for (const name of ['Général', 'Ouvertures', 'Tactiques', 'Partie libre', 'Badges secrets'])
      expect(screen.getByRole('heading', { name })).toBeVisible();
    // The twenty per-opening badges are rows, not twenty extra cards.
    expect(document.querySelectorAll('.badge-card')).toHaveLength(
      badges.filter((badge) => !badge.compact).length,
    );
    expect(document.querySelectorAll('.repertoire-list li')).toHaveLength(openings.length);
    const row = screen.getByTestId('repertoire-scotch').closest('li')!;
    expect(within(row).getByLabelText(`Découverte · ${scotch.name} : obtenu`)).toBeVisible();
    expect(within(row).getByLabelText(`Maîtrise · ${scotch.name} : à obtenir`)).toBeVisible();
  });
});
