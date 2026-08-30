import { Chess, type Move } from 'chess.js';
import type { Opening, Variation } from '../data/openings';

export type CompiledLesson = {
  opening: Opening;
  variation: Variation;
  moves: Move[];
  positions: string[];
  total: number;
  orientation: 'white' | 'black';
};
export type TrainerState = {
  ply: number;
  completed: number;
  errors: number;
  hints: number;
  hintVisible: boolean;
  feedback: 'initial' | 'correct' | 'incorrect';
  explanation: string;
};
export type TrainerAction =
  | { type: 'attempt'; from: string; to: string; promotion?: string }
  | { type: 'computer'; expectedPly: number }
  | { type: 'hint' }
  | { type: 'reset' };

export function compileLesson(opening: Opening, variation: Variation): CompiledLesson {
  if (!variation.moves.length) throw new Error(`Variante vide : ${variation.id}`);
  const game = new Chess();
  const positions = [game.fen()];
  const moves = variation.moves.map((step, index) => {
    try {
      if (!step.explanation.trim()) throw new Error('Explication manquante');
      const result = game.move(step.san, { strict: true });
      positions.push(game.fen());
      return result;
    } catch (error) {
      throw new Error(
        `${opening.name} / ${variation.name}, demi-coup ${index + 1} (${step.san}) : donnée invalide.`,
        { cause: error },
      );
    }
  });
  return {
    opening,
    variation,
    moves,
    positions,
    total: moves.filter((move) => move.color === opening.side).length,
    orientation: opening.side === 'w' ? 'white' : 'black',
  };
}

export const initialState = (): TrainerState => ({
  ply: 0,
  completed: 0,
  errors: 0,
  hints: 0,
  hintVisible: false,
  feedback: 'initial',
  explanation: '',
});
export const isComplete = (lesson: CompiledLesson, state: TrainerState) =>
  state.ply === lesson.moves.length;
export const isPlayerTurn = (lesson: CompiledLesson, state: TrainerState) =>
  !isComplete(lesson, state) && lesson.moves[state.ply].color === lesson.opening.side;
export function isExpectedMove(
  lesson: CompiledLesson,
  state: TrainerState,
  from: string,
  to: string,
  promotion?: string,
) {
  const expected = lesson.moves[state.ply];
  return (
    isPlayerTurn(lesson, state) &&
    expected.from === from &&
    expected.to === to &&
    expected.promotion === promotion
  );
}

export function reduceTrainer(
  lesson: CompiledLesson,
  state: TrainerState,
  action: TrainerAction,
): TrainerState {
  if (action.type === 'reset') return initialState();
  if (isComplete(lesson, state)) return state;
  if (action.type === 'computer') {
    if (isPlayerTurn(lesson, state) || action.expectedPly !== state.ply) return state;
    // This advances ONLY the compiled lesson. No engine output enters this model.
    return { ...state, ply: state.ply + 1, hintVisible: false };
  }
  if (!isPlayerTurn(lesson, state)) return state;
  if (action.type === 'hint')
    return state.hintVisible ? state : { ...state, hints: state.hints + 1, hintVisible: true };
  if (!isExpectedMove(lesson, state, action.from, action.to, action.promotion)) {
    return { ...state, errors: state.errors + 1, feedback: 'incorrect' };
  }
  return {
    ...state,
    ply: state.ply + 1,
    completed: state.completed + 1,
    hintVisible: false,
    feedback: 'correct',
    explanation: lesson.variation.moves[state.ply].explanation,
  };
}
