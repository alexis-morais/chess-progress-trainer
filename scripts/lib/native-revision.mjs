import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import ts from 'typescript';

const names = ['chooseMove.ts', 'difficulty.ts', 'ComputerEngine.ts', 'material.ts'];
const json = async (file) => JSON.parse(await readFile(file, 'utf8'));
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const corpus = (positions) => positions.map(({ reference, ...position }) => position);
const referenceSets = (base, updates, changed) => [
  {
    levels: base.profiles.filter((p) => !changed.includes(p.id)).map((p) => p.id),
    positions: base.positions.map(({ id, reference }) => ({ id, reference })),
  },
  ...updates.map((update) => ({
    levels: update.profiles.map((p) => p.id),
    positions: update.positions.map(({ id, reference }) => ({ id, reference })),
  })),
];
const requireThat = (condition, message) => {
  if (!condition) throw new Error(message);
};
export async function policySources() {
  return Object.fromEntries(
    await Promise.all(
      names.map(async (name) => [name, await readFile(`src/computer/${name}`, 'utf8')]),
    ),
  );
}
export function policyHash(sources) {
  const hash = createHash('sha256');
  for (const name of names) hash.update(sources[name]);
  return hash.digest('hex');
}
function nativeTemplate(source) {
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      removeComments: true,
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
    },
  }).outputText;
  const expression = /elo: \[[\d,\s]+\]\[id - 16\]/g;
  requireThat([...compiled.matchAll(expression)].length === 1, 'Table native non identifiable.');
  return compiled.replace(expression, 'elo: NATIVE_TARGETS');
}
export function changedNativeLevels(oldProfiles, profiles) {
  const changed = [];
  for (const [index, profile] of profiles.entries()) {
    const old = oldProfiles[index];
    if (equal(old, profile)) continue;
    requireThat(profile.id >= 16 && profile.id <= 24, 'Révision limitée aux cibles natives 16–24.');
    requireThat(
      equal({ ...old, settings: { ...old.settings, elo: profile.settings.elo } }, profile),
      'Autre paramètre modifié : refaire la validation complète.',
    );
    changed.push(profile.id);
  }
  requireThat(changed.length > 0, 'Aucune cible native modifiée.');
  return changed;
}
export function overlayReport(base, updates, kind, changed) {
  const fields =
    kind === 'positions' ? ['rows', 'summary', 'openingHabits'] : ['matches', 'summary'];
  const key = (row, field) =>
    kind === 'positions'
      ? `${row.level}/${field === 'rows' ? row.position : ''}`
      : `${row.lower}/${row.higher}/${field === 'matches' ? row.round : ''}`;
  const affected = (row) =>
    kind === 'positions'
      ? changed.includes(row.level)
      : changed.includes(row.lower) || changed.includes(row.higher);
  const result = {};
  for (const field of fields) {
    const replacements = new Map();
    for (const update of updates)
      for (const row of update[field]) {
        requireThat(affected(row), 'Une mesure inchangée ne doit pas être remplacée.');
        const id = key(row, field);
        requireThat(!replacements.has(id), 'Mesure remplacée deux fois.');
        replacements.set(id, row);
      }
    result[field] = base[field].map((row) => {
      if (!affected(row)) return row;
      const id = key(row, field),
        next = replacements.get(id);
      requireThat(next, `Nouvelle mesure manquante : ${id}`);
      replacements.delete(id);
      return next;
    });
    requireThat(replacements.size === 0, 'Mesures étrangères au corpus initial.');
  }
  return result;
}

// Reuse is deliberately narrow: identical engine/selection code, only the native Elo table
// may change. Every affected position and game must have a fresh, complete measurement.
export async function verifyNativeRevision(report, profiles) {
  if (!report.nativeRevision) return;
  const revision = report.nativeRevision;
  const base = await json(revision.baseline),
    snapshot = await json(revision.snapshot);
  const sources = await policySources();
  requireThat(
    base.completedAt && base.policyHash === policyHash(snapshot),
    'Empreinte du rapport de départ invalide.',
  );
  for (const name of names.filter((name) => name !== 'difficulty.ts'))
    requireThat(
      snapshot[name] === sources[name],
      `Logique ${name} modifiée : validation complète requise.`,
    );
  requireThat(
    nativeTemplate(snapshot['difficulty.ts']) === nativeTemplate(sources['difficulty.ts']),
    'La logique des profils a changé.',
  );
  const changed = changedNativeLevels(base.profiles, profiles);
  requireThat(equal(changed, revision.changedLevels), 'Liste des profils modifiés incohérente.');
  const updates = await Promise.all(revision.updates.map(json));
  for (const update of updates) {
    // The position runner records only the requested profiles; game reports record all 25.
    const expectedProfiles =
      revision.kind === 'positions'
        ? profiles.filter((profile) =>
            update.profiles.some((measured) => measured.id === profile.id),
          )
        : profiles;
    requireThat(
      update.completedAt &&
        !update.nativeTrial &&
        update.policyHash === policyHash(sources) &&
        update.profiles.length > 0 &&
        equal(update.profiles, expectedProfiles),
      'Nouvelle mesure incomplète, expérimentale ou périmée.',
    );
    requireThat(equal(update.referenceSettings, base.referenceSettings), 'Référence différente.');
    if (revision.kind === 'positions')
      requireThat(
        equal(corpus(update.positions), corpus(base.positions)) && update.seed === base.seed,
        'Corpus ou seed de positions différent.',
      );
    else
      requireThat(
        update.maxPlies === base.maxPlies && equal(update.opponentSettings, base.opponentSettings),
        'Protocole de parties différent.',
      );
  }
  const expected = overlayReport(base, updates, revision.kind, changed);
  for (const [field, rows] of Object.entries(expected))
    requireThat(equal(report[field], rows), `Composition ${field} non fidèle aux mesures.`);
  if (revision.kind === 'positions')
    requireThat(
      equal(report.referenceSets, referenceSets(base, updates, changed)),
      'Les références de qualité doivent suivre les mesures de chaque profil.',
    );
  requireThat(
    report.policyHash === policyHash(sources) && equal(report.profiles, profiles),
    'La synthèse ne correspond pas aux profils actuels.',
  );
}

export async function composeNativeRevision(
  { baseline, snapshot, updates, kind, output },
  profiles,
) {
  const base = await json(baseline),
    sources = await policySources();
  const changed = changedNativeLevels(base.profiles, profiles);
  const patches = await Promise.all(updates.map(json));
  const report = {
    ...base,
    ...overlayReport(base, patches, kind, changed),
    ...(kind === 'positions' ? { referenceSets: referenceSets(base, patches, changed) } : {}),
    profiles,
    policyHash: policyHash(sources),
    completedAt: new Date().toISOString(),
    nativeRevision: { baseline, snapshot, updates, kind, changedLevels: changed },
  };
  await verifyNativeRevision(report, profiles);
  await writeFile(output, JSON.stringify(report, null, 2) + '\n');
  return report;
}
