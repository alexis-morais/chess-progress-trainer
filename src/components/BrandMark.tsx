import type { CSSProperties } from 'react';

export function BrandMark({ className = '' }: { className?: string }) {
  const source = `${import.meta.env.BASE_URL}chess-progress-symbol-v3.svg`;
  return (
    <span
      className={`brand-mark ${className}`.trim()}
      style={{ '--brand-mark-source': `url("${source}")` } as CSSProperties}
      aria-hidden="true"
      data-brand-source={source}
    />
  );
}
