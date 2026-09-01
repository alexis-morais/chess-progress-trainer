import { render } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BrandMark } from '../components/BrandMark';

describe('Identité Chess Progress', () => {
  it('utilise un symbole géométrique original sans pion ni asset distant', () => {
    const { container } = render(<BrandMark className="test-mark" />);
    expect(container.querySelector('svg.test-mark')).toHaveAttribute('viewBox', '0 0 48 48');
    expect(container.querySelectorAll('path')).toHaveLength(2);
    expect(container.querySelector('img')).toBeNull();
    expect(container.innerHTML).not.toMatch(/https?:|pawn|pion/i);
  });

  it('fournit le favicon couleur et une déclinaison monochrome vectorielle', () => {
    const favicon = readFileSync('public/favicon.svg', 'utf8');
    const monochrome = readFileSync('public/logo-monochrome.svg', 'utf8');
    expect(favicon).toContain('viewBox="0 0 48 48"');
    expect(monochrome).toContain('<mask');
    expect(monochrome.match(/fill="#[0-9a-f]+"/gi)).toHaveLength(1);
  });
});
