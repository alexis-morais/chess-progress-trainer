export type Evaluation = { cp?: number; mate?: number; depth: number };
export type AnalysisState = {
  status: 'loading' | 'analyzing' | 'ready' | 'unavailable';
  evaluation: Evaluation | null;
};
type EngineWorker = Pick<
  Worker,
  'postMessage' | 'terminate' | 'onmessage' | 'onerror' | 'onmessageerror'
>;
type Request = { id: number; fen: string };

export function parseEvaluation(line: string, fen: string): Evaluation | null {
  if (line.length > 16_384) return null;
  if (!line.startsWith('info ') || /\b(lowerbound|upperbound)\b/.test(line)) return null;
  const match = line.match(/\bscore (cp|mate) (-?\d+)(?=\s|$)/);
  if (!match) return null;
  const sign = fen.split(' ')[1] === 'w' ? 1 : -1;
  const value = Number(match[2]) * sign;
  const depth = Number(line.match(/\bdepth (-?\d+)(?=\s|$)/)?.[1] ?? 0);
  if (
    !Number.isSafeInteger(value) ||
    !Number.isSafeInteger(depth) ||
    depth < 0 ||
    depth > 128 ||
    Math.abs(value) > (match[1] === 'mate' ? 1000 : 100000)
  )
    return null;
  return match[1] === 'mate' ? { mate: value, depth } : { cp: value, depth };
}

export class StockfishEngine {
  private worker: EngineWorker | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private ready = false;
  private dead = false;
  private stopping = false;
  private generation = 0;
  private pending: Request | null = null;
  private active: Request | null = null;
  private score: Evaluation | null = null;

  constructor(
    private update: (state: AnalysisState) => void,
    factory: () => EngineWorker = () => {
      if (typeof Worker === 'undefined' || typeof WebAssembly === 'undefined')
        throw new Error('WebAssembly indisponible');
      // A classic worker is required by this unmodified, single-threaded build.
      return new Worker(`${import.meta.env.BASE_URL}engine/stockfish-18-lite-single.js`);
    },
  ) {
    this.update({ status: 'loading', evaluation: null });
    try {
      this.worker = factory();
      this.worker.onmessage = (event: MessageEvent) => {
        if (typeof event.data === 'string' && event.data.length <= 65_536)
          event.data.split('\n').forEach((line) => this.receive(line.trim()));
      };
      this.worker.onerror = () => this.fail();
      this.worker.onmessageerror = () => this.fail();
      this.watchdog(25000);
      this.send('uci');
    } catch {
      this.fail();
    }
  }

  analyze(fen: string) {
    if (this.dead) return;
    this.pending = { id: ++this.generation, fen };
    this.score = null;
    this.update({ status: this.ready ? 'analyzing' : 'loading', evaluation: null });
    if (this.active && !this.stopping) {
      this.stopping = true;
      this.send('stop');
    } else if (!this.active) this.startPending();
  }

  private send(command: string) {
    try {
      this.worker?.postMessage(command);
    } catch {
      this.fail();
    }
  }

  private receive(line: string) {
    if (this.dead) return;
    if (line === 'uciok') {
      this.send('setoption name Hash value 16');
      this.send('ucinewgame');
      this.send('isready');
    } else if (line === 'readyok') {
      clearTimeout(this.timer);
      this.ready = true;
      this.startPending();
    } else if (line.startsWith('bestmove')) {
      // UCI end-of-search marker ONLY. Its move is never read or passed to the trainer.
      clearTimeout(this.timer);
      const isCurrent = this.active?.id === this.generation;
      this.active = null;
      this.stopping = false;
      if (this.pending) this.startPending();
      else if (isCurrent)
        this.update({ status: this.score ? 'ready' : 'unavailable', evaluation: this.score });
    } else if (this.active?.id === this.generation) {
      const score = parseEvaluation(line, this.active.fen);
      if (score) {
        this.score = score;
        this.update({ status: 'analyzing', evaluation: score });
      }
    }
  }

  private startPending() {
    if (!this.ready || this.active || !this.pending || this.dead) return;
    this.active = this.pending;
    this.pending = null;
    this.watchdog(8000);
    this.send(`position fen ${this.active.fen}`);
    this.send('go depth 12 movetime 250');
  }

  private watchdog(ms: number) {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.fail(), ms);
  }

  private fail() {
    if (this.dead) return;
    this.dispose();
    this.update({ status: 'unavailable', evaluation: null });
  }

  dispose() {
    this.dead = true;
    clearTimeout(this.timer);
    if (this.worker) {
      this.worker.onmessage = null;
      this.worker.onerror = null;
      this.worker.onmessageerror = null;
      this.worker.terminate();
    }
  }
}
