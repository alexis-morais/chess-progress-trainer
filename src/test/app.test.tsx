import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { openings } from '../data/openings';
import { compileLesson } from '../trainer/model';
import {
  COMPUTER_DELAY,
  CORRECT_FEEDBACK_DELAY,
  INCORRECT_FEEDBACK_DELAY,
} from '../trainer/useTrainer';
import type { LessonMode } from '../data/openings';

function play(from: string, to: string) {
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${from},`) }));
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${to},`) }));
}
function waitComputer(delay = CORRECT_FEEDBACK_DELAY) {
  act(() => vi.advanceTimersByTime(delay));
}
function start(
  opening = 'Ouverture italienne',
  variation = 'Giuoco Piano',
  mode: LessonMode = 'essential',
) {
  fireEvent.click(screen.getByRole('button', { name: 'Ouvertures' }));
  fireEvent.click(screen.getByRole('button', { name: new RegExp(opening) }));
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${variation}`) }));
  fireEvent.click(
    screen.getByRole('radio', {
      name: new RegExp(mode === 'essential' ? '^Ligne essentielle' : '^Version étendue'),
    }),
  );
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
    const worker = vi.fn(function () {
      throw new Error('Analyse indisponible');
    });
    vi.stubGlobal('Worker', worker);
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Explorer les ouvertures' }));
    expect(screen.getAllByText('Vous jouez : Blancs')).toHaveLength(5);
    expect(screen.getAllByText('Vous jouez : Noirs')).toHaveLength(5);
    fireEvent.click(screen.getByRole('button', { name: /Ouverture italienne/ }));
    expect(screen.getByText('Sélectionne une variante')).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Commencer l’entraînement' }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^Giuoco Piano/ }));
    expect(screen.getByRole('button', { name: 'Commencer l’entraînement' })).toBeDisabled();
    fireEvent.click(screen.getByRole('radio', { name: /^Version étendue/ }));
    expect(screen.getByRole('button', { name: 'Commencer l’entraînement' })).toBeEnabled();
    expect(document.querySelector('.training-board')).toBeNull();
    expect(worker).not.toHaveBeenCalled();
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
    act(() => vi.advanceTimersByTime(CORRECT_FEEDBACK_DELAY - 1));
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
    waitComputer(COMPUTER_DELAY);
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
    waitComputer();
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
  it('montre la croix rouge sur la destination refusée puis la coche verte avant la réponse', () => {
    render(<App />);
    start();
    play('d2', 'd4');
    expect(screen.getByTestId('move-badge')).toHaveClass('incorrect');
    expect(screen.getByTestId('move-badge')).toHaveAttribute('data-square', 'd4');
    expect(screen.getByRole('button', { name: 'd4, case vide' })).toHaveStyle({
      backgroundColor: '#e5a4a0',
    });
    act(() => vi.advanceTimersByTime(INCORRECT_FEEDBACK_DELAY - 1));
    expect(screen.getByTestId('move-badge')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByTestId('move-badge')).toBeNull();
    expect(
      screen.getByText("Ce n'est pas le coup de cette variante. Essaie encore."),
    ).toBeVisible();
    play('e2', 'e4');
    expect(screen.getByTestId('move-badge')).toHaveClass('correct');
    expect(screen.getByTestId('move-badge')).toHaveAttribute('data-square', 'e4');
    expect(screen.getByRole('button', { name: 'e4, pion blanc' })).toHaveStyle({
      backgroundColor: '#a8d8a4',
    });
    waitComputer(CORRECT_FEEDBACK_DELAY - 1);
    expect(screen.getByRole('button', { name: 'e7, pion noir' })).toBeInTheDocument();
    expect(screen.getByTestId('move-badge')).toBeInTheDocument();
    waitComputer(1);
    expect(screen.queryByTestId('move-badge')).toBeNull();
    expect(screen.getByRole('button', { name: 'e5, pion noir' })).toBeInTheDocument();
  });
  it('place les badges dans la bonne case avec les Noirs en bas et annule les délais au restart', () => {
    render(<App />);
    start('Défense Caro-Kann', 'Variante classique', 'extended');
    waitComputer(COMPUTER_DELAY);
    play('e7', 'e5');
    expect(screen.getByTestId('move-badge').closest('[data-key-square]')).toHaveAttribute(
      'data-key-square',
      'e5',
    );
    expect(screen.getByTestId('errors')).toHaveTextContent('1');
    play('c7', 'c6');
    expect(screen.getByTestId('move-badge')).toHaveClass('correct');
    expect(screen.getByTestId('move-badge').closest('[data-key-square]')).toHaveAttribute(
      'data-key-square',
      'c6',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Recommencer' }));
    waitComputer();
    expect(screen.queryByTestId('move-badge')).toBeNull();
    expect(screen.getByRole('button', { name: 'c7, pion noir' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'd2, pion blanc' })).toBeInTheDocument();
    expect(screen.getByText('Version étendue')).toBeVisible();
    expect(screen.getByTestId('errors')).toHaveTextContent('0');
  });
  for (const mode of ['essential', 'extended'] as const)
    it(`termine et rejoue le mode ${mode} avec les Noirs`, () => {
      render(<App />);
      start('Défense Caro-Kann', 'Variante Tartakower', mode);
      const opening = openings.find((o) => o.id === 'caro-kann')!;
      const lesson = compileLesson(
        opening,
        opening.variations.find((v) => v.id === 'caro-tartakower')!,
        mode,
      );
      for (const [i, move] of lesson.moves.entries()) {
        if (move.color === 'b') play(move.from, move.to);
        else waitComputer(i === 0 ? COMPUTER_DELAY : CORRECT_FEEDBACK_DELAY);
      }
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByTestId('move-badge')).toHaveClass('correct');
      waitComputer();
      expect(screen.getByRole('dialog')).toHaveTextContent(
        `Mode : ${mode === 'essential' ? 'Ligne essentielle' : 'Version étendue'}`,
      );
      expect(screen.getByTestId('progress')).toHaveTextContent(`${lesson.total} / ${lesson.total}`);
      fireEvent.click(screen.getByRole('button', { name: 'Rejouer la variante' }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByTestId('progress')).toHaveTextContent(`0 / ${lesson.total}`);
      expect(screen.getByTestId('errors')).toHaveTextContent('0');
      expect(screen.getByTestId('hints')).toHaveTextContent('0');
    });
  it('permet de sélectionner et de jouer un coup au clavier', () => {
    render(<App />);
    start();
    fireEvent.keyDown(screen.getByRole('button', { name: 'e2, pion blanc' }), { key: 'Enter' });
    fireEvent.keyDown(screen.getByRole('button', { name: 'e4, case vide' }), { key: 'Enter' });
    expect(screen.getByTestId('progress')).toHaveTextContent('1 / 7');
  });
});
