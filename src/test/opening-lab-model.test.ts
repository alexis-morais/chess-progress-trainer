import { Chess } from 'chess.js';
import { describe, expect, it } from 'vitest';
import { openings } from '../data/openings';
import { positionResult } from '../computer/game';
import type { PositionAnalysis } from '../computer/types';
import {
  identifyOpening,
  LAB_EVALUATION_SETTINGS,
  LAB_RECOMMENDATION_SETTINGS,
  moveCursor,
  playLabMove,
  recommendationsFrom,
  recognizeOpening,
  replayTimeline,
  scoreForStudiedSide,
  scoreLabelForStudiedSide,
  type LabTimeline,
} from '../opening-lab/model';

const line = (...moves: string[]): LabTimeline => ({ moves, cursor: moves.length });

describe('Ouverture libre : modèle de navigation et règles', () => {
  it('démarre depuis la position initiale et accepte alternativement les deux camps', () => {
    let timeline = line();
    timeline = playLabMove(timeline, 'e2', 'e4');
    timeline = playLabMove(timeline, 'e7', 'e5');
    expect(timeline.moves).toEqual(['e2e4', 'e7e5']);
    expect(replayTimeline(timeline).game.turn()).toBe('w');
  });

  it('refuse uniquement les coups illégaux sans modifier la position', () => {
    const timeline = line();
    expect(playLabMove(timeline, 'e2', 'e5')).toBe(timeline);
    expect(playLabMove(timeline, 'e7', 'e5')).toBe(timeline);
  });

  it('autorise volontairement une sortie complète du répertoire', () => {
    let timeline = line();
    for (const [from, to] of [
      ['a2', 'a3'],
      ['h7', 'h5'],
      ['a3', 'a4'],
      ['h5', 'h4'],
    ])
      timeline = playLabMove(timeline, from, to);
    expect(timeline.moves).toHaveLength(4);
    expect(identifyOpening(timeline.moves)).toBe('Exploration libre');
  });

  it('restaure exactement FEN, trait, roque et en passant en naviguant', () => {
    let timeline = line();
    for (const move of [
      ['e2', 'e4'],
      ['a7', 'a6'],
      ['e4', 'e5'],
      ['d7', 'd5'],
    ])
      timeline = playLabMove(timeline, move[0], move[1]);
    const replay = replayTimeline(timeline);
    const atFour = replay.positions[4];
    const restored = replayTimeline(moveCursor(timeline, 4)).game.fen();
    expect(restored).toBe(atFour);
    expect(restored.split(' ')[1]).toBe('w');
    expect(restored.split(' ')[3]).toBe('d6');
    expect(restored.split(' ')[2]).toBe('KQkq');
  });

  it('prend en passant et conserve la position exacte', () => {
    let timeline = line();
    for (const move of [
      ['e2', 'e4'],
      ['a7', 'a6'],
      ['e4', 'e5'],
      ['d7', 'd5'],
      ['e5', 'd6'],
    ])
      timeline = playLabMove(timeline, move[0], move[1]);
    const game = replayTimeline(timeline).game;
    expect(game.get('d6')).toMatchObject({ type: 'p', color: 'w' });
    expect(game.get('d5')).toBeUndefined();
  });

  it('gère le roque avec les mêmes règles chess.js que le reste du produit', () => {
    let timeline = line();
    for (const move of [
      ['e2', 'e4'],
      ['e7', 'e5'],
      ['g1', 'f3'],
      ['b8', 'c6'],
      ['f1', 'e2'],
      ['g8', 'f6'],
      ['e1', 'g1'],
    ])
      timeline = playLabMove(timeline, move[0], move[1]);
    const game = replayTimeline(timeline).game;
    expect(game.get('g1')).toMatchObject({ type: 'k', color: 'w' });
    expect(game.get('f1')).toMatchObject({ type: 'r', color: 'w' });
  });

  it('gère une promotion et une sous-promotion dans la chronologie libre', () => {
    let timeline = line();
    for (const move of [
      ['a2', 'a4'],
      ['h7', 'h5'],
      ['a4', 'a5'],
      ['h5', 'h4'],
      ['a5', 'a6'],
      ['h4', 'h3'],
      ['a6', 'b7'],
      ['h3', 'g2'],
    ])
      timeline = playLabMove(timeline, move[0], move[1]);
    timeline = playLabMove(timeline, 'b7', 'a8', 'n');
    expect(timeline.moves.at(-1)).toBe('b7a8n');
    expect(replayTimeline(timeline).game.get('a8')).toMatchObject({ type: 'n', color: 'w' });
  });

  it('tronque la continuation future lorsqu’un nouveau coup crée une branche', () => {
    const original = line('e2e4', 'e7e5', 'g1f3', 'b8c6');
    const past = moveCursor(original, 3);
    const branch = playLabMove(past, 'd7', 'd6');
    expect(branch).toEqual({ moves: ['e2e4', 'e7e5', 'g1f3', 'd7d6'], cursor: 4 });
  });

  it('borne précédent/suivant et permet un reset complet', () => {
    const timeline = line('e2e4', 'e7e5');
    expect(moveCursor(timeline, -5).cursor).toBe(0);
    expect(moveCursor(timeline, 99).cursor).toBe(2);
    expect(replayTimeline(line()).game.fen()).toBe(new Chess().fen());
  });

  it('détecte la fin de partie et refuse tout coup supplémentaire', () => {
    let timeline = line();
    for (const move of [
      ['f2', 'f3'],
      ['e7', 'e5'],
      ['g2', 'g4'],
      ['d8', 'h4'],
    ])
      timeline = playLabMove(timeline, move[0], move[1]);
    expect(positionResult(replayTimeline(timeline).game)?.reason).toBe('checkmate');
    expect(playLabMove(timeline, 'a2', 'a3')).toBe(timeline);
  });

  it('détecte la répétition grâce à l’historique rejoué, pas au seul FEN', () => {
    let timeline = line();
    for (const move of [
      ['g1', 'f3'],
      ['g8', 'f6'],
      ['f3', 'g1'],
      ['f6', 'g8'],
      ['g1', 'f3'],
      ['g8', 'f6'],
      ['f3', 'g1'],
      ['f6', 'g8'],
    ])
      timeline = playLabMove(timeline, move[0], move[1]);
    expect(positionResult(replayTimeline(timeline).game)?.reason).toBe('repetition');
  });

  it('reconnaît uniquement les lignes vérifiées du catalogue existant', () => {
    expect(openings).toHaveLength(10);
    expect(openings.flatMap((opening) => opening.variations)).toHaveLength(60);
    expect(identifyOpening(['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4', 'f8c5'])).toContain(
      'Ouverture italienne',
    );
    expect(identifyOpening(['e2e4'])).toBe('Exploration libre');
  });

  it('attend le coup discriminant avant d’annoncer une variante écossaise', () => {
    const common = ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'd2d4', 'e5d4', 'f3d4'];
    expect(recognizeOpening(common)).toEqual({
      kind: 'catalogue',
      opening: 'Ouverture écossaise',
      variation: null,
      inBook: true,
    });
    expect(recognizeOpening([...common, 'f8c5'])).toMatchObject({
      opening: 'Ouverture écossaise',
      variation: 'Variante classique',
      inBook: true,
    });
    expect(recognizeOpening([...common, 'g8f6', 'b1c3'])).toMatchObject({
      opening: 'Ouverture écossaise',
      variation: 'Variante Schmidt',
      inBook: true,
    });
  });

  it('signale la sortie du répertoire puis recalcule la variante depuis la timeline affichée', () => {
    const common = ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'd2d4', 'e5d4', 'f3d4'];
    const classical = [...common, 'f8c5'];
    expect(recognizeOpening([...classical, 'a2a3'])).toEqual({
      kind: 'catalogue',
      opening: 'Ouverture écossaise',
      variation: null,
      inBook: false,
    });
    expect(recognizeOpening(classical)).toMatchObject({ variation: 'Variante classique' });
    expect(recognizeOpening([...common, 'g8f6', 'b1c3'])).toMatchObject({
      variation: 'Variante Schmidt',
    });
  });
});

