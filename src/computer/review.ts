import { Chess, type Move } from 'chess.js';
import { frenchSan, type Side } from '../data/openings';
import { abortError } from './ComputerEngine';
import { moveNumber, playUci, replayGame, terminalScore, uci } from './game';
import {
  categories,
  categoryInfo,
  REVIEW_SETTINGS,
  type Assessment,
  type Category,
  type EngineScore,
  type GameRecord,
  type PositionAnalysis,
  type ReviewedMove,
  type ReviewReport,
  type SearchEngine,
} from './types';

export function whiteScore(score: EngineScore): number {
  return 'cp' in score ? score.cp : score.winner === 'w' ? 10000 : -10000;
}
export function scoreLabel(score: EngineScore): string {
  if ('mate' in score)
    return score.mate === 0
      ? `Mat ${score.winner === 'w' ? 'Blancs' : 'Noirs'}`
      : `${score.winner === 'b' ? '−' : ''}M${score.mate}`;
  const value = score.cp / 100;
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}`;
}
// Beyond ±3, each extra centipawn matters less when the game remains very one-sided.
export function contextualValue(cp: number): number {
  const value = Math.abs(cp);
  return Math.sign(cp) * (value <= 300 ? value : 300 + 200 * Math.log1p((value - 300) / 200));
}
export function classifyMove(
  before: EngineScore,
  after: EngineScore,
  player: Side,
  played: string,
  bestMove: string | null,
): Assessment {
  const sign = player === 'w' ? 1 : -1;
  const a = whiteScore(before) * sign,
    b = whiteScore(after) * sign;
  const cpLoss = 'cp' in before && 'cp' in after ? Math.max(0, Math.round(a - b)) : null;
  let loss = Math.max(0, contextualValue(a) - contextualValue(b));
  if (played === bestMove) return { category: 'best', loss: 0, cpLoss };
  if (
    'mate' in after &&
    after.winner !== player &&
    !('mate' in before && before.winner !== player)
  ) {
    return { category: a <= -600 ? 'mistake' : 'blunder', loss: a <= -600 ? 220 : 600, cpLoss };
  }
  if (
    'mate' in before &&
    before.winner === player &&
    !('mate' in after && after.winner === player)
  ) {
    return {
      category: b >= 500 ? 'inaccuracy' : b > 0 ? 'mistake' : 'blunder',
      loss: b >= 500 ? 100 : b > 0 ? 250 : 600,
      cpLoss,
    };
  }
  if ('mate' in before && 'mate' in after && before.winner === after.winner) loss = 0;
  const category: Category =
    loss <= 15
      ? 'excellent'
      : loss <= 60
        ? 'good'
        : loss <= 130
          ? 'inaccuracy'
          : loss <= 300
            ? 'mistake'
            : 'blunder';
  return { category, loss: Math.round(loss), cpLoss };
}

const pieceNames: Record<string, string> = {
  p: 'un pion',
  n: 'un cavalier',
  b: 'un fou',
  r: 'une tour',
  q: 'une dame',
  k: 'le roi',
};
const materialValues: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
function material(game: Chess, side: Side) {
  return game
    .board()
    .flat()
    .reduce(
      (sum, piece) =>
        sum + (piece ? (piece.color === side ? 1 : -1) * materialValues[piece.type] : 0),
      0,
    );
}
export function pedagogicalComment(
  move: Move,
  assessment: Assessment,
  before: PositionAnalysis,
  after: PositionAnalysis,
  bestSan: string | null,
): string {
  const label = categoryInfo[assessment.category].name;
  const sign = move.color === 'w' ? 1 : -1;
  const a = whiteScore(before.score) * sign,
    b = whiteScore(after.score) * sign;
  const recommended = bestSan ? ` Stockfish préférait ${bestSan}.` : '';
  if (move.san.endsWith('#'))
    return `${label}. Tu donnes échec et mat : le roi adverse n’a plus de réponse légale.`;
  if (!categoryInfo[assessment.category].good) {
    if (
      'mate' in after.score &&
      after.score.winner !== move.color &&
      !('mate' in before.score && before.score.winner !== move.color)
    )
      return `${label}. L’analyse trouve maintenant un mat forcé contre ton roi.${recommended}`;
    if (
      'mate' in before.score &&
      before.score.winner === move.color &&
      !('mate' in after.score && after.score.winner === move.color)
    )
      return `${label}. Le mat annoncé avant ce coup n’est plus retrouvé dans cette analyse.${recommended}`;
    const line = new Chess(move.after);
    try {
      for (const token of after.pv) playUci(line, token);
    } catch {
      /* Only use the legal part if a cached PV was truncated. */
    }
    if (material(line, move.color) <= material(new Chess(move.before), move.color) - 200)
      return `${label}. La suite analysée montre une perte de matériel pour ton camp.${recommended}`;
    if (a > 150 && b < -150)
      return `${label}. Ton avantage se transforme en une position favorable à l’adversaire.${recommended}`;
    if (a > 100 && b < a)
      return `${label}. Ce coup fait perdre une partie de ton avantage.${recommended}`;
    return `${label}. La position devient moins favorable selon cette analyse limitée.${recommended}`;
  }
  if ('mate' in after.score && after.score.winner !== move.color)
    return `${label} parmi les options analysées, mais la position reste perdante avec un mat annoncé.`;
  if (b < -600)
    return `${label} parmi les options analysées. Tu limites les dégâts, mais la position reste très difficile.`;
  if (move.isKingsideCastle() || move.isQueensideCastle())
    return `${label}. Tu mets ton roi à l’abri et rapproches une tour du centre.`;
  if (move.promotion)
    return `${label}. Ton pion atteint la dernière rangée et devient ${pieceNames[move.promotion]}.`;
  if (move.isEnPassant())
    return `${label}. Tu utilises la prise en passant pour capturer le pion qui vient d’avancer de deux cases.`;
  if (move.captured)
    return `${label}. Tu captures ${pieceNames[move.captured]} sans dégrader sensiblement l’évaluation de ta position.`;
  if (move.san.endsWith('+'))
    return `${label}. Tu donnes échec et obliges l’adversaire à répondre à la menace sur son roi.`;
  if (
    ['n', 'b'].includes(move.piece) &&
    /[18]$/.test(move.from) &&
    Number(move.before.split(' ')[5]) <= 10
  )
    return `${label}. Tu développes ${pieceNames[move.piece]} et prépares la coordination de tes pièces.`;
  if (['d4', 'e4', 'd5', 'e5'].includes(move.to))
    return `${label}. Tu places ${pieceNames[move.piece]} au centre, où les pièces peuvent agir sur les deux ailes.`;
  if (move.piece === 'p') {
    const game = new Chess(move.after);
    const sameFile = game
      .board()
      .flat()
      .filter(
        (piece) =>
          piece?.type === 'p' && piece.color === move.color && piece.square[0] === move.to[0],
      ).length;
    if (sameFile > 1)
      return `${label}. Tes pions sont doublés sur la colonne ${move.to[0]}, mais la position reste jouable selon l’analyse.`;
  }
  return Math.abs(b) <= 100
    ? `${label}. La position reste proche de l’équilibre ; poursuis la coordination de tes pièces.`
    : `${label}. Tu conserves les possibilités de ta position selon Stockfish.`;
}

export function proposedLine(fen: string, tokens: string[]) {
  const game = new Chess(fen);
  const output: string[] = [];
  for (const token of tokens.slice(0, 6)) {
    try {
      const n = game.moveNumber();
      const side = game.turn();
      const move = playUci(game, token);
      output.push(
        `${side === 'w' ? `${n}. ` : output.length === 0 ? `${n}… ` : ''}${frenchSan(move.san)}`,
      );
    } catch {
      break;
    }
  }
  return output.join(' ');
}
export function buildReport(record: GameRecord, positions: PositionAnalysis[]): ReviewReport {
  const replay = replayGame(record);
  if (positions.length !== replay.positions.length) throw new Error('Analyse incomplète.');
  const moves: ReviewedMove[] = replay.moves.flatMap((move, index) => {
    if (move.color !== record.player) return [];
    const before = positions[index],
      after = positions[index + 1];
    const assessment = classifyMove(
      before.score,
      after.score,
      record.player,
      uci(move),
      before.bestMove,
    );
    let bestSan: string | null = null;
    try {
      if (before.bestMove)
        bestSan = frenchSan(playUci(new Chess(move.before), before.bestMove).san);
    } catch {
      /* No tactical claim without a legal recommendation. */
    }
    return [
      {
        ...assessment,
        ply: index + 1,
        played: `${moveNumber(index + 1)} ${frenchSan(move.san)}`,
        bestSan,
        comment: pedagogicalComment(move, assessment, before, after, bestSan),
        proposedLine: proposedLine(move.before, before.pv),
      },
    ];
  });
  const counts = Object.fromEntries(
    categories.map((category) => [
      category,
      moves.filter((move) => move.category === category).length,
    ]),
  ) as ReviewReport['counts'];
  const averageLoss = moves.reduce((sum, move) => sum + Math.min(600, move.loss), 0) / moves.length;
  return {
    positions,
    moves,
    counts,
    accuracy: moves.length ? Math.round(100 * Math.exp(-averageLoss / 160)) : null,
  };
}

export async function analyzeGame(
  record: GameRecord,
  engine: SearchEngine,
  signal: AbortSignal,
  progress: (done: number, total: number) => void,
): Promise<ReviewReport> {
  if (!record.result) throw new Error('Termine la partie avant de lancer son analyse.');
  const replay = replayGame(record);
  const total = replay.moves.filter((move) => move.color === record.player).length;
  const game = new Chess();
  const positions: PositionAnalysis[] = [];
  let done = 0;
  progress(0, total);
  // Every board position is visited once: before/after each learner move, plus computer moves for the chart.
  for (let ply = 0; ply <= record.moves.length; ply++) {
    if (signal.aborted) throw abortError();
    if (ply > 0) playUci(game, record.moves[ply - 1]);
    const terminal = terminalScore(game);
    const result = terminal
      ? { score: terminal, bestMove: null, pv: [] }
      : await engine.search(
          { fen: game.fen(), history: record.moves.slice(0, ply) },
          REVIEW_SETTINGS,
          signal,
        );
    if (signal.aborted) throw abortError();
    positions.push(result);
    if (ply > 0 && replay.moves[ply - 1].color === record.player) progress(++done, total);
  }
  return buildReport(record, positions);
}

export const navigatePly = (
  current: number,
  action: 'first' | 'previous' | 'next' | 'last',
  total: number,
) =>
  action === 'first'
    ? 0
    : action === 'last'
      ? total
      : Math.max(0, Math.min(total, current + (action === 'previous' ? -1 : 1)));

export type ReviewNavigationAction = 'first' | 'previous' | 'next' | 'last';

export function categoryPlies(moves: ReviewedMove[], category: Category): number[] {
  return moves.filter((move) => move.category === category).map((move) => move.ply);
}

export function navigateFilteredPly(
  current: number,
  action: ReviewNavigationAction,
  plies: number[],
): number | null {
  if (!plies.length) return null;
  const currentIndex = Math.max(0, plies.indexOf(current));
  const nextIndex =
    action === 'first'
      ? 0
      : action === 'last'
        ? plies.length - 1
        : Math.max(
            0,
            Math.min(plies.length - 1, currentIndex + (action === 'previous' ? -1 : 1)),
          );
  return plies[nextIndex];
}

export function bestMoveArrow(
  fen: string,
  token: string | null,
): { from: string; to: string } | null {
  if (!token || !/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(token)) return null;
  try {
    playUci(new Chess(fen), token);
    return { from: token.slice(0, 2), to: token.slice(2, 4) };
  } catch {
    return null;
  }
}
