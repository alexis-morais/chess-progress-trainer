import { ArrowRight, Crosshair } from 'lucide-react';
import { sideName } from '../data/openings';
import { tacticsFor, type Tactic } from '../tactics/model';

export const tacticDisclaimer =
  'Ces positions illustrent des motifs typiques pouvant apparaître dans cette ouverture. Elles ne signifient pas que l’adversaire jouera toujours exactement cette ligne.';

export function TacticCards({
  openingId,
  onStart,
}: {
  openingId: string;
  onStart: (puzzle: Tactic) => void;
}) {
  const puzzles = tacticsFor(openingId);
  return (
    <section className="opening-tactics" aria-labelledby={`tactics-title-${openingId}`}>
      <div className="variant-picker-heading">
        <Crosshair size={19} />
        <h4 id={`tactics-title-${openingId}`}>TACTIQUES</h4>
        <span>{puzzles.length} exercices</span>
      </div>
      <p className="tactic-intro">Reconnais les occasions que l’ouverture peut offrir.</p>
      <div className="tactic-grid">
        {puzzles.map((puzzle, i) => (
          <button key={puzzle.id} className="tactic-card" onClick={() => onStart(puzzle)}>
            <span className="eyebrow">
              TACTIQUE {i + 1} · {puzzle.difficulty}
            </span>
            <strong>{puzzle.title}</strong>
            <span>{puzzle.motif}</span>
            <small>
              Aux {sideName(puzzle.side)} de jouer <ArrowRight size={16} />
            </small>
          </button>
        ))}
      </div>
      <p className="tactic-disclaimer">{tacticDisclaimer}</p>
    </section>
  );
}
