import { difficultyLabel } from './difficulty';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Cpu,
} from 'lucide-react';
import { frenchSan, sideName } from '../data/openings';
import { ComputerEngine, isAbort } from './ComputerEngine';
import { ComputerBoard } from './ComputerBoard';
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
  type GameRecord,
  type ReviewReport,
} from './types';
import { InfoTooltip } from '../components/InfoTooltip';

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
  const [selected, setSelected] = useState(game.moves.length);
  const [showBest, setShowBest] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const replay = useMemo(() => replayGame(game), [game]);
  const completed = useRef(onComplete);
  completed.current = onComplete;
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
        completed.current(result);
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
  useEffect(() => {
    if (!report) return;
    const move = replay.moves[selected - 1];
    const reviewed = report.moves.find((item) => item.ply === selected);
    const analysis = report.positions[Math.max(0, selected - 1)];
    setShowBest(
      Boolean(
        move &&
          reviewed?.bestSan &&
          analysis?.bestMove &&
          uci(move) !== analysis.bestMove &&
          bestMoveArrow(move.before, analysis.bestMove),
      ),
    );
  }, [report]);
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
  const review = report;
  function alternativeAt(ply: number) {
    const move = replay.moves[ply - 1];
    const reviewed = review.moves.find((item) => item.ply === ply);
    const analysis = review.positions[Math.max(0, ply - 1)];
    return Boolean(
      move &&
        reviewed &&
        reviewed.bestSan &&
        analysis?.bestMove &&
        uci(move) !== analysis.bestMove &&
        bestMoveArrow(move.before, analysis.bestMove),
    );
  }
  function select(ply: number, keepFilter = false) {
    setSelected(ply);
    if (!keepFilter) setActiveCategory(null);
    setShowBest(alternativeAt(ply));
  }
  function chooseCategory(category: Category) {
    const plies = categoryPlies(review.moves, category);
    if (!plies.length) return;
    setActiveCategory(category);
    select(plies[0], true);
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
  const alreadyBest = Boolean(detail && before.bestMove && played && uci(played) === before.bestMove);
  const alternative =
    detail && !alreadyBest ? bestMoveArrow(replay.positions[selected - 1], before.bestMove) : null;
  const visibleAlternative = showBest && alternative ? alternative : null;
  const quality = detail ? categoryInfo[detail.category] : null;
  const positionPly = visibleAlternative ? selected - 1 : selected;
  return (
    <>
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
          <span><InfoTooltip term="Précision estimée" /></span>
          <small>Indice pédagogique local</small>
        </div>
        <div className="review-classifications">
          <div className="review-filter-heading">
            <strong>Retrouver mes coups</strong>
            <button
              type="button"
              className="review-all-filter"
              aria-pressed={activeCategory === null}
              onClick={() => {
                setActiveCategory(null);
                setShowBest(false);
              }}
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
                  <span className={`category-symbol ${category}`} aria-hidden="true">
                    {categoryInfo[category].symbol}
                  </span>
                  <strong>{count}</strong>
                  <span>{categoryInfo[category].plural}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>
      <EvaluationChart positions={report.positions} selected={selected} onSelect={select} />
      <div className="computer-layout review-layout">
        <section className="computer-board-section" aria-label="Explorateur de la partie">
          <div className="review-board-caption">
            <strong>
              {visibleAlternative
                ? 'Position avant ta décision'
                : selected === 0
                  ? 'Position initiale'
                  : 'Position après le coup sélectionné'}
            </strong>
            <span>
              {visibleAlternative && detail?.bestSan
                ? `Meilleur coup · ${detail.bestSan}`
                : scoreLabel(report.positions[positionPly].score)}
            </span>
          </div>
          <ComputerBoard
            fen={replay.positions[positionPly]}
            player={game.player}
            last={visibleAlternative ? undefined : played}
            arrow={
              visibleAlternative
                ? { ...visibleAlternative, color: 'rgba(31, 124, 88, .9)', kind: 'best-move' }
                : undefined
            }
            mark={
              !visibleAlternative && played && quality
                ? { square: played.to, good: quality.good, symbol: quality.symbol }
                : null
            }
          />
          <div className="review-controls" aria-label="Navigation dans la partie">
            <button
              className="button secondary"
              aria-label="Revenir au début"
              disabled={activeCategory ? filteredIndex <= 0 : selected === 0}
              onClick={() => navigate('first')}
            >
              <ChevronsLeft size={21} />
            </button>
            <button
              className="button secondary"
              aria-label="Coup précédent"
              disabled={activeCategory ? filteredIndex <= 0 : selected === 0}
              onClick={() => navigate('previous')}
            >
              <ChevronLeft size={21} />
            </button>
            <span data-testid="review-position" aria-live="polite">
              {activeCategory
                ? `${categoryInfo[activeCategory].name} ${filteredIndex + 1} / ${filteredPlies.length}`
                : `${selected} / ${game.moves.length}`}
            </span>
            <button
              className="button secondary"
              aria-label="Coup suivant"
              disabled={
                activeCategory
                  ? filteredIndex === filteredPlies.length - 1
                  : selected === game.moves.length
              }
              onClick={() => navigate('next')}
            >
              <ChevronRight size={21} />
            </button>
            <button
              className="button secondary"
              aria-label="Aller à la fin"
              disabled={
                activeCategory
                  ? filteredIndex === filteredPlies.length - 1
                  : selected === game.moves.length
              }
              onClick={() => navigate('last')}
            >
              <ChevronsRight size={21} />
            </button>
          </div>
        </section>
        <aside
          className="training-panel computer-panel review-detail"
          aria-label="Détail du coup sélectionné"
        >
          <div aria-live="polite">
            <span className="eyebrow">
              {selected === 0
                ? 'LE POINT DE DÉPART'
                : detail
                  ? 'TON COUP'
                  : 'RÉPONSE DE L’ORDINATEUR'}
            </span>
            <h2>
              {played
                ? `${moveNumber(selected)} ${frenchSan(played.san)}${detail?.category === 'mistake' ? '?' : detail?.category === 'blunder' ? '??' : detail?.category === 'inaccuracy' ? '?!' : ''}`
                : 'Position initiale'}
            </h2>
            {detail && quality && (
              <span className={`review-category ${detail.category}`}>
                {quality.symbol} {quality.name}
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
                  <>
                    <p className="best-move-explanation">
                      La flèche verte montre le choix recommandé dans la position avant ton coup.
                    </p>
                    <div className="best-move-views" aria-label="Vue de la décision">
                      <button
                        type="button"
                        aria-pressed={!showBest}
                        onClick={() => setShowBest(false)}
                      >
                        Mon coup
                      </button>
                      <button
                        type="button"
                        aria-pressed={showBest}
                        onClick={() => setShowBest(true)}
                      >
                        Meilleur coup
                      </button>
                    </div>
                  </>
                )}
                {detail.proposedLine && (
                  <>
                    <span>Suite proposée</span>
                    <p>{detail.proposedLine}</p>
                  </>
                )}
              </div>
            )}
            <p className="review-comment" data-testid="review-comment">
              {detail?.comment ??
                (selected
                  ? 'Ce coup est la réponse de Stockfish. Sélectionne l’un de tes coups pour lire son commentaire.'
                  : 'Les Blancs commencent. Avance dans la partie pour explorer les décisions.')}
            </p>
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
          </div>
          <h3>Explorer les coups</h3>
          <MoveHistory
            moves={replay.moves}
            reviews={report.moves}
            selected={selected}
            onSelect={(ply) => select(ply)}
          />
        </aside>
      </div>
      <details className="review-method">
        <summary>Comment lire ce bilan ?</summary>
        <p>
          Les catégories comparent l’évaluation avant et après chacun de tes coups, depuis ton camp.
          Les petits écarts sont tolérés ; les positions déjà très déséquilibrées et les mats sont
          traités séparément. « Meilleur coup » désigne le choix trouvé par cette recherche limitée.
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
