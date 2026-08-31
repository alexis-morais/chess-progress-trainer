import { Chess } from 'chess.js';
import data from '../data/tactics.json';
import { openings, type LessonMove, type Opening, type Side } from '../data/openings';
import { compileScript, type ScriptedExercise } from '../trainer/model';

export type Tactic = {
  id: string;
  openingId: string;
  title: string;
  motif: string;
  difficulty: 'Facile' | 'Intermédiaire' | 'Difficile';
  provenance: {
    moves: string[];
    gameUrl: string;
    puzzleUrl: string;
    openingTag: string;
    license: string;
  };
  fen: string;
  side: Side;
  sequence: LessonMove[];
  explanation: string;
  gain: string;
  principle: string;
};
export const tactics = data as Tactic[];
export const tacticsFor = (openingId: string) =>
  tactics.filter((puzzle) => puzzle.openingId === openingId);
export type CompiledTactic = ScriptedExercise & { puzzle: Tactic; opening: Opening };

export function compileTactic(puzzle: Tactic): CompiledTactic {
  const opening = openings.find((entry) => entry.id === puzzle.openingId);
  if (!opening) throw new Error(`Ouverture inconnue pour la tactique ${puzzle.id}`);
  if (
    !puzzle.provenance.moves.length ||
    !puzzle.title.trim() ||
    !puzzle.explanation.trim() ||
    !puzzle.gain.trim()
  )
    throw new Error(`Tactique incomplète : ${puzzle.id}`);
  const origin = new Chess();
  try {
    puzzle.provenance.moves.forEach((san) => origin.move(san, { strict: true }));
  } catch (error) {
    throw new Error(`Provenance illégale : ${puzzle.id}`, { cause: error });
  }
  if (origin.fen() !== puzzle.fen || origin.turn() !== puzzle.side)
    throw new Error(`Position ou camp incohérent : ${puzzle.id}`);
  const script = compileScript(puzzle.sequence, puzzle.fen, puzzle.side, puzzle.title);
  return { puzzle, opening, ...script };
}
