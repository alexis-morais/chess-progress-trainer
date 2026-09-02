
import { difficultyLabel } from './difficulty';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Cpu,
  LineChart,
} from 'lucide-react';
import { frenchSan, sideName } from '../data/openings';
import { ComputerEngine, isAbort } from './ComputerEngine';
import { ComputerBoard, type BoardArrow } from './ComputerBoard';
import { EvaluationChart } from './EvaluationChart';
import { MoveHistory } from './MoveHistory';
import { moveNumber, replayGame, resultReason, resultTitle, uci } from './game';
import {
  analyzeGame,
  bestMoveArrow,
  categoryPlies,
  navigateFilteredPly,
  navigatePly,
  scoreLabel,
  type ReviewNavigationAction,
} from './review';
import {
  categories,
  categoryInfo,
  type Category,
  type EngineScore,
  type GameRecord,
  type ReviewReport,
} from './types';
import { ClassificationMedallion } from '../ui/ClassificationMedallion';
import { GlossaryText, InfoTooltip } from '../components/InfoTooltip';
import { EvaluationBar } from '../components/EvaluationBar';
import { BEST_MOVE_ARROW, BEST_MOVE_OUTLINE, classificationVisuals } from '../ui/classification';
import { COMPACT_REVIEW_QUERY, useMediaQuery } from '../ui/useMediaQuery';

// The bar reuses the trainer component; only the label comes from the bilan wording.
function reviewEvaluation(score: EngineScore) {
  return 'cp' in score
    ? { cp: score.cp, depth: score.depth }
    : { mate: (score.winner === 'w' ? 1 : -1) * Math.max(score.mate, 0), depth: score.depth };
}

