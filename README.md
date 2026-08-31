# Chess Progress — Apprendre, jouer, progresser

**Entraîne-toi aux ouvertures, coup après coup.**

Prototype pédagogique du **Chess Progress Project 2026** : une application web en français pour apprendre **60 variantes d’échecs, chacune en deux niveaux**, soit 120 séquences, résoudre **20 tactiques issues de ces ouvertures**, et **jouer des parties complètes contre Stockfish avec un bilan après la partie**. Gratuite, sans compte, sans publicité, sans clé API et sans serveur applicatif. Tout fonctionne dans le navigateur, sur ordinateur, tablette et smartphone.

Dans le **mode Ouvertures**, le principe reste inchangé :

> Les coups de l’adversaire sont prédéfinis par les variantes pédagogiques. Stockfish est utilisé uniquement pour l’évaluation des positions.

Dans les **Tactiques**, les coups et réponses sont également scriptés : aucun moteur ne démarre pendant l’exercice. Stockfish sert à vérifier les solutions lors de la préparation des données. Dans le **mode Partie libre**, Stockfish choisit réellement ses coups. Ces trois usages sont séparés dans le code.

Évolution du 30 août 2026 : accueil à deux entrées, vues dédiées, thèmes clair et sombre, échiquiers agrandis et pièces vectorielles classiques. Le catalogue, les deux formats, la partie libre, les bilans et les règles pédagogiques sont conservés.

Mise à jour structurelle du 31 août 2026 : aide facultative **Indice | Solution** au-dessus du plateau, formats révélés dans la variante sélectionnée, et deux tactiques par ouverture. Les cartes d’accueil entièrement cliquables, les ajustements pour petits écrans, la direction artistique et les deux thèmes sont conservés.

## Navigation et apparence

- **Accueil** : choisir entre apprendre les ouvertures et jouer contre l’ordinateur.
- **Ouvertures** : parcourir les deux camps. Chaque ouverture propose **APPRENDRE** (variantes et formats) et **TACTIQUES** (exercices indépendants des variantes).
- **Partie libre** : choisir son camp et le niveau de Stockfish, jouer puis consulter le bilan.
- La navigation utilise les fragments `#/`, `#/ouvertures` et `#/partie`. Le retour du navigateur fonctionne et les liens sont actualisables sur GitHub Pages sans serveur de routage.
- Le bouton **Clair / Sombre** dans l’en-tête change le thème sans interrompre la séance. Le choix initial suit le système ; un choix manuel est mémorisé localement avec la clé `chess-progress:theme:v1`. Si le stockage est bloqué, le choix reste valable pendant la session. Aucun compte ni synchronisation distante.
- Les deux thèmes partagent les mêmes espacements, composants et pièces. Les animations respectent la préférence « réduire les animations » du système. Le plateau et les contrôles restent accessibles au clavier.

## Ouvertures disponibles

**Ligne essentielle** : 12 à 14 demi-coups pour reconnaître la variante. **Version étendue** : 20 à 29 demi-coups pour découvrir des plans et des idées de milieu de jeu. Un demi-coup est le mouvement d’un seul camp. La progression ne compte que les décisions de l’élève.

