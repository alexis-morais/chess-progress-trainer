import { ArrowLeft } from 'lucide-react';
import type { TrainerState } from '../trainer/model';

export function mistakeMessage(state: TrainerState, kind: 'opening' | 'tactic') {
  return state.mistake === 'illegal'
    ? 'Ce déplacement n’est pas légal.'
    : kind === 'opening'
      ? 'Coup légal, mais il sort de la ligne travaillée.'
      : 'Ce coup est possible, mais il ne résout pas la tactique.';
}
export function ExerciseFeedback({
  state,
  kind,
}: {
  state: TrainerState;
  kind: 'opening' | 'tactic';
}) {
  return (
    <div
      className={`compact-feedback ${state.feedback}`}
      role="status"
      data-testid="compact-feedback"
    >
      {state.feedback === 'incorrect' ? (
        <>
          <strong aria-hidden="true">✕</strong>
          <span>{mistakeMessage(state, kind)}</span>
        </>
      ) : state.feedback === 'correct' ? (
        <>
          <strong>✓ Bon coup.</strong>
          <span>{state.explanation.match(/^[^.!?]+[.!?]?/)?.[0] ?? state.explanation}</span>
        </>
      ) : null}
    </div>
  );
}
export function FocusTitle({
  title,
  subtitle,
  onBack,
}: {
  title: string;
  subtitle: string;
  onBack: () => void;
}) {
  return (
    <div className="focus-title">
      <button onClick={onBack} aria-label="Revenir au choix de l’exercice">
        <ArrowLeft size={18} />
      </button>
      <div>
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </div>
    </div>
  );
}