export function ReviewScreen({
  game,
  cached,
  onComplete,
  onExit,
}: {
  game: GameRecord;
  cached: ReviewReport | null;
  onComplete: (review: ReviewReport) => void;
  onExit: () => void;
}) {
  const [report, setReport] = useState(cached);
  const [progress, setProgress] = useState({
    done: 0,
    total: game.moves.filter((_, index) => index % 2 === (game.player === 'w' ? 0 : 1)).length,
  });
  const [failure, setFailure] = useState('');
  const [retry, setRetry] = useState(0);
  // Opens on the starting position, filter "Tous les coups": the learner picks where to
  // look first. Choosing a classification still jumps straight to its first occurrence.
  const [selected, setSelected] = useState(0);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [threadOpen, setThreadOpen] = useState(false);
  const compact = useMediaQuery(COMPACT_REVIEW_QUERY);
  const workspace = useRef<HTMLDivElement>(null);
  const [pendingScroll, setPendingScroll] = useState(false);
  const replay = useMemo(() => replayGame(game), [game]);
  const completed = useRef(onComplete);
  completed.current = onComplete;
  const announced = useRef<ReviewReport | null>(null);
  // A bilan restored from the local save announces its badges exactly like a fresh one,
  // and each distinct report is announced once.
  // On phones the summary sits above the board: bring the decision into view once the
  // new content is laid out, never during the render that changes it.
  useEffect(() => {
    if (!pendingScroll) return;
    setPendingScroll(false);
    if (!compact) return;
    // Instant on purpose: this is a jump to a section, and an animated scroll is silently
    // ignored in several environments.
    workspace.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }, [compact, pendingScroll]);
  useEffect(() => {
    if (report && announced.current !== report) {
      announced.current = report;
      completed.current(report);
    }
  }, [report]);
  useEffect(() => {
    if (cached) {
      setReport(cached);
      return;
    }
    const controller = new AbortController();
    const engine = new ComputerEngine();
    setFailure('');
    analyzeGame(game, engine, controller.signal, (done, total) => setProgress({ done, total }))
      .then((result) => {
        if (controller.signal.aborted) return;
        setReport(result);
      })
      .catch((error: unknown) => {
        if (!isAbort(error) && !controller.signal.aborted)
          setFailure(error instanceof Error ? error.message : 'Analyse indisponible.');
      })
      .finally(() => engine.dispose());
    return () => {
      controller.abort();
      engine.dispose();
    };
  }, [game, cached, retry]);
  if (!report)
    return (
      <section className="review-loading" aria-label="Analyse de la partie">
        <Cpu size={36} />
        <h2>{failure ? 'Analyse interrompue' : 'Un regard neuf sur ta partie.'}</h2>
        <p role="status">
          Analyse de la partie : {progress.done} / {progress.total} coups
        </p>
        <progress
          max={Math.max(1, progress.total)}
          value={progress.done}
          aria-label="Progression de l’analyse"
        />
        {failure ? (
          <div role="alert">
            <p>{failure}</p>
            <button className="button primary" onClick={() => setRetry((value) => value + 1)}>
              Réessayer l’analyse
            </button>
          </div>
        ) : (
          <p className="muted">
            {progress.done === progress.total
              ? 'Finalisation de la courbe…'
              : 'Stockfish examine une position à la fois. Tu peux quitter cet écran à tout moment.'}
          </p>
        )}
        <button className="button secondary" onClick={onExit}>
          {failure ? 'Retour à la partie' : 'Annuler l’analyse'}
        </button>
      </section>
    );
  function select(ply: number, keepFilter = false) {
    setSelected(ply);
    if (!keepFilter) setActiveCategory(null);
  }
  function chooseCategory(category: Category) {
    const plies = categoryPlies(report!.moves, category);
    if (!plies.length) return;
    setActiveCategory(category);
    setSelected(plies[0]);
    setPendingScroll(true);
  }
  const filteredPlies = activeCategory ? categoryPlies(report.moves, activeCategory) : [];
  const filteredIndex = activeCategory ? filteredPlies.indexOf(selected) : -1;
  function navigate(action: ReviewNavigationAction) {
    const target = activeCategory
      ? navigateFilteredPly(selected, action, filteredPlies)
      : navigatePly(selected, action, game.moves.length);
    if (target !== null) select(target, Boolean(activeCategory));
  }
  const played = replay.moves[selected - 1];
  const detail = report.moves.find((move) => move.ply === selected);
  const before = report.positions[Math.max(0, selected - 1)];
  const after = report.positions[selected];
  const quality = detail ? categoryInfo[detail.category] : null;
  const alreadyBest = Boolean(detail && before.bestMove && played && uci(played) === before.bestMove);
  // The recommendation is checked against the position before the decision, where it is legal.
  const alternative =
    detail && !alreadyBest ? bestMoveArrow(replay.positions[selected - 1], before.bestMove) : null;
  // The board always shows the position AFTER the played move: the piece really sits on its
  // destination, which carries the classification. The played move is therefore never an arrow.
  // The only arrow is the recommended alternative, drawn as an annotation of the previous decision.
  const decision = Boolean(detail && played);
  const boardPly = selected;
  const visual = detail ? classificationVisuals[detail.category] : null;
  const arrows: BoardArrow[] = alternative
    ? [{ ...alternative, color: BEST_MOVE_ARROW, kind: 'best-move' }]
    : [];
  // When the recommendation started from the square the played move has just left, that square
  // is now empty: a very discreet outline keeps the arrow readable, without any ghost piece.
  const originHint =
    alternative && played && alternative.from === played.from
      ? { square: alternative.from, color: BEST_MOVE_OUTLINE }
      : undefined;
  const boardScore = report.positions[boardPly].score;
  const thread = (
    <section
      className="review-thread"
      id="review-thread"
      data-open={threadOpen ? 'true' : 'false'}
      aria-hidden={compact && !threadOpen ? true : undefined}
    >
      <EvaluationChart positions={report.positions} selected={selected} onSelect={select} />
    </section>
  );
  const evaluationBar = (
    <EvaluationBar
      analysis={{ status: 'ready', evaluation: reviewEvaluation(boardScore) }}
      orientation={game.player === 'w' ? 'white' : 'black'}
      label={scoreLabel(boardScore)}
      description={`Évaluation ${scoreLabel(boardScore)}, du point de vue des Blancs`}
    />
  );
  return (
    <>
      <div className="review-header">
      <div className="review-title">
        <div>
          <span className="eyebrow">TON BILAN DE PARTIE</span>
          <h1>
            {resultTitle(game)} <span>· {resultReason(game.result!)}</span>
          </h1>
          <p>
            {sideName(game.player)} · {difficultyLabel(game.difficulty)} ·{' '}
            {Math.ceil(game.moves.length / 2)} coups ({game.moves.length} demi-coups), dont{' '}
            {report.moves.length} joués par toi.
          </p>
        </div>
        <button className="text-button" onClick={onExit}>
          <ArrowLeft size={15} />
          Retour au résultat
        </button>
      </div>
      <section className="review-summary" aria-label="Résumé de tes coups">
        <div className="accuracy">
          <strong>{report.accuracy === null ? '—' : `${report.accuracy} %`}</strong>
          <span>
            <InfoTooltip term="Précision estimée" />
          </span>
          <small>Indice pédagogique local</small>
        </div>
        <div className="review-classifications">
          <div className="review-filter-heading">
            <strong>Retrouver mes coups</strong>
            <button
              type="button"
              className="review-all-filter"
              aria-pressed={activeCategory === null}
              onClick={() => setActiveCategory(null)}
            >
              Tous les coups
            </button>
          </div>
          <div className="category-totals">
            {categories.map((category) => {
              const count = report.counts[category];
              return (
                <button
                  type="button"
                  key={category}
                  className={category}
                  disabled={count === 0}
                  aria-pressed={activeCategory === category}
                  aria-label={`${categoryInfo[category].plural}, ${count} ${count > 1 ? 'coups' : 'coup'}${count === 0 ? ', aucun coup à afficher' : ''}`}
                  onClick={() => chooseCategory(category)}
                >
                  <ClassificationMedallion category={category} className="summary-medallion" />
                  <strong>{count}</strong>
                  <span>{categoryInfo[category].plural}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>
      </div>
      <div className="review-workspace" ref={workspace}>
        {/* Flexed tightly together so the bar reads as part of the board, not a separate
            column: the gap here is deliberately smaller than the one before the panel. */}
        <div className="review-board-group">
        <div className="review-eval">
          {compact ? (
            <button
              type="button"
              className="review-eval-toggle"
              aria-expanded={threadOpen}
              aria-controls="review-thread"
              onClick={() => setThreadOpen((open) => !open)}
            >
              {evaluationBar}
              <span className="review-eval-hint">
                <LineChart size={14} aria-hidden="true" />
                {threadOpen ? 'Masquer le fil de la partie' : 'Voir le fil de la partie'}
              </span>
            </button>
          ) : (
            evaluationBar
          )}
        </div>
        <section className="computer-board-section" aria-label="Explorateur de la partie">
          <div className="review-board-caption">
            <strong>
              {decision
                ? 'Position après ton coup'
                : selected === 0
                  ? 'Position initiale'
                  : 'Position après le coup sélectionné'}
            </strong>
            <span>
              {alternative && detail?.bestSan
                ? `Meilleur coup · ${detail.bestSan}`
                : scoreLabel(boardScore)}
            </span>
          </div>
          <ComputerBoard
            fen={replay.positions[boardPly]}
            player={game.player}
            last={decision ? undefined : played}
            arrows={arrows}
            originHint={originHint}
            mark={
              decision && played && visual && quality
                ? {
                    square: played.to,
                    from: played.from,
                    good: quality.good,
                    symbol: quality.symbol,
                    fill: visual.square,
                    ring: visual.ring,
                    fromFill: visual.origin,
                    fromRing: visual.originRing,
                    tone: detail?.category,
                  }
                : null
            }
          />
        </section>
        </div>
        <div className="review-panel">
        <section className="review-insight" aria-label="Détail du coup sélectionné" aria-live="polite">
          <span className="eyebrow">
            {selected === 0 ? 'LE POINT DE DÉPART' : detail ? 'TON COUP' : 'RÉPONSE DE L’ORDINATEUR'}
          </span>
          <h2>
            {played
              ? `${moveNumber(selected)} ${frenchSan(played.san)}${detail?.category === 'mistake' ? '?' : detail?.category === 'blunder' ? '??' : detail?.category === 'inaccuracy' ? '?!' : ''}`
              : 'Position initiale'}
          </h2>
          {detail && quality && (
            <span className={`review-category ${detail.category}`}>
              <ClassificationMedallion category={detail.category} className="detail-medallion" />
              {quality.name}
            </span>
          )}
          {detail && (
            <div className="recommendation">
              {alreadyBest ? (
                <strong className="best-move-confirmation">✓ Meilleur coup</strong>
              ) : (
                <strong>Meilleur coup : {detail.bestSan ?? 'Non disponible'}</strong>
              )}
              {alternative && (
                <p className="best-move-explanation">
                  La flèche verte montre le coup recommandé à la place du tien.
                </p>
              )}
            </div>
          )}
        </section>
        {/* Everything that can be read after the board keeps its own block, so the phone
            shows the decision itself without any scrolling. */}
        <section className="review-detail-block" aria-label="Commentaire et évaluations">
          <p className="review-comment" data-testid="review-comment">
            <GlossaryText>
              {detail?.comment ??
                (selected
                  ? 'Ce coup est la réponse de Stockfish. Sélectionne l’un de tes coups pour lire son commentaire.'
                  : 'Les Blancs commencent. Avance dans la partie pour explorer les décisions.')}
            </GlossaryText>
          </p>
          {detail?.proposedLine && (
            <div className="proposed-line">
              <span>Suite proposée</span>
              <p>{detail.proposedLine}</p>
            </div>
          )}
          <dl className="review-evaluations">
            <div>
              <dt>Évaluation avant</dt>
              <dd>{scoreLabel(before.score)}</dd>
            </div>
            <div>
              <dt>Évaluation après</dt>
              <dd>{scoreLabel(after.score)}</dd>
            </div>
          </dl>
          <p className="computer-note">Valeurs toujours du point de vue des Blancs.</p>
        </section>
        <section className="review-history-block" aria-label="Explorer les coups">
          <h3>Explorer les coups</h3>
          <MoveHistory
            moves={replay.moves}
            reviews={report.moves}
            selected={selected}
            onSelect={(ply) => select(ply)}
          />
        </section>
        {thread}
        </div>
        <div className="review-controls" aria-label="Navigation dans la partie">
          {(() => {
            const atStart = activeCategory ? filteredIndex <= 0 : selected === 0;
            const atEnd = activeCategory
              ? filteredIndex === filteredPlies.length - 1
              : selected === game.moves.length;
            return (
              <>
                <button
                  className="button secondary nav-edge"
                  aria-label="Premier coup"
                  disabled={atStart}
                  onClick={() => navigate('first')}
                >
                  <ChevronsLeft size={19} />
                  <span>Premier</span>
                </button>
                <button
                  className="button secondary"
                  aria-label="Coup précédent"
                  disabled={atStart}
                  onClick={() => navigate('previous')}
                >
                  <ChevronLeft size={21} />
                  <span>Précédent</span>
                </button>
                <span data-testid="review-position" aria-live="polite">
                  {activeCategory
                    ? `${categoryInfo[activeCategory].name} ${filteredIndex + 1} / ${filteredPlies.length}`
                    : `${selected} / ${game.moves.length}`}
                </span>
                <button
                  className="button secondary"
                  aria-label="Coup suivant"
                  disabled={atEnd}
                  onClick={() => navigate('next')}
                >
                  <span>Suivant</span>
                  <ChevronRight size={21} />
                </button>
                <button
                  className="button secondary nav-edge"
                  aria-label="Dernier coup"
                  disabled={atEnd}
                  onClick={() => navigate('last')}
                >
                  <span>Dernier</span>
                  <ChevronsRight size={19} />
                </button>
              </>
            );
          })()}
        </div>
      </div>
      <details className="review-method">
        <summary>Comment lire ce bilan ?</summary>
        <p>
          Les catégories comparent l’évaluation avant et après chacun de tes coups, depuis ton camp.
          Les petits écarts sont tolérés ; les positions déjà très déséquilibrées et les mats sont
          traités séparément. « Meilleur coup » désigne le choix trouvé par cette recherche limitée.
        </p>
        <p>
          Pour l’un de tes coups, l’échiquier montre la position telle qu’elle était avant ta
          décision : la flèche de ton coup et celle du coup recommandé restent ainsi valables dans
          la même position. La couleur de la case d’arrivée reprend la classification, toujours
          accompagnée de son symbole et de son nom.
        </p>
        <p>
          La précision estimée résume ces pertes ajustées. Ce n’est ni une mesure officielle
          Chess.com, ni une note absolue de ton niveau. Les commentaires utilisent des règles
          locales, sans IA externe. Les suites proposées sont courtes et peuvent changer avec une
          recherche plus longue.
        </p>
      </details>
    </>
  );
}
