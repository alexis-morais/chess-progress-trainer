// Development-only visual bench. Not an entry point of the production build.
// Synthetic touch events verify rendering, not a physical browser's gesture arbitration.
import { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Chess, type Move } from 'chess.js';
import { ComputerBoard } from '../src/computer/ComputerBoard';
import '../src/styles.css';
import '../src/ui/theme.css';

const scenarios = {
  'Pion blanc': { fen: new Chess().fen(), from: 'e2', to: 'e4', side: 'w' },
  'Pion noir': {
    fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
    from: 'e7',
    to: 'e5',
    side: 'b',
  },
  'Capture noire': {
    fen: 'rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 2',
    from: 'd5',
    to: 'e4',
    side: 'b',
  },
  'Petit roque': { fen: 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1', from: 'e1', to: 'g1', side: 'w' },
  'Grand roque': { fen: 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1', from: 'e1', to: 'c1', side: 'w' },
  'En passant': { fen: '4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 2', from: 'e5', to: 'd6', side: 'w' },
  Promotion: { fen: '7k/P7/8/8/8/8/8/7K w - - 0 1', from: 'a7', to: 'a8', side: 'w' },
  'Refus pédagogique': { fen: new Chess().fen(), from: 'e2', to: 'e3', side: 'w' },
} as const;
function Bench() {
  const [name, setName] = useState<keyof typeof scenarios>('Pion blanc');
  const scenario = scenarios[name];
  const [fen, setFen] = useState<string>(scenario.fen),
    [last, setLast] = useState<Move>();
  const [message, setMessage] = useState('Prêt'),
    [serial, setSerial] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const [touching, setTouching] = useState(false);
  function emit(type: string, square: string) {
    const node = root.current!.querySelector<HTMLElement>(`[data-key-square="${square}"]`)!;
    const rect = node.getBoundingClientRect();
    node.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        pointerId: 99,
        pointerType: 'touch',
        isPrimary: true,
        button: 0,
        buttons: type === 'pointerup' ? 0 : 1,
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
      }),
    );
  }
  function startTouch() {
    // No hardware pointer is active for these synthetic events. Capture is tested
    // separately with native mouse gestures and the automated pointer tests.
    const board = root.current!.querySelector<HTMLElement>('.interactive-board')!;
    board.setPointerCapture = () => {};
    board.hasPointerCapture = () => false;
    emit('pointerdown', scenario.from);
    requestAnimationFrame(() => emit('pointermove', scenario.to));
    setTouching(true);
  }
  function reset(next = name) {
    setName(next);
    setFen(scenarios[next].fen);
    setLast(undefined);
    setMessage('Prêt');
    setSerial((n) => n + 1);
    setTouching(false);
  }
  return (
    <main style={{ width: 'calc(100% - 16px)', maxWidth: 680, margin: '12px auto' }}>
      <h1 style={{ fontSize: 22 }}>Contrôle local de l’échiquier</h1>
      <p>Simulation tactile instrumentée — aucun moteur, aucune donnée sauvegardée.</p>
      <label>
        Position{' '}
        <select value={name} onChange={(e) => reset(e.target.value as keyof typeof scenarios)}>
          {Object.keys(scenarios).map((key) => (
            <option key={key}>{key}</option>
          ))}
        </select>
      </label>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0' }}>
        <button className="button secondary" onClick={() => reset()}>
          Réinitialiser
        </button>
        <button
          className="button secondary"
          onClick={() => {
            document.documentElement.dataset.theme =
              document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
          }}
        >
          Thème
        </button>
        <button className="button primary" disabled={touching} onClick={startTouch}>
          Maintenir un drag tactile simulé
        </button>
        <button
          className="button secondary"
          disabled={!touching}
          onClick={() => {
            emit('pointerup', scenario.to);
            setTouching(false);
          }}
        >
          Relâcher
        </button>
      </div>
      <div ref={root}>
        <ComputerBoard
          key={serial}
          fen={fen}
          player={scenario.side}
          enabled
          last={last}
          onMove={(from, to, promotion) => {
            const game = new Chess(fen);
            if (name === 'Refus pédagogique') {
              setMessage('Coup légal refusé par l’exercice');
              return false;
            }
            try {
              const move = game.move({ from, to, promotion });
              setLast(move);
              setFen(game.fen());
              setMessage(`Joué : ${move.san}`);
              return true;
            } catch {
              setMessage('Coup illégal refusé');
              return false;
            }
          }}
        />
      </div>
      <p role="status" aria-label="Résultat du geste">
        {message}
      </p>
      <p>Cette page de test n’est pas incluse dans le site publié.</p>
      <div style={{ height: 400 }} aria-hidden="true" />
    </main>
  );
}
const root = createRoot(document.getElementById('root')!);
root.render(<Bench />);
if (import.meta.hot) import.meta.hot.dispose(() => root.unmount());
