import { Eye, Lightbulb } from 'lucide-react';
import { useId } from 'react';
import { playerGuidance } from '../trainer/hints';
import { isComplete, type ScriptedExercise, type TrainerState } from '../trainer/model';
import { mistakeMessage } from './ExerciseFeedback';

// One message at a time inside one reserved slot: the board below never moves when the
// pedagogical state changes. Priority goes from the most explicit help to the calmest prompt.
export function assistanceMessage(
  lesson: ScriptedExercise,
  state: TrainerState,
  guided: boolean,
  hasGuidance: boolean,
) {
  if (hasGuidance && state.solutionVisible) return 'solution' as const;
  if (hasGuidance && state.hintVisible) return 'hint' as const;
  if (state.feedback === 'incorrect') return 'incorrect' as const;
  if (guided && hasGuidance) return 'intention' as const;
  if (state.feedback === 'correct') return 'correct' as const;
  if (isComplete(lesson, state)) return 'done' as const;
  return hasGuidance ? 'idle' : 'waiting';
}

export function TrainingAssistance({
  lesson,
  state,
  onHint,
  onReveal,
  guided = false,
  kind,
}: {
  lesson: ScriptedExercise;
  state: TrainerState;
  onHint: () => void;
  onReveal: () => void;
  guided?: boolean;
  kind: 'opening' | 'tactic';
}) {
  const guidance = playerGuidance(lesson, state);
  const complete = isComplete(lesson, state);
  const id = useId();
  const message = assistanceMessage(lesson, state, guided, Boolean(guidance));
  // The exact move leads; a hint asked before it stays readable as a secondary line.
  const paired = message === 'solution' && state.hintVisible && Boolean(guidance);
  return (
    <section className="training-assistance" aria-label="Aide à ton prochain coup">
      <div className="assistance-heading">
        <div className="assistance-segments" role="group" aria-label="Assistance facultative">
          <button
            disabled={!guidance}
            aria-pressed={state.hintVisible}
            aria-controls={`${id}-slot`}
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
            aria-controls={`${id}-slot`}
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
      <div
        className={`coach-slot${paired ? ' paired' : ''}`}
        id={`${id}-slot`}
        data-testid="coach-slot"
        data-message={message}
        aria-live="polite"
        aria-atomic="true"
      >
        {message === 'solution' && guidance ? (
          <p className="coach-line hint-description" data-testid="exact-move">
            {guidance.exact}
            <small>Flèche affichée · 1 aide comptée pour ce coup</small>
          </p>
        ) : message === 'hint' && guidance ? (
          <p className="coach-line coach-hint" data-testid="pedagogical-hint">
            {guidance.hint}
          </p>
        ) : message === 'incorrect' ? (
          <p className="coach-line coach-mistake" data-testid="compact-feedback" role="status">
            <strong aria-hidden="true">✕</strong> {mistakeMessage(state, kind)}
            {state.moveErrors >= 3 && (
              <span className="help-prompt"> Besoin d’un coup de pouce ?</span>
            )}
          </p>
        ) : message === 'correct' ? (
          <p className="coach-line coach-correct" data-testid="compact-feedback" role="status">
            <strong>✓ Bon coup.</strong>{' '}
            {state.explanation.match(/^[^.!?]+[.!?]?/)?.[0] ?? state.explanation}
          </p>
        ) : message === 'intention' && guidance ? (
          <p className="coach-line guided-intention" data-testid="guided-intention">
            <strong>Ton intention :</strong> {guidance.hint}
          </p>
        ) : (
          <p className="coach-line coach-idle">
            {message === 'done'
              ? 'Séance terminée. Tu peux la rejouer ou passer à une autre variante.'
              : message === 'waiting'
                ? 'L’adversaire joue la réponse prévue par la variante.'
                : 'Observe la position, puis joue ton coup. Indice et Solution restent facultatifs.'}
          </p>
        )}
        {paired && guidance && (
          <p className="coach-line coach-hint coach-secondary" data-testid="pedagogical-hint">
            {guidance.hint}
          </p>
        )}
      </div>
    </section>
  );
}
