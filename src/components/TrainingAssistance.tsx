import { Eye, Lightbulb } from 'lucide-react';
import { useId } from 'react';
import { playerGuidance } from '../trainer/hints';
import { isComplete, type ScriptedExercise, type TrainerState } from '../trainer/model';

export function TrainingAssistance({
  lesson,
  state,
  onHint,
  onReveal,
}: {
  lesson: ScriptedExercise;
  state: TrainerState;
  onHint: () => void;
  onReveal: () => void;
}) {
  const guidance = playerGuidance(lesson, state);
  const complete = isComplete(lesson, state);
  const id = useId();
  return (
    <section className="training-assistance" aria-label="Aide à ton prochain coup">
      <div className="assistance-heading">
        <div className="assistance-segments" role="group" aria-label="Assistance facultative">
          <button
            disabled={!guidance}
            aria-pressed={state.hintVisible}
            aria-controls={`${id}-hint`}
            onClick={onHint}
            title="Une piste de réflexion, gratuite"
            className={
              state.moveErrors === 3 && !state.hintVisible && !state.solutionVisible
                ? 'hint-nudge'
                : ''
            }
          >
            <Lightbulb size={17} aria-hidden="true" /> Indice
          </button>
          <button
            disabled={!guidance}
            aria-pressed={state.solutionVisible}
            aria-controls={`${id}-solution`}
            onClick={onReveal}
            title="Le coup exact, une aide comptée par coup"
          >
            <Eye size={17} aria-hidden="true" /> Solution
          </button>
        </div>
        <span className="assistance-turn">
          {complete
            ? 'Séance terminée'
            : guidance
              ? `Coup ${state.completed + 1} / ${lesson.total} · À toi de jouer`
              : 'Réponse de l’ordinateur…'}
        </span>
      </div>
      {state.moveErrors >= 3 && !state.hintVisible && !state.solutionVisible && (
        <p className="help-prompt" role="status">
          Besoin d’un coup de pouce ?
        </p>
      )}
      <div className="instruction-copy" aria-live="polite" aria-atomic="true">
        <div id={`${id}-hint`}>
          {guidance && state.hintVisible && <p data-testid="pedagogical-hint">{guidance.hint}</p>}
        </div>
        <div id={`${id}-solution`}>
          {guidance && state.solutionVisible && (
            <p className="hint-description" data-testid="exact-move">
              {guidance.exact}
              <small>Flèche affichée · 1 aide comptée pour ce coup</small>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
