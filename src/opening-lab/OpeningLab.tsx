import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Compass,
  Cpu,
  RotateCcw,
  Shield,
  Sparkles,
} from 'lucide-react';
import type { Side } from '../data/openings';
import { sideName } from '../data/openings';
import { ComputerBoard } from '../computer/ComputerBoard';
import { MoveHistory } from '../computer/MoveHistory';
import { positionResult, resultReason } from '../computer/game';
import { EvaluationBar } from '../components/EvaluationBar';
import { pieceUrl } from '../ui/pieces';
import type { BoardMark } from '../board/InteractiveBoard';
import {
  moveCursor,
  playLabMove,
  recognizeOpening,
  recommendationsFrom,
  replayTimeline,
  scoreForEvaluationBar,
  scoreLabelForStudiedSide,
  type LabTimeline,
} from './model';
import { useOpeningLabAnalysis } from './useOpeningLabAnalysis';

const initialTimeline: LabTimeline = { moves: [], cursor: 0 };
const arrowColors = [
  '#227d52',
  '#447e67',
  '#977d3d',
];

export default function OpeningLab({ onOpenings }: { onOpenings: () => void }) {
  const [studiedSide, setStudiedSide] = useState<Side | null>(null);
  return (
    <main id="main" className={`opening-lab-page page-width ${studiedSide ? 'mobile-focus' : ''}`}>
      <div className="breadcrumb">
        <button onClick={onOpenings}>
          <ArrowLeft size={15} />
          Les ouvertures
        </button>
        <span>Ouverture libre</span>
      </div>
      {studiedSide ? (
        <OpeningLabSession
          key={studiedSide}
          studiedSide={studiedSide}
          onChangeSide={() => setStudiedSide(null)}
        />
      ) : (
        <OpeningLabSetup onChoose={setStudiedSide} />
      )}
    </main>
  );
}

function OpeningLabSetup({ onChoose }: { onChoose: (side: Side) => void }) {
  return (
    <section className="opening-lab-setup" aria-labelledby="opening-lab-title">
      <div className="opening-lab-intro">
        <span className="eyebrow">LABORATOIRE D’OUVERTURES</span>
        <h1 id="opening-lab-title">
          Une position.
          <br />
          <span>Autant d’idées que tu veux.</span>
        </h1>
        <p>
          Contrôle les deux camps, teste n’importe quel coup légal et découvre les meilleures
          réponses uniquement pour le camp que tu étudies.
        </p>
      </div>
      <fieldset className="opening-lab-side-picker">
        <legend>Quel camp souhaites-tu étudier ?</legend>
        {(['w', 'b'] as const).map((side) => (
          <button
            key={side}
            type="button"
            aria-label={`Étudier les ${sideName(side)}`}
            onClick={() => onChoose(side)}
          >
            <img src={pieceUrl(`${side}K`)} alt="" />
            <span>
              <small>Garder ce camp devant toi</small>
              <strong>Étudier les {sideName(side)}</strong>
              <em>
                {side === 'w'
                  ? 'Les recommandations apparaissent au tour des Blancs.'
                  : 'Les recommandations apparaissent au tour des Noirs.'}
              </em>
            </span>
            <ChevronRight size={21} aria-hidden="true" />
          </button>
        ))}
      </fieldset>
      <div className="opening-lab-principle">
        <Compass size={22} />
        <p>
          <strong>Tu construis la position.</strong> Stockfish ne joue aucun coup : il éclaire
          seulement les choix de ton camp.
        </p>
      </div>
    </section>
  );
}

