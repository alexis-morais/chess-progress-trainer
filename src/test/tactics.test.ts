import { createHash } from 'node:crypto';
import { Chess, type Square } from 'chess.js';
import { describe, expect, it } from 'vitest';
import { openings } from '../data/openings';
import { compileTactic, tactics, tacticsFor } from '../tactics/model';
import { initialState, isComplete, isPlayerTurn, reduceTrainer } from '../trainer/model';
import { playerGuidance } from '../trainer/hints';
import verification from './fixtures/tactics-verification.json';

const positionKey = (game: Chess) => game.fen().split(' ').slice(0, 4).join(' ');
const openingRoots: Record<string, string[]> = {
  italian: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4'],
  scotch: ['e4', 'e5', 'Nf3', 'Nc6', 'd4'],
  vienna: ['e4', 'e5', 'Nc3'],
  'queens-gambit': ['d4', 'd5', 'c4'],
  french: ['e4', 'e6'],
  scandinavian: ['e4', 'd5'],
  'caro-kann': ['e4', 'c6'],
  sicilian: ['e4', 'c5'],
};
function isOpeningPosition(opening: string, game: Chess) {
  if (openingRoots[opening]) {
    const reference = new Chess();
    openingRoots[opening].forEach((san) => reference.move(san));
    return positionKey(reference) === positionKey(game);
  }
  const pieces =
    opening === 'london'
      ? { d4: 'wp', f3: 'wn', f4: 'wb' }
      : { d4: 'wp', c4: 'wp', c3: 'wn', e4: 'wp', f6: 'bn', g6: 'bp', g7: 'bb', d6: 'bp' };
  return Object.entries(pieces).every(([square, value]) => {
    const piece = game.get(square as Square);
    return piece && piece.color + piece.type === value;
  });
}

