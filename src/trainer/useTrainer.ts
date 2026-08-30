import { useEffect, useReducer } from 'react';
import {
  initialState,
  isComplete,
  isPlayerTurn,
  reduceTrainer,
  type CompiledLesson,
} from './model';

export const COMPUTER_DELAY = 600;
export const CORRECT_FEEDBACK_DELAY = 900;
export const INCORRECT_FEEDBACK_DELAY = 1000;
export function useTrainer(lesson: CompiledLesson) {
  const [state, dispatch] = useReducer(
    (state: ReturnType<typeof initialState>, action: Parameters<typeof reduceTrainer>[2]) =>
      reduceTrainer(lesson, state, action),
    undefined,
    initialState,
  );
  const playerTurn = isPlayerTurn(lesson, state);
  const complete = isComplete(lesson, state);
  useEffect(() => {
    if (playerTurn || complete) return;
    const timer = window.setTimeout(
      () => dispatch({ type: 'computer', expectedPly: state.ply }),
      state.ply === 0 ? COMPUTER_DELAY : CORRECT_FEEDBACK_DELAY,
    );
    return () => window.clearTimeout(timer);
  }, [playerTurn, complete, state.ply]);
  useEffect(() => {
    const feedback = state.boardFeedback;
    if (!feedback) return;
    const timer = window.setTimeout(
      () => dispatch({ type: 'clearFeedback', id: feedback.id }),
      feedback.kind === 'correct' ? CORRECT_FEEDBACK_DELAY : INCORRECT_FEEDBACK_DELAY,
    );
    return () => window.clearTimeout(timer);
  }, [state.boardFeedback]);
  return { state, dispatch, playerTurn, complete, fen: lesson.positions[state.ply] };
}
