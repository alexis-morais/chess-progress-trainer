import { Chess, type Move, type PieceSymbol } from 'chess.js';
import { isPlayerTurn, type ScriptedExercise, type TrainerState } from './model';

const pieces: Record<PieceSymbol, { name: string; possessive: string; article: string }> = {
  p: { name: 'pion', possessive: 'ton pion', article: 'le pion' },
  n: { name: 'cavalier', possessive: 'ton cavalier', article: 'le cavalier' },
  b: { name: 'fou', possessive: 'ton fou', article: 'le fou' },
  r: { name: 'tour', possessive: 'ta tour', article: 'la tour' },
  q: { name: 'dame', possessive: 'ta dame', article: 'la dame' },
  k: { name: 'roi', possessive: 'ton roi', article: 'le roi' },
};

// Hints suggest a question to consider, without identifying the move or promising an advantage.
export function pedagogicalHint(move: Move, override?: string): string {
  if (override?.trim()) return override.trim();
  const game = new Chess(move.before);
  const central = 'cdef'.includes(move.to[0]) && '3456'.includes(move.to[1]);
  if (game.isCheck())
    return 'Commence par écarter la menace, sans oublier les possibilités de contre-attaque.';
  if (move.flags.includes('k') || move.flags.includes('q'))
    return 'Réfléchis à la sécurité de ton roi avant de poursuivre ton développement.';
  if (move.promotion) return 'Une avancée pourrait se transformer en avantage décisif.';
  if (move.captured) {
    if (!game.isAttacked(move.to, move.color === 'w' ? 'b' : 'w'))
      return 'Observe ce qui est insuffisamment protégé dans le camp adverse.';
    return central
      ? 'Examine les échanges possibles pour contester le centre.'
      : 'Compare les échanges possibles et ce qui restera après chacun.';
  }
  if (move.san.includes('+'))
    return 'Cherche une menace immédiate qui oblige ton adversaire à réagir.';
  if (move.piece === 'p' && central) return 'Cherche à prendre davantage de contrôle au centre.';
  if (
    (move.piece === 'n' || move.piece === 'b') &&
    move.from[1] === (move.color === 'w' ? '1' : '8')
  )
    return 'Pense à développer une pièce tout en renforçant ta présence dans le jeu.';
  if (central) return 'Cherche à renforcer ta présence dans la zone centrale.';
  if (move.piece === 'k') return 'Prends le temps de vérifier la sécurité de ta position.';
  if (move.piece === 'p') return 'Réfléchis à l’espace dont ton camp pourrait avoir besoin.';
  return 'Cherche à améliorer progressivement l’activité de tes pièces.';
}

export function exactMoveLabel(move: Move): string {
  const name = pieces[move.piece].name;
  return `${name[0].toUpperCase()}${name.slice(1)} : ${move.from} → ${move.to}${move.promotion ? ` · promotion en ${pieces[move.promotion].name}` : ''}`;
}

export function playerGuidance(lesson: ScriptedExercise, state: TrainerState) {
  if (!isPlayerTurn(lesson, state)) return null;
  const move = lesson.moves[state.ply];
  return { hint: pedagogicalHint(move, lesson.steps[state.ply].hint), exact: exactMoveLabel(move) };
}
