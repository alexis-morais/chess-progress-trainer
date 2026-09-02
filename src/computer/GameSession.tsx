import { useEffect, useMemo, useRef, useState } from 'react';
import { Cpu, Flag, User } from 'lucide-react';
import { sideName } from '../data/openings';
import { ComputerEngine, isAbort } from './ComputerEngine';
import { ComputerBoard, ChoiceDialog, type BoardMark } from './ComputerBoard';
import { attemptMove, otherSide, replayGame, resign } from './game';
import { difficultyInfo, type EngineStatus, type GameRecord } from './types';
import { MoveHistory } from './MoveHistory';
import { searchForLevel } from './chooseMove';

// The mating move stays on screen — king marked, badge in place — before the result panel
// takes over. Comfortably under the 2 s ceiling; short enough that nobody feels like waiting.
export const MATE_SEQUENCE_MS = 1300;

export function GameSession({
  initial,
  onEnd,
  onPlayerMove,
}: {
  initial: GameRecord;
  onEnd: (game: GameRecord) => void;
  onPlayerMove?: (game: GameRecord) => void;
}) {
  const [record, setRecord] = useState(initial);
  const current = useRef(record);
  const engine = useRef<ComputerEngine | null>(null);
  const [status, setStatus] = useState<EngineStatus>('loading');
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const [illegal, setIllegal] = useState<{ mark: BoardMark; id: number } | null>(null);
  const replay = useMemo(() => replayGame(record), [record]);
  const playerTurn = replay.game.turn() === record.player;
  const difficulty = difficultyInfo(record.difficulty);
  const mateTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(mateTimer.current), []);
  useEffect(() => {
    setError('');
    const instance = new ComputerEngine(setStatus);
    engine.current = instance;
    return () => {
      instance.dispose();
      engine.current = null;
    };
  }, [retry]);
  function commit(next: GameRecord) {
    if (next === current.current) return;
    current.current = next;
    setRecord(next);
    setIllegal(null);
    if (!next.result) return;
    // The board keeps showing the mated king — and its badge — for a short beat before the
    // existing result panel takes over. Every other ending stays instant, as before.
    if (next.result.reason === 'checkmate')
      mateTimer.current = setTimeout(() => onEnd(next), MATE_SEQUENCE_MS);
    else onEnd(next);
  }
  useEffect(() => {
    if (playerTurn || record.result) return;
    const controller = new AbortController();
    const expectedPly = record.moves.length;
    const timer = window.setTimeout(() => {
      if (!engine.current) return;
      searchForLevel(
        engine.current,
        { fen: replay.game.fen(), history: record.moves },
        record.difficulty,
        controller.signal,
      )
        .then((reply) => {
          if (controller.signal.aborted) return;
          const before = current.current;
          const next = attemptMove(before, 'computer', reply ?? '', expectedPly);
          if (next === before) {
            setError('La réponse du moteur n’est pas valide. Relance Stockfish.');
            return;
          }
          commit(next);
        })
        .catch((reason: unknown) => {
          if (!isAbort(reason) && !controller.signal.aborted)
            setError(reason instanceof Error ? reason.message : 'Le moteur ne répond pas.');
        });
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
    // A reply is bound to this exact turn and cancelled before any new session.
  }, [record, replay, playerTurn, difficulty, retry]);
  useEffect(() => {
    if (!illegal) return;
    const timer = window.setTimeout(() => setIllegal(null), 1000);
    return () => window.clearTimeout(timer);
  }, [illegal]);
  const unavailable = status === 'unavailable' || !!error;
  const turnText = unavailable
    ? 'Partie en pause'
    : status === 'loading'
      ? 'Préparation de Stockfish…'
      : playerTurn
        ? replay.game.inCheck()
          ? 'Échec ! À toi de jouer.'
          : ''
        : 'Stockfish réfléchit…';
  return (
    <div className="computer-layout">
      <section className="computer-board-section" aria-label="Partie libre">
        <div className="player-label">
          <div className="player-avatar">
            <Cpu size={19} />
          </div>
          <div>
            <strong>Ordinateur · {difficulty.name}</strong>
            <span>
              {sideName(otherSide(record.player))} · {difficulty.category} ·{' '}
              {difficulty.elo === null ? 'Stockfish non affaibli' : `≈ ${difficulty.elo} Elo`}
            </span>
          </div>
        </div>
        <ComputerBoard
          fen={replay.game.fen()}
          player={record.player}
          enabled={playerTurn && !record.result && status === 'ready' && !unavailable && !confirm}
          last={replay.moves.at(-1)}
          mark={illegal?.mark}
          onMove={(from, to, promotion) => {
            const before = current.current;
            const next = attemptMove(before, 'player', from + to + (promotion ?? ''));
            if (next === before) {
              setIllegal({ mark: { square: to, good: false, symbol: '✕' }, id: Date.now() });
              return false;
            }
            commit(next);
            onPlayerMove?.(next);
            return true;
          }}
        />
        <div className="player-label">
          <div className="player-avatar you">
            <User size={19} />
          </div>
          <div>
            <strong>Toi · {sideName(record.player)}</strong>
            <span role="status" data-testid="computer-turn">
              {turnText}
            </span>
          </div>
          <span className={`turn-dot ${playerTurn && !unavailable ? 'active' : ''}`} />
        </div>
        <p className="board-instructions">
          Glisse une pièce ou touche sa case puis sa destination.
          <br />
          Au clavier : flèches, puis Entrée. La promotion te laisse choisir ta pièce.
        </p>
      </section>
      <aside className="training-panel computer-panel" aria-label="Ta partie">
        {turnText && <div className="game-live-status" aria-live="polite">{turnText}</div>}
        {illegal && (
          <p className="computer-warning" role="alert">
            Ce déplacement est illégal. La position n’a pas changé.
          </p>
        )}
        {unavailable && (
          <div className="computer-warning" role="alert">
            <p>
              {error ||
                'Stockfish est indisponible. La partie reste en pause, sans coup de remplacement.'}
            </p>
            <button className="button secondary" onClick={() => setRetry((value) => value + 1)}>
              Relancer Stockfish
            </button>
          </div>
        )}
        <h3>Les coups joués</h3>
        <MoveHistory moves={replay.moves} />
        <button className="button secondary resign-button" onClick={() => setConfirm(true)}>
          <Flag size={16} />
          Abandonner
        </button>
      </aside>
      {confirm && (
        <ChoiceDialog title="Abandonner la partie ?" onCancel={() => setConfirm(false)}>
          <p>La partie sera terminée par une défaite. Tu pourras ensuite analyser tes coups.</p>
          <button
            className="button danger"
            onClick={() => {
              setConfirm(false);
              commit(resign(current.current));
            }}
          >
            Confirmer l’abandon
          </button>
        </ChoiceDialog>
      )}
    </div>
  );
}
