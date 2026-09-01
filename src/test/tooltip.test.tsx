import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GlossaryText, InfoTooltip } from '../components/InfoTooltip';

describe('Infobulles pédagogiques', () => {
  it('s’ouvre au focus ou au clic, puis se ferme avec Échap', () => {
    render(<InfoTooltip term="Promotion" />);
    const button = screen.getByRole('button', { name: 'Définition : Promotion' });
    fireEvent.focus(button);
    expect(screen.getByRole('tooltip')).toHaveTextContent('dernière rangée');
    expect(button).toHaveAttribute('aria-expanded', 'true');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).toBeNull();
    fireEvent.click(button);
    expect(screen.getByRole('tooltip')).toBeVisible();
  });

  it('reste ouverte après un survol suivi d’un clic explicite', () => {
    render(<InfoTooltip term="Roque" />);
    const button = screen.getByRole('button', { name: 'Définition : Roque' });
    fireEvent.mouseEnter(button.closest('.info-term')!);
    expect(screen.getByRole('tooltip')).toBeVisible();
    fireEvent.click(button);
    fireEvent.mouseLeave(button.closest('.info-term')!);
    expect(screen.getByRole('tooltip')).toBeVisible();
    fireEvent.click(button);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('se ferme au tap extérieur et reste dans une largeur sûre', () => {
    render(<div><InfoTooltip term="Prise en passant" /><button>Dehors</button></div>);
    fireEvent.click(screen.getByRole('button', { name: 'Définition : Prise en passant' }));
    expect(screen.getByRole('tooltip')).toBeVisible();
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Dehors' }));
    expect(screen.queryByRole('tooltip')).toBeNull();
    expect(document.querySelector('.info-popover')).toBeNull();
  });

  it('enrichit seulement les termes connus sans altérer le reste du texte', () => {
    render(<p><GlossaryText>Le Roque évite parfois un Clouage.</GlossaryText></p>);
    expect(screen.getByText(/Le/).parentElement).toHaveTextContent('Le Roque évite parfois un Clouage.');
    expect(screen.getByRole('button', { name: 'Définition : Roque' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Définition : Clouage' })).toBeVisible();
  });
});
