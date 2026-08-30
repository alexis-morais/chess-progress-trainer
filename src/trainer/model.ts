import { Chess, type Move } from 'chess.js';
import {
  getLessonMoves,
  type LessonMode,
  type LessonMove,
  type Opening,
  type Variation,
} from '../data/openings';

export type CompiledLesson = {
  opening: Opening;
  variation: Variation;
  mode: LessonMode;
  steps: LessonMove[];
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
  attemptId: number;
  boardFeedback: { id: number; kind: 'correct' | 'incorrect'; square: string } | null;
};
export type TrainerAction =
  | { type: 'attempt'; from: string; to: string; promotion?: string }
  | { type: 'computer'; expectedPly: number }
  | { type: 'hint' }
  | { type: 'clearFeedback'; id: number }
  | { type: 'reset' };

export function compileLesson(
  opening: Opening,
  variation: Variation,
  mode: LessonMode = 'essential',
): CompiledLesson {
  if (!variation.moves.length) throw new Error(`Variante vide : ${variation.id}`);
  if (mode === 'extended' && !variation.extension.length)
    throw new Error(`Prolongement vide : ${variation.id}`);
  const steps = getLessonMoves(variation, mode);
  const game = new Chess();
  const positions = [game.fen()];
  const moves = steps.map((step, index) => {
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
    mode,
    steps,
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
  attemptId: 0,
  boardFeedback: null,
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
  if (action.type === 'clearFeedback')
    return state.boardFeedback?.id === action.id ? { ...state, boardFeedback: null } : state;
  if (isComplete(lesson, state)) return state;
  if (action.type === 'computer') {
    if (isPlayerTurn(lesson, state) || action.expectedPly !== state.ply) return state;
    // This advances ONLY the compiled lesson. No engine output enters this model.
    return { ...state, ply: state.ply + 1, hintVisible: false, boardFeedback: null };
  }
  if (!isPlayerTurn(lesson, state)) return state;
  if (action.type === 'hint')
    return state.hintVisible ? state : { ...state, hints: state.hints + 1, hintVisible: true };
  if (!isExpectedMove(lesson, state, action.from, action.to, action.promotion)) {
    return {
      ...state,
      errors: state.errors + 1,
      feedback: 'incorrect',
      attemptId: state.attemptId + 1,
      boardFeedback: { id: state.attemptId + 1, kind: 'incorrect', square: action.to },
    };
  }
  return {
    ...state,
    ply: state.ply + 1,
    completed: state.completed + 1,
    hintVisible: false,
    feedback: 'correct',
    explanation: lesson.steps[state.ply].explanation,
    attemptId: state.attemptId + 1,
    boardFeedback: { id: state.attemptId + 1, kind: 'correct', square: action.to },
  };
}
