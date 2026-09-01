import { render } from '@testing-library/react';
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BrandMark } from '../components/BrandMark';

describe('Identité Chess Progress', () => {
  it('utilise la dame ascendante vectorielle comme source du header', () => {
    const { container } = render(<BrandMark className="test-mark" />);
    const mark = container.querySelector('.brand-mark.test-mark');
    expect(mark?.getAttribute('data-brand-source')).toMatch(/\/chess-progress-symbol-v3\.svg$/);
    expect(mark).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('img')).toBeNull();
    expect(container.innerHTML).not.toMatch(/https?:|pawn|pion|favicon\.svg/i);
  });

  it.each([
    'public/chess-progress-symbol-v3.svg',
    'public/chess-progress-favicon-v3.svg',
    'public/chess-progress-mask-v3.svg',
    'public/chess-progress-touch-v3.svg',
  ])('fournit un SVG local valide et sans filtre lourd : %s', (file) => {
    const source = readFileSync(file, 'utf8');
    const document = new DOMParser().parseFromString(source, 'image/svg+xml');
    expect(document.querySelector('parsererror')).toBeNull();
    expect(document.documentElement.localName).toBe('svg');
    expect(source).toContain('fill-rule="evenodd"');
    expect(source).not.toMatch(/<filter|<image/i);
  });

  it('fournit les PNG exacts pour favicon et Apple Touch Icon', () => {
    const size = (file: string) => {
      const bytes = readFileSync(file);
      expect(bytes.subarray(1, 4).toString()).toBe('PNG');
      return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
    };
    expect(size('public/chess-progress-favicon-32-v3.png')).toEqual([32, 32]);
    expect(size('public/chess-progress-touch-v3.png')).toEqual([180, 180]);
  });

  it('versionne toutes les références navigateur avec la base GitHub Pages', () => {
    const html = readFileSync('index.html', 'utf8');
    const obsoleteFavicon = ['favicon', 'svg'].join('.');
    const obsoleteMonochrome = `${['logo', 'monochrome'].join('-')}.svg`;
    expect(html).toContain('%BASE_URL%chess-progress-favicon-v3.svg');
    expect(html).toContain('%BASE_URL%chess-progress-favicon-32-v3.png');
    expect(html).toContain('%BASE_URL%chess-progress-touch-v3.png');
    expect(html).toContain('%BASE_URL%chess-progress-mask-v3.svg');
    expect(html).not.toContain(obsoleteFavicon);
    expect(html).not.toContain(obsoleteMonochrome);
    expect(existsSync(`public/${obsoleteFavicon}`)).toBe(false);
    expect(existsSync(`public/${obsoleteMonochrome}`)).toBe(false);
  });
});
