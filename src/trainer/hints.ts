import { Chess, type Move, type PieceSymbol, type Square } from 'chess.js';
import { isPlayerTurn, type CompiledLesson, type TrainerState } from './model';

const pieces: Record<PieceSymbol, { name: string; possessive: string; article: string }> = {
  p: { name: 'pion', possessive: 'ton pion', article: 'le pion' },
  n: { name: 'cavalier', possessive: 'ton cavalier', article: 'le cavalier' },
  b: { name: 'fou', possessive: 'ton fou', article: 'le fou' },
  r: { name: 'tour', possessive: 'ta tour', article: 'la tour' },
  q: { name: 'dame', possessive: 'ta dame', article: 'la dame' },
  k: { name: 'roi', possessive: 'ton roi', article: 'le roi' },
};

// These clues describe observable moves, never an inferred tactical or strategic advantage.
export function pedagogicalHint(move: Move, override?: string): string {
  if (override?.trim()) return override.trim();
  const piece = pieces[move.piece];
  if (move.flags.includes('k') || move.flags.includes('q')) {
    const towardRight = move.to > move.from === (move.color === 'w');
    return `Roque pour protéger ton roi en le déplaçant de deux cases vers la ${towardRight ? 'droite' : 'gauche'}.`;
  }
  if (move.promotion) {
    const approach = move.captured
      ? `Capture ${pieces[move.captured].article} adverse avec ton pion`
      : 'Avance ton pion jusqu’au bout de l’échiquier';
    return `${approach} et transforme-le en ${pieces[move.promotion].name}.`;
  }
  if (move.flags.includes('e'))
    return 'Prends en passant le pion adverse : avance ton pion en diagonale derrière lui.';
  if (move.captured)
    return `Avec ${piece.possessive}, capture ${pieces[move.captured].article} adverse.`;

  const home = move.color === 'w' ? '1' : '8';
  const pawnHome = move.color === 'w' ? '2' : '7';
  const game = new Chess(move.before);
  if (move.piece === 'p') {
    const distance = Math.abs(Number(move.to[1]) - Number(move.from[1]));
    const steps = distance === 2 ? 'de deux cases' : 'd’une case';
    const behind = game.get((move.from[0] + home) as Square);
    if (move.from[1] === pawnHome && behind?.color === move.color) {
      if (behind.type === 'k') return `Avance le pion situé devant ton roi ${steps}.`;
      if (behind.type === 'q') return `Avance le pion situé devant ta dame ${steps}.`;
    }
    if ('de'.includes(move.to[0])) return `Avance un pion central ${steps} pour occuper le centre.`;
    if ('ah'.includes(move.to[0])) return `Avance un pion au bord de l’échiquier ${steps}.`;
    return `Avance un pion ${steps} pour faire évoluer ta position.`;
  }
  const homeKing = game.get(('e' + home) as Square);
  const originalKing = homeKing?.type === 'k' && homeKing.color === move.color;
  const central = 'cdef'.includes(move.to[0]) && '3456'.includes(move.to[1]);
  if (move.piece === 'n') {
    if (originalKing && move.from === 'g' + home)
      return `Sors le cavalier situé près de ton roi${central ? ' vers le centre' : ' de sa case de départ'}.`;
    if (originalKing && move.from === 'b' + home)
      return `Sors le cavalier du côté de ta dame${central ? ' vers le centre' : ' de sa case de départ'}.`;
    return central
      ? 'Place ton cavalier dans la zone centrale de l’échiquier.'
      : 'Déplace ton cavalier pour le repositionner.';
  }
  if (move.piece === 'b') {
    if (originalKing && move.from === 'f' + home)
      return 'Sors le fou situé près de ton roi sur une diagonale libre.';
    if (originalKing && move.from === 'c' + home)
      return 'Sors le fou du côté de ta dame sur une diagonale libre.';
    return 'Déplace ton fou le long de sa diagonale.';
  }
  if (move.piece === 'k') return 'Déplace ton roi sur une case voisine libre.';
  const direction =
    move.from[0] === move.to[0]
      ? 'le long de sa colonne'
      : move.from[1] === move.to[1]
        ? 'horizontalement'
        : 'en diagonale';
  return `Déplace ${piece.possessive} ${direction}.`;
}

export function exactMoveLabel(move: Move): string {
  const name = pieces[move.piece].name;
  return `${name[0].toUpperCase()}${name.slice(1)} : ${move.from} → ${move.to}${move.promotion ? ` · promotion en ${pieces[move.promotion].name}` : ''}`;
}

export function playerGuidance(lesson: CompiledLesson, state: TrainerState) {
  if (!isPlayerTurn(lesson, state)) return null;
  const move = lesson.moves[state.ply];
  return { hint: pedagogicalHint(move, lesson.steps[state.ply].hint), exact: exactMoveLabel(move) };
}
