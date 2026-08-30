# Chess Progress — Opening Trainer

**Entraîne-toi aux ouvertures, coup après coup.**

Prototype pédagogique du **Chess Progress Project 2026** : une application web en français pour apprendre 16 courtes variantes d’échecs. Gratuite, sans compte, sans publicité, sans clé API et sans serveur applicatif. Tout fonctionne dans le navigateur, sur ordinateur, tablette et smartphone.

> Les coups de l’adversaire sont prédéfinis par les variantes pédagogiques. Stockfish est utilisé uniquement pour l’évaluation des positions.

## Ouvertures disponibles

Chaque ligne contient 12 à 14 demi-coups, soit 6 ou 7 décisions de l’élève.

| Ouverture  | Camp de l’élève | Variantes                                                                    |
| ---------- | --------------- | ---------------------------------------------------------------------------- |
| Italienne  | Blancs          | Giuoco Piano, Deux Cavaliers, Giuoco Pianissimo, Défense hongroise           |
| Écossaise  | Blancs          | Variante classique, Variante Schmidt, Gambit écossais, Variante Steinitz     |
| Française  | Noirs           | Variante d’avance, Variante d’échange, Variante Tarrasch, Variante classique |
| Scandinave | Noirs           | Ligne principale avec Da5, Dd6, retraite Dd8, variante moderne avec Cf6      |

