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

const contextualPhrases = {
  center: [
    'Quelle décision augmenterait ton influence au centre sans révéler le coup exact ?',
    'Cherche une façon de contester la zone centrale avant que l’adversaire ne s’y installe.',
    'Ton prochain choix peut donner plus d’espace et de stabilité au cœur de l’échiquier.',
    'Demande-toi comment agir au centre avant de lancer un plan sur une aile.',
  ],
  development: [
    'Une pièce encore peu active peut participer au jeu tout en soutenant le centre.',
    'Poursuis ton développement en recherchant une case utile pour la suite du plan.',
    'Quelle amélioration rendrait une de tes pièces plus active sans perdre de temps ?',
    'Fais entrer une nouvelle pièce dans le jeu en lui donnant aussitôt un rôle utile.',
  ],
  safety: [
    'Avant d’ouvrir davantage la position, pense à la sécurité de ton roi.',
    'Ton développement est assez avancé pour envisager maintenant la mise à l’abri du roi.',
    'Réduis les risques liés à la sécurité royale avant de poursuivre ton plan actif.',
    'Vérifie si le moment est venu de protéger ton roi et de relier tes pièces lourdes.',
  ],
  pressure: [
    'Repère la cible adverse la plus vulnérable et augmente la pression sans te précipiter.',
    'Une menace utile peut obliger l’adversaire à répondre tout en améliorant ta position.',
    'Cherche un coup actif qui gagne un temps sur une pièce ou un point sensible.',
    'Quelle décision poserait une question concrète à l’adversaire tout en servant ton plan ?',
  ],
  exchange: [
    'Compare les échanges disponibles : lequel améliore le mieux ta structure ou ton activité ?',
    'Un échange bien choisi peut réduire la pression et clarifier le centre.',
    'Avant de capturer, imagine les pièces et les lignes qui resteront après la reprise.',
    'Évalue les reprises possibles avant de modifier l’équilibre des pièces au centre.',
  ],
  structure: [
    'Une poussée peut améliorer ta structure et préparer une rupture future.',
    'Observe ta chaîne centrale : quelle décision soutient le mieux sa base ?',
    'Cherche l’avancée qui gagne de l’espace sans créer de faiblesse immédiate.',
    'Choisis une poussée qui consolide ta structure et prépare la prochaine étape du plan.',
  ],
  activity: [
    'Améliore ta pièce la moins active afin qu’elle participe réellement au plan.',
    'Une ligne ou une diagonale peut offrir davantage d’activité à ton camp.',
    'Cherche une case depuis laquelle ton jeu exercera une pression plus utile.',
    'Replace une pièce afin qu’elle coopère mieux avec le reste de ton camp.',
  ],
} as const;

function phrase(category: keyof typeof contextualPhrases, move: Move, index: number, context: string) {
  const choices = contextualPhrases[category];
  const contextSeed = [...context].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  const seed = move.from.charCodeAt(0) + move.to.charCodeAt(0) + Number(move.to[1]) + index + contextSeed;
  return choices[seed % choices.length];
}

export function contextualHint(move: Move, explanation: string, index = 0, override?: string) {
  if (override?.trim()) return override.trim();
  const text = explanation.toLocaleLowerCase('fr');
  if (move.flags.includes('k') || move.flags.includes('q') || /roi|roque|abri|sécurité/.test(text))
    return phrase('safety', move, index, text);
  if (move.captured || /échange|reprend|capture/.test(text)) return phrase('exchange', move, index, text);
  if (/menace|attaque|pression|tempo|cible|clou/.test(text) || move.san.includes('+'))
    return phrase('pressure', move, index, text);
  if (/structure|chaîne|pion|espace|rupture/.test(text) && move.piece === 'p')
    return phrase('structure', move, index, text);
  if (/centre|centr|d4|e4|d5|e5/.test(text)) return phrase('center', move, index, text);
  if (/développ|active|activité|diagonale|colonne|case/.test(text))
    return phrase(move.from[1] === (move.color === 'w' ? '1' : '8') ? 'development' : 'activity', move, index, text);
  return phrase(move.piece === 'p' ? 'structure' : 'activity', move, index, text);
}

export function exactMoveLabel(move: Move): string {
  const name = pieces[move.piece].name;
  return `${name[0].toUpperCase()}${name.slice(1)} : ${move.from} → ${move.to}${move.promotion ? ` · promotion en ${pieces[move.promotion].name}` : ''}`;
}

export function playerGuidance(lesson: ScriptedExercise, state: TrainerState) {
  if (!isPlayerTurn(lesson, state)) return null;
  const move = lesson.moves[state.ply];
  const step = lesson.steps[state.ply];
  return {
    hint: state.completed === 0
      ? pedagogicalHint(move, step.hint)
      : contextualHint(move, step.explanation, state.ply, step.hint),
    exact: exactMoveLabel(move),
  };
}
