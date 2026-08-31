import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HomePage } from '../components/HomePage';

describe('Cartes mobiles enrichies, liens sémantiques conservés', () => {
  it.each(['openings', 'freeplay'] as const)(
    '%s : le visuel est décoratif, local et inclus dans le lien',
    (kind) => {
      render(<HomePage onOpenings={vi.fn()} onComputer={vi.fn()} />);
      const art = screen.getByTestId(`art-${kind}`),
        link = art.closest('a')!;
      expect(art).toHaveAttribute('aria-hidden', 'true');
      expect(link).toHaveAttribute('href', kind === 'openings' ? '#/ouvertures' : '#/partie');
      expect(link.querySelectorAll('button,a')).toHaveLength(0);
      for (const picture of art.querySelectorAll('image'))
        expect(picture.getAttribute('href')).toMatch(/\/pieces\/cburnett\/[wb][PNBRQK]\.svg$/);
      expect(link.querySelector('.mobile-path-meta')).toHaveTextContent(
        kind === 'openings' ? '10 ouvertures20 tactiques' : '25 niveauxAnalyse après partie',
      );
    },
  );
  it.each(['openings', 'computer'] as const)(
    '%s : cliquer le visuel ou la flèche déclenche la même action',
    (kind) => {
      const onOpenings = vi.fn(),
        onComputer = vi.fn();
      render(<HomePage onOpenings={onOpenings} onComputer={onComputer} />);
      const callback = kind === 'openings' ? onOpenings : onComputer;
      fireEvent.click(screen.getByTestId(`${kind}-card-arrow`));
      fireEvent.click(screen.getByTestId(`art-${kind === 'openings' ? 'openings' : 'freeplay'}`));
      expect(callback).toHaveBeenCalledTimes(2);
      const link = screen.getByRole('link', {
        name: kind === 'openings' ? 'OUVERTURES' : 'ENTRAÎNEMENT LIBRE',
      });
      link.focus();
      expect(link).toHaveFocus();
      fireEvent.click(link, { detail: 0 });
      expect(callback).toHaveBeenCalledTimes(3);
      expect(within(link).getByRole('heading')).toBeVisible();
    },
  );
});
