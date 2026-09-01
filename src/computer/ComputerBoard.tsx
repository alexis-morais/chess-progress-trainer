import type { Move } from 'chess.js';
import type { Side } from '../data/openings';
import { InteractiveBoard, type BoardMark } from '../board/InteractiveBoard';
export { ChoiceDialog } from '../board/ChoiceDialog';
export type { BoardMark };

type Props = {
  fen: string;
  player: Side;
  enabled?: boolean;
  last?: Pick<Move, 'from' | 'to'>;
  arrow?: { from: string; to: string; color?: string; kind?: string };
  mark?: BoardMark | null;
  onMove?: (from: string, to: string, promotion?: string) => boolean;
};
export function ComputerBoard(props: Props) {
  return (
    <InteractiveBoard
      {...props}
      id="computer-board"
      className="computer-board"
      label={`Échiquier de partie libre, ${props.player === 'w' ? 'Blancs' : 'Noirs'} en bas`}
      badgeTestId="computer-move-badge"
    />
  );
}
