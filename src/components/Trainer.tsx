import {
  ArrowLeft,
  ArrowRightLeft,
  Check,
  ChevronRight,
  CircleAlert,
  Cpu,
  Lightbulb,
  RotateCcw,
  Sparkles,
  User,
} from 'lucide-react';
import { useTrainer } from '../trainer/useTrainer';
import { isExpectedMove, type CompiledLesson } from '../trainer/model';
import { useStockfish } from '../engine/useStockfish';
import { frenchSan, sideName, modeName } from '../data/openings';
import { TrainingBoard } from './TrainingBoard';
import { EvaluationBar } from './EvaluationBar';
import { CompletionDialog } from './CompletionDialog';
import { TrainingAssistance } from './TrainingAssistance';

export function Trainer({
  lesson,
  onRestart,
  onVariants,
  onHome,
}: {
  lesson: CompiledLesson;
  onRestart: () => void;
  onVariants: () => void;
  onHome: () => void;
}) {
  const { state, dispatch, playerTurn, complete, fen } = useTrainer(lesson);
  const analysis = useStockfish(fen);
  const current = Math.min(state.completed + 1, lesson.total);
  const status = complete
    ? 'Variante terminée'
    : playerTurn
      ? 'À toi de jouer'
      : 'L’ordinateur joue…';
  const engineText =
    analysis.status === 'unavailable'
      ? 'Analyse indisponible'
      : analysis.status === 'loading'
        ? 'Chargement de l’analyse…'
        : analysis.status === 'analyzing'
          ? 'Analyse en cours…'
          : 'Analyse locale active';
  return (
    <main id="main" className="trainer page-width">
      <div className="breadcrumb">
        <button onClick={onVariants}>
          <ArrowLeft size={15} />
          Les ouvertures
        </button>
        <ChevronRight size={14} />
        <span>{lesson.opening.name}</span>
      </div>
      <div className="training-heading">
        <div>
          <span className="eyebrow">LA PRATIQUE FAIT LA DIFFÉRENCE</span>
          <h1>À chaque coup, un progrès.</h1>
        </div>
        <span className="guided-badge">
          <Sparkles size={15} /> Entraînement guidé
        </span>
      </div>
      <TrainingAssistance
        lesson={lesson}
        state={state}
        onReveal={() => dispatch({ type: 'hint' })}
      />
      <div className="training-layout">
        <section className="board-section" aria-label="Zone de jeu">
          <div className="player-label top-player">
            <div className="player-avatar">
              <Cpu size={19} />
            </div>
            <div>
              <strong>Ordinateur</strong>
              <span>
                Réponses prédéfinies · {sideName(lesson.opening.side === 'w' ? 'b' : 'w')}
              </span>
            </div>
            <span className={`turn-dot ${!playerTurn && !complete ? 'active' : ''}`} />
          </div>
          <div className="board-with-eval">
            <EvaluationBar analysis={analysis} orientation={lesson.orientation} />
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
          </div>
          <div className="player-label bottom-player">
            <div className="player-avatar you">
              <User size={19} />
            </div>
            <div>
              <strong>
                Toi <span className="you-badge">{sideName(lesson.opening.side)}</span>
              </strong>
              <span>{status}</span>
            </div>
            <span className={`turn-dot ${playerTurn ? 'active' : ''}`} />
          </div>
          <div className="engine-status" data-testid="engine-status">
            <Cpu size={13} />
            <span>Stockfish 18 Lite</span>
            <span className={`engine-dot ${analysis.status}`} />
            <span>{engineText}</span>
          </div>
          <p className="board-instructions">
            Glisse une pièce ou touche sa case, puis sa destination.
            <br />
            <span>Au clavier : flèches pour naviguer, Entrée pour sélectionner.</span>
          </p>
        </section>
        <aside className="training-panel" aria-label="Ta séance">
          <div className="lesson-heading">
            <span className="eyebrow">
              TON ENTRAÎNEMENT <span>{lesson.variation.eco}</span>
            </span>
            <h2>{lesson.opening.name}</h2>
            <p>{lesson.variation.name}</p>
            <span className="lesson-mode">{modeName(lesson.mode)}</span>
            <span className="side-badge">
              <span className={`side-dot ${lesson.opening.side === 'b' ? 'black' : ''}`} />
              Tu joues les {sideName(lesson.opening.side)}
            </span>
          </div>
          <div className="progress-section">
            <div>
              <strong>Progression</strong>
              <span data-testid="progress">
                {state.completed} / {lesson.total}
              </span>
            </div>
            <progress
              value={state.completed}
              max={lesson.total}
              aria-label="Coups de l’élève complétés"
            />
            <p>
              {complete
                ? 'Tous tes coups sont complétés.'
                : state.completed === lesson.total
                  ? 'Dernière réponse de l’ordinateur…'
                  : `Coup ${current} / ${lesson.total}${!playerTurn ? ' · Réponse de l’ordinateur…' : ' · À toi de jouer'}`}
            </p>
          </div>
          <div className={`feedback ${state.feedback}`} role="status" aria-live="polite">
            <div className="feedback-title">
              {state.feedback === 'correct' ? (
                <>
                  <Check size={19} />✓ Bon coup !
                </>
              ) : state.feedback === 'incorrect' ? (
                <>
                  <CircleAlert size={19} />
                  Essaie encore
                </>
              ) : (
                <>
                  <Lightbulb size={19} />À toi de trouver
                </>
              )}
            </div>
            <p>
              {state.feedback === 'incorrect'
                ? "Ce n'est pas le coup de cette variante. Essaie encore."
                : state.feedback === 'correct'
                  ? state.explanation
                  : lesson.opening.side === 'w'
                    ? 'Lis l’indice au-dessus de l’échiquier, puis essaie le coup. « Voir le coup » révèle la flèche si tu hésites.'
                    : 'Les Blancs commencent. Lis ensuite ton indice au-dessus de l’échiquier pour trouver la réponse.'}
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
            <button className="text-button" onClick={onVariants}>
              <ArrowRightLeft size={15} />
              Retour aux variantes
            </button>
          </div>
          <details className="played-moves">
            <summary>
              Les coups joués <span>{state.ply}</span>
            </summary>
            <div>
              {state.ply === 0 ? (
                <p>Aucun coup pour le moment.</p>
              ) : (
                lesson.moves.slice(0, state.ply).map((move, index) => (
                  <span key={index} className={index === state.ply - 1 ? 'latest' : ''}>
                    {index % 2 === 0 && <small>{index / 2 + 1}.</small>}
                    {frenchSan(move.san)}
                  </span>
                ))
              )}
            </div>
          </details>
        </aside>
      </div>
      <p className="training-note">
        <BookNote /> Les coups de l’adversaire sont prédéfinis. Stockfish évalue la position, sans
        choisir les coups.
      </p>
      {complete && !state.boardFeedback && (
        <CompletionDialog
          lesson={lesson}
          state={state}
          onRestart={onRestart}
          onVariants={onVariants}
          onHome={onHome}
        />
      )}
    </main>
  );
}

function BookNote() {
  return <Lightbulb size={15} />;
}
