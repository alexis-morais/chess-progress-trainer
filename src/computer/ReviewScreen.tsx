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
import { moveNumber, replayGame, resultReason, resultTitle } from './game';
import { analyzeGame, navigatePly, scoreLabel } from './review';
import { categories, categoryInfo, type GameRecord, type ReviewReport } from './types';

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
  function select(ply: number) {
    setSelected(ply);
    setShowBest(false);
  }
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
  const played = replay.moves[selected - 1];
  const detail = report.moves.find((move) => move.ply === selected);
  const before = report.positions[Math.max(0, selected - 1)];
  const after = report.positions[selected];
  const token = showBest && detail ? before.bestMove : null;
  const quality = detail ? categoryInfo[detail.category] : null;
  const positionPly = showBest && detail ? selected - 1 : selected;
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
          <span>Précision estimée</span>
          <small>Indice pédagogique local</small>
        </div>
        <div className="category-totals">
          {categories.map((category) => (
            <div key={category} className={category}>
              <span className={`category-symbol ${category}`}>{categoryInfo[category].symbol}</span>
              <strong>{report.counts[category]}</strong>
              <span>{categoryInfo[category].plural}</span>
            </div>
          ))}
        </div>
      </section>
      <EvaluationChart positions={report.positions} selected={selected} onSelect={select} />
      <div className="computer-layout review-layout">
        <section className="computer-board-section" aria-label="Explorateur de la partie">
          <div className="review-board-caption">
            <strong>
              {showBest && detail
                ? 'Position avant ton coup'
                : selected === 0
                  ? 'Position initiale'
                  : 'Position après le coup sélectionné'}
            </strong>
            <span>{scoreLabel(report.positions[positionPly].score)}</span>
          </div>
          <ComputerBoard
            fen={replay.positions[positionPly]}
            player={game.player}
            last={showBest ? undefined : played}
            arrow={token ? { from: token.slice(0, 2), to: token.slice(2, 4) } : undefined}
            mark={
              !showBest && played && quality
                ? { square: played.to, good: quality.good, symbol: quality.symbol }
                : null
            }
          />
          <div className="review-controls" aria-label="Navigation dans la partie">
            <button
              className="button secondary"
              aria-label="Revenir au début"
              disabled={selected === 0}
              onClick={() => select(navigatePly(selected, 'first', game.moves.length))}
            >
              <ChevronsLeft size={21} />
            </button>
            <button
              className="button secondary"
              aria-label="Coup précédent"
              disabled={selected === 0}
              onClick={() => select(navigatePly(selected, 'previous', game.moves.length))}
            >
              <ChevronLeft size={21} />
            </button>
            <span data-testid="review-position">
              {selected} / {game.moves.length}
            </span>
            <button
              className="button secondary"
              aria-label="Coup suivant"
              disabled={selected === game.moves.length}
              onClick={() => select(navigatePly(selected, 'next', game.moves.length))}
            >
              <ChevronRight size={21} />
            </button>
            <button
              className="button secondary"
              aria-label="Aller à la fin"
              disabled={selected === game.moves.length}
              onClick={() => select(navigatePly(selected, 'last', game.moves.length))}
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
            {detail && (
              <div className="recommendation">
                <strong>Meilleur coup : {detail.bestSan ?? 'Non disponible'}</strong>
                {before.bestMove && (
                  <label className="best-move-toggle">
                    <input
                      type="checkbox"
                      checked={showBest}
                      onChange={(event) => setShowBest(event.target.checked)}
                    />
                    Voir le meilleur coup sur la position d’origine
                  </label>
                )}
                {detail.proposedLine && (
                  <>
                    <span>Suite proposée</span>
                    <p>{detail.proposedLine}</p>
                  </>
                )}
              </div>
            )}
          </div>
          <h3>Explorer les coups</h3>
          <MoveHistory
            moves={replay.moves}
            reviews={report.moves}
            selected={selected}
            onSelect={select}
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
