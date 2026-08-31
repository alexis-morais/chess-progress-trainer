import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  changedNativeLevels,
  overlayReport,
  verifyNativeRevision,
} from '../../scripts/lib/native-revision.mjs';
import { difficulties } from '../computer/difficulty';

const read = (name) => JSON.parse(readFileSync(`calibration/${name}.json`, 'utf8'));

describe('Traçabilité des mesures réutilisées après le raccord natif', () => {
  it.each(['quality-results', 'quality-games', 'quality-neighbors'])(
    '%s : chaque mesure réutilisée ou remplacée correspond à sa source',
    async (name) => {
      await expect(verifyNativeRevision(read(name), difficulties)).resolves.toBeUndefined();
    },
  );
  it('interdit de recycler des mesures si un profil personnalisé a changé', () => {
    const old = structuredClone(difficulties);
    old[7].selection.hangingRate *= 2;
    expect(() => changedNativeLevels(old, difficulties)).toThrow('cibles natives');
  });
  it('interdit de changer discrètement le temps ou la profondeur de recherche', () => {
    const old = structuredClone(difficulties);
    old[15].settings.depth -= 1;
    expect(() => changedNativeLevels(old, difficulties)).toThrow('Autre paramètre');
  });
  it('exige de remplacer toutes les mesures des profils modifiés, pas seulement les victoires', () => {
    const base = {
      matches: [0, 1].map((round) => ({ lower: 15, higher: 16, round, higherPoints: round })),
      summary: [{ lower: 15, higher: 16, games: 2, higherScore: 0.5 }],
    };
    const partial = { matches: [base.matches[1]], summary: base.summary };
    expect(() => overlayReport(base, [partial], 'games', [16])).toThrow('manquante');
    expect(overlayReport(base, [base], 'games', [16])).toEqual(base);
  });
  it('refuse de remplacer une paire dont aucun profil ne change', () => {
    const report = {
      matches: [{ lower: 7, higher: 8, round: 0 }],
      summary: [{ lower: 7, higher: 8 }],
    };
    expect(() => overlayReport(report, [report], 'games', [16])).toThrow('inchangée');
  });
});
