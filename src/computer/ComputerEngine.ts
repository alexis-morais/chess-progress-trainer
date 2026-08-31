import { Chess } from 'chess.js';
import { parseEvaluation } from '../engine/StockfishEngine';
import { otherSide, playUci } from './game';
import type {
  EngineScore,
  Candidate,
  EngineStatus,
  PositionAnalysis,
  SearchEngine,
  SearchInput,
  SearchSettings,
} from './types';

type EngineWorker = Pick<
  Worker,
  'postMessage' | 'terminate' | 'onmessage' | 'onerror' | 'onmessageerror'
>;
type Job = {
  input: SearchInput;
  settings: SearchSettings;
  resolve: (value: PositionAnalysis) => void;
  reject: (error: Error) => void;
  cleanup: () => void;
  cancelled: boolean;
};
export const abortError = () => new DOMException('Analyse annulée.', 'AbortError');
export const isAbort = (error: unknown) => error instanceof Error && error.name === 'AbortError';

export function scoreFromInfo(line: string, fen: string): EngineScore | null {
  if (/\bmultipv (\d+)/.test(line) && !/\bmultipv 1\b/.test(line)) return null;
  const score = parseEvaluation(line, fen);
  if (!score) return null;
  if (score.mate !== undefined)
    return {
      mate: Math.abs(score.mate),
      winner: score.mate === 0 ? otherSide(new Chess(fen).turn()) : score.mate > 0 ? 'w' : 'b',
      depth: score.depth,
    };
  return { cp: score.cp!, depth: score.depth };
}
export function legalPv(fen: string, tokens: string[]): string[] {
  const game = new Chess(fen);
  const result: string[] = [];
  for (const token of tokens.slice(0, 6)) {
    try {
      playUci(game, token);
      result.push(token);
    } catch {
      break;
    }
  }
  return result;
}

