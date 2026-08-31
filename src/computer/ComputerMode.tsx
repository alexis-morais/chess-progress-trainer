import { useCallback, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Cpu, Sparkles, Trophy, Shuffle } from 'lucide-react';
import { pieceUrl } from '../ui/pieces';
import { sideName } from '../data/openings';
import { ComputerBoard } from './ComputerBoard';
import { GameSession } from './GameSession';
import { ReviewScreen } from './ReviewScreen';
import { createGame, replayGame, resultReason, resultTitle } from './game';
import { loadLastGame, saveLastGame } from './storage';
import {
  difficulties,
  difficultyInfo,
  type ColorChoice,
  type Difficulty,
  type GameRecord,
  type ReviewReport,
} from './types';
import './computer.css';

export default function ComputerMode({ onHome }: { onHome: () => void }) {
  const [view, setView] = useState<'setup' | 'game' | 'finished' | 'review'>('setup');
  const [color, setColor] = useState<ColorChoice>('w');
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner');
  const [record, setRecord] = useState<GameRecord | null>(null);
  const [review, setReview] = useState<ReviewReport | null>(null);
  const [saved, setSaved] = useState(loadLastGame);
  const [storageWarning, setStorageWarning] = useState(false);
  const onEnd = useCallback((game: GameRecord) => {
    setRecord(game);
    setReview(null);
    setSaved({ game, review: null });
    setView('finished');
    setStorageWarning(!saveLastGame(game, null));
    window.scrollTo(0, 0);
  }, []);
  const onReview = useCallback(
    (report: ReviewReport) => {
      if (!record) return;
      setReview(report);
      setSaved({ game: record, review: report });
      setStorageWarning(!saveLastGame(record, report));
    },
    [record],
  );
  return (
    <main id="main" className={`computer-page page-width ${view !== 'setup' ? 'playing-page' : ''}`}>
      <div className="breadcrumb">
        <button onClick={onHome}>
          <ArrowLeft size={15} />
          Retour à l’accueil
        </button>
        <span>Jouer contre l’ordinateur</span>
      </div>
      {storageWarning && (
        <p className="computer-warning" role="status">
          La sauvegarde locale est indisponible. Garde cet onglet ouvert pour conserver la partie et
          son bilan.
        </p>
      )}
      {view === 'setup' && (
        <>
          <div className="computer-intro">
            <span className="eyebrow">L’ESPACE PARTIE LIBRE</span>
            <h1>
              Un adversaire.
              <br />
              <span>Mille façons de progresser.</span>
            </h1>
            <p>
              Joue une partie complète contre Stockfish, puis prends le temps de comprendre tes
              décisions.
            </p>
          </div>
          <div className="computer-setup">
            <section className="setup-card">
              <div className="setup-title">
                <Cpu size={25} />
                <div>
                  <h2>Prépare ta partie</h2>
                  <p>Sans chrono, sans compte, sans pression.</p>
                </div>
              </div>
              <fieldset className="color-choices">
                <legend>Choisis ton camp</legend>
                {(
                  [
                    { id: 'w', name: 'Blancs' },
                    { id: 'b', name: 'Noirs' },
                    { id: 'random', name: 'Aléatoire' },
                  ] as const
                ).map((item) => (
                  <label className={color === item.id ? 'selected' : ''} key={item.id}>
                    <input
                      type="radio"
                      name="game-color"
                      checked={color === item.id}
                      onChange={() => setColor(item.id)}
                    />
                    {item.id === 'random' ? (
                      <Shuffle size={25} aria-hidden="true" />
                    ) : (
                      <img src={pieceUrl(`${item.id}K`)} alt="" />
                    )}
                    <span>{item.name}</span>
                  </label>
                ))}
              </fieldset>
              <fieldset className="difficulty-choices">
                <legend>Choisis ton adversaire</legend>
                {difficulties.map((item) => (
                  <label className={difficulty === item.id ? 'selected' : ''} key={item.id}>
                    <input
                      type="radio"
                      name="game-difficulty"
                      checked={difficulty === item.id}
                      onChange={() => setDifficulty(item.id)}
                    />
                    <span>
                      <strong>{item.name}</strong>
                      <small>{item.description}</small>
                    </span>
                    <span className="level-bars" aria-hidden="true">
                      {String(difficulties.indexOf(item) + 1).padStart(2, '0')}
                    </span>
                  </label>
                ))}
              </fieldset>
              <button
                className="button primary"
                onClick={() => {
                  setRecord(createGame(color, difficulty));
                  setReview(null);
                  setView('game');
                  window.scrollTo(0, 0);
                }}
              >
                Commencer la partie <ArrowRight size={18} />
              </button>
              <p className="computer-note">
                Les niveaux ne correspondent pas à un Elo garanti. Même au niveau Débutant,
                Stockfish peut trouver de bons coups.
              </p>
            </section>
            <aside className="setup-aside">
              <Sparkles size={24} />
              <h2>
                Joue d’abord.
                <br />
                Comprends ensuite.
              </h2>
              <p>
                Après la partie, retrouve tes meilleurs coups, tes occasions manquées et les idées
                proposées par Stockfish.
              </p>
              <ol>
                <li>Une partie libre, avec tous les coups légaux.</li>
                <li>Une analyse locale, position après position.</li>
                <li>Un bilan à explorer, à ton rythme.</li>
              </ol>
              <div className="review-preview-art" aria-hidden="true">
                <span>LE FIL DE TA PARTIE</span>
                <svg viewBox="0 0 340 95">
                  <path d="M0 48H340" stroke="currentColor" opacity=".2" strokeDasharray="4 6" />
                  <path
                    d="M5 50 38 51 64 43 93 55 126 29 157 34 185 61 214 36 249 42 283 19 330 11"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                  />
                  <circle cx="283" cy="19" r="5" fill="currentColor" />
                </svg>
                <p>Des évaluations, des idées et de nouveaux repères.</p>
              </div>
              <p className="computer-note">
                Dans l’entraîneur d’ouvertures, rien ne change : l’adversaire suit toujours la
                variante prévue.
              </p>
            </aside>
          </div>
          {saved && (
            <section className="saved-game">
              <div>
                <span className="eyebrow">CONSERVÉE SUR CET APPAREIL</span>
                <h3>Ta dernière partie</h3>
                <p>
                  {resultTitle(saved.game)} · {sideName(saved.game.player)} ·{' '}
                  {difficultyInfo(saved.game.difficulty).name} ·{' '}
                  {new Date(saved.game.completedAt!).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <button
                className="button secondary"
                onClick={() => {
                  setRecord(saved.game);
                  setReview(saved.review);
                  setView(saved.review ? 'review' : 'finished');
                  window.scrollTo(0, 0);
                }}
              >
                {saved.review ? 'Revoir le bilan' : 'Retrouver la partie'}
                <ArrowRight size={17} />
              </button>
            </section>
          )}
        </>
      )}
      {view === 'game' && record && (
        <>
          <div className="computer-game-heading">
            <span className="eyebrow">PARTIE CONTRE STOCKFISH</span>
            <h1>Chaque décision compte.</h1>
          </div>
          <GameSession key={record.id} initial={record} onEnd={onEnd} />
        </>
      )}
      {view === 'finished' && record && (
        <FinishedGame
          game={record}
          hasReview={!!review}
          onAnalyze={() => {
            setView('review');
            window.scrollTo(0, 0);
          }}
          onNew={() => setView('setup')}
        />
      )}
      {view === 'review' && record && (
        <ReviewScreen
          game={record}
          cached={review}
          onComplete={onReview}
          onExit={() => {
            setView('finished');
            window.scrollTo(0, 0);
          }}
        />
      )}
    </main>
  );
}
function FinishedGame({
  game,
  hasReview,
  onAnalyze,
  onNew,
}: {
  game: GameRecord;
  hasReview: boolean;
  onAnalyze: () => void;
  onNew: () => void;
}) {
  const replay = useMemo(() => replayGame(game), [game]);
  return (
    <div className="computer-layout finished-game">
      <section className="computer-board-section">
        <ComputerBoard fen={replay.game.fen()} player={game.player} last={replay.moves.at(-1)} />
      </section>
      <section
        className="training-panel computer-panel result-panel"
        aria-label="Résultat de la partie"
      >
        <div className="trophy">
          <Trophy size={32} />
        </div>
        <span className="eyebrow">PARTIE TERMINÉE</span>
        <h1>{resultTitle(game)}</h1>
        <p className="result-reason">{resultReason(game.result!)}</p>
        <p>
          {sideName(game.player)} · {difficultyInfo(game.difficulty).name}
        </p>
        <p>{game.moves.length} demi-coups joués</p>
        <button className="button primary" onClick={onAnalyze}>
          {hasReview ? 'Revoir le bilan' : 'Analyser ma partie'}
          <Sparkles size={17} />
        </button>
        <button className="button secondary" onClick={onNew}>
          Nouvelle partie
        </button>
        <p className="computer-note">
          La dernière partie terminée et son bilan sont conservés localement, si ton navigateur
          autorise le stockage.
        </p>
      </section>
    </div>
  );
}
