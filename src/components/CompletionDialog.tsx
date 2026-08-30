import { useEffect, useRef } from 'react';
import { ArrowRight, RotateCcw, Trophy } from 'lucide-react';
import type { CompiledLesson, TrainerState } from '../trainer/model';

export function CompletionDialog({
  lesson,
  state,
  onRestart,
  onVariants,
  onHome,
}: {
  lesson: CompiledLesson;
  state: TrainerState;
  onRestart: () => void;
  onVariants: () => void;
  onHome: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current!;
    element.showModal();
    return () => {
      element.close();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="completion-dialog"
      aria-labelledby="completion-title"
      onCancel={(event) => event.preventDefault()}
    >
      <div className="trophy">
        <Trophy size={32} />
      </div>
      <span className="eyebrow">UN PAS DE PLUS DANS TON JEU</span>
      <h2 id="completion-title">🎉 Variante terminée !</h2>
      <p className="completion-subtitle">
        {state.errors === 0 && state.hints === 0
          ? 'Sans erreur, sans aide. Bien joué !'
          : 'Les bons réflexes se construisent coup après coup.'}
      </p>
      <div className="completion-lesson">
        <span>Ouverture : {lesson.opening.name}</span>
        <strong>Variante : {lesson.variation.name}</strong>
      </div>
      <div className="completion-stats">
        <div>
          <strong>
            {state.completed} / {lesson.total}
          </strong>
          <span>Coups complétés</span>
        </div>
        <div>
          <strong>{state.errors}</strong>
          <span>Erreurs</span>
        </div>
        <div>
          <strong>{state.hints}</strong>
          <span>Aides utilisées</span>
        </div>
      </div>
      <button autoFocus className="button primary" onClick={onRestart}>
        <RotateCcw size={17} />
        Rejouer la variante
      </button>
      <button className="button secondary" onClick={onVariants}>
        Choisir une autre variante
        <ArrowRight size={17} />
      </button>
      <button className="text-button" onClick={onHome}>
        Retour à l’accueil
      </button>
    </dialog>
  );
}