// Only the free-game module consumes bestmove. The opening trainer keeps its own evaluator.
export class ComputerEngine implements SearchEngine {
  private worker: EngineWorker | null = null;
  private queue: Job[] = [];
  private active: Job | null = null;
  private phase: 'boot' | 'idle' | 'sync' | 'search' | 'dead' = 'boot';
  private uciReceived = false;
  private hasSkill = false;
  private hasElo = false;
  private hasLimit = false;
  private multiPVMax = 1;
  private candidates = new Map<number, Map<number, Candidate>>();
  private score: EngineScore | null = null;
  private pv: string[] = [];
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private status: (status: EngineStatus) => void = () => {},
    factory: () => EngineWorker = () =>
      new Worker(`${import.meta.env.BASE_URL}engine/stockfish-18-lite-single.js`),
  ) {
    this.status('loading');
    try {
      if (typeof WebAssembly === 'undefined') throw new Error('WebAssembly indisponible.');
      this.worker = factory();
      this.worker.onmessage = (event) => {
        if (typeof event.data === 'string' && event.data.length <= 65_536)
          event.data.split('\n').forEach((line) => this.receive(line.trim()));
      };
      this.worker.onerror = this.worker.onmessageerror = () => this.fail();
      this.watchdog(25000);
      this.send('uci');
    } catch {
      this.fail();
    }
  }

  search(
    input: SearchInput,
    settings: SearchSettings,
    signal?: AbortSignal,
  ): Promise<PositionAnalysis> {
    if (this.phase === 'dead') return Promise.reject(new Error('Stockfish est indisponible.'));
    if (signal?.aborted) return Promise.reject(abortError());
    if (
      ![
        settings.skill,
        settings.depth,
        settings.movetime,
        settings.multiPV ?? 1,
        settings.nodes ?? 1,
      ].every(Number.isInteger) ||
      settings.skill < 0 ||
      settings.skill > 20 ||
      settings.depth < 1 ||
      settings.depth > 64 ||
      settings.movetime < 1 ||
      settings.movetime > 10000 ||
      (settings.multiPV ?? 1) < 1 ||
      (settings.multiPV ?? 1) > 64 ||
      (settings.nodes ?? 1) < 1 ||
      (settings.nodes ?? 1) > 2000000 ||
      (settings.elo !== undefined &&
        (!Number.isInteger(settings.elo) || settings.elo < 1320 || settings.elo > 3190))
    )
      return Promise.reject(new Error('Paramètres Stockfish invalides.'));
    try {
      new Chess(input.fen);
      if (input.startFen) new Chess(input.startFen);
      if (input.history.some((token) => !/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(token)))
        throw new Error();
    } catch {
      return Promise.reject(new Error('Position Stockfish invalide.'));
    }
    return new Promise((resolve, reject) => {
      const job: Job = {
        input: {
          fen: input.fen,
          history: [...input.history],
          ...(input.startFen ? { startFen: new Chess(input.startFen).fen() } : {}),
        },
        settings: { ...settings },
        resolve,
        reject,
        cleanup: () => signal?.removeEventListener('abort', cancel),
        cancelled: false,
      };
      const cancel = () => {
        job.cancelled = true;
        job.cleanup();
        reject(abortError());
        if (this.active === job) {
          if (this.phase === 'search') this.send('stop');
        } else this.queue = this.queue.filter((item) => item !== job);
      };
      signal?.addEventListener('abort', cancel, { once: true });
      this.queue.push(job);
      this.pump();
    });
  }

  private send(command: string) {
    try {
      this.worker?.postMessage(command);
    } catch {
      this.fail();
    }
  }
  private watchdog(ms: number) {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.fail(), ms);
  }
  private pump() {
    if (this.phase !== 'idle' || this.active || !this.queue.length) return;
    this.active = this.queue.shift()!;
    const { settings } = this.active;
    if (
      (settings.elo !== undefined && (!this.hasElo || !this.hasLimit)) ||
      (settings.multiPV ?? 1) > this.multiPVMax
    ) {
      this.active.reject(new Error('Options de difficulté Stockfish indisponibles.'));
      this.finish();
      return;
    }
    this.phase = 'sync';
    this.score = null;
    this.pv = [];
    this.candidates.clear();
    this.status('thinking');
    this.watchdog(8000);
    this.send(`setoption name UCI_LimitStrength value ${settings.elo !== undefined}`);
    if (settings.elo !== undefined) this.send(`setoption name UCI_Elo value ${settings.elo}`);
    this.send(`setoption name Skill Level value ${settings.skill}`);
    this.send(`setoption name MultiPV value ${settings.multiPV ?? 1}`);
    // The ready barrier drains old output before attributing scores to this position.
    this.send('isready');
  }
  private receive(line: string) {
    if (this.phase === 'dead') return;
    if (line.startsWith('option name Skill Level ')) this.hasSkill = true;
    if (/^option name UCI_LimitStrength type check/.test(line)) this.hasLimit = true;
    if (/^option name UCI_Elo type spin .*min 1320 max 3190$/.test(line)) this.hasElo = true;
    const multiOption = line.match(/^option name MultiPV type spin .*max (\d+)$/);
    if (multiOption) this.multiPVMax = Math.min(64, Number(multiOption[1]));
    if (line === 'uciok' && this.phase === 'boot' && !this.uciReceived) {
      this.uciReceived = true;
      if (!this.hasSkill) {
        this.fail();
        return;
      }
      this.send('setoption name Hash value 16');
      this.send('ucinewgame');
      this.send('isready');
    } else if (line === 'readyok') {
      if (this.phase === 'boot' && this.uciReceived) {
        clearTimeout(this.timer);
        this.phase = 'idle';
        this.status('ready');
        this.pump();
      } else if (this.phase === 'sync' && this.active) {
        if (this.active.cancelled) {
          this.finish();
          return;
        }
        this.phase = 'search';
        const { input, settings } = this.active;
        this.watchdog(settings.movetime + 8000);
        this.send(
          `position ${input.startFen ? `fen ${input.startFen}` : 'startpos'}${input.history.length ? ` moves ${input.history.join(' ')}` : ''}`,
        );
        this.send(
          `go depth ${settings.depth} movetime ${settings.movetime}${settings.nodes ? ` nodes ${settings.nodes}` : ''}`,
        );
      }
    } else if (this.phase === 'search' && this.active) {
      if (line.startsWith('bestmove ')) {
        if (!this.active.cancelled) {
          const bestMove = line.split(/\s+/)[1];
          try {
            const game = new Chess(this.active.input.fen);
            playUci(game, bestMove);
            if (!this.score) throw new Error('Évaluation absente.');
            const batches = [...this.candidates.values()];
            const wanted = Math.min(this.active.settings.multiPV ?? 1, game.moves().length);
            const batch = batches.filter((items) => items.size >= wanted).at(-1) ?? batches.at(-1);
            this.active.resolve({
              score: this.score,
              bestMove,
              pv: this.pv[0] === bestMove ? this.pv : [bestMove],
              ...((this.active.settings.multiPV ?? 1) > 1
                ? { candidates: [...(batch?.values() ?? [])] }
                : {}),
            });
          } catch {
            this.active.reject(new Error('Réponse de Stockfish invalide. Réessaie.'));
          }
        }
        this.finish();
      } else if (!this.active.cancelled) {
        const index = Number(line.match(/\bmultipv (\d+)\b/)?.[1] ?? 1);
        const score =
          index >= 1 && index <= (this.active.settings.multiPV ?? 1)
            ? scoreFromInfo(line.replace(/\bmultipv \d+\b/, 'multipv 1'), this.active.input.fen)
            : null;
        if (score) {
          const pv = legalPv(
            this.active.input.fen,
            line.match(/\bpv (.+)$/)?.[1].split(/\s+/) ?? [],
          );
          if (index === 1) {
            this.score = score;
            this.pv = pv;
          }
          if (pv.length) {
            if (!this.candidates.has(score.depth)) this.candidates.set(score.depth, new Map());
            this.candidates.get(score.depth)!.set(index, { move: pv[0], score, pv });
            if (this.candidates.size > 2)
              this.candidates.delete(this.candidates.keys().next().value!);
          }
        }
      }
    }
  }
  private finish() {
    clearTimeout(this.timer);
    this.active?.cleanup();
    this.active = null;
    this.phase = 'idle';
    this.status('ready');
    this.pump();
  }
  private fail() {
    if (this.phase === 'dead') return;
    this.close(new Error('Stockfish est indisponible. Réessaie de le charger.'));
    this.status('unavailable');
  }
  private close(error: Error) {
    this.phase = 'dead';
    clearTimeout(this.timer);
    for (const job of [...this.queue, ...(this.active ? [this.active] : [])]) {
      job.cleanup();
      job.reject(error);
    }
    this.queue = [];
    this.active = null;
    if (this.worker) {
      this.worker.onmessage = this.worker.onerror = this.worker.onmessageerror = null;
      this.worker.terminate();
      this.worker = null;
    }
  }
  dispose() {
    this.close(abortError());
  }
}
