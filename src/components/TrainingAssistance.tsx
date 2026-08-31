import { Eye, Lightbulb } from 'lucide-react';
import { playerGuidance } from '../trainer/hints';
import { isComplete, type CompiledLesson, type TrainerState } from '../trainer/model';

export function TrainingAssistance({
  lesson,
  state,
  onReveal,
}: {
  lesson: CompiledLesson;
  state: TrainerState;
  onReveal: () => void;
}) {
  const guidance = playerGuidance(lesson, state);
  const complete = isComplete(lesson, state);
  return (
    <section className="training-assistance" aria-label="Aide à ton prochain coup">
      <div className="instruction-copy" aria-live="polite" aria-atomic="true">
        <span className="instruction-label">
          <Lightbulb size={15} aria-hidden="true" />
          {guidance
            ? `Indice · Coup ${state.completed + 1} / ${lesson.total}`
            : complete
              ? 'Séance terminée'
              : 'À l’ordinateur'}
        </span>
        {guidance ? (
          <p data-testid="pedagogical-hint">{guidance.hint}</p>
        ) : (
          <p>
            {complete
              ? 'Tous tes coups sont complétés.'
              : 'Observe la réponse de l’ordinateur, ton indice arrive ensuite.'}
          </p>
        )}
        {guidance && state.hintVisible && (
          <p className="hint-description" data-testid="exact-move">
            {guidance.exact}
          </p>
        )}
      </div>
      <div className="assistance-controls">
        <button
          className="button primary hint-button"
          disabled={!guidance}
          aria-pressed={state.hintVisible}
          aria-describedby="reveal-cost"
          onClick={onReveal}
        >
          <Eye size={17} aria-hidden="true" /> Voir le coup
        </button>
        <span id="reveal-cost">
          {state.hintVisible ? 'Flèche affichée · 1 aide comptée' : 'Compte 1 aide par coup'}
        </span>
      </div>
    </section>
  );
}
