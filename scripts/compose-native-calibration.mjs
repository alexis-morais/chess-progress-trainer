import { difficultyRuntime } from './lib/difficulty-runtime.mjs';
import { composeNativeRevision } from './lib/native-revision.mjs';

// Reproduce this narrow revision from immutable full-pass evidence and fresh native runs.
// The verifier rejects reuse if anything other than native Elo targets has changed.
const { difficulties } = await difficultyRuntime();
for (const [kind, baseline, updates, output] of [
  ['positions', 'quality-pass3-positions', ['quality-native-final-positions'], 'quality-results'],
  [
    'games',
    'quality-pass3-games',
    ['quality-native-final-main-15-16', 'quality-native-final-main-16-19'],
    'quality-games',
  ],
  [
    'games',
    'quality-pass3-neighbors',
    ['quality-native-final-neighbor-15-16'],
    'quality-neighbors',
  ],
]) {
  await composeNativeRevision(
    {
      kind,
      baseline: `calibration/${baseline}.json`,
      snapshot: 'calibration/policy-pass3.json',
      updates: updates.map((name) => `calibration/${name}.json`),
      output: `calibration/${output}.json`,
    },
    difficulties,
  );
  console.log(`${output} : mesures et provenance vérifiées.`);
}
