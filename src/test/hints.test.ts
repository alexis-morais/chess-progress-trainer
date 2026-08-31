import { Chess } from 'chess.js';
import { describe, expect, it } from 'vitest';
import { openings, lessonModes } from '../data/openings';
import { exactMoveLabel, pedagogicalHint, playerGuidance } from '../trainer/hints';
import { compileLesson, initialState, isPlayerTurn, reduceTrainer } from '../trainer/model';

function lastMove(line: string[], fen?: string) {
  const game = new Chess(fen);
  return line.map((san) => game.move(san)).at(-1)!;
}

describe('Indices naturels pour les débutants', () => {
  it.each([
    [['e4'], 'Cherche à prendre davantage de contrôle au centre.'],
    [['d4'], 'Cherche à prendre davantage de contrôle au centre.'],
    [['e4', 'e6'], 'Cherche à prendre davantage de contrôle au centre.'],
    [
      ['e4', 'e5', 'Nf3'],
      'Pense à développer une pièce tout en renforçant ta présence dans le jeu.',
    ],
    [
      ['e4', 'e5', 'Nf3', 'Nc6'],
      'Pense à développer une pièce tout en renforçant ta présence dans le jeu.',
    ],
    [
      ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5'],
      'Pense à développer une pièce tout en renforçant ta présence dans le jeu.',
    ],
    [['e4', 'd5', 'exd5'], 'Examine les échanges possibles pour contester le centre.'],
    [
      ['e4', 'd5', 'exd5', 'Qxd5'],
      'Observe ce qui est insuffisamment protégé dans le camp adverse.',
    ],
    [
      ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Bxc6'],
      'Examine les échanges possibles pour contester le centre.',
    ],
  ] as const)('explique %j sans notation', (line, expected) => {
    expect(pedagogicalHint(lastMove([...line]))).toBe(expected);
  });
  it.each([
    ['w', 'O-O', 'droite'],
    ['w', 'O-O-O', 'gauche'],
    ['b', 'O-O', 'gauche'],
    ['b', 'O-O-O', 'droite'],
  ])('décrit le roque %s %s depuis le côté du joueur', (side, san, direction) => {
    const move = lastMove([san], `r3k2r/8/8/8/8/8/8/R3K2R ${side} KQkq - 0 1`);
    expect(pedagogicalHint(move)).toContain('sécurité');
    expect(pedagogicalHint(move)).not.toContain(direction);
    expect(exactMoveLabel(move)).toContain('Roi :');
  });
  it.each([
    ['Q', 'dame'],
    ['R', 'tour'],
    ['B', 'fou'],
    ['N', 'cavalier'],
  ])('nomme la promotion en %s, sans imposer une dame', (symbol, name) => {
    const move = lastMove([`a8=${symbol}`], '7k/P7/8/8/8/8/8/4K3 w - - 0 1');
    expect(pedagogicalHint(move)).toBe('Une avancée pourrait se transformer en avantage décisif.');
    expect(exactMoveLabel(move)).toBe(`Pion : a7 → a8 · promotion en ${name}`);
  });
  it('explique une capture avec promotion et la prise en passant', () => {
    const promotion = lastMove(['axb8=N'], '1r5k/P7/8/8/8/8/8/4K3 w - - 0 1');
    expect(pedagogicalHint(promotion)).toBe(
      'Une avancée pourrait se transformer en avantage décisif.',
    );
    const enPassant = lastMove(['e4', 'a6', 'e5', 'd5', 'exd6']);
    expect(pedagogicalHint(enPassant)).not.toMatch(/en passant|pion|[a-h][1-8]/);
    expect(exactMoveLabel(enPassant)).toBe('Pion : e5 → d6');
  });
  it.each([
    ['Re1', '7k/8/8/8/8/8/K7/7R w - - 0 1', 'activité'],
    ['Ra3', '7k/8/8/8/8/8/8/R3K3 w - - 0 1', 'activité'],
    ['Qh5', '7k/8/8/8/8/8/8/3QK3 w - - 0 1', 'menace'],
    ['Kd2', '7k/8/8/8/8/8/8/4K3 w - - 0 1', 'sécurité'],
  ])('reste factuel pour %s', (san, fen, word) => {
    expect(pedagogicalHint(lastMove([san], fen))).toContain(word);
  });
  it('utilise un indice manuel sans changer le coup, son explication ou les compteurs', () => {
    const opening = openings[0];
    const variation = opening.variations[0];
    const changed = {
      ...variation,
      moves: variation.moves.map((step, i) =>
        i ? step : { ...step, hint: '  Cherche à occuper le centre.  ' },
      ),
    };
    const lesson = compileLesson(opening, changed);
    expect(playerGuidance(lesson, initialState())).toEqual({
      hint: 'Cherche à occuper le centre.',
      exact: 'Pion : e2 → e4',
    });
    expect(lesson.positions).toEqual(compileLesson(opening, variation).positions);
    expect(lesson.steps[0].explanation).toBe(variation.moves[0].explanation);
  });
  it('signale un indice personnalisé invalide lors de la compilation', () => {
    const opening = openings[0];
    const variation = opening.variations[0];
    expect(() =>
      compileLesson(opening, {
        ...variation,
        moves: [{ ...variation.moves[0], hint: '  ' }, ...variation.moves.slice(1)],
      }),
    ).toThrow(/donnée invalide/);
  });
});

describe('Un indice gratuit à chaque décision des 120 séances', () => {
  for (const opening of openings)
    for (const variation of opening.variations)
      for (const mode of lessonModes) {
        it(`${opening.name} / ${variation.name} / ${mode.name}`, () => {
          const lesson = compileLesson(opening, variation, mode.id);
          let state = initialState();
          let count = 0;
          for (const move of lesson.moves) {
            Object.freeze(state);
            const guidance = playerGuidance(lesson, state);
            if (isPlayerTurn(lesson, state)) {
              expect(guidance?.hint.length).toBeGreaterThan(20);
              expect(guidance?.hint.length).toBeLessThan(160);
              expect(guidance?.hint).not.toMatch(/\b[a-h][1-8]\b/);
              expect(guidance?.exact).toContain(`${move.from} → ${move.to}`);
              expect(guidance?.hint).not.toMatch(/pion|cavalier|fou|tour|dame|deux cases|roqu/i);
              expect(state.hintVisible).toBe(false);
              expect(state.solutionVisible).toBe(false);
              state = reduceTrainer(lesson, state, { type: 'hint' });
              state = reduceTrainer(lesson, state, { type: 'hint' });
              expect(state.hintVisible).toBe(true);
              expect(state.hints).toBe(0);
              expect(state.solutionVisible).toBe(false);
              state = reduceTrainer(lesson, state, {
                type: 'attempt',
                from: move.from,
                to: move.to,
                promotion: move.promotion,
              });
              count++;
            } else {
              expect(guidance).toBeNull();
              state = reduceTrainer(lesson, state, { type: 'computer', expectedPly: state.ply });
            }
            expect(state.hints).toBe(0);
            expect(state.errors).toBe(0);
          }
          expect(count).toBe(lesson.total);
          expect(playerGuidance(lesson, state)).toBeNull();
          expect(
            playerGuidance(lesson, reduceTrainer(lesson, state, { type: 'reset' })) !== null,
          ).toBe(opening.side === 'w');
        });
      }
});
