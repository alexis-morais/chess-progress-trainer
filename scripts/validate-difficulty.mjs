import { spawn } from 'node:child_process';

// The v1 report stays immutable: it supplies the fixed, legal long-game probes.
const args = process.argv.slice(2);
const phase = args.find((a) => a.startsWith('--phase='))?.slice(8) ?? 'all';
if (!['all', 'positions', 'matches', 'neighbors', 'adjacent', 'merge'].includes(phase))
  throw new Error('Phase inconnue.');
if (args.includes('--quick'))
  throw new Error(
    'Utiliser --phase=positions --levels=8 --output=calibration/essai.json pour un essai ciblé. Aucun essai rapide ne valide la calibration complète.',
  );
const pass = args.filter((a) => !a.startsWith('--phase='));
if (phase === 'all' && pass.length)
  throw new Error(
    'La validation complète utilise les paramètres de référence. Pour un essai, sélectionner une phase.',
  );
async function run(script, options = []) {
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [`scripts/${script}`, ...options], { stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`${script} : échec ${code}`)),
    );
  });
}
if (phase === 'all' || phase === 'positions') await run('validate-quality.mjs', pass);
if (phase === 'all' || phase === 'matches') await run('validate-quality-games.mjs', pass);
if (phase === 'all' || phase === 'neighbors')
  await run(
    'validate-quality-games.mjs',
    phase === 'all' || !pass.length
      ? [
          '--pairs=7-8,8-9,9-10,15-16',
          '--rounds=12',
          '--seed=20260909',
          '--output=calibration/quality-neighbors.json',
        ]
      : pass,
  );
if (phase === 'all' || phase === 'adjacent')
  await run(
    'validate-quality-games.mjs',
    phase === 'all' || !pass.length
      ? [
          '--pairs=14-15,16-17,17-18',
          '--rounds=6',
          '--seed=20260921',
          '--output=calibration/quality-native-final-adjacent.json',
        ]
      : pass,
  );
if (phase === 'all' || phase === 'merge') await run('merge-difficulty.mjs');
