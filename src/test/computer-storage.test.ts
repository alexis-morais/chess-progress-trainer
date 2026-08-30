import { describe, expect, it, vi } from 'vitest';
import { createGame } from '../computer/game';
import { buildReport } from '../computer/review';
import { loadLastGame, saveLastGame, STORAGE_KEY } from '../computer/storage';
import { exampleAnalyses, matedGame } from './fixtures/computer';

function memory() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
}
describe('Dernière partie : stockage local validé', () => {
  it('retrouve la partie et son bilan après rechargement', () => {
    const storage = memory(),
      game = matedGame(),
      review = buildReport(game, exampleAnalyses());
    expect(saveLastGame(game, review, storage)).toBe(true);
    expect(loadLastGame(storage)).toEqual({ game, review });
  });
  it('ne remplace pas la dernière partie terminée par une partie en cours', () => {
    const storage = memory(),
      game = matedGame();
    saveLastGame(game, null, storage);
    expect(saveLastGame(createGame('w', 'beginner'), null, storage)).toBe(false);
    expect(loadLastGame(storage)?.game).toEqual(game);
  });
  it('continue sans stockage si le navigateur le bloque', () => {
    const storage = {
      getItem: vi.fn(() => {
        throw new Error('denied');
      }),
      setItem: vi.fn(() => {
        throw new Error('quota');
      }),
    };
    expect(saveLastGame(matedGame(), null, storage)).toBe(false);
    expect(loadLastGame(storage)).toBeNull();
  });
  it.each(['json', 'illegal', 'result', 'extra-move', 'version', 'oversize'])(
    'refuse une sauvegarde invalide : %s',
    (kind) => {
      const storage = memory();
      saveLastGame(matedGame(), null, storage);
      const data = JSON.parse(storage.getItem(STORAGE_KEY)!);
      if (kind === 'illegal') data.game.moves[0] = 'e2e5';
      if (kind === 'result') data.game.result.winner = 'w';
      if (kind === 'extra-move') data.game.moves.push('h2h3');
      if (kind === 'version') data.version = 99;
      storage.setItem(
        STORAGE_KEY,
        kind === 'json'
          ? '{broken'
          : kind === 'oversize'
            ? 'x'.repeat(2_000_001)
            : JSON.stringify(data),
      );
      expect(loadLastGame(storage)).toBeNull();
    },
  );
  it.each(['score', 'pv', 'best', 'length'])(
    'garde la partie si le bilan %s est endommagé',
    (kind) => {
      const storage = memory(),
        game = matedGame();
      saveLastGame(game, buildReport(game, exampleAnalyses()), storage);
      const data = JSON.parse(storage.getItem(STORAGE_KEY)!);
      if (kind === 'score') data.analyses[0].score.cp = 'invalid';
      if (kind === 'pv') data.analyses[0].pv = ['e2e5'];
      if (kind === 'best') data.analyses[0].bestMove = 'h1h8';
      if (kind === 'length') data.analyses.pop();
      storage.setItem(STORAGE_KEY, JSON.stringify(data));
      expect(loadLastGame(storage)).toEqual({ game, review: null });
    },
  );
});
