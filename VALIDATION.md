# Contrôle de livraison — 30 août 2026

## Résultat

- **53 tests réussis / 53**, répartis dans quatre fichiers.
- **Build de production réussi**, vérification TypeScript comprise, sans avertissement de taille ni erreur.
- **Audit des dépendances de production : aucune vulnérabilité connue** au moment du contrôle.
- Installation reproduite avec `pnpm install --frozen-lockfile --offline` depuis les paquets déjà téléchargés.
- Toutes les séquences sont légales en SAN stricte : **16 variantes, 4 par ouverture**.
- Aucun service externe, compte, clé, suivi publicitaire ou backend n’est utilisé par l’application.

## Tests automatiques réellement exécutés

| Fichier | Tests | Couverture |
| --- | ---: | --- |
| `src/test/openings.test.ts` | 19 | Catalogue, identifiants, 16 lignes entièrement rejouées, données invalides, notation française |
| `src/test/trainer.test.ts` | 22 | Orientations, premier coup, coups interdits, compteurs, aides uniques, réinitialisation, réponses et fin exactes pour les 16 lignes |
| `src/test/engine.test.ts` | 7 | UCI, centipions et mats, point de vue des Blancs, limites de calcul, recherches périmées, pannes, délais et destruction |
| `src/test/app.test.tsx` | 5 | Sélection explicite, véritable composant react-chessboard, flèche, feedback, délai de 600 ms, orientation noire, reprise, bilan et clavier |

Commande : `pnpm check` (tests puis build). Le test sans moteur force l’échec du Worker et vérifie que les coups, compteurs et redémarrages restent utilisables.

## Vérifications dans un vrai navigateur

Navigateur Chromium intégré, application servie en HTTP, d’abord en développement, puis depuis **le dossier `dist/`** à l’adresse `http://127.0.0.1:4173/chess-progress-trainer/`.

- Choix d’une ouverture : aucune partie avant la sélection d’une variante et le bouton de démarrage.
- Italienne : Blancs en bas ; Française et Scandinave : Noirs en bas.
- Française : premier coup blanc automatique `e4`, puis tour de l’élève.
- Mauvais glisser-déposer `d2 → d4` dans l’Italienne : pion revenu sur d2, position inchangée, erreurs +1, progression 0/7.
- Aide répétée sur le même coup : une seule aide ; flèche visible e2 → e4, supprimée après le coup correct.
- Entrée sur e2 puis e4 au clavier : coup accepté ; progression 1/7.
- Réponse noire automatique e5 et surbrillance effective des cases e7/e5.
- Rejeu complet de l’Italienne jusqu’à 7/7 sur le build de production ; bilan, blocage du plateau et choix d’une autre variante vérifiés.
- Rejeu complet de la Française jusqu’à 6/6 au format smartphone ; bilan et bouton Rejouer : position et compteurs remis à zéro.
- Aucun message d’erreur ou d’avertissement de l’application dans la console du navigateur pendant ces parcours.

## Stockfish depuis le build final

- `stockfish-18-lite-single.js` démarre bien dans un Worker classique ; le WASM local est effectivement exécuté.
- État affiché : **Analyse locale active**, avec évaluation numérique observée (`+0.4` à la position initiale), puis nouvelles évaluations après les mouvements.
- Réponse HTTP **200**, type **application/wasm**, taille **7 295 411 octets** sous `/chess-progress-trainer/engine/stockfish-18-lite-single.wasm`.
- Empreintes SHA-256 du JavaScript, du WASM, des sources amont et du réseau NNUE vérifiées à chaque build.
- Les liens de licences et d’archive source répondent en HTTP **200** sous le même préfixe.
- Le modèle du trainer ne dépend pas du module d’analyse. Le contenu du coup `bestmove` n’est jamais interprété : seul le marqueur de fin de recherche est utilisé pour la file UCI.

Le JavaScript principal de l’application représente environ 342 ko (108 ko compressés), le CSS 21 ko (5,4 ko compressés). Les archives de sources et le réseau séparé ne sont **pas** téléchargés pour jouer ; seul le moteur WASM embarquant déjà son réseau est nécessaire à l’analyse.

## Responsive et limites de compatibilité

Tailles réellement vérifiées : **320, 390, 768 et 1280 pixels** de large. Aucun débordement horizontal ; panneau sous l’échiquier sur mobile/tablette, à droite sur ordinateur. Modale de fin visible et utilisable à 390 × 844. Test de glisser-déposer à la souris et de navigation au clavier effectué.

Le build cible Chrome 107+, Firefox 104+ et Safari 16+ ; Worker classique et WASM mono-thread sans SharedArrayBuffer, donc sans en-têtes d’isolation spécifiques. Les cibles Firefox et Safari sont vérifiées **par la compilation et les API utilisées**, pas par une exécution dans ces navigateurs. Aucun test sur téléphone physique n’a été effectué ; les tailles mobiles sont simulées. Une interface tactile est fournie par react-chessboard et par la sélection en deux touches.

## GitHub Pages

Workflow prêt dans `.github/workflows/deploy-pages.yml` : dépendances verrouillées, tests, build et publication de `dist/` à chaque push sur `main`. Les références d’actions officielles configurées ont été vérifiées. Les pull requests sont testées sans déploiement.

**La publication distante n’a pas été exécutée.** Le dépôt local est relié à `https://github.com/mralexis901/chess-progress-trainer.git`, mais cet environnement ne dispose pas de l’authentification GitHub pour l’envoyer ou activer Pages. Le site public prévu répondait **404** lors de la vérification. Cela ne permet pas de déterminer si le dépôt distant est privé ou absent.

Après envoi des fichiers sur `main`, activer **GitHub → Settings → Pages → Source → GitHub Actions**, puis **Actions → Tester et déployer Chess Progress → Run workflow → Run workflow**. Adresse attendue après succès : `https://mralexis901.github.io/chess-progress-trainer/`.
