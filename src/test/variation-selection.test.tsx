import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';

describe('Modes immédiatement rattachés à leur variante', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  it('affiche les modes dans la carte sélectionnée, puis remplace cette sélection', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('link', { name: 'OUVERTURES' }));
    fireEvent.click(screen.getByRole('button', { name: /Ouverture italienne/ }));
    const first = screen.getByRole('button', { name: /^Giuoco Piano/ });
    first.focus();
    expect(first).toHaveFocus();
    fireEvent.click(first, { detail: 0 });
    const card = first.closest('.variant-card')! as HTMLElement;
    expect(within(card).getByRole('radio', { name: /^Ligne essentielle/ })).toBeVisible();
    expect(within(card).getByRole('radio', { name: /^Version étendue/ })).toBeVisible();
    expect(screen.getAllByRole('group', { name: 'Choisis ton format' })).toHaveLength(1);
    fireEvent.click(within(card).getByRole('radio', { name: /^Version étendue/ }));
    expect(within(card).getByRole('button', { name: 'Commencer l’entraînement' })).toBeEnabled();
    const second = screen.getByRole('button', { name: /^Deux Cavaliers/ });
    fireEvent.click(second);
    expect(within(card).queryByRole('radio')).not.toBeInTheDocument();
    expect(first).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getAllByRole('radio')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Commencer l’entraînement' })).toBeDisabled();
  });
  it('rapproche seulement une carte hors écran et respecte la réduction des animations', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
    );
    const scroll = vi.fn();
    vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockImplementation(scroll);
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Ouvertures' }));
    fireEvent.click(screen.getByRole('button', { name: /Ouverture italienne/ }));
    const button = screen.getByRole('button', { name: /^Giuoco Piano/ });
    vi.spyOn(button.closest('.variant-card')!, 'getBoundingClientRect').mockReturnValue({
      top: 720,
      bottom: 1200,
      width: 280,
      height: 480,
      left: 0,
      right: 280,
      x: 0,
      y: 720,
      toJSON: () => {},
    });
    fireEvent.click(button);
    act(() => vi.advanceTimersByTime(30));
    expect(scroll).toHaveBeenCalledWith({ block: 'nearest', behavior: 'instant' });
    scroll.mockClear();
    const second = screen.getByRole('button', { name: /^Deux Cavaliers/ });
    vi.spyOn(second.closest('.variant-card')!, 'getBoundingClientRect').mockReturnValue({
      top: 100,
      bottom: 180,
      width: 280,
      height: 80,
      left: 0,
      right: 280,
      x: 0,
      y: 100,
      toJSON: () => {},
    });
    fireEvent.click(second);
    act(() => vi.advanceTimersByTime(30));
    expect(scroll).not.toHaveBeenCalled();
  });
});
