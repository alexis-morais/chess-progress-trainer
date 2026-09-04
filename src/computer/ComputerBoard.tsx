import type { Move } from 'chess.js';
import type { Side } from '../data/openings';
import { InteractiveBoard, type BoardArrow, type BoardMark } from '../board/InteractiveBoard';
export { ChoiceDialog } from '../board/ChoiceDialog';
export type { BoardArrow, BoardMark };

type Props = {
  fen: string;
  player: Side;
  label?: string;
  interactionSide?: Side;
  enabled?: boolean;
  last?: Pick<Move, 'from' | 'to'>;
  arrow?: BoardArrow;
  arrows?: BoardArrow[];
  originHint?: { square: string; color: string };
  mark?: BoardMark | null;
  onMove?: (from: string, to: string, promotion?: string) => boolean;
};
export function ComputerBoard({ label, ...props }: Props) {
  return (
    <InteractiveBoard
      {...props}
      id="computer-board"
      className="computer-board"
      label={
        label ?? `Échiquier de partie libre, ${props.player === 'w' ? 'Blancs' : 'Noirs'} en bas`
      }
      badgeTestId="computer-move-badge"
    />
  );
}
