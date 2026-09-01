import { describe, expect, it } from 'vitest';
import { lessonModes, openings } from '../data/openings';
import { lessonIntroduction, openingPedagogy } from '../data/pedagogy';
import { compileLesson, initialState, isPlayerTurn, reduceTrainer } from '../trainer/model';
import { playerGuidance } from '../trainer/hints';

describe('Introductions pédagogiques réelles', () => {
  it('couvre les dix ouvertures avec des contenus propres', () => {
    expect(Object.keys(openingPedagogy)).toHaveLength(10);
    const ideas = openings.map((opening) => lessonIntroduction(opening, opening.variations[0], 'essential').idea);
    expect(new Set(ideas).size).toBe(10);
    for (const opening of openings) {
      const intro = lessonIntroduction(opening, opening.variations[0], 'essential');
      expect(intro.idea.length).toBeGreaterThan(70);
      expect(intro.objectives).toHaveLength(3);
      expect(new Set(intro.objectives).size).toBe(3);
    }
  });

  it('donne un objectif spécifique aux soixante variantes et aux deux modes', () => {
    let count = 0;
    for (const opening of openings)
      for (const variation of opening.variations)
        for (const mode of lessonModes) {
          const intro = lessonIntroduction(opening, variation, mode.id);
          expect(intro.variation).toBe(variation.description);
          expect(intro.variation.length).toBeGreaterThan(25);
          expect(intro.depth).toContain(mode.id === 'extended' ? 'milieu de jeu' : 'repères');
          count++;
        }
    expect(count).toBe(120);
  });

  it('fournit une intention sans coordonnées pour chaque décision des 120 séances', () => {
    const seen = new Set<string>();
    let sessions = 0;
    let decisions = 0;
    for (const opening of openings)
      for (const variation of opening.variations)
        for (const mode of lessonModes) {
          const lesson = compileLesson(opening, variation, mode.id);
          let state = initialState();
          for (const move of lesson.moves) {
            if (isPlayerTurn(lesson, state)) {
              const guidance = playerGuidance(lesson, state)!;
              expect(guidance.hint).not.toMatch(/\b[a-h][1-8]\b|→/);
              expect(guidance.hint.length).toBeGreaterThan(30);
              seen.add(guidance.hint);
              decisions++;
              state = reduceTrainer(lesson, state, {
                type: 'attempt',
                from: move.from,
                to: move.to,
                promotion: move.promotion,
              });
            } else state = reduceTrainer(lesson, state, { type: 'computer', expectedPly: state.ply });
          }
          sessions++;
        }
    expect(sessions).toBe(120);
    expect(decisions).toBeGreaterThan(600);
    expect(seen.size).toBeGreaterThan(24);
    const corpus = [...seen].join(' ').toLocaleLowerCase('fr');
    for (const theme of [
      /centre|centrale|cœur/,
      /développ|active|activité/,
      /roi|sécurité|abri/,
      /pression|menace|cible|temps/,
      /échange|captur/,
      /structure|chaîne|pion|espace|rupture/,
      /ligne|diagonale|case/,
    ]) expect(corpus).toMatch(theme);
  });

  it('conserve une explication réelle après chaque bon coup de l’élève', () => {
    let checked = 0;
    for (const opening of openings)
      for (const variation of opening.variations)
        for (const mode of lessonModes) {
          const lesson = compileLesson(opening, variation, mode.id);
          lesson.moves.forEach((move, index) => {
            if (move.color !== lesson.player) return;
            const explanation = lesson.steps[index].explanation;
            expect(explanation).not.toMatch(/^Réponse prédéfinie/);
            expect(explanation.length).toBeGreaterThan(24);
            checked++;
          });
        }
    expect(checked).toBeGreaterThan(600);
  });
});
