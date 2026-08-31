import type { ScriptedExercise, TrainerState } from '../trainer/model';
import { InteractiveBoard } from '../board/InteractiveBoard';

type Props = {
  lesson: ScriptedExercise;
  state: TrainerState;
  fen: string;
  enabled: boolean;
  onMove: (from: string, to: string, promotion?: string) => boolean;
};
export function TrainingBoard({ lesson, state, fen, enabled, onMove }: Props) {
  const expected = lesson.moves[state.ply];
  const feedback = state.boardFeedback;
  return (
    <InteractiveBoard
      id="training-board"
      label={`Échiquier, ${lesson.player === 'w' ? 'Blancs' : 'Noirs'} en bas`}
      fen={fen}
      player={lesson.player}
      enabled={enabled}
      onMove={onMove}
      last={lesson.moves[state.ply - 1]}
      arrow={
        state.solutionVisible && expected ? { from: expected.from, to: expected.to } : undefined
      }
      badgeTestId="move-badge"
      mark={
        feedback
          ? {
              square: feedback.square,
              good: feedback.kind === 'correct',
              symbol: feedback.kind === 'correct' ? '✓' : '✕',
              id: feedback.id,
            }
          : null
      }
    />
  );
}
