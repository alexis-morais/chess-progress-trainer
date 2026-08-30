import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Chess } from 'chess.js';
import { StockfishEngine, parseEvaluation } from '../engine/StockfishEngine';
import { evaluationLabel } from '../components/EvaluationBar';

class FakeWorker {
  onmessage: Worker['onmessage'] = null;
  onerror: Worker['onerror'] = null;
  onmessageerror: Worker['onmessageerror'] = null;
  postMessage = vi.fn();
  terminate = vi.fn();
  emit(data: string) {
    this.onmessage?.call(this as unknown as Worker, { data } as MessageEvent);
  }
}
const start = new Chess().fen();
const game = new Chess();
game.move('e4');
const afterE4 = game.fen();

describe('Stockfish : évaluation uniquement', () => {
  beforeEach(() => vi.useFakeTimers());
  it('convertit centipions et mats du point de vue des Blancs', () => {
    expect(parseEvaluation('info depth 10 score cp 42', start)).toEqual({ cp: 42, depth: 10 });
    expect(parseEvaluation('info depth 8 score cp 120', afterE4)).toEqual({ cp: -120, depth: 8 });
    expect(parseEvaluation('info depth 7 score mate -3', afterE4)).toEqual({ mate: 3, depth: 7 });
    expect(parseEvaluation('info depth 7 score mate 2', afterE4)).toEqual({ mate: -2, depth: 7 });
    expect(parseEvaluation('info score cp 8 lowerbound', start)).toBeNull();
    expect(parseEvaluation('bestmove e2e4', start)).toBeNull();
    expect(evaluationLabel({ mate: 3, depth: 9 })).toBe('M3');
    expect(evaluationLabel({ mate: -2, depth: 9 })).toBe('−M2');
    expect(evaluationLabel({ cp: 0, depth: 9 })).toBe('0.0');
    expect(evaluationLabel({ cp: 40, depth: 9 })).toBe('+0.4');
  });
  it('attend UCI, limite l’analyse et ne transmet jamais de coup', () => {
    const worker = new FakeWorker();
    const update = vi.fn();
    const engine = new StockfishEngine(update, () => worker);
    engine.analyze(start);
    expect(worker.postMessage).toHaveBeenLastCalledWith('uci');
    worker.emit('uciok');
    expect(worker.postMessage).toHaveBeenLastCalledWith('isready');
    worker.emit('readyok');
    expect(worker.postMessage).toHaveBeenLastCalledWith('go depth 12 movetime 250');
    worker.emit('info depth 10 score cp 30');
    worker.emit('bestmove d2d4 ponder d7d5');
    expect(update).toHaveBeenLastCalledWith({ status: 'ready', evaluation: { cp: 30, depth: 10 } });
    expect(JSON.stringify(update.mock.calls)).not.toContain('d2d4');
    engine.dispose();
  });
  it('arrête la recherche précédente et ignore ses scores tardifs', () => {
    const worker = new FakeWorker();
    const update = vi.fn();
    const engine = new StockfishEngine(update, () => worker);
    engine.analyze(start);
    worker.emit('uciok');
    worker.emit('readyok');
    engine.analyze(afterE4);
    expect(worker.postMessage).toHaveBeenLastCalledWith('stop');
    worker.emit('info depth 12 score cp 999');
    expect(update).toHaveBeenLastCalledWith({ status: 'analyzing', evaluation: null });
    worker.emit('bestmove e2e4');
    expect(worker.postMessage).toHaveBeenCalledWith(`position fen ${afterE4}`);
    worker.emit('info depth 8 score cp 40');
    expect(update).toHaveBeenLastCalledWith({
      status: 'analyzing',
      evaluation: { cp: -40, depth: 8 },
    });
    engine.dispose();
  });
  it('ne démarre que la dernière position en attente lors de changements rapides', () => {
    const worker = new FakeWorker();
    const engine = new StockfishEngine(vi.fn(), () => worker);
    engine.analyze(start);
    worker.emit('uciok');
    worker.emit('readyok');
    engine.analyze(afterE4);
    engine.analyze(start);
    worker.emit('bestmove e2e4');
    expect(worker.postMessage).not.toHaveBeenCalledWith(`position fen ${afterE4}`);
    engine.dispose();
  });
  it('tolère une absence de WASM, un échec de chargement ou un worker en erreur', () => {
    const update = vi.fn();
    new StockfishEngine(update, () => {
      throw new Error('WASM absent');
    });
    expect(update).toHaveBeenLastCalledWith({ status: 'unavailable', evaluation: null });
    const worker = new FakeWorker();
    new StockfishEngine(update, () => worker);
    worker.onerror?.call(worker as unknown as Worker, {} as ErrorEvent);
    expect(worker.terminate).toHaveBeenCalled();
    expect(update).toHaveBeenLastCalledWith({ status: 'unavailable', evaluation: null });
  });
  it('signale les délais dépassés et libère les ressources', () => {
    const worker = new FakeWorker();
    const update = vi.fn();
    new StockfishEngine(update, () => worker);
    vi.advanceTimersByTime(25001);
    expect(update).toHaveBeenLastCalledWith({ status: 'unavailable', evaluation: null });
    expect(worker.terminate).toHaveBeenCalledOnce();
    const worker2 = new FakeWorker();
    const engine = new StockfishEngine(update, () => worker2);
    engine.analyze(start);
    worker2.emit('uciok');
    worker2.emit('readyok');
    vi.advanceTimersByTime(8001);
    expect(worker2.terminate).toHaveBeenCalledOnce();
    engine.dispose();
  });
  it('la destruction interdit toute mise à jour tardive', () => {
    const worker = new FakeWorker();
    const update = vi.fn();
    const engine = new StockfishEngine(update, () => worker);
    engine.dispose();
    update.mockClear();
    worker.emit('readyok');
    engine.analyze(start);
    vi.advanceTimersByTime(30000);
    expect(update).not.toHaveBeenCalled();
    expect(worker.onmessage).toBeNull();
  });
});
