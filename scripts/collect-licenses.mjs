import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const names = [
  'react',
  'react-dom',
  'scheduler',
  'chess.js',
  'react-chessboard',
  'lucide-react',
  '@dnd-kit/core',
  '@dnd-kit/modifiers',
  '@dnd-kit/utilities',
  '@dnd-kit/accessibility',
  'tslib',
];
const modules = readdirSync('node_modules/.pnpm');
let notices =
  'CHESS PROGRESS — BIBLIOTHÈQUES DISTRIBUÉES\n\nLes textes originaux des licences sont reproduits ci-dessous.\nStockfish : voir les fichiers GPL et AUTHORS séparés.\n\n';
for (const name of names) {
  const entry = modules.find((item) => item.startsWith(name.replace('/', '+') + '@'));
  if (!entry) throw new Error(`Dépendance manquante : ${name}`);
  const directory = join('node_modules/.pnpm', entry, 'node_modules', name);
  const pkg = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'));
  const files = readdirSync(directory).filter(
    (file) => /^(licen[sc]e|copying|notice)/i.test(file) && !file.endsWith('.js'),
  );
  if (!files.length) throw new Error(`Licence introuvable : ${name}`);
  notices += `\n${'='.repeat(70)}\n${name} ${pkg.version} — ${pkg.license}\n${typeof pkg.repository === 'string' ? pkg.repository : (pkg.repository?.url ?? '')}\n\n`;
  for (const file of files)
    if (existsSync(join(directory, file)))
      notices += readFileSync(join(directory, file), 'utf8') + '\n';
}
writeFileSync('public/licenses/THIRD-PARTY-NOTICES.txt', notices);
console.log(`Licences complètes de ${names.length} bibliothèques enregistrées.`);
