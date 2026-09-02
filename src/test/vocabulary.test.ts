import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { glossary, glossaryAliases, type GlossaryTerm } from '../data/glossary';

// Audit of the chess vocabulary actually shown to the learner.
// The candidate list is deliberately larger than the product: a term that appears in a
// user-visible string must have a definition, and a term that never appears is recorded
// as an explicit exclusion instead of an unused entry.
const candidates = [
  'promotion',
  'sous-promotion',
  'roque',
  'petit roque',
  'grand roque',
  'prise en passant',
  'fourchette',
  'clouage',
  'enfilade',
  'attaque à la découverte',
  'double attaque',
  'gambit',
  'tempo',
  'développement',
  'structure de pions',
  'pion isolé',
  'pions doublés',
  'pion passé',
  'colonne ouverte',
  'colonne semi-ouverte',
  'case faible',
  'sacrifice',
  'initiative',
  'opposition',
  'zugzwang',
  'pat',
  'échec',
  'échec et mat',
  'finale',
  'milieu de jeu',
  'centre',
  'fianchetto',
  'gaffe',
  'précision estimée',
  'demi-coup',
  'diagonale',
  'rangée',
  'colonne',
  'aile roi',
  'aile dame',
  'contre-attaque',
  'menace',
  'capture',
  'matériel',
  'matériel insuffisant',
  'règle des 50 coups',
  'répétition',
  'nulle',
  'abandon',
  'évaluation',
  'coordination',
  'ouverture',
  'variante',
  'elo',
  'eco',
  'transposition',
  'zwischenzug',
  'batterie',
  'surcharge',
  'interception',
  'déviation',
  'attraction',
] as const;

// Terms kept out of the tooltips on purpose.
const excluded: Record<string, string> = {
  // Piece names are learnt on the board itself; a tooltip on every "cavalier" would be noise.
  pion: 'nom de pièce, appris directement sur l’échiquier',
  tour: 'nom de pièce',
  cavalier: 'nom de pièce',
  fou: 'nom de pièce',
  dame: 'nom de pièce',
  roi: 'nom de pièce',
  // Motifs named only inside a tactic title, already explained by the exercise itself.
  déviation: 'motif nommé et expliqué dans la fiche de la tactique',
  attraction: 'motif nommé et expliqué dans la fiche de la tactique',
};

function userVisibleCorpus() {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry);
      if (statSync(path).isDirectory()) {
        if (!path.includes(join('src', 'test'))) walk(path);
      } else if (/\.(ts|tsx|json)$/.test(path)) files.push(path);
    }
  };
  walk('src');
  let corpus = '';
  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(/'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g))
      corpus += ` ${match[1] ?? match[2] ?? match[3] ?? ''}`;
    for (const match of source.matchAll(/>\s*([^<>{}]{4,})\s*</g)) corpus += ` ${match[1]}`;
  }
  return corpus.replace(/\s+/g, ' ').toLocaleLowerCase('fr');
}

const corpus = userVisibleCorpus();
const covered = new Set<string>();
for (const term of Object.keys(glossary) as GlossaryTerm[]) {
  covered.add(term.toLocaleLowerCase('fr'));
  for (const alias of glossaryAliases[term] ?? []) covered.add(alias.toLocaleLowerCase('fr'));
}
const appears = (term: string) =>
  new RegExp(
    `(?<![\\p{L}\\p{N}’'-])${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(s|es|x)?(?![\\p{L}\\p{N}’'-])`,
    'iu',
  ).test(corpus);

describe('Vocabulaire échiquéen visible par l’élève', () => {
  const detected = candidates.filter(appears);

  it('détecte du vocabulaire dans les textes réellement affichés', () => {
    expect(detected.length).toBeGreaterThanOrEqual(40);
  });

  it.each(detected)('« %s » possède une définition ou une exclusion assumée', (term) => {
    expect(covered.has(term) || term in excluded).toBe(true);
  });

  it('n’ajoute aucune définition pour un terme absent du produit', () => {
    const unused = (Object.keys(glossary) as GlossaryTerm[]).filter(
      (term) => !appears(term.toLocaleLowerCase('fr')),
    );
    expect(unused).toEqual([]);
  });

  it('justifie chaque exclusion', () => {
    for (const [term, reason] of Object.entries(excluded)) {
      expect(reason.length).toBeGreaterThan(10);
      expect(covered.has(term)).toBe(false);
    }
  });
});