| Ouverture          | Camp   | Six variantes                                                                                                             |
| ------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------- |
| Italienne          | Blancs | Giuoco Piano ; Deux Cavaliers ; Giuoco Pianissimo ; Défense hongroise ; Gambit Evans ; Attaque avec Cg5                   |
| Écossaise          | Blancs | Classique ; Schmidt ; Gambit écossais ; Steinitz ; Mieses ; Gambit Göring                                                 |
| Partie viennoise   | Blancs | Max Lange ; Falkbeer ; Gambit viennois ; Stanley ; Paulsen ; Anderssen                                                    |
| Gambit Dame        | Blancs | Refusé ; Accepté ; Slave ; Semi-Slave ; Chigorin ; Contre-gambit Albin                                                    |
| Système de Londres | Blancs | Structure classique avec e6 ; Réaction à c5 ; Face à Ff5 ; Pression par Db6 ; Structure Est-Indienne ; Fianchetto avec d5 |
| Française          | Noirs  | Avance ; Échange ; Tarrasch ; Classique ; Winawer ; Rubinstein                                                            |
| Scandinave         | Noirs  | Da5 ; Dd6 ; Dd8 ; Moderne avec Cf6 ; Gambit portugais ; Gambit islandais                                                  |
| Caro-Kann          | Noirs  | Classique ; Avance ; Échange ; Panov ; Tartakower ; Deux Cavaliers                                                        |
| Sicilienne         | Noirs  | Ouverte ; Najdorf ; Dragon ; Dragon accéléré ; Alapine ; Fermée                                                           |
| Est-Indienne       | Noirs  | Classique ; Sämisch ; Fianchetto ; Quatre Pions ; Averbakh ; Petrosian                                                    |

Les 16 variantes d’origine sont conservées avec leurs noms, coups et explications. Les 60 lignes étendues reprennent exactement leur ligne essentielle puis ajoutent uniquement la continuation.

