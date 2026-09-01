import { useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Check, Crosshair, RotateCcw, Trophy } from 'lucide-react';
import { TrainingAssistance } from '../components/TrainingAssistance';
import { TrainingBoard } from '../components/TrainingBoard';
import { tacticDisclaimer } from '../components/TacticCards';
import { frenchSan, sideName } from '../data/openings';
import { isExpectedMove, type TrainerState } from '../trainer/model';
import { useTrainer } from '../trainer/useTrainer';
import type { CompiledTactic } from './model';
import { ExerciseFeedback, FocusTitle, mistakeMessage } from '../components/ExerciseFeedback';
import { GlossaryText } from '../components/InfoTooltip';

type Props = {
  lesson: CompiledTactic;
  onRestart: () => void;
  onBack: () => void;
  onNext?: () => void;
  onComplete?: (id: string) => void;
};

export function TacticTrainer({ lesson, onRestart, onBack, onNext, onComplete }: Props) {
  const { state, dispatch, playerTurn, complete, fen } = useTrainer(lesson);
  const puzzle = lesson.puzzle;
  const recorded = useRef(false);
  useEffect(() => {
    if (!complete || recorded.current) return;
    recorded.current = true;
    onComplete?.(puzzle.id);
  }, [complete, onComplete, puzzle.id]);
  return (
    <main id="main" className="trainer tactic-trainer page-width mobile-focus">
      <FocusTitle
        title={puzzle.title}
        subtitle={`Aux ${sideName(lesson.player)} de jouer · ${puzzle.difficulty}`}
        onBack={onBack}
      />
      <div className="breadcrumb">
        <button onClick={onBack}>
          <ArrowLeft size={15} />
          Retour à l’ouverture
        </button>
        <span>{lesson.opening.name}</span>
      </div>
      <div className="training-heading">
        <div>
          <span className="eyebrow">TACTIQUE D’OUVERTURE</span>
          <h1>{puzzle.title}</h1>
        </div>
        <span className="guided-badge">
          <Crosshair size={15} />
          {puzzle.difficulty}
        </span>
      </div>
      <TrainingAssistance
        lesson={lesson}
        state={state}
        onHint={() => dispatch({ type: 'hint' })}
        onReveal={() => dispatch({ type: 'solution' })}
      />
      <ExerciseFeedback state={state} kind="tactic" />
      <div className="training-layout">
        <section className="board-section" aria-label="Échiquier de la tactique">
          <div className="tactic-board-caption">
            <strong>Aux {sideName(lesson.player)} de jouer</strong>
            <span>
              {complete
                ? 'Exercice terminé'
                : playerTurn
                  ? 'À toi de trouver'
                  : 'Réponse scriptée…'}
            </span>
          </div>
          <TrainingBoard
            lesson={lesson}
            state={state}
            fen={fen}
            enabled={playerTurn && !complete}
            onMove={(from, to, promotion) => {
              const accepted = isExpectedMove(lesson, state, from, to, promotion);
              dispatch({ type: 'attempt', from, to, promotion });
              return accepted;
            }}
          />
          <p className="board-instructions">
            Glisse une pièce ou touche sa case, puis sa destination.
            <br />
            Au clavier : flèches, puis Entrée.
          </p>
        </section>
        <aside className="training-panel" aria-label="Ton exercice tactique">
          <div className="lesson-heading">
            <span className="eyebrow">COMPRENDRE L’OCCASION</span>
            <h2>{lesson.opening.name}</h2>
            <p><GlossaryText>{puzzle.motif}</GlossaryText></p>
            <span className="side-badge">Tu joues les {sideName(lesson.player)}</span>
          </div>
          <div className="progress-section">
            <div>
              <strong>Combinaison</strong>
              <span data-testid="progress">
                {state.completed} / {lesson.total}
              </span>
            </div>
            <progress
              value={state.completed}
              max={lesson.total}
              aria-label="Coups de la tactique complétés"
            />
          </div>
          <div className={`feedback ${state.feedback}`} role="status">
            <strong>
              {state.feedback === 'correct'
                ? '✓ Bon coup !'
                : state.feedback === 'incorrect'
                  ? '✕ Essaie encore'
                  : 'Observe, puis décide.'}
            </strong>
            <p>
              {state.feedback === 'incorrect'
                ? mistakeMessage(state, 'tactic')
                : state.feedback === 'correct'
                  ? complete
                    ? 'La combinaison est terminée.'
                    : 'La combinaison continue. Attends la réponse, puis cherche la suite.'
                  : 'Prends le temps de chercher. Indice et Solution restent facultatifs.'}
            </p>
          </div>
          <div className="session-stats">
            <div>
              <span>Erreurs</span>
              <strong data-testid="errors">{state.errors}</strong>
            </div>
            <div>
              <span>Aides utilisées</span>
              <strong data-testid="hints">{state.hints}</strong>
            </div>
          </div>
          <div className="panel-actions">
            <button className="button secondary" onClick={onRestart}>
              <RotateCcw size={16} />
              Recommencer
            </button>
            <button className="text-button" onClick={onBack}>
              Retour à l’ouverture
            </button>
          </div>
          <details className="played-moves">
            <summary>Provenance de la position</summary>
            <p>
              Position issue d’une partie réelle, après {puzzle.provenance.moves.length} demi-coups.
            </p>
            <div className="line-preview">
              {puzzle.provenance.moves.map((san, i) => (
                <span key={i}>
                  {i % 2 === 0 ? `${i / 2 + 1}. ` : ''}
                  {frenchSan(san)}
                </span>
              ))}
            </div>
            <a href={puzzle.provenance.gameUrl} target="_blank" rel="noreferrer">
              Partie source sur Lichess ↗
            </a>
            <p>
              Solution vérifiée hors ligne avec Stockfish 18. Les réponses de cet exercice sont
              fixes.
            </p>
          </details>
        </aside>
      </div>
      <p className="training-note">{tacticDisclaimer}</p>
      {complete && !state.boardFeedback && (
        <TacticCompletion
          lesson={lesson}
          state={state}
          onRestart={onRestart}
          onBack={onBack}
          onNext={onNext}
        />
      )}
    </main>
  );
}

function TacticCompletion({
  lesson,
  state,
  onRestart,
  onBack,
  onNext,
}: Props & { state: TrainerState }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current!;
    element.showModal();
    return () => element.close();
  }, []);
  const puzzle = lesson.puzzle;
  return (
    <dialog
      ref={dialog}
      className="completion-dialog tactic-completion"
      aria-labelledby="tactic-complete-title"
      onCancel={(event) => event.preventDefault()}
    >
      <div className="trophy">
        <Trophy size={30} />
      </div>
      <h2 id="tactic-complete-title">Tactique réussie</h2>
      <p className="completion-subtitle">{lesson.opening.name}</p>
      <div className="tactic-explanation">
        <h3><GlossaryText>{puzzle.motif}</GlossaryText></h3>
        <p>{puzzle.explanation}</p>
        <p>
          <Check size={16} />
          <strong>{puzzle.gain}</strong>
        </p>
        <p className="tactic-principle">À retenir : {puzzle.principle}</p>
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
        <RotateCcw size={16} />
        Rejouer
      </button>
      {onNext && (
        <button className="button secondary" onClick={onNext}>
          Tactique suivante
          <ArrowRight size={16} />
        </button>
      )}
      <button className="text-button" onClick={onBack}>
        Retour à l’ouverture
      </button>
    </dialog>
  );
}
