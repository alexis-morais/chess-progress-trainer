import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import App from '../App';
import { THEME_KEY } from '../ui/theme';

function mockSystem(dark = false) {
  const listeners = new Set<() => void>();
  const media = {
    matches: dark,
    addEventListener: vi.fn((_event, callback) => listeners.add(callback)),
    removeEventListener: vi.fn((_event, callback) => listeners.delete(callback)),
  };
  vi.stubGlobal('matchMedia', () => media);
  return {
    media,
    change(value: boolean) {
      act(() => {
        media.matches = value;
        listeners.forEach((fn) => fn());
      });
    },
  };
}
beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});

describe('Thèmes et navigation sans perte de fonctionnalités', () => {
  it.each(['light', 'dark'] as const)(
    'restaure le choix %s, même si le système préfère l’autre thème',
    (theme) => {
      localStorage.setItem(THEME_KEY, theme);
      mockSystem(theme !== 'dark');
      render(<App />);
      expect(document.documentElement).toHaveAttribute('data-theme', theme);
      expect(
        screen.getByRole('button', {
          name: theme === 'light' ? 'Activer le thème sombre' : 'Activer le thème clair',
        }),
      ).toBeVisible();
    },
  );
  it('suit le système tant que le choix n’est pas manuel et retire l’écoute au démontage', () => {
    const system = mockSystem(true);
    const view = render(<App />);
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    system.change(false);
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    fireEvent.click(screen.getByRole('button', { name: 'Activer le thème sombre' }));
    expect(localStorage.getItem(THEME_KEY)).toBe('dark');
    system.change(true);
    system.change(false);
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    view.unmount();
    expect(system.media.removeEventListener).toHaveBeenCalled();
  });
  it('conserve le choix lors d’un nouveau chargement', () => {
    mockSystem(false);
    const first = render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Activer le thème sombre' }));
    first.unmount();
    render(<App />);
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  });
  it('tolère le stockage interdit et applique malgré tout le changement pendant la session', () => {
    mockSystem(false);
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Activer le thème sombre' }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  });
  it('ignore une préférence invalide et synchronise une préférence changée dans un autre onglet', () => {
    localStorage.setItem(THEME_KEY, 'invalid');
    mockSystem(false);
    render(<App />);
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    localStorage.setItem(THEME_KEY, 'dark');
    act(() =>
      window.dispatchEvent(new StorageEvent('storage', { key: THEME_KEY, newValue: 'dark' })),
    );
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  });
  it('sépare réellement les deux espaces sur l’accueil sans charger le moteur', async () => {
    const worker = vi.fn();
    vi.stubGlobal('Worker', worker);
    mockSystem(false);
    render(<App />);
    expect(screen.queryByRole('button', { name: /Ouverture italienne/ })).toBeNull();
    expect(screen.getByRole('link', { name: 'OUVERTURES' })).toBeVisible();
    fireEvent.click(screen.getByRole('link', { name: 'OUVERTURES' }));
    expect(location.hash).toBe('#/ouvertures');
    expect(screen.getByRole('button', { name: 'Ouvertures' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getAllByText('Vous jouez : Blancs')).toHaveLength(5);
    fireEvent.click(screen.getByRole('button', { name: 'Partie libre' }));
    expect(await screen.findByRole('heading', { name: 'Prépare ta partie' })).toBeVisible();
    expect(location.hash).toBe('#/partie');
    expect(worker).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Accueil' }));
    expect(location.hash).toBe('#/');
  });
  it.each(['#/ouvertures', '#/partie'])(
    'ouvre directement la vue %s après une actualisation',
    async (hash) => {
      mockSystem(false);
      history.replaceState(null, '', hash);
      render(<App />);
      if (hash === '#/ouvertures')
        expect(screen.getByRole('button', { name: /Ouverture italienne/ })).toBeVisible();
      else expect(await screen.findByRole('heading', { name: 'Prépare ta partie' })).toBeVisible();
    },
  );
  it('respecte le retour du navigateur et le lien clavier ne change pas de vue', () => {
    mockSystem(false);
    render(<App />);
    fireEvent.click(screen.getByRole('link', { name: 'OUVERTURES' }));
    fireEvent.click(screen.getByRole('link', { name: 'Aller au contenu' }));
    expect(location.hash).toBe('#/ouvertures');
    expect(document.activeElement?.id).toBe('main');
    act(() => {
      history.replaceState(null, '', '#/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(screen.getByRole('link', { name: 'OUVERTURES' })).toBeVisible();
  });
  it('change le thème sans remettre à zéro une séance, ses erreurs ou ses aides', () => {
    vi.useFakeTimers();
    mockSystem(false);
    vi.stubGlobal(
      'Worker',
      class {
        constructor() {
          throw new Error('offline');
        }
      },
    );
    render(<App />);
    fireEvent.click(screen.getByRole('link', { name: 'OUVERTURES' }));
    fireEvent.click(screen.getByRole('button', { name: /Ouverture italienne/ }));
    fireEvent.click(screen.getByRole('button', { name: /^Giuoco Piano/ }));
    fireEvent.click(screen.getByRole('radio', { name: /^Ligne essentielle/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Commencer l’entraînement' }));
    fireEvent.click(screen.getByRole('button', { name: 'd2, pion blanc' }));
    fireEvent.click(screen.getByRole('button', { name: 'd4, case vide' }));
    fireEvent.click(screen.getByRole('button', { name: 'Solution' }));
    fireEvent.click(screen.getByRole('button', { name: 'e2, pion blanc' }));
    fireEvent.click(screen.getByRole('button', { name: 'e4, case vide' }));
    fireEvent.click(screen.getByRole('button', { name: 'Activer le thème sombre' }));
    act(() => vi.advanceTimersByTime(900));
    expect(screen.getByTestId('progress')).toHaveTextContent('1 / 7');
    expect(screen.getByTestId('errors')).toHaveTextContent('1');
    expect(screen.getByTestId('hints')).toHaveTextContent('1');
    expect(screen.getByRole('button', { name: 'e5, pion noir' })).toBeInTheDocument();
  });
  it('applique la préférence avant React et sert les douze SVG depuis le même site', () => {
    mockSystem(false);
    localStorage.setItem(THEME_KEY, 'dark');
    const bootstrap = readFileSync('public/theme-init.js', 'utf8');
    new Function(bootstrap)();
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    for (const side of ['w', 'b'])
      for (const piece of ['K', 'Q', 'R', 'B', 'N', 'P'])
        expect(readFileSync(`public/pieces/cburnett/${side}${piece}.svg`, 'utf8')).toContain(
          '<svg',
        );
  });
});
