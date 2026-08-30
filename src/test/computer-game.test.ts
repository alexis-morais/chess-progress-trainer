import { Chess } from 'chess.js';
import { describe, expect, it } from 'vitest';
import {
  attemptMove,
  createGame,
  legalPromotions,
  playUci,
  positionResult,
  replayGame,
  resign,
  resolveColor,
  resultReason,
  resultTitle,
  terminalScore,
} from '../computer/game';
import { difficulties } from '../computer/types';

describe('Partie libre : règles et état', () => {
  it.each(['w', 'b'] as const)(
    'démarre pour les %s sans déplacer arbitrairement une pièce',
    (side) => {
      const game = createGame(side, 'beginner');
      expect(game.player).toBe(side);
      expect(game.moves).toEqual([]);
      expect(game.result).toBeNull();
      expect(replayGame(game).game.fen()).toBe(new Chess().fen());
      const actor = side === 'w' ? 'player' : 'computer';
      expect(attemptMove(game, actor, 'e2e4').moves).toEqual(['e2e4']);
      expect(attemptMove(game, actor === 'player' ? 'computer' : 'player', 'e2e4')).toBe(game);
    },
  );
  it('résout le hasard une seule fois et permet les deux camps', () => {
    expect(resolveColor('random', () => 0.1)).toBe('w');
    expect(resolveColor('random', () => 0.9)).toBe('b');
    expect(resolveColor('w', () => 0.9)).toBe('w');
    expect(createGame('random', 'expert', () => 0.9).player).toBe('b');
  });
  it('propose trois puissances croissantes sans Elo annoncé', () => {
    expect(difficulties.map((level) => level.name)).toEqual([
      'Débutant',
      'Intermédiaire',
      'Expert',
    ]);
    expect(difficulties.map((level) => level.settings.skill)).toEqual([0, 7, 20]);
    expect(difficulties.map((level) => level.settings.movetime)).toEqual([100, 350, 1200]);
    expect(difficulties.map((level) => level.settings.depth)).toEqual([3, 8, 18]);
  });
  it('refuse les coups illégaux, le mauvais camp et les réponses périmées', () => {
    const start = createGame('w', 'expert');
    for (const token of ['e2e5', 'e7e5', 'e1e2', 'nope', 'e2e4q'])
      expect(attemptMove(start, 'player', token)).toBe(start);
    const next = attemptMove(start, 'player', 'd2d4');
    expect(next.moves).toEqual(['d2d4']);
    expect(attemptMove(next, 'computer', 'd7d5', 0)).toBe(next);
    expect(attemptMove(next, 'player', 'd7d5')).toBe(next);
    expect(attemptMove(next, 'computer', 'c7c5', 1).moves).toEqual(['d2d4', 'c7c5']);
    expect(start.moves).toEqual([]);
  });
  it.each(['w', 'b'] as const)('détecte le mat et bloque ensuite la partie pour %s', (player) => {
    let game = createGame(player, 'expert');
    for (const [index, token] of ['f2f3', 'e7e5', 'g2g4', 'd8h4'].entries())
      game = attemptMove(
        game,
        (index % 2 === 0 ? 'w' : 'b') === player ? 'player' : 'computer',
        token,
      );
    expect(game.result).toEqual({ winner: 'b', reason: 'checkmate' });
    expect(resultTitle(game)).toBe(player === 'w' ? 'Défaite' : 'Victoire');
    expect(resultReason(game.result!)).toBe('Échec et mat');
    expect(terminalScore(replayGame(game).game)).toEqual({ mate: 0, winner: 'b', depth: 0 });
    expect(attemptMove(game, 'player', 'h2h3')).toBe(game);
    expect(resign(game)).toBe(game);
  });
  it('détecte la répétition en conservant tout l’historique', () => {
    let game = createGame('w', 'beginner');
    for (const [i, token] of [
      'g1f3',
      'g8f6',
      'f3g1',
      'f6g8',
      'g1f3',
      'g8f6',
      'f3g1',
      'f6g8',
    ].entries())
      game = attemptMove(game, i % 2 ? 'computer' : 'player', token);
    expect(game.result).toEqual({ winner: null, reason: 'repetition' });
    expect(resultTitle(game)).toBe('Match nul');
  });
  it.each([
    ['7k/5K2/6Q1/8/8/8/8/8 b - - 0 1', 'stalemate'],
    ['7k/8/5K2/8/8/8/8/8 w - - 0 1', 'material'],
    ['7k/8/5K2/8/8/8/8/R7 w - - 100 51', 'fifty'],
  ])('détecte la nulle %s', (fen, reason) => {
    expect(positionResult(new Chess(fen))).toEqual({ winner: null, reason });
    expect(terminalScore(new Chess(fen))).toEqual({ cp: 0, depth: 0 });
  });
  it('termine par abandon et ne modifie pas les coups', () => {
    const game = attemptMove(createGame('b', 'intermediate'), 'computer', 'd2d4');
    const finished = resign(game);
    expect(finished.result).toEqual({ winner: 'w', reason: 'resignation' });
    expect(finished.moves).toEqual(game.moves);
    expect(finished.completedAt).toBeTruthy();
    expect(resultReason(finished.result!)).toBe('Abandon');
  });
  it('accepte roque, prise en passant et choix de sous-promotion', () => {
    const castle = new Chess('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
    expect(playUci(castle, 'e1g1').isKingsideCastle()).toBe(true);
    expect(castle.get('f1')?.type).toBe('r');
    const ep = new Chess();
    for (const token of ['e2e4', 'a7a6', 'e4e5', 'd7d5']) playUci(ep, token);
    expect(playUci(ep, 'e5d6').isEnPassant()).toBe(true);
    const promotion = new Chess('7k/P7/8/8/8/8/8/7K w - - 0 1');
    expect(legalPromotions(promotion, 'a7', 'a8').sort()).toEqual(['b', 'n', 'q', 'r']);
    expect(playUci(promotion, 'a7a8n').promotion).toBe('n');
  });
});
