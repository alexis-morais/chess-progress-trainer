import { Chess } from 'chess.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComputerEngine, legalPv, scoreFromInfo } from '../computer/ComputerEngine';
import { difficulties, REVIEW_SETTINGS } from '../computer/types';

class FakeWorker {
  onmessage: Worker['onmessage'] = null;
  onerror: Worker['onerror'] = null;
  onmessageerror: Worker['onmessageerror'] = null;
  postMessage = vi.fn();
  terminate = vi.fn();
  emit(data: string) {
    this.onmessage?.call(this as unknown as Worker, { data } as MessageEvent);
  }
  ready() {
    this.emit('option name Skill Level type spin default 20 min 0 max 20\nuciok\nreadyok');
  }
}
const initial = { fen: new Chess().fen(), history: [] as string[] };
const chess = new Chess();
chess.move('e4');
const next = { fen: chess.fen(), history: ['e2e4'] };

describe('Stockfish pour la partie libre : protocole indépendant', () => {
  beforeEach(() => vi.useFakeTimers());
  it.each(difficulties)(
    'configure $name et consomme réellement le meilleur coup renvoyé',
    async ({ settings }) => {
      const worker = new FakeWorker();
      const engine = new ComputerEngine(vi.fn(), () => worker);
      const result = engine.search(initial, settings);
      expect(worker.postMessage).toHaveBeenLastCalledWith('uci');
      worker.ready();
      expect(worker.postMessage).toHaveBeenCalledWith(
        `setoption name Skill Level value ${settings.skill}`,
      );
      expect(worker.postMessage).toHaveBeenCalledWith(
        'setoption name UCI_LimitStrength value false',
      );
      expect(worker.postMessage).not.toHaveBeenCalledWith(expect.stringMatching(/^go /));
      worker.emit('readyok');
      expect(worker.postMessage).toHaveBeenLastCalledWith(
        `go depth ${settings.depth} movetime ${settings.movetime}`,
      );
      worker.emit('info depth 3 score cp 27 pv d2d4 d7d5 c2c4\nbestmove d2d4 ponder d7d5');
      await expect(result).resolves.toEqual({
        score: { cp: 27, depth: 3 },
        bestMove: 'd2d4',
        pv: ['d2d4', 'd7d5', 'c2c4'],
      });
      engine.dispose();
    },
  );
  it('conserve l’historique pour les répétitions et convertit les scores des Noirs', async () => {
    const worker = new FakeWorker();
    const engine = new ComputerEngine(vi.fn(), () => worker);
    worker.ready();
    const result = engine.search(next, REVIEW_SETTINGS);
    worker.emit('readyok');
    expect(worker.postMessage).toHaveBeenCalledWith('position startpos moves e2e4');
    worker.emit('info depth 9 score cp 42 pv c7c5 g1f3\nbestmove c7c5');
    expect((await result).score).toEqual({ cp: -42, depth: 9 });
    engine.dispose();
  });
  it('sérialise les recherches et attend la fin de la précédente', async () => {
    const worker = new FakeWorker();
    const engine = new ComputerEngine(vi.fn(), () => worker);
    worker.ready();
    const first = engine.search(initial, REVIEW_SETTINGS);
    const second = engine.search(next, REVIEW_SETTINGS);
    worker.emit('readyok');
    expect(worker.postMessage.mock.calls.filter(([line]) => line.startsWith('go '))).toHaveLength(
      1,
    );
    worker.emit('info depth 8 score cp 40 pv e2e4\nbestmove e2e4');
    await first;
    expect(worker.postMessage).toHaveBeenLastCalledWith('isready');
    worker.emit('readyok');
    worker.emit('info depth 8 score cp 20 pv e7e5\nbestmove e7e5');
    expect((await second).bestMove).toBe('e7e5');
    engine.dispose();
  });
  it('annule la recherche active et ignore ses infos, même avant la barrière readyok suivante', async () => {
    const worker = new FakeWorker();
    const engine = new ComputerEngine(vi.fn(), () => worker);
    worker.ready();
    const controller = new AbortController();
    const first = engine.search(initial, REVIEW_SETTINGS, controller.signal);
    const rejected = expect(first).rejects.toHaveProperty('name', 'AbortError');
    worker.emit('readyok');
    controller.abort();
    expect(worker.postMessage).toHaveBeenLastCalledWith('stop');
    const second = engine.search(next, REVIEW_SETTINGS);
    worker.emit('info depth 14 score cp 9999 pv e2e4\nbestmove e2e4');
    worker.emit('info depth 14 score cp 9999 pv e7e5\nbestmove e7e5');
    worker.emit('readyok');
    worker.emit('info depth 10 score cp 12 pv c7c5\nbestmove c7c5');
    await rejected;
    expect((await second).score).toEqual({ cp: -12, depth: 10 });
    engine.dispose();
  });
  it.each(['queue', 'sync'] as const)(
    'annule une requête en phase %s avant toute recherche',
    async (phase) => {
      const worker = new FakeWorker();
      const engine = new ComputerEngine(vi.fn(), () => worker);
      if (phase === 'sync') worker.ready();
      const controller = new AbortController();
      const pending = engine.search(initial, REVIEW_SETTINGS, controller.signal);
      const rejected = expect(pending).rejects.toHaveProperty('name', 'AbortError');
      controller.abort();
      if (phase === 'queue') worker.ready();
      else worker.emit('readyok');
      await rejected;
      expect(worker.postMessage).not.toHaveBeenCalledWith(expect.stringMatching(/^go /));
      engine.dispose();
    },
  );
  it('refuse les réponses illégales ou sans évaluation au lieu d’inventer un coup', async () => {
    for (const output of ['info depth 2 score cp 0\nbestmove e2e5', 'bestmove e2e4']) {
      const worker = new FakeWorker();
      const engine = new ComputerEngine(vi.fn(), () => worker);
      worker.ready();
      const result = engine.search(initial, REVIEW_SETTINGS);
      const rejected = expect(result).rejects.toThrow('invalide');
      worker.emit('readyok');
      worker.emit(output);
      await rejected;
      engine.dispose();
    }
  });
  it('ne prétend pas limiter la force si cette option est absente du moteur', async () => {
    const worker = new FakeWorker();
    const status = vi.fn();
    const engine = new ComputerEngine(status, () => worker);
    worker.emit('uciok');
    expect(status).toHaveBeenLastCalledWith('unavailable');
    await expect(engine.search(initial, REVIEW_SETTINGS)).rejects.toThrow('indisponible');
    expect(worker.terminate).toHaveBeenCalledOnce();
  });
  it('gère le délai de chargement, une panne Worker et le démontage', async () => {
    const worker = new FakeWorker();
    const status = vi.fn();
    const engine = new ComputerEngine(status, () => worker);
    const pending = engine.search(initial, REVIEW_SETTINGS);
    const rejected = expect(pending).rejects.toThrow('indisponible');
    vi.advanceTimersByTime(25001);
    await rejected;
    expect(status).toHaveBeenLastCalledWith('unavailable');
    const worker2 = new FakeWorker();
    const engine2 = new ComputerEngine(status, () => worker2);
    worker2.ready();
    const pending2 = engine2.search(initial, REVIEW_SETTINGS);
    const rejected2 = expect(pending2).rejects.toHaveProperty('name', 'AbortError');
    engine2.dispose();
    await rejected2;
    expect(worker2.onmessage).toBeNull();
    const worker3 = new FakeWorker();
    new ComputerEngine(status, () => worker3);
    worker3.onerror?.call(worker3 as unknown as Worker, {} as ErrorEvent);
    expect(worker3.terminate).toHaveBeenCalledOnce();
  });
  it('borne les recherches même si le moteur ne répond plus', async () => {
    const worker = new FakeWorker();
    const engine = new ComputerEngine(vi.fn(), () => worker);
    worker.ready();
    const result = engine.search(initial, REVIEW_SETTINGS);
    const rejected = expect(result).rejects.toThrow('indisponible');
    worker.emit('readyok');
    vi.advanceTimersByTime(REVIEW_SETTINGS.movetime + 8001);
    await rejected;
    expect(worker.terminate).toHaveBeenCalledOnce();
  });
  it('normalise les mats y compris mat zéro, filtre MultiPV et refuse les bornes', () => {
    expect(scoreFromInfo('info depth 6 score mate 3', next.fen)).toEqual({
      mate: 3,
      winner: 'b',
      depth: 6,
    });
    expect(scoreFromInfo('info depth 6 score mate -2', next.fen)).toEqual({
      mate: 2,
      winner: 'w',
      depth: 6,
    });
    expect(scoreFromInfo('info depth 0 score mate 0', next.fen)).toEqual({
      mate: 0,
      winner: 'w',
      depth: 0,
    });
    expect(scoreFromInfo('info depth 9 multipv 2 score cp 40', initial.fen)).toBeNull();
    expect(scoreFromInfo('info depth 9 score cp 40 lowerbound', initial.fen)).toBeNull();
    expect(legalPv(initial.fen, ['e2e4', 'e7e5', 'e4e6', 'g8f6'])).toEqual(['e2e4', 'e7e5']);
  });
});
