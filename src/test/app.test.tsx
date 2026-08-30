import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { openings } from '../data/openings';
import { compileLesson } from '../trainer/model';
import { COMPUTER_DELAY } from '../trainer/useTrainer';

function play(from: string, to: string) {
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${from},`) }));
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${to},`) }));
}
function waitComputer() {
  act(() => vi.advanceTimersByTime(COMPUTER_DELAY));
}
function start(opening = 'Ouverture italienne', variation = 'Giuoco Piano') {
  fireEvent.click(screen.getByRole('button', { name: new RegExp(opening) }));
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${variation}`) }));
  fireEvent.click(screen.getByRole('button', { name: 'Commencer l’entraînement' }));
}

describe('Parcours complet de l’interface avec le véritable échiquier React', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'Worker',
      class {
        constructor() {
          throw new Error('Analyse indisponible pour ce test');
        }
      },
    );
  });
  it('ne lance rien au clic sur une ouverture, exige le choix d’une variante', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Ouverture italienne/ }));
    expect(screen.getByText('Sélectionne une variante')).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Commencer l’entraînement' }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^Giuoco Piano/ }));
    expect(screen.getByRole('button', { name: 'Commencer l’entraînement' })).toBeVisible();
    expect(document.querySelector('.training-board')).toBeNull();
  });
  it('continue sans Stockfish, refuse les erreurs, montre la flèche et réinitialise tout', () => {
    render(<App />);
    start();
    expect(screen.getByText('Analyse indisponible')).toBeVisible();
    expect(document.querySelector('.training-board')).toHaveAttribute('data-orientation', 'white');
    play('d2', 'd4');
    expect(screen.getByTestId('errors')).toHaveTextContent('1');
    expect(screen.getByTestId('progress')).toHaveTextContent('0 / 7');
    expect(screen.getByRole('button', { name: 'd2, pion blanc' })).toBeInTheDocument();
    const hint = screen.getByRole('button', { name: /💡 Aide/ });
    fireEvent.click(hint);
    fireEvent.click(hint);
    expect(screen.getByTestId('hints')).toHaveTextContent('1');
    expect(document.querySelector('[id*="arrowhead-0-e2-e4"]')).toBeInTheDocument();
    play('e2', 'e4');
    expect(screen.getByText('✓ Bon coup !')).toBeVisible();
    expect(screen.getByTestId('progress')).toHaveTextContent('1 / 7');
    expect(screen.queryByText('Joue de e2 vers e4.')).not.toBeInTheDocument();
    expect(hint).toBeDisabled();
    act(() => vi.advanceTimersByTime(COMPUTER_DELAY - 1));
    expect(screen.getByRole('button', { name: 'e7, pion noir' })).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByRole('button', { name: 'e5, pion noir' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Recommencer' }));
    expect(screen.getByTestId('errors')).toHaveTextContent('0');
    expect(screen.getByTestId('hints')).toHaveTextContent('0');
    expect(screen.getByTestId('progress')).toHaveTextContent('0 / 7');
    expect(screen.getByTestId('evaluation-value')).toHaveTextContent('—');
    expect(screen.getByRole('button', { name: 'e2, pion blanc' })).toBeInTheDocument();
  });
  it('les Noirs sont en bas et le premier coup adverse arrive après 600 ms', () => {
    render(<App />);
    start('Défense française', 'Variante d’avance');
    expect(document.querySelector('.training-board')).toHaveAttribute('data-orientation', 'black');
    expect(document.querySelector('.training-board [data-square]')).toHaveAttribute(
      'data-square',
      'h1',
    );
    expect(screen.getByRole('button', { name: /💡 Aide/ })).toBeDisabled();
    waitComputer();
    expect(screen.getByRole('button', { name: 'e4, pion blanc' })).toBeInTheDocument();
    expect(screen.getByTestId('progress')).toHaveTextContent('0 / 6');
    play('e7', 'e6');
    expect(screen.getByTestId('progress')).toHaveTextContent('1 / 6');
    fireEvent.click(screen.getByRole('button', { name: 'Recommencer' }));
    waitComputer();
    expect(screen.getByRole('button', { name: 'd2, pion blanc' })).toBeInTheDocument();
    expect(screen.getByTestId('progress')).toHaveTextContent('0 / 6');
  });
  it('termine la séquence, bloque le plateau, affiche le bilan et permet de rejouer', () => {
    render(<App />);
    start();
    const lesson = compileLesson(openings[0], openings[0].variations[0]);
    for (const move of lesson.moves) {
      if (move.color === 'w') play(move.from, move.to);
      else waitComputer();
    }
    expect(screen.getByRole('dialog')).toBeVisible();
    expect(screen.getByText('🎉 Variante terminée !')).toBeVisible();
    expect(screen.getByRole('button', { name: /💡 Aide/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'd2, fou blanc' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Rejouer la variante' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByTestId('progress')).toHaveTextContent('0 / 7');
    fireEvent.click(screen.getByRole('button', { name: 'Retour aux variantes' }));
    expect(screen.getByText('Sélectionne une variante')).toBeVisible();
  });
  it('permet de sélectionner et de jouer un coup au clavier', () => {
    render(<App />);
    start();
    fireEvent.keyDown(screen.getByRole('button', { name: 'e2, pion blanc' }), { key: 'Enter' });
    fireEvent.keyDown(screen.getByRole('button', { name: 'e4, case vide' }), { key: 'Enter' });
    expect(screen.getByTestId('progress')).toHaveTextContent('1 / 7');
  });
});
