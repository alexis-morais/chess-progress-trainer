import { useEffect, useReducer } from 'react';
import {
  initialState,
  isComplete,
  isPlayerTurn,
  reduceTrainer,
  type CompiledLesson,
} from './model';

export const COMPUTER_DELAY = 600;
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
      COMPUTER_DELAY,
    );
    return () => window.clearTimeout(timer);
  }, [playerTurn, complete, state.ply]);
  return { state, dispatch, playerTurn, complete, fen: lesson.positions[state.ply] };
}