Les noms et positions caractéristiques ont été recoupés avec le [répertoire d’ouvertures Lichess (CC0)](https://github.com/lichess-org/chess-openings). Les 60 références sont conservées dans `src/test/fixtures/opening-references.json`, y compris les transpositions. Les continuations illustrent des plans cohérents ; elles ne sont pas des suites forcées de meilleurs coups ni un répertoire exhaustif. Certaines lignes viennoises transposent dans d’autres ouvertures ouvertes ; les lignes du Londres sont des réponses et structures typiques.

## Utiliser le trainer

1. Depuis l’accueil, cliquer sur **Explorer les ouvertures**. Choisir une ouverture dans « Jouer avec les Blancs » ou « Jouer avec les Noirs », puis l’une de ses six variantes.
2. Choisir **Ligne essentielle** ou **Version étendue** directement dans la carte sélectionnée, puis cliquer sur **Commencer l’entraînement**. Sur petit écran, la carte se remet légèrement en vue si nécessaire.
3. Observer la position sans assistance imposée. Le composant **Indice | Solution** reste disponible au-dessus du plateau. **Indice** affiche une piste générale, par exemple « Cherche à prendre davantage de contrôle au centre. » Il est facultatif, ne désigne pas le déplacement et ne compte jamais comme une aide utilisée.
4. Déplacer une pièce avec la souris, ou toucher sa case puis sa destination. Au clavier, utiliser les flèches puis Entrée ou Espace ; Échap annule la sélection.
5. **Solution** révèle la flèche et le déplacement exact du coup actuel, par exemple « Pion : e2 → e4 ». Cela compte **une seule aide par coup**, même après plusieurs clics. Indice, déplacement et flèche disparaissent après le coup ; le tour suivant commence à nouveau sans assistance visible.
6. Seul le coup prévu est accepté. Un autre coup est refusé et compte comme une erreur ; la position ne change pas. La destination tentée devient rouge avec une croix blanche pendant 1 seconde.
7. Après chaque bon coup, une coche verte apparaît sur la destination pendant 900 ms. Lire l’explication, puis regarder la réponse prédéfinie de l’ordinateur.
8. À la fin, consulter le bilan avec le mode joué, rejouer dans le même mode ou changer de variante.

Ton camp est toujours en bas. Si tu joues les Noirs, l’ordinateur joue le premier coup blanc après 600 ms. La progression compte uniquement **tes** coups, pas ceux de l’adversaire. Le compteur principal indique les coups complétés ; « Coup 3 / 6 » désigne la prochaine décision attendue. Le dernier mouvement est surligné pour les deux camps.

**Recommencer** et **Rejouer la variante** réinitialisent la position, la progression, les erreurs, les aides, les sélections, les badges, les minuteries et le moteur d’analyse. Le mode choisi est conservé. Les séances d’ouverture ne sont pas enregistrées : une actualisation revient au catalogue de la vue Ouvertures. Quitter cette vue termine la séance en cours.

## Interagir avec l’échiquier

Dans les ouvertures, les tactiques et la partie libre, **cliquer/toucher une pièce puis sa destination** et **glisser-déposer** fonctionnent sans réglage. Une autre pièce de ton camp peut être sélectionnée immédiatement. Les points indiquent les cases vides légales ; les anneaux indiquent les captures. Ces destinations sont calculées par chess.js, avec les échecs, clouages, roques, prises en passant et promotions.

**Légal ne signifie pas solution de l’exercice.** Tous les coups légaux de la pièce sont indiqués, mais seul le coup pédagogique prévu est accepté dans les ouvertures et tactiques. Indice reste facultatif et gratuit ; Solution révèle toujours sa flèche et compte une aide. En partie libre, tous les coups légaux sont autorisés.

Pendant le drag, les marqueurs restent visibles. À la souris, la pièce suit le curseur. Au toucher, après un seuil de 10 px, elle grandit à **125 %** et s’élève d’environ **40 px au-dessus du doigt** sur téléphone ; la case soulignée sous le contact reste la destination. Le snap/retour dure 140 ms ; les coups par clic et automatiques sont animés sur 170 ms. La préférence de réduction des animations est respectée. Les quatre promotions restent proposées dans une fenêtre accessible.

Sur téléphone, le plateau utilise la largeur disponible avec 8 px de marge de chaque côté : **374 px sur un écran de 390 px**. La barre d’évaluation du trainer passe sous le plateau. Les grands plateaux et panneaux latéraux desktop sont conservés. Seuls les gestes démarrés sur une pièce jouable réservent le déplacement à un doigt ; le défilement reste disponible sur les cases vides et hors plateau.

Les gestes sont centralisés dans `src/board/` ; les composants du trainer et de partie libre conservent la décision d’accepter un coup. Le [banc visuel local](qa/README.md) permet de reproduire les simulations tactiles et coups spéciaux sans être inclus dans le site publié.

## Tactiques d’ouverture

Chaque ouverture propose deux exercices, indépendants de ses six variantes. Ils commencent directement depuis une position réelle, avec le camp à jouer en bas : il peut s’agir de l’autre camp que celui travaillé dans le trainer théorique. Les exercices comprennent **1 à 3 décisions de l’élève** ; **19 sur 20 demandent plusieurs coups**. Les réponses adverses sont prédéfinies et l’aide ne révèle que le coup courant.

Un coup inattendu est refusé, avec le même feedback rouge et compteur d’erreurs. Un bon coup reçoit une coche verte avant la réponse automatique. La fiche **Tactique réussie** explique le motif, le gain et le principe à retenir ; elle propose Rejouer, Tactique suivante si disponible, et Retour à l’ouverture. Les séances tactiques ne sont pas sauvegardées.

Les positions proviennent de parties publiques et de puzzles **Lichess CC0**. Leur provenance complète, leur FEN et leur combinaison sont rejouées avec chess.js ; les solutions sont vérifiées séparément avec le Stockfish local. Ces positions illustrent des occasions possibles, pas des gains garantis dans toute partie. Certaines réponses illustrées ont des alternatives : seule la continuation pédagogique enregistrée est acceptée.

Voir le [catalogue des 20 tactiques, leurs sources et la méthode de validation](TACTICS.md).

## Jouer contre l’ordinateur

Depuis le bloc séparé de l’accueil, cliquer sur **Configurer une partie**, choisir Blancs, Noirs ou Aléatoire, puis l’un des trois niveaux. Le camp choisi est toujours en bas ; Stockfish commence si tu joues les Noirs. Tous les coups légaux sont autorisés, y compris le roque, la prise en passant et les quatre promotions.

La partie se termine par mat, pat, répétition, règle des 50 coups, matériel insuffisant ou abandon confirmé. Les nulles par répétition et 50 coups sont déclarées automatiquement dans ce prototype, sans procédure de réclamation. Il n’y a pas de chronomètre. L’historique affiche les coups en notation française.

Après la partie, **Analyser ma partie** lance le bilan. Il comprend les six catégories de coups, une précision estimée, la courbe d’évaluation interactive, la navigation dans les positions, un commentaire pour chacun de tes coups, le meilleur coup trouvé et une suite de six demi-coups au maximum. **Voir le meilleur coup** ramène le plateau à la position avant ton coup pour tracer une flèche légale.

La dernière partie **terminée**, puis son bilan, sont sauvegardés dans `localStorage` sur cet appareil uniquement. Après une actualisation, ouvrir **Configurer une partie**, puis **Retrouver la partie** ou **Revoir le bilan**. Rien n’est envoyé à un serveur. Le stockage privé/bloqué peut empêcher cette sauvegarde ; un message prévient alors de garder l’onglet ouvert. Une partie encore en cours n’est pas sauvegardée. Supprimer les données du site efface la sauvegarde.

### Niveaux et temps de calcul

| Usage                 | Skill Level | Profondeur maximale | Temps de recherche maximal par position |
| --------------------- | ----------: | ------------------: | --------------------------------------: |
| Débutant              |           0 |                   3 |                                  100 ms |
| Intermédiaire         |           7 |                   8 |                                  350 ms |
| Expert                |          20 |                  18 |                                1 200 ms |
| Bilan après la partie |          20 |                  14 |                                  350 ms |

Stockfish s’arrête dès qu’une des limites est atteinte ; le temps réel dépend du navigateur et de l’appareil. Une courte pause visuelle de 250 ms précède les réponses en partie. Le niveau Débutant utilise **Skill Level**, qui permet au moteur de choisir volontairement des coups sous-optimaux. Intermédiaire dispose de plus de calcul ; Expert supprime cette faiblesse volontaire. Aucun Elo n’est annoncé ni garanti : Débutant peut encore être difficile pour un novice. Le comportement de limitation est documenté dans la [FAQ officielle Stockfish](https://official-stockfish.github.io/docs/stockfish-wiki/Stockfish-FAQ.html) et confirmé dans les sources de la version embarquée.

### Méthode du bilan

`chess.js` reconstruit toute la partie. Stockfish analyse **séquentiellement** chaque position distincte dans la chronologie, avant/après les décisions de l’élève et après les réponses adverses pour la courbe. L’historique complet est transmis au moteur pour les répétitions. Les positions terminales sont évaluées exactement par les règles de chess.js. Aucune analyse de bilan n’est lancée pendant la partie.

Pour un score en centipions, la perte est `max(0, évaluation avant − évaluation après)`, depuis le camp du joueur. Le score « avant » correspond au meilleur jeu trouvé par le moteur. Au-delà de ±300 centipions, la fonction `signe(x) × (300 + 200 × ln(1 + (abs(x) − 300) / 200))` atténue les variations dans les positions très déséquilibrées ; en deçà, la valeur reste inchangée.

- **Meilleur coup** : coup identique à celui trouvé dans cette recherche limitée.
- Sinon, perte ajustée ≤15 : **Excellent** ; ≤60 : **Bon** ; ≤130 : **Imprécision** ; ≤300 : **Erreur** ; au-delà : **Gaffe**.
- Un nouveau mat forcé contre le joueur est une gaffe, ou une erreur si la position était déjà très perdante. La disparition d’un mat gagnant est pondérée selon l’avantage qui reste. Une position déjà condamnée n’est pas pénalisée à nouveau simplement parce que le mat se rapproche.
- **Précision estimée** : `100 × exp(−moyenne des pertes ajustées plafonnées à 600 / 160)`, arrondie. Aucun indice n’est donné si le joueur n’a joué aucun coup. C’est une convention pédagogique propre au projet, pas une précision officielle ni un classement.

Les commentaires sont générés **localement par des règles**, à partir du classement, du score et des faits vérifiables : pièce déplacée, développement, case centrale, capture, échec, mat, roque, promotion ou prise en passant. Une perte matérielle n’est mentionnée que si une courte suite légale la montre. Sinon, le texte reste prudent et indique le coup préféré de Stockfish. Il n’y a ni API d’IA, ni texte tactique inventé.

L’analyse courte peut manquer une tactique, modifier une évaluation d’une position à l’autre ou préférer un autre coup à plus grande profondeur. Les commentaires ne remplacent pas un professeur ; les variantes affichées ne sont pas des certitudes. La courbe borne les évaluations extrêmes et identifie les mats avec **M**. Tous ses scores sont du point de vue des Blancs.

Une seule recherche est active par Worker. Quitter l’analyse annule le travail et détruit le Worker ; les anciennes réponses sont ignorées. Une partie de 40 coups complets représente jusqu’à 81 positions, soit environ 28 secondes de budget de recherche, hors chargement et traitement. Le bilan peut prendre davantage de temps sur un téléphone lent.

## Stockfish

**Stockfish.js 18.0.8 Lite Single-Threaded**, exécuté dans un Web Worker/WASM. Les fichiers officiels `stockfish-18-lite-single.js` et `stockfish-18-lite-single.wasm` sont inclus dans `public/engine/`. Le WASM pèse environ 7,3 Mo et n’est chargé que lors d’un entraînement théorique, d’une partie ou d’un bilan non sauvegardé, jamais pour les tactiques. Les modes réutilisent ces mêmes fichiers ; aucune nouvelle dépendance moteur n’a été ajoutée. Aucun appel à un service d’analyse ou CDN pendant l’utilisation.

**Dans le trainer d’ouvertures** :

- Analyse après chaque position : au maximum profondeur 12 ou 250 ms de recherche, table de hachage 16 Mo.
- Valeur positive : avantage Blancs ; négative : avantage Noirs. `M3` signifie un mat annoncé en 3 coups pour les Blancs ; `−M3` pour les Noirs.
- La barre est orientée comme le plateau, mais le signe numérique reste toujours celui des Blancs.
- Les recherches sont sérialisées et les scores des positions précédentes sont ignorés.
- Le message UCI `bestmove` sert seulement de signal de fin d’analyse : son coup n’est jamais lu par le trainer.
- Si le chargement, WebAssembly ou l’analyse échoue, **Analyse indisponible** apparaît ; l’exercice continue normalement. Recommencer relance le moteur.
- Aucune exigence SharedArrayBuffer, COOP/COEP ou serveur spécial : compatible avec GitHub Pages.

**Dans la partie libre**, `src/computer/ComputerEngine.ts` interprète `bestmove`, vérifie sa légalité et gère les niveaux et la file de recherches. En cas d’échec, la partie se met en pause et propose **Relancer Stockfish**, sans inventer de coup de remplacement. Le bilan propose de réessayer ou de revenir au résultat. Le module d’ouvertures n’importe pas ce moteur de partie libre.

Voir [les instructions Stockfish](public/engine/README.md) et [les licences et crédits](THIRD_PARTY_NOTICES.md).

## Technologies et organisation

React 19, Vite 7, TypeScript, chess.js 1.4, react-chessboard 5.12, Lucide et Stockfish.js 18. Tests avec Vitest, Testing Library et jsdom. Police système, aucun service de polices distant. Pas de React Router, de backend, de base de données, de stockage cloud ou d’authentification.

```text
src/data/openings.ts        Catalogue, modes et 16 lignes historiques
src/data/repertoire.json    44 nouvelles lignes et 60 prolongements annotés
src/data/tactics.json       Tactiques, provenance, FEN, solutions et commentaires
src/tactics/                Compilation et écran des exercices tactiques, sans moteur
src/trainer/model.ts        Validation et transitions partagées des exercices scriptés
src/trainer/hints.ts        Indices généraux facultatifs et libellés précis des solutions
src/trainer/useTrainer.ts   Temporisation des réponses automatiques
src/board/                 Interaction partagée, marqueurs légaux, drag, animations, promotion
src/engine/                 Intégration UCI, isolation et gestion des erreurs
src/components/             Accueil, plateau, évaluation et bilan
src/computer/               Partie libre, moteur dédié, bilan, graphique et sauvegarde
src/ui/                    Thèmes, navigation et pièces SVG partagées
src/styles.css             Mise en page, composants et responsive
src/test/                  Tests des 120 lignes, des préfixes, du trainer, de l’UI et du moteur
public/engine/             Moteur, sources correspondantes et réseau NNUE
public/licenses/           Licences intégrales et attributions
public/pieces/             Pièces 2D cburnett, sources SVG et attribution
scripts/                   Vérification des fichiers et archives de distribution
scripts/validate-tactics.mjs Validation Stockfish séparée, hors ligne
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
pnpm validate:tactics # Recontrôler les 20 solutions avec le moteur local (plus lent)
pnpm run licenses   # Régénérer les crédits après une mise à jour des dépendances
```

Ne pas ouvrir `dist/index.html` en double-cliquant : les Workers/WASM doivent être servis par HTTP(S). `pnpm preview` reproduit le préfixe GitHub Pages.

### Tests et runners GitHub Actions

Les **715 tests existants sont conservés**, avec **55 nouveaux tests**, soit **770 tests**. Les nouveaux contrôles couvrent les gestes souris/tactiles, les destinations légales, les règles spéciales, les animations, les trois modes et la robustesse du stockage et des messages du moteur.

Dans `vite.config.ts`, le délai maximum par test est de **20 secondes en CI**, contre **5 secondes en local**. GitHub définit automatiquement `CI=true` : le workflow existant bénéficie donc du délai adapté aux runners partagés. Aucun test n’est désactivé et les échecs réels restent bloquants. Pour reproduire cette configuration localement : `CI=true pnpm test`. Ce réglage ne modifie pas les délais de l’application ni les recherches Stockfish.

## Modifier les variantes

Les données sont regroupées dans **`src/data/`** :

- **`openings.ts`** décrit les ouvertures, les modes et conserve les 16 lignes essentielles historiques.
- **`repertoire.json`** contient un objet par variante. Les 44 nouvelles variantes y possèdent `openingId`, `id`, `name`, `description`, `eco`, `moves` et `extension`. Pour les 16 historiques, seuls les identifiants et `extension` sont nécessaires.
- **`moves`** contient la ligne essentielle. **`extension` contient uniquement les coups supplémentaires**, sans répéter le début. Chaque coup associe `san` et `explanation`. Le premier coup de l’extension est celui du camp dont c’est le tour à la fin de la ligne essentielle.
- Le trainer assemble automatiquement `moves + extension` en version étendue. Chaque explication est affichée après le coup correspondant de l’élève.

Exemple d’un coup : `{ "san": "Nf3", "explanation": "Le cavalier contrôle le centre et prépare le roque." }`.

Les indices sont préparés localement dans `src/trainer/hints.ts`, à partir du coup légal reconstruit par chess.js : position, centre, développement, capture, échec, roque ou promotion. Ils ne s’affichent que sur demande et suggèrent une direction générale sans nommer le déplacement. Les règles restent prudentes et n’inventent pas une combinaison. Stockfish n’intervient pas dans les indices.

Un champ facultatif `hint` permet un indice spécifique, sans modifier l’explication affichée après le coup : `{ "san": "Nf3", "explanation": "Le cavalier contrôle le centre et prépare le roque.", "hint": "Pense à développer une pièce tout en renforçant ton contrôle du centre." }`. Ne pas y indiquer de case, de notation ou de pièce exacte. Dans les lignes historiques utilisant le helper `move`, cet indice peut être fourni comme troisième argument. Sans ce champ, aucune rédaction manuelle n’est nécessaire. Un indice personnalisé vide ou invalide est signalé lors de la compilation de la séance.

Les coups de données sont en **SAN internationale** : `Nf3` pour Cf3, `Bc4` pour Fc4, `Qxd5` pour Dxd5, `O-O` pour le petit roque. L’interface traduit automatiquement les lettres en français. Conserver les indications d’échec et de désambiguïsation (`Bb4+`, `Nfd7`, etc.).

Après toute modification, lancer `pnpm test` puis `pnpm build`. Une variante illégale est explicitement signalée avec son nom et le demi-coup en cause, et empêche la validation. L’application possède aussi un écran d’erreur au lieu d’un écran vide.

## Déployer gratuitement sur GitHub Pages

**Cette évolution est livrée pour essai local uniquement. Aucun envoi ni déploiement GitHub n’a été effectué.** Les instructions suivantes serviront lorsque tu décideras de publier.

Le dépôt doit s’appeler **chess-progress-trainer**. Pour un hébergement gratuit avec un compte GitHub Free, le dépôt doit être **public**. Le site ne demande aucun compte à ses visiteurs.

Le chemin `/chess-progress-trainer/` est déjà configuré dans `vite.config.ts`. Le moteur, les pièces, les licences et les fichiers de l’application utilisent ce même préfixe. Une actualisation ne provoque pas de 404 : les vues sont identifiées par un fragment après `#`, qui n’est pas envoyé au serveur.

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

Les **770 tests** incluent les **715 tests antérieurs**, **48 tests d’interaction et de règles du plateau** et **7 tests supplémentaires de robustesse/sécurité**. Les 120 lignes et leurs préfixes, les 16 variantes historiques, les règles d’échecs, les trois difficultés, le bilan, le graphique, le stockage, les thèmes et le clavier restent couverts. Les tests UI utilisent le vrai composant react-chessboard ; le processus Worker y est simulé. Le vrai moteur est aussi essayé dans le navigateur de production et par la validation tactique séparée.

La compilation cible Chrome 107+, Firefox 104+ et Safari 16+. Le moteur amont vise les navigateurs modernes avec WebAssembly (notamment iOS 16+). La version de production est à vérifier sur HTTP(S), à l’URL avec son sous-répertoire. Si un appareil refuse le WASM, l’exercice reste accessible.

Le catalogue utilise des aperçus statiques légers ; seule la séance sélectionnée est compilée avec chess.js. Le module Partie libre est chargé à la demande. Stockfish ne démarre ni sur l’accueil, ni sur l’écran de configuration, ni pendant les tactiques. Dans les parties et le trainer, il ne calcule que la position courante ; dans le bilan, il parcourt la partie une position à la fois. Les rapports de validation tactique restent dans les tests et ne sont pas chargés par le site.

Le contrôle navigateur réalisé lors de la livraison et ses limites sont consignés dans `VALIDATION.md`. Une simulation de taille mobile ne remplace pas un test sur un appareil physique.

## Sécurité et confidentialité

Le [rapport d’audit local](SECURITY.md) décrit les contrôles, corrections et limites. Aucun secret détecté dans le périmètre examiné ; `pnpm audit` ne signale aucune vulnérabilité connue à la date de validation. Le build ajoute une CSP compatible avec le Worker/WASM local et une politique `no-referrer`. Les types des sauvegardes et les messages du moteur sont validés ; les données invalides ne sont pas exécutées comme du HTML. Aucun tracking ni compte n’a été ajouté. Le JavaScript reste public, comme pour tout site statique.

## Licence

Application sous **GPL-3.0-only** ; dépendances sous leurs licences respectives. Les textes et sources nécessaires accompagnent le site, via **Logiciels libres & crédits**. Lire `LICENSE`, `THIRD_PARTY_NOTICES.md` et `public/engine/README.md` avant de redistribuer une version modifiée.

**Chess Progress Project 2026 — Prototype pédagogique**
