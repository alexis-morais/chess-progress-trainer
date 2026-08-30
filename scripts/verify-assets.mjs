import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const manifest = JSON.parse(
  readFileSync(new URL('./engine-manifest.json', import.meta.url), 'utf8'),
);
for (const [file, hash] of Object.entries(manifest)) {
  const bytes = readFileSync(new URL(`../public/engine/${file}`, import.meta.url));
  if (createHash('sha256').update(bytes).digest('hex') !== hash) {
    throw new Error(
      `Stockfish : fichier manquant ou altéré (${file}). Restaurer le fichier officiel avant de publier.`,
    );
  }
}
for (const file of ['Stockfish-GPL-3.0.txt', 'Stockfish-AUTHORS.txt', 'THIRD-PARTY-NOTICES.txt']) {
  readFileSync(new URL(`../public/licenses/${file}`, import.meta.url));
}
console.log('Stockfish 18 : fichiers, source, réseau NNUE et licences vérifiés.');
