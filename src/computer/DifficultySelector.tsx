import { difficultyInfo, difficultyShortcuts, strengthNotice, validLevel } from './difficulty';
import type { Difficulty } from './types';

export function DifficultySelector({
  level,
  onChange,
}: {
  level: Difficulty;
  onChange: (level: Difficulty) => void;
}) {
  const profile = difficultyInfo(level);
  return (
    <fieldset className="difficulty-selector">
      <legend>Force de l’ordinateur</legend>
      <div className="difficulty-current" aria-live="polite">
        <strong>{profile.name}</strong>
        <span>
          {profile.category}{' '}
          <b>{profile.elo === null ? 'Stockfish non affaibli' : `≈ ${profile.elo} Elo`}</b>
        </span>
      </div>
      <input
        type="range"
        aria-label="Niveau de l’ordinateur"
        aria-valuetext={`${profile.name}, ${profile.category}, ${profile.elo === null ? 'Stockfish non affaibli' : `force estimée ${profile.elo} Elo`}`}
        min="1"
        max="25"
        step="1"
        value={level}
        onInput={(event) => {
          const value = Number(event.currentTarget.value);
          if (validLevel(value)) onChange(value);
        }}
        onChange={(event) => {
          const value = Number(event.target.value);
          if (validLevel(value)) onChange(value);
        }}
      />
      <div className="range-endpoints" aria-hidden="true">
        <span>1 · Découverte</span>
        <span>25 · Maximum</span>
      </div>
      <div className="difficulty-shortcuts" role="group" aria-label="Raccourcis de force">
        {difficultyShortcuts.map((item) => (
          <button
            key={item.level}
            type="button"
            aria-pressed={profile.category === item.name}
            onClick={() => onChange(item.level)}
          >
            {item.name}
          </button>
        ))}
      </div>
      <p className="strength-notice">{strengthNotice}</p>
    </fieldset>
  );
}
