import { mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

mkdirSync('public/source', { recursive: true });
const files = [
  'src',
  'scripts',
  '.github',
  'package.json',
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  '.npmrc',
  'tsconfig.json',
  'vite.config.ts',
  'index.html',
  'README.md',
  'VALIDATION.md',
  'LICENSE',
  'THIRD_PARTY_NOTICES.md',
  '.gitignore',
  '.gitattributes',
  '.prettierrc.json',
  '.prettierignore',
  'public/favicon.svg',
  'public/theme-init.js',
  'public/pieces',
  'public/.nojekyll',
  'public/licences.html',
  'public/licenses',
  'public/engine',
];
const result = spawnSync('tar', ['-czf', 'public/source/chess-progress-source.tar.gz', ...files], {
  stdio: 'inherit',
});
if (result.status !== 0)
  throw new Error('La création de l’archive source a échoué. Vérifier que tar est installé.');
console.log('Archive des sources de cette version prête à être distribuée.');