function OpeningLabSession({
  studiedSide,
  onChangeSide,
}: {
  studiedSide: Side;
  onChangeSide: () => void;
}) {
  const [timeline, setTimeline] = useState<LabTimeline>(initialTimeline);
  const [illegal, setIllegal] = useState<BoardMark | null>(null);
  const replay = useMemo(() => replayTimeline(timeline), [timeline]);
  const history = useMemo(
    () => timeline.moves.slice(0, timeline.cursor),
    [timeline.cursor, timeline.moves],
  );
  const fen = replay.game.fen();
  const result = positionResult(replay.game);
  const studiedTurn = replay.game.turn() === studiedSide;
  const analysis = useOpeningLabAnalysis({
    fen,
    history,
    studiedSide,
    active: !result,
  });
  const recommendations = useMemo(
    () =>
      studiedTurn && analysis.recommendationsVisible && analysis.result
        ? recommendationsFrom(analysis.result, fen, studiedSide)
        : [],
    [analysis.recommendationsVisible, analysis.result, fen, studiedSide, studiedTurn],
  );
  useEffect(() => {
    if (!illegal) return;
    const timer = window.setTimeout(() => setIllegal(null), 900);
    return () => window.clearTimeout(timer);
  }, [illegal]);
  const currentMoves = replay.moves.slice(0, timeline.cursor);
  const recognition = recognizeOpening(history);
  const evaluation = analysis.result ? scoreForEvaluationBar(analysis.result.score) : null;
  const evaluationLabel = analysis.result
    ? scoreLabelForStudiedSide(analysis.result.score, studiedSide)
    : '—';
  const status = result
    ? resultReason(result)
    : studiedTurn
      ? analysis.status === 'thinking' || analysis.status === 'loading'
        ? 'Analyse…'
        : analysis.status === 'unavailable'
          ? 'Analyse indisponible'
          : 'Recommandations prêtes'
      : `À toi de choisir le coup des ${sideName(replay.game.turn())}`;
  return (
    <>
      <header className="opening-lab-heading">
        <div>
          <span className="eyebrow">OUVERTURE LIBRE · {sideName(studiedSide).toUpperCase()}</span>
          <h1>Explore la position.</h1>
          <div className="opening-lab-recognition" aria-live="polite">
            {recognition.kind === 'free' ? (
              <span>Exploration libre</span>
            ) : (
              <>
                <strong>{recognition.opening}</strong>
                {(recognition.variation || !recognition.inBook) && (
                  <span>{recognition.inBook ? recognition.variation : 'Hors répertoire'}</span>
                )}
              </>
            )}
          </div>
        </div>
        <button className="button secondary" onClick={onChangeSide}>
          Changer de camp
        </button>
      </header>
      <div className="opening-lab-layout">
        <section className="opening-lab-board-column" aria-label="Laboratoire d’ouvertures">
          <div className="opening-lab-turn">
            <span className={`side-dot ${replay.game.turn() === 'b' ? 'black' : ''}`} />
            <strong>Trait aux {sideName(replay.game.turn())}</strong>
            <span className="opening-lab-viewpoint">
              <Shield size={14} />
              Point de vue : {sideName(studiedSide)} en bas
            </span>
            <span role="status">{status}</span>
          </div>
          <div className="board-with-eval opening-lab-board-with-eval">
            <EvaluationBar
              analysis={{
                status:
                  analysis.status === 'thinking'
                    ? 'analyzing'
                    : analysis.status === 'ready'
                      ? 'ready'
                      : analysis.status,
                evaluation,
              }}
              orientation={studiedSide === 'w' ? 'white' : 'black'}
              label={evaluationLabel}
              description={`Évaluation ${evaluationLabel}, du point de vue des ${sideName(studiedSide)}`}
              perspective={studiedSide === 'w' ? 'white' : 'black'}
            />
            <ComputerBoard
              fen={fen}
              player={studiedSide}
              label={`Échiquier d’ouverture libre, ${sideName(studiedSide)} en bas`}
              interactionSide={replay.game.turn()}
              enabled={!result}
              last={currentMoves.at(-1)}
              mark={illegal}
              arrows={recommendations.map((recommendation, index) => ({
                from: recommendation.from,
                to: recommendation.to,
                color: arrowColors[index],
                kind: `opening-lab-${recommendation.rank}`,
                rank: recommendation.rank,
                badge: recommendation.badge,
                moveLabel: recommendation.san,
                evaluation: recommendation.label,
              }))}
              onMove={(from, to, promotion) => {
                const next = playLabMove(timeline, from, to, promotion);
                if (next === timeline) {
                  setIllegal({
                    square: to,
                    good: false,
                    symbol: '✕',
                    id: Date.now(),
                  });
                  return false;
                }
                setIllegal(null);
                setTimeline(next);
                return true;
              }}
            />
          </div>
        </section>
        <aside className="opening-lab-panel" aria-label="Recommandations et historique">
          <section className="opening-lab-recommendations" aria-live="polite">
            <div className="opening-lab-panel-title">
              <Sparkles size={18} />
              <div>
                <span className="eyebrow">POUR TON CAMP</span>
                <h2>Coups recommandés</h2>
              </div>
            </div>
            {result ? (
              <div className="opening-lab-terminal" role="status">
                <strong>Partie terminée</strong>
                <span>{resultReason(result)}</span>
              </div>
            ) : !studiedTurn ? (
              <div className="opening-lab-opponent-turn" data-testid="opponent-turn-no-help">
                <Compass size={22} />
                <strong>À toi de créer la réponse adverse.</strong>
                <p>Aucune aide moteur n’est affichée pour ce camp.</p>
              </div>
            ) : analysis.status === 'unavailable' ? (
              <p className="opening-lab-analysis-note">
                Analyse indisponible. Tu peux continuer à jouer.
              </p>
            ) : recommendations.length ? (
              <ol className="opening-lab-candidates">
                {recommendations.map((recommendation) => (
                  <li key={recommendation.move} className={`rank-${recommendation.rank}`}>
                    <span>{recommendation.badge}</span>
                    <strong>{recommendation.san}</strong>
                    <b>{recommendation.label}</b>
                    <small>
                      Si tu joues ce coup, l’évaluation estimée devient {recommendation.label}.
                    </small>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="opening-lab-thinking" role="status">
                <Cpu size={19} />
                Analyse de la position…
              </div>
            )}
          </section>
          <section className="opening-lab-history" aria-labelledby="opening-lab-history-title">
            <h2 id="opening-lab-history-title">Ta ligne</h2>
            <MoveHistory
              moves={replay.moves}
              selected={timeline.cursor}
              onSelect={(cursor) => setTimeline((current) => moveCursor(current, cursor))}
            />
            <div className="opening-lab-navigation" aria-label="Navigation dans la ligne">
              <button
                className="button secondary"
                disabled={timeline.cursor === 0}
                onClick={() => setTimeline((current) => moveCursor(current, current.cursor - 1))}
              >
                <ChevronLeft size={17} />
                Coup précédent
              </button>
              <button
                className="button secondary"
                disabled={timeline.cursor === timeline.moves.length}
                onClick={() => setTimeline((current) => moveCursor(current, current.cursor + 1))}
              >
                Coup suivant
                <ChevronRight size={17} />
              </button>
            </div>
            <button
              className="button secondary opening-lab-reset"
              onClick={() => {
                setIllegal(null);
                setTimeline(initialTimeline);
              }}
            >
              <RotateCcw size={16} />
              Recommencer
            </button>
          </section>
          <p className="opening-lab-note">
            Tu contrôles les deux camps. Seuls les coups illégaux sont refusés ; quitter la théorie
            est toujours permis.
          </p>
        </aside>
      </div>
    </>
  );
}
