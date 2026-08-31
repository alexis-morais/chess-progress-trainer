import { Chess } from 'chess.js';
import { describe, expect, it, vi } from 'vitest';
import { loadLastGame } from '../computer/storage';
import { parseEvaluation, StockfishEngine } from '../engine/StockfishEngine';
import { ComputerEngine } from '../computer/ComputerEngine';
import { difficulties } from '../computer/types';
import { matedGame, exampleAnalyses } from './fixtures/computer';

const saved = () => ({ version: 1, game: matedGame(), analyses: exampleAnalyses() });
const load = (value: unknown) =>
  loadLastGame({ getItem: () => JSON.stringify(value), setItem: vi.fn() });
describe('Données persistées altérées', () => {
  it('refuse les dates non textuelles même quand Date.parse les accepterait', () => {
    for (const field of ['startedAt', 'completedAt'])
      for (const date of [2026, ['2026-08-31'], {}, null]) {
        const data = saved();
        Object.assign(data.game, { [field]: date });
        expect(load(data)).toBeNull();
      }
  });
  it('refuse un score ambigu ou mal formé mais conserve la partie légale', () => {
    for (const score of [
      { cp: 20, mate: 3, winner: 'w', depth: 10 },
      { depth: 2, mate: '3', winner: 'w' },
      [],
      {},
      'score',
    ]) {
      const data = saved();
      Object.assign(data.analyses[0], { score });
      expect(load(data)).toEqual({ game: data.game, review: null });
    }
  });
  it('reconstruit le bilan et retire les propriétés non prévues, sans réutiliser du HTML sauvegardé', () => {
    const data = saved(),
      markup = '<img src=x onerror="alert(1)">';
    Object.assign(data, { review: { comment: markup } });
    Object.assign(data.game, { html: markup });
    Object.assign(data.game.result!, { html: markup });
    Object.assign(data.analyses[0], { comment: markup });
    Object.assign(data.analyses[0].score, { html: markup });
    const result = load(data);
    expect(result?.review).not.toBeNull();
    expect(JSON.stringify(result)).not.toContain(markup);
    expect(result?.game.moves).toEqual(data.game.moves);
  });
  it('accepte les anciennes sauvegardes valides sans migration', () => {
    const data = saved(),
      result = load(data);
    expect(result?.game).toEqual(data.game);
    expect(result?.review?.positions).toEqual(data.analyses);
  });
});

class WorkerStub {
  onmessage: Worker['onmessage'] = null;
  onerror: Worker['onerror'] = null;
  onmessageerror: Worker['onmessageerror'] = null;
  postMessage = vi.fn();
  terminate = vi.fn();
  emit(data: unknown) {
    this.onmessage?.call(this as unknown as Worker, { data } as MessageEvent);
  }
}
describe('Messages du moteur bornés et validés', () => {
  it('rejette les valeurs non finies, hors limites et les scores tronqués', () => {
    const fen = new Chess().fen();
    for (const line of [
      'info depth 10 score cp ' + '9'.repeat(400),
      'info depth 999999 score cp 42',
      'info depth -2 score cp 42',
      'info depth 10 score cp 42evil',
      'info depth 10 score mate 99999',
      'info depth 8 score cp 5 ' + 'x'.repeat(17000),
    ])
      expect(parseEvaluation(line, fen)).toBeNull();
    expect(parseEvaluation('info depth 12 score cp -42 pv e2e4', fen)).toEqual({
      depth: 12,
      cp: -42,
    });
  });
  it('le trainer ignore les objets et messages géants puis reprend normalement', () => {
    const worker = new WorkerStub(),
      update = vi.fn(),
      engine = new StockfishEngine(update, () => worker);
    engine.analyze(new Chess().fen());
    for (const payload of [null, {}, ['uciok'], 'uciok\n' + 'x'.repeat(65536)])
      worker.emit(payload);
    expect(worker.postMessage).toHaveBeenLastCalledWith('uci');
    worker.emit('uciok');
    worker.emit('readyok');
    worker.emit('info depth 10 score cp 20');
    worker.emit('bestmove e2e4');
    expect(update).toHaveBeenLastCalledWith({ status: 'ready', evaluation: { depth: 10, cp: 20 } });
    engine.dispose();
  });
  it('le moteur de partie libre ignore aussi les messages inattendus sans choisir un coup de secours', async () => {
    const worker = new WorkerStub(),
      engine = new ComputerEngine(vi.fn(), () => worker);
    const search = engine.search({ fen: new Chess().fen(), history: [] }, difficulties[0].settings);
    worker.emit({ bestmove: 'e2e4' });
    worker.emit('x'.repeat(65537));
    expect(worker.postMessage).toHaveBeenLastCalledWith('uci');
    worker.emit('option name Skill Level type spin default 20 min 0 max 20');
    worker.emit('option name MultiPV type spin default 1 min 1 max 256');
    worker.emit('uciok');
    worker.emit('readyok');
    worker.emit('readyok');
    worker.emit('info depth 3 score cp 20 pv e2e4');
    worker.emit('bestmove e2e4');
    await expect(search).resolves.toMatchObject({ bestMove: 'e2e4', score: { cp: 20, depth: 3 } });
    engine.dispose();
  });
});
