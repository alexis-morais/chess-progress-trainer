import type { Category } from '../computer/types';

type Props = {
  category: Category;
  className?: string;
  label?: string;
};

/**
 * One deliberately small SVG family for every Game Review surface.
 *
 * The geometry lives in a shared 40 × 40 viewBox so the six marks keep the same
 * optical centre and diameter on the board, in the summary and in the move list.
 * Punctuation remains text because a real question mark is clearer than a custom
 * approximation at 18 px, but its baseline and tracking are fixed inside the SVG.
 */
export function ClassificationMedallion({ category, className = '', label }: Props) {
  return (
    <span
      className={`classification-medallion ${category} ${className}`.trim()}
      data-classification={category}
      aria-label={label}
      aria-hidden={label ? undefined : 'true'}
    >
      <svg viewBox="0 0 40 40" focusable="false" aria-hidden="true">
        {category === 'best' ? (
          <path
            className="classification-glyph classification-star"
            d="M20 7.1 23.9 15l8.7 1.25-6.3 6.15 1.5 8.65L20 27l-7.8 4.05 1.5-8.65-6.3-6.15L16.1 15 20 7.1Z"
          />
        ) : category === 'excellent' ? (
          <>
            <path
              className="classification-glyph classification-check strong"
              d="m10.2 20.6 6.1 6.1 13.6-14.1"
            />
            <path className="classification-spark" d="M10.8 9.1v4.3M8.65 11.25h4.3" />
          </>
        ) : category === 'good' ? (
          <path
            className="classification-glyph classification-check"
            d="m10.8 20.7 5.7 5.6 12.7-13.2"
          />
        ) : category === 'blunder' ? (
          <path
            className="classification-glyph classification-cross"
            d="m12.1 12.1 15.8 15.8m0-15.8L12.1 27.9"
          />
        ) : (
          <text
            className={`classification-punctuation ${category}`}
            x="20"
            y="20.8"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {category === 'inaccuracy' ? '?!' : '?'}
          </text>
        )}
      </svg>
    </span>
  );
}
