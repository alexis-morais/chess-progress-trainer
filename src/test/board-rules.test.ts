import { Chess } from 'chess.js';
import { describe, expect, it } from 'vitest';
import { animatedMoves, legalDestinations, squareAtPoint, squareCenter } from '../board/geometry';

export const CASTLES = 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1';
export const EN_PASSANT = '4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 2';
export const PROMOTION = '7k/P7/8/8/8/8/8/7K w - - 0 1';

describe('Vraies destinations légales, indépendantes de la solution', () => {
  it('montre les deux poussées du pion et les deux sauts du cavalier', () => {
    expect([...legalDestinations(new Chess(), 'e2')]).toEqual([
      ['e3', 'move'],
      ['e4', 'move'],
    ]);
    expect([...legalDestinations(new Chess(), 'g1').keys()].sort()).toEqual(['f3', 'h3']);
  });
  it('distingue une capture et une case vide', () => {
    const game = new Chess();
    game.move('e4');
    game.move('d5');
    expect([...legalDestinations(game, 'e4')]).toEqual([
      ['e5', 'move'],
      ['d5', 'capture'],
    ]);
  });
  it('ne libère jamais le roi derrière une pièce clouée', () => {
    const game = new Chess('4r1k1/8/8/8/8/8/4R3/4K3 w - - 0 1');
    expect([...legalDestinations(game, 'e2').keys()]).toEqual(['e3', 'e4', 'e5', 'e6', 'e7', 'e8']);
  });
  it('en échec, ne propose que les coups qui le parent', () => {
    const game = new Chess('4r1k1/8/8/8/8/8/P7/4K3 w - - 0 1');
    expect(game.isCheck()).toBe(true);
    expect(legalDestinations(game, 'a2').size).toBe(0);
    expect([...legalDestinations(game, 'e1').keys()].sort()).toEqual(['d1', 'd2', 'f1', 'f2']);
  });
  it('propose les deux roques avec leurs droits, jamais à travers une attaque', () => {
    expect(legalDestinations(new Chess(CASTLES), 'e1').has('g1')).toBe(true);
    expect(legalDestinations(new Chess(CASTLES), 'e1').has('c1')).toBe(true);
    const attacked = new Chess('r3kr1r/8/8/8/8/8/8/R3K2R w KQ - 0 1');
    expect(legalDestinations(attacked, 'e1').has('g1')).toBe(false);
    expect(legalDestinations(new Chess(CASTLES.replace('KQkq', '-')), 'e1').has('c1')).toBe(false);
  });
  it('marque la prise en passant comme capture, et vérifie le clouage', () => {
    expect(legalDestinations(new Chess(EN_PASSANT), 'e5').get('d6')).toBe('capture');
    expect(
      legalDestinations(new Chess('4r1k1/8/8/3pP3/8/8/8/4K3 w - d6 0 2'), 'e5').has('d6'),
    ).toBe(false);
  });
  it('affiche une seule destination de promotion pour quatre choix', () => {
    const game = new Chess(PROMOTION);
    expect(game.moves({ square: 'a7', verbose: true }).length).toBe(4);
    expect([...legalDestinations(game, 'a7')]).toEqual([['a8', 'move']]);
  });
});

describe('Géométrie et transitions', () => {
  it.each(['white', 'black'] as const)(
    '%s : chaque centre et chaque bord correspond à la bonne case',
    (orientation) => {
      const rect = { left: 8, top: 210, width: 374, height: 374 };
      for (const file of 'abcdefgh')
        for (let rank = 1; rank <= 8; rank++) {
          const square = `${file}${rank}`;
          const point = squareCenter(square, rect, orientation);
          expect(squareAtPoint(point.x, point.y, rect, orientation)).toBe(square);
        }
      expect(squareAtPoint(7, 211, rect, orientation)).toBeNull();
      expect(squareAtPoint(382, 211, rect, orientation)).toBeNull();
      expect(squareAtPoint(8, 209, rect, orientation)).toBeNull();
      expect(squareAtPoint(8, 584, rect, orientation)).toBeNull();
    },
  );
  it.each(['O-O', 'O-O-O'])('anime roi et tour pour %s', (san) => {
    const game = new Chess(CASTLES),
      before = game.fen(),
      move = game.move(san);
    expect(animatedMoves(before, game.fen(), move)).toEqual([
      { from: 'e1', to: san === 'O-O' ? 'g1' : 'c1' },
      { from: san === 'O-O' ? 'h1' : 'a1', to: san === 'O-O' ? 'f1' : 'd1' },
    ]);
  });
  it('anime une promotion sans inventer de déplacement lors d’un reset', () => {
    const game = new Chess(PROMOTION),
      before = game.fen(),
      move = game.move('a8=N');
    expect(animatedMoves(before, game.fen(), move)).toEqual([{ from: 'a7', to: 'a8' }]);
    expect(animatedMoves(game.fen(), before, move)).toEqual([]);
    expect(animatedMoves(before, before, move)).toEqual([]);
  });
});