describe('Catalogue de tactiques et provenance indépendante', () => {
  it('propose 2 à 3 tactiques pour chacune des dix ouvertures, sans doublons', () => {
    expect(openings).toHaveLength(10);
    expect(tactics.length).toBeGreaterThanOrEqual(20);
    expect(tactics.length).toBeLessThanOrEqual(30);
    expect(new Set(tactics.map((puzzle) => puzzle.id)).size).toBe(tactics.length);
    for (const opening of openings) {
      expect(tacticsFor(opening.id).length).toBeGreaterThanOrEqual(2);
      expect(tacticsFor(opening.id).length).toBeLessThanOrEqual(3);
    }
  });
  it('comprend des combinaisons à un, deux et trois coups et les deux camps', () => {
    expect(new Set(tactics.map((puzzle) => compileTactic(puzzle).total))).toEqual(
      new Set([1, 2, 3]),
    );
    expect(new Set(tactics.map((puzzle) => puzzle.side))).toEqual(new Set(['w', 'b']));
  });
  for (const puzzle of tactics) {
    it(`${puzzle.id} : provenance, identité de l’ouverture, FEN et solution légales`, () => {
      const game = new Chess();
      let foundOpening = false;
      puzzle.provenance.moves.forEach((san, index) => {
        expect(game.move(san, { strict: true })).toBeTruthy();
        if (index < 14 && isOpeningPosition(puzzle.openingId, game)) foundOpening = true;
      });
      expect(foundOpening).toBe(true);
      expect(game.fen()).toBe(puzzle.fen);
      expect(game.turn()).toBe(puzzle.side);
      expect(puzzle.provenance.gameUrl).toMatch(/^https:\/\/lichess.org\/[a-zA-Z0-9]{8}$/);
      expect(puzzle.provenance.puzzleUrl).toMatch(
        /^https:\/\/lichess.org\/training\/[a-zA-Z0-9]{5}$/,
      );
      expect(puzzle.provenance.openingTag).toBeTruthy();
      expect(puzzle.provenance.license).toBe('CC0-1.0');
      expect(['Facile', 'Intermédiaire', 'Difficile']).toContain(puzzle.difficulty);
      const lesson = compileTactic(puzzle);
      expect(lesson.positions[0]).toBe(puzzle.fen);
      expect(lesson.orientation).toBe(puzzle.side === 'w' ? 'white' : 'black');
      for (const step of puzzle.sequence)
        expect(game.move(step.san, { strict: true })).toBeTruthy();
      expect(lesson.positions.at(-1)).toBe(game.fen());
      if (puzzle.gain.startsWith('Échec et mat')) expect(game.isCheckmate()).toBe(true);
      expect(puzzle.explanation.length).toBeGreaterThan(50);
      expect(puzzle.principle).toBeTruthy();
    });
    it(`${puzzle.id} : validation Stockfish actuelle, chaque solution forte et chaque réponse crédible`, () => {
      const entry = verification.puzzles.find((entry) => entry.id === puzzle.id)!;
      expect(entry).toBeDefined();
      const fingerprint = createHash('sha256')
        .update(
          JSON.stringify({
            openingId: puzzle.openingId,
            provenance: puzzle.provenance,
            fen: puzzle.fen,
            side: puzzle.side,
            sequence: puzzle.sequence.map((step) => step.san),
          }),
        )
        .digest('hex');
      expect(
        entry.fingerprint,
        'Relancer pnpm validate:tactics --write après une modification de la ligne.',
      ).toBe(fingerprint);
      expect(entry.checked).toHaveLength(puzzle.sequence.length);
      const lesson = compileTactic(puzzle);
      entry.checked.forEach((check, index) => {
        expect(check.fen).toBe(lesson.positions[index]);
        const move = lesson.moves[index];
        expect(check.uci).toBe(move.from + move.to + (move.promotion || ''));
        expect(check.playerMove).toBe(move.color === puzzle.side);
        const best = check.lines[0],
          played = check.lines.find((line) => line.pv[0] === check.uci)!;
        expect(played).toBeDefined();
        expect(played.depth).toBeGreaterThanOrEqual(14);
        if (check.playerMove) {
          expect(check.bestmove).toBe(check.uci);
          expect(best.value).toBeGreaterThan(best.type === 'mate' ? 0 : 150);
        }
        expect(played.type).toBe(best.type);
        if (best.type === 'mate') expect(played.value).toBe(best.value);
        else expect(best.value - played.value).toBeLessThanOrEqual(50);
      });
    });
    it(`${puzzle.id} : refus, compteurs, aide facultative, réponses fixes, fin et reset`, () => {
      const lesson = compileTactic(puzzle);
      let state = initialState();
      const wrong = new Chess(puzzle.fen)
        .moves({ verbose: true })
        .find((move) => move.san !== puzzle.sequence[0].san)!;
      state = reduceTrainer(lesson, state, {
        type: 'attempt',
        from: wrong.from,
        to: wrong.to,
        promotion: wrong.promotion,
      });
      expect(state.ply).toBe(0);
      expect(state.errors).toBe(1);
      expect(state.boardFeedback?.kind).toBe('incorrect');
      for (const move of lesson.moves) {
        expect(state.hintVisible).toBe(false);
        expect(state.solutionVisible).toBe(false);
        if (isPlayerTurn(lesson, state)) {
          const hints = state.hints;
          state = reduceTrainer(lesson, state, { type: 'hint' });
          state = reduceTrainer(lesson, state, { type: 'hint' });
          expect(state.hints).toBe(hints);
          expect(playerGuidance(lesson, state)?.hint).not.toMatch(/\b[a-h][1-8]\b/);
          state = reduceTrainer(lesson, state, { type: 'solution' });
          state = reduceTrainer(lesson, state, { type: 'solution' });
          expect(state.hints).toBe(hints + 1);
          expect(playerGuidance(lesson, state)?.exact).toContain(`${move.from} → ${move.to}`);
          state = reduceTrainer(lesson, state, {
            type: 'attempt',
            from: move.from,
            to: move.to,
            promotion: move.promotion,
          });
          expect(state.boardFeedback?.kind).toBe('correct');
        } else {
          const ply = state.ply;
          expect(reduceTrainer(lesson, state, { type: 'solution' })).toBe(state);
          state = reduceTrainer(lesson, state, { type: 'computer', expectedPly: ply });
          expect(state.ply).toBe(ply + 1);
          expect(lesson.positions[state.ply]).toBe(move.after);
        }
      }
      expect(isComplete(lesson, state)).toBe(true);
      expect(state.completed).toBe(lesson.total);
      expect(state.hints).toBe(lesson.total);
      expect(state.errors).toBe(1);
      expect(reduceTrainer(lesson, state, { type: 'reset' })).toEqual(initialState());
    });
  }
  it('refuse les données corrompues au lieu de lancer un exercice trompeur', () => {
    const puzzle = tactics[0];
    expect(() => compileTactic({ ...puzzle, fen: new Chess().fen() })).toThrow(/Position/);
    expect(() => compileTactic({ ...puzzle, side: puzzle.side === 'w' ? 'b' : 'w' })).toThrow(
      /camp/,
    );
    expect(() =>
      compileTactic({ ...puzzle, provenance: { ...puzzle.provenance, moves: ['e5'] } }),
    ).toThrow(/Provenance/);
    expect(() =>
      compileTactic({ ...puzzle, sequence: [{ san: 'Ke9', explanation: 'Invalide' }] }),
    ).toThrow(/invalide/);
  });
});