describe('Ouverture libre : recommandations et perspective', () => {
  const analysis: PositionAnalysis = {
    score: { cp: 142, depth: 13 },
    bestMove: 'e2e4',
    pv: ['e2e4'],
    candidates: [
      { move: 'e2e4', score: { cp: 142, depth: 13 }, pv: ['e2e4'] },
      { move: 'd2d4', score: { cp: 101, depth: 13 }, pv: ['d2d4'] },
      { move: 'g1f3', score: { cp: 76, depth: 13 }, pv: ['g1f3'] },
      { move: 'e2e5', score: { cp: 999, depth: 13 }, pv: ['e2e5'] },
    ],
  };

  it('demande MultiPV 3 uniquement dans le profil de recommandations', () => {
    expect(LAB_RECOMMENDATION_SETTINGS.multiPV).toBe(3);
    expect(LAB_EVALUATION_SETTINGS.multiPV).toBe(1);
    expect(LAB_RECOMMENDATION_SETTINGS.movetime).toBeLessThan(500);
  });

  it('produit au maximum trois candidats légaux et leur rang textuel', () => {
    const candidates = recommendationsFrom(analysis, new Chess().fen(), 'w');
    expect(candidates.map(({ badge, san }) => [badge, san])).toEqual([
      ['MEILLEUR', 'e4'],
      ['EXCELLENT', 'd4'],
      ['BON', 'Cf3'],
    ]);
    expect(candidates).toHaveLength(3);
  });

  it('associe à chaque flèche le score de son propre candidat', () => {
    expect(recommendationsFrom(analysis, new Chess().fen(), 'w').map((item) => item.label)).toEqual(
      ['+1.42', '+1.01', '+0.76'],
    );
  });

  it('rétablit une hiérarchie fiable même si les messages MultiPV arrivent dans le désordre', () => {
    const shuffled = {
      ...analysis,
      candidates: [analysis.candidates![2], analysis.candidates![0], analysis.candidates![1]],
    };
    expect(recommendationsFrom(shuffled, new Chess().fen(), 'w').map((item) => item.move)).toEqual([
      'e2e4',
      'd2d4',
      'g1f3',
    ]);
  });

  it('normalise les centipions du point de vue des Blancs et des Noirs', () => {
    expect(scoreForStudiedSide({ cp: 125, depth: 10 }, 'w')).toMatchObject({ cp: 125 });
    expect(scoreForStudiedSide({ cp: 125, depth: 10 }, 'b')).toMatchObject({ cp: -125 });
    expect(scoreLabelForStudiedSide({ cp: -42, depth: 10 }, 'b')).toBe('+0.42');
  });

  it('normalise aussi les mats sans ambiguïté de camp', () => {
    const whiteMate = { mate: 3, winner: 'w' as const, depth: 14 };
    expect(scoreLabelForStudiedSide(whiteMate, 'w')).toBe('M3');
    expect(scoreLabelForStudiedSide(whiteMate, 'b')).toBe('−M3');
    const blackMate = { mate: 2, winner: 'b' as const, depth: 14 };
    expect(scoreLabelForStudiedSide(blackMate, 'b')).toBe('M2');
  });

  it('affiche moins de trois lignes plutôt que d’inventer une donnée', () => {
    const partial = { ...analysis, candidates: analysis.candidates?.slice(0, 2) };
    expect(recommendationsFrom(partial, new Chess().fen(), 'w')).toHaveLength(2);
  });

  it('n’invente aucun rang si la première ligne MultiPV est absente', () => {
    const partial = { ...analysis, candidates: analysis.candidates?.slice(1) };
    expect(recommendationsFrom(partial, new Chess().fen(), 'w')).toEqual([]);
  });
});
