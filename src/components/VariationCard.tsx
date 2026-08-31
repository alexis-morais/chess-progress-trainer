import { useEffect, useRef } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import {
  frenchSan,
  learnerMoveCount,
  lessonModes,
  type Opening,
  type Variation,
  type LessonMode,
} from '../data/openings';

export function VariationCard({
  opening,
  variation,
  selected,
  mode,
  onSelect,
  onMode,
  onStart,
}: {
  opening: Opening;
  variation: Variation;
  selected: boolean;
  mode: LessonMode | null;
  onSelect: () => void;
  onMode: (mode: LessonMode) => void;
  onStart: (mode: LessonMode) => void;
}) {
  const card = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!selected) return;
    const frame = requestAnimationFrame(() => {
      const element = card.current;
      if (!element) return;
      const rect = element.getBoundingClientRect();
      if (rect.bottom > window.innerHeight - 16 || rect.top < 16)
        element.scrollIntoView({
          block: 'nearest',
          behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
            ? 'instant'
            : 'smooth',
        });
    });
    return () => cancelAnimationFrame(frame);
  }, [selected]);
  return (
    <div ref={card} className={`variant-card ${selected ? 'selected-variation' : ''}`}>
      <button
        className={`variant-option ${selected ? 'selected' : ''}`}
        aria-pressed={selected}
        aria-expanded={selected}
        aria-controls={`mode-${variation.id}`}
        onClick={onSelect}
      >
        <span>
          <strong>{variation.name}</strong>
          <small>
            {learnerMoveCount(opening.side, variation.moves.length)} coups essentiels ·{' '}
            {variation.eco}
          </small>
        </span>
        <span className="radio-indicator">{selected && <Check size={12} />}</span>
      </button>
      {selected && (
        <div className="variant-detail" id={`mode-${variation.id}`}>
          <fieldset className="mode-picker">
            <legend>Choisis ton format</legend>
            {lessonModes.map((option) => (
              <label
                key={option.id}
                className={`mode-option ${mode === option.id ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="lesson-mode"
                  value={option.id}
                  checked={mode === option.id}
                  onChange={() => onMode(option.id)}
                />
                <span>
                  <strong>{option.name}</strong>
                  <small>{option.description}</small>
                  <em>
                    {learnerMoveCount(
                      opening.side,
                      variation.moves.length +
                        (option.id === 'extended' ? variation.extension.length : 0),
                    )}{' '}
                    coups à jouer
                  </em>
                </span>
              </label>
            ))}
          </fieldset>
          <button
            className="button primary start-button"
            disabled={!mode}
            onClick={() => mode && onStart(mode)}
          >
            Commencer l’entraînement <ArrowRight size={17} />
          </button>
          <details className="variant-about">
            <summary>À propos de cette ligne</summary>
            <p>{variation.description}</p>
            <div className="line-preview" aria-label="Début de la variante">
              {variation.moves.slice(0, 6).map((move, i) => (
                <span key={i}>
                  {i % 2 === 0 ? `${i / 2 + 1}. ` : ''}
                  {frenchSan(move.san)}
                </span>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
