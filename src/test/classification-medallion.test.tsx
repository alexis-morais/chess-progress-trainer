import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { categories, categoryInfo, type Category } from '../computer/types';
import { ClassificationMedallion } from '../ui/ClassificationMedallion';

describe('Médaillons premium du Game Review', () => {
  it.each(categories)('%s garde le même cercle et le même centre optique', (category: Category) => {
    render(<ClassificationMedallion category={category} label={categoryInfo[category].name} />);
    const medallion = screen.getByLabelText(categoryInfo[category].name);
    expect(medallion).toHaveAttribute('data-classification', category);
    expect(medallion.querySelector('svg')).toHaveAttribute('viewBox', '0 0 40 40');
  });

  it('distingue clairement Excellent de Bon', () => {
    const view = render(<ClassificationMedallion category="excellent" label="Excellent" />);
    expect(screen.getByLabelText('Excellent').querySelector('.classification-check.strong')).toBeInTheDocument();
    expect(screen.getByLabelText('Excellent').querySelector('.classification-spark')).toBeInTheDocument();
    view.rerender(<ClassificationMedallion category="good" label="Bon" />);
    expect(screen.getByLabelText('Bon').querySelector('.classification-check.strong')).toBeNull();
    expect(screen.getByLabelText('Bon').querySelector('.classification-spark')).toBeNull();
  });

  it('centre ?! et ? dans le même viewBox sans caractère ambiant', () => {
    const view = render(<ClassificationMedallion category="inaccuracy" label="Imprécision" />);
    const imprecision = screen.getByText('?!');
    expect(imprecision).toHaveAttribute('x', '20');
    expect(imprecision).toHaveAttribute('text-anchor', 'middle');
    view.rerender(<ClassificationMedallion category="mistake" label="Erreur" />);
    expect(screen.getByText('?')).toHaveAttribute('dominant-baseline', 'middle');
  });
});
