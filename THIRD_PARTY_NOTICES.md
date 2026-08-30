# Licences et crédits

Le code et les explications originales de **Chess Progress — Opening Trainer**, © 2026 Chess Progress Project 2026, sont disponibles sous **GPL-3.0-only**. Le texte intégral est dans `LICENSE`. Le prototype est fourni sans garantie. Les dépendances gardent leurs propres licences.

| Composant                                  | Licence      | Attribution / provenance                                                     |
| ------------------------------------------ | ------------ | ---------------------------------------------------------------------------- |
| React / React DOM / Scheduler              | MIT          | Meta et contributeurs — https://github.com/facebook/react                    |
| chess.js                                   | BSD-2-Clause | Jeff Hlywa et contributeurs — https://github.com/jhlywa/chess.js             |
| react-chessboard et ses pièces             | MIT          | Ryan Gregory et contributeurs — https://github.com/Clariity/react-chessboard |
| Lucide                                     | ISC          | Contributeurs Lucide et Feather — https://github.com/lucide-icons/lucide     |
| DnD Kit                                    | MIT          | Clauderic Demers et contributeurs — https://github.com/clauderic/dnd-kit     |
| tslib                                      | 0BSD         | Microsoft — https://github.com/Microsoft/tslib                               |
| Stockfish.js 18.0.8 Lite Single-Threaded   | GPL-3.0      | Nathan Rugg, Chess.com, LLC, équipe Stockfish ; réseaux de Linmiao Xu        |
| Noms et préfixes d’ouvertures de référence | CC0          | https://github.com/lichess-org/chess-openings                                |

Les **textes complets** des licences de toutes les dépendances embarquées, y compris les dépendances transitives, figurent dans `public/licenses/THIRD-PARTY-NOTICES.txt`, produit par `pnpm run licenses`. Les outils de développement Vite, Vitest (MIT), TypeScript (Apache-2.0), Testing Library (MIT) et jsdom (MIT) ne sont pas embarqués dans le site ; leurs textes sont inclus dans leurs paquets installés.

## Distribution de Stockfish

Le JavaScript et le WASM officiels sont vendored, non modifiés, dans `public/engine/`. **Aucun CDN n’est contacté pendant l’utilisation.** Le réseau NNUE est déjà intégré au WASM ; sa copie distincte n’est proposée que pour reconstruire le moteur.

Le site distribue avec ces binaires :

- la licence GPLv3 complète et la liste d’auteurs officielle ;
- l’archive du code source correspondant exactement au commit npm `93c994592dcf3b4b21052ab925e9b534df9c0918` ;
- le réseau `nn-9067e33176e8.nnue` nécessaire à la compilation ;
- les instructions de reconstruction, dans `public/engine/README.md` ;
- le code source du trainer (archive créée à chaque build), le fichier de verrouillage et les scripts de construction.

Tous ces éléments sont accessibles via **« Logiciels libres & crédits »** en bas de page, y compris sans accès à GitHub. Les sources du moteur, son réseau et ses scripts sont servis au même endroit que le binaire, gratuitement. Ne pas les retirer d’une redistribution. Conserver les attributions et le texte GPL ; si le moteur est modifié, mettre aussi à jour ses sources correspondantes, ses notices et ses empreintes.

Les binaires officiels viennent de `https://unpkg.com/stockfish@18.0.8/bin/` au moment de la préparation ; l’archive provient de GitHub/codeload et le réseau de `https://tests.stockfishchess.org/api/nn/nn-9067e33176e8.nnue`. Les empreintes sont figées dans `scripts/engine-manifest.json` et contrôlées au build. L’archive source contient les scripts amont et requiert Emscripten 3.1.7 pour reconstruire le moteur.

Le prototype utilise son identité propre. Il n’est ni affilié ni sponsorisé par Chess.com, Lichess ou Stockfish. Aucun logo tiers n’est repris.