Ces séquences sont des introductions à des variantes connues, pas des répertoires complets. Les noms et préfixes ont été recoupés avec le [répertoire d’ouvertures Lichess (CC0)](https://github.com/lichess-org/chess-openings). Chaque séquence est rejouée automatiquement depuis la position initiale avec chess.js. Les explications sont rédigées pour un débutant.

## Utiliser le trainer

1. Cliquer sur une ouverture, puis choisir une variante.
2. Cliquer sur **Commencer l’entraînement**.
3. Déplacer une pièce avec la souris, ou toucher sa case puis sa destination. Au clavier, utiliser les flèches puis Entrée ou Espace ; Échap annule la sélection.
4. Seul le coup prévu est accepté. Un autre coup est refusé et compte comme une erreur ; la position ne change pas.
5. Après chaque bon coup, lire l’explication. L’ordinateur joue sa réponse prévue après 600 ms.
6. **Aide** affiche une flèche et les cases de départ/d’arrivée. Réappuyer pendant le même coup ne compte pas une aide supplémentaire.
7. À la fin, consulter le bilan, rejouer ou changer de variante.

Ton camp est toujours en bas. Si tu joues les Noirs, l’ordinateur joue le premier coup blanc. La progression compte uniquement **tes** coups, pas ceux de l’adversaire. Le compteur principal indique les coups complétés ; « Coup 3 / 6 » désigne la prochaine décision attendue. Le dernier mouvement est surligné pour les deux camps.

**Recommencer** et **Rejouer la variante** réinitialisent la position, la progression, les erreurs, les aides, les sélections, les minuteries et le moteur d’analyse. Rien n’est enregistré : une actualisation revient à l’accueil.

## Stockfish

**Stockfish.js 18.0.8 Lite Single-Threaded**, exécuté dans un Web Worker/WASM. Les fichiers officiels `stockfish-18-lite-single.js` et `stockfish-18-lite-single.wasm` sont inclus dans `public/engine/`. Le WASM pèse environ 7,3 Mo et n’est chargé que lors d’un entraînement. Aucun appel à un service d’analyse ou CDN pendant l’utilisation.

- Analyse après chaque position : au maximum profondeur 12 ou 250 ms de recherche, table de hachage 16 Mo.
- Valeur positive : avantage Blancs ; négative : avantage Noirs. `M3` signifie un mat annoncé en 3 coups pour les Blancs ; `−M3` pour les Noirs.
- La barre est orientée comme le plateau, mais le signe numérique reste toujours celui des Blancs.
- Les recherches sont sérialisées et les scores des positions précédentes sont ignorés.
- Le message UCI `bestmove` sert seulement de signal de fin d’analyse : son coup n’est jamais lu par le trainer.
- Si le chargement, WebAssembly ou l’analyse échoue, **Analyse indisponible** apparaît ; l’exercice continue normalement. Recommencer relance le moteur.
- Aucune exigence SharedArrayBuffer, COOP/COEP ou serveur spécial : compatible avec GitHub Pages.

Voir [les instructions Stockfish](public/engine/README.md) et [les licences et crédits](THIRD_PARTY_NOTICES.md).

## Technologies et organisation

React 19, Vite 7, TypeScript, chess.js 1.4, react-chessboard 5.12, Lucide et Stockfish.js 18. Tests avec Vitest, Testing Library et jsdom. Police système, aucun service de polices distant. Pas de React Router, de backend, de base de données, de stockage cloud ou d’authentification.

```text
src/data/openings.ts        Ouvertures, variantes, coups et explications
src/trainer/model.ts        Validation et transitions de l’exercice
src/trainer/useTrainer.ts   Temporisation des réponses automatiques
src/engine/                 Intégration UCI, isolation et gestion des erreurs
src/components/             Accueil, plateau, évaluation et bilan
src/styles.css             Thème sombre et responsive
src/test/                  Tests des 16 lignes, du trainer, de l’UI et du moteur
public/engine/             Moteur, sources correspondantes et réseau NNUE
public/licenses/           Licences intégrales et attributions
scripts/                   Vérification des fichiers et archives de distribution
.github/workflows/         Tests, build et déploiement automatiques
```

## Lancer localement

Prérequis : **Node.js 24 LTS**, **pnpm 11.19.0**, et l’utilitaire `tar` (fourni avec macOS, Linux et les versions modernes de Windows). Si pnpm n’est pas installé : `npm install -g pnpm@11.19.0`.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Ouvrir l’adresse indiquée, habituellement **http://127.0.0.1:5173/chess-progress-trainer/**. Le serveur Vite sert uniquement au développement local, il n’est pas nécessaire pour l’hébergement public.

```sh
pnpm test           # Tous les tests
pnpm build          # TypeScript, intégrité Stockfish, sources GPL et build Vite
pnpm preview        # Tester le dossier dist, habituellement sur le port 4173
pnpm run licenses   # Régénérer les crédits après une mise à jour des dépendances
```

Ne pas ouvrir `dist/index.html` en double-cliquant : les Workers/WASM doivent être servis par HTTP(S). `pnpm preview` reproduit le préfixe GitHub Pages.

## Modifier les variantes

Tout est dans **`src/data/openings.ts`**. Chaque variante possède un identifiant unique, un nom français, une description, un code ECO et une liste `moves`. Chaque coup associe une notation `san` à une `explanation`. Les premiers coups communs sont regroupés au début du fichier.

Les coups de données sont en **SAN internationale** : `Nf3` pour Cf3, `Bc4` pour Fc4, `Qxd5` pour Dxd5, `O-O` pour le petit roque. L’interface traduit automatiquement les lettres en français. Conserver les indications d’échec et de désambiguïsation (`Bb4+`, `Nfd7`, etc.).

Après toute modification, lancer `pnpm test` puis `pnpm build`. Une variante illégale est explicitement signalée avec son nom et le demi-coup en cause, et empêche la validation. L’application possède aussi un écran d’erreur au lieu d’un écran vide.

## Déployer gratuitement sur GitHub Pages

Le dépôt doit s’appeler **chess-progress-trainer**. Pour un hébergement gratuit avec un compte GitHub Free, le dépôt doit être **public**. Le site ne demande aucun compte à ses visiteurs.

Le chemin `/chess-progress-trainer/` est déjà configuré dans `vite.config.ts`. Le moteur, les licences et les fichiers de l’application utilisent ce même préfixe. Une actualisation ne provoque pas de 404, car la navigation interne n’utilise pas d’URL supplémentaire.

### Activation, une seule fois

Lorsque les fichiers de ce projet sont présents dans la branche **main** sur GitHub :

1. Ouvrir le dépôt **chess-progress-trainer**.
2. Cliquer sur **Settings** (Paramètres).
3. Dans le menu de gauche, cliquer sur **Pages**.
4. Sous **Build and deployment → Source**, choisir **GitHub Actions**.
5. Cliquer sur l’onglet **Actions** du dépôt.
6. Choisir **Tester et déployer Chess Progress**, puis **Run workflow → Run workflow** pour lancer la première publication. Les prochains envois sur `main` déclenchent automatiquement le déploiement.
7. Attendre la coche verte. L’adresse est affichée dans **Settings → Pages**, ainsi que dans le résultat du workflow.

Adresse prévue pour le dépôt configuré : **https://mralexis901.github.io/chess-progress-trainer/**. Cette adresse ne fonctionne qu’après la première publication réussie.

Le workflow installe les dépendances depuis le fichier verrouillé, exécute les tests, vérifie les fichiers Stockfish, crée les archives source, construit le site, puis publie **uniquement `dist/`**. Une erreur de test ou de build bloque la publication. Il utilise les actions officielles `configure-pages`, `upload-pages-artifact` et `deploy-pages`. Aucun secret ou jeton personnel à saisir. Les pull requests lancent les tests et le build sans publier.

Si les fichiers ne sont pas encore sur GitHub, utiliser **GitHub Desktop** pour ajouter ce dossier, enregistrer les modifications et cliquer sur **Publish repository** ou **Push origin**. Ne pas envoyer `node_modules` ni `dist` ; ils sont déjà exclus. Le workflow publie lui-même le site construit.

Documentation officielle : [déploiement avec GitHub Actions](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Tests et compatibilité

Les tests rejouent intégralement les 16 lignes et vérifient les coups refusés, les réponses adverses, les deux orientations, la progression par décision, les erreurs, les aides, les réinitialisations, la fin de séance, les interactions clavier, la file d’analyse et les pannes du moteur. Les tests UI utilisent le vrai composant react-chessboard.

La compilation cible Chrome 107+, Firefox 104+ et Safari 16+. Le moteur amont vise les navigateurs modernes avec WebAssembly (notamment iOS 16+). La version de production est à vérifier sur HTTP(S), à l’URL avec son sous-répertoire. Si un appareil refuse le WASM, l’exercice reste accessible.

Le contrôle navigateur réalisé lors de la livraison et ses limites sont consignés dans `VALIDATION.md`. Une simulation de taille mobile ne remplace pas un test sur un appareil physique.

## Licence

Application sous **GPL-3.0-only** ; dépendances sous leurs licences respectives. Les textes et sources nécessaires accompagnent le site, via **Logiciels libres & crédits**. Lire `LICENSE`, `THIRD_PARTY_NOTICES.md` et `public/engine/README.md` avant de redistribuer une version modifiée.

**Chess Progress Project 2026 — Prototype pédagogique**
