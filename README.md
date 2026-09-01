# Chess Progress — Apprendre, jouer, progresser

**Entraîne-toi aux ouvertures, coup après coup.**

Prototype pédagogique du **Chess Progress Project 2026** : une application web en français pour apprendre **60 variantes d’échecs, chacune en deux niveaux**, soit 120 séquences, résoudre **20 tactiques issues de ces ouvertures**, et **jouer des parties complètes contre Stockfish avec un bilan après la partie**. Gratuite, sans compte, sans publicité, sans clé API et sans serveur applicatif. Tout fonctionne dans le navigateur, sur ordinateur, tablette et smartphone.

Dans le **mode Ouvertures**, le principe reste inchangé :

> Les coups de l’adversaire sont prédéfinis par les variantes pédagogiques. Stockfish est utilisé uniquement pour l’évaluation des positions.

Dans les **Tactiques**, les coups et réponses sont également scriptés : aucun moteur ne démarre pendant l’exercice. Stockfish sert à vérifier les solutions lors de la préparation des données. Dans le **mode Partie libre**, Stockfish choisit réellement ses coups. Ces trois usages sont séparés dans le code.

Évolution du 30 août 2026 : accueil à deux entrées, vues dédiées, thèmes clair et sombre, échiquiers agrandis et pièces vectorielles classiques. Le catalogue, les deux formats, la partie libre, les bilans et les règles pédagogiques sont conservés.

Mise à jour structurelle du 31 août 2026 : aide facultative **Indice | Solution** au-dessus du plateau, formats révélés dans la variante sélectionnée, et deux tactiques par ouverture. Les cartes d’accueil entièrement cliquables, les ajustements pour petits écrans, la direction artistique et les deux thèmes sont conservés.

Finition du 1er septembre 2026 : introduction propre à chaque ouverture, première découverte guidée, indices contextualisés, glossaire interactif et page **Progression** locale avec vingt badges. La Partie libre est plus compacte une fois lancée. Le nouveau monogramme géométrique, le grand halo tactile et les quatre accès de navigation sont intégrés aux deux thèmes.

## Mobile et mode Focus

Sur téléphone, un en-tête compact conserve les quatre accès et le thème. Les cartes **OUVERTURES / ENTRAÎNEMENT LIBRE** sont côte à côte et visibles dès l’accueil. Avant le plateau, une courte fiche présente l’ouverture, trois repères et le plan de la variante. Le trainer place ensuite tour/progression et **Indice | Solution** avant le grand plateau. Les détails, statistiques et boutons secondaires restent plus bas. Le plateau conserve 304/359/374/414 px aux largeurs 320/375/390/430. Les safe areas et la hauteur visible `svh` sont prises en compte.

Les feedbacks proches du plateau distinguent **déplacement illégal**, **coup légal hors ligne** et **coup légal qui ne résout pas la tactique**. Après trois erreurs sur la même décision, une invitation discrète attire une fois l’attention sur Indice. Lors d’une première découverte, une intention générale accompagne automatiquement les quatre premières décisions sans dévoiler de pièce, de case ou de notation et sans augmenter les compteurs. Une répétition redevient moins guidée. Le bon coup réinitialise l’aide du coup courant.

## Navigation et apparence

- **Accueil** : choisir entre apprendre les ouvertures et jouer contre l’ordinateur.
- **Ouvertures** : parcourir les deux camps. Chaque ouverture propose **APPRENDRE** (variantes et formats) et **TACTIQUES** (exercices indépendants des variantes).
- **Partie libre** : choisir son camp et le niveau de Stockfish, jouer puis consulter le bilan.
- **Progression** : consulter les accomplissements conservés uniquement sur cet appareil.
- La navigation utilise les fragments `#/`, `#/ouvertures`, `#/partie` et `#/progression`. Le retour du navigateur fonctionne et les liens sont actualisables sur GitHub Pages sans serveur de routage.
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
2. Choisir **Ligne essentielle** ou **Version étendue** directement dans la carte sélectionnée, puis cliquer sur **Commencer l’entraînement**. Lire la fiche « Comprendre cette ouverture », puis confirmer le démarrage. Sur petit écran, la carte se remet légèrement en vue si nécessaire.
3. Observer la position. Pendant la première découverte d’une séance, une intention générale accompagne les quatre premières décisions sans révéler la solution. Le composant **Indice | Solution** reste disponible au-dessus du plateau. **Indice** affiche une piste contextualisée, par exemple « Cherche à prendre davantage de contrôle au centre. » Il ne désigne jamais le déplacement et ne compte pas dans « Aides utilisées ».
4. Déplacer une pièce avec la souris, ou toucher sa case puis sa destination. Au clavier, utiliser les flèches puis Entrée ou Espace ; Échap annule la sélection.
5. **Solution** révèle la flèche et le déplacement exact du coup actuel, par exemple « Pion : e2 → e4 ». Cela compte **une seule aide par coup**, même après plusieurs clics. Indice, déplacement et flèche disparaissent après le coup ; la décision suivante reçoit sa nouvelle intention si la séance est encore dans sa phase de première découverte.
6. Seul le coup prévu est accepté. Un autre coup est refusé et compte comme une erreur ; la position ne change pas. La destination tentée devient rouge avec une croix blanche pendant 1 seconde.
7. Après chaque bon coup, une coche verte apparaît sur la destination pendant 900 ms. Lire l’explication, puis regarder la réponse prédéfinie de l’ordinateur.
8. À la fin, consulter le bilan avec le mode joué, rejouer dans le même mode ou changer de variante.

Ton camp est toujours en bas. Si tu joues les Noirs, l’ordinateur joue le premier coup blanc après 600 ms. La progression compte uniquement **tes** coups, pas ceux de l’adversaire. Le compteur principal indique les coups complétés ; « Coup 3 / 6 » désigne la prochaine décision attendue. Le dernier mouvement est surligné pour les deux camps.

**Recommencer** et **Rejouer la variante** réinitialisent la position, la progression de la séance, les erreurs, les aides, les sélections, les feedbacks, les minuteries et le moteur d’analyse. Le mode choisi est conservé. L’état exact d’une séance en cours n’est pas repris après une actualisation, mais ses accomplissements terminés sont enregistrés dans la progression locale.

## Interagir avec l’échiquier

Dans les ouvertures, les tactiques et la partie libre, **cliquer/toucher une pièce puis sa destination** et **glisser-déposer** fonctionnent sans réglage. Une autre pièce de ton camp peut être sélectionnée immédiatement. Les points indiquent les cases vides légales ; les anneaux indiquent les captures. Ces destinations sont calculées par chess.js, avec les échecs, clouages, roques, prises en passant et promotions.

**Légal ne signifie pas solution de l’exercice.** Tous les coups légaux de la pièce sont indiqués, mais seul le coup pédagogique prévu est accepté dans les ouvertures et tactiques. Indice reste facultatif et gratuit ; Solution révèle toujours sa flèche et compte une aide. En partie libre, tous les coups légaux sont autorisés.

Pendant le drag, les marqueurs restent visibles. À la souris, la pièce suit le curseur. Au toucher, après un seuil de 10 px, elle grandit à **142 %** et s’élève de **44 à 54 px au-dessus du doigt** aux largeurs mobiles testées. Un grand cercle sombre translucide, une case source persistante et une case cible mobile accompagnent le geste. La case sous le contact reste la destination, indépendamment de la pièce soulevée. Le snap/retour dure 140 ms ; les coups par clic et automatiques sont animés sur 170 ms. La préférence de réduction des animations est respectée. Les quatre promotions restent proposées dans une fenêtre accessible.

Sur téléphone, le plateau utilise la largeur disponible avec 8 px de marge de chaque côté : **374 px sur un écran de 390 px**. La barre d’évaluation du trainer passe sous le plateau. Les grands plateaux et panneaux latéraux desktop sont conservés. Seuls les gestes démarrés sur une pièce jouable réservent le déplacement à un doigt ; le défilement reste disponible sur les cases vides et hors plateau.

Les gestes sont centralisés dans `src/board/` ; les composants du trainer et de partie libre conservent la décision d’accepter un coup. Le [banc visuel local](qa/README.md) permet de reproduire les simulations tactiles et coups spéciaux sans être inclus dans le site publié.

Les termes importants comme **Roque**, **Promotion**, **Prise en passant**, **Clouage**, **Fianchetto**, **Gaffe** et **Précision estimée** utilisent une infobulle commune. Elle s’ouvre au survol ou au focus, peut être épinglée au clic/tap, se ferme avec Échap ou un clic extérieur et se repositionne pour rester dans le viewport.

## Progression locale et badges

La page **Progression** présente vingt accomplissements avec leur avance `X / Y`, leur date de déblocage et une notification non répétée. Les données sont versionnées, validées et conservées dans `localStorage` avec la clé `chess-progress:progress:v1`. Un stockage absent, interdit, ancien ou corrompu revient à une structure sûre. Il n’existe aucun compte, serveur ou transfert entre appareils.

Les quinze badges visibles récompensent une première variante, les dix ouvertures découvertes, une ligne sans Solution, une essentielle sans erreur, les six variantes d’une ouverture, une répétition sans erreur, cinq lignes sans erreur, cinq puis vingt tactiques, une première Partie libre, un premier Game Review et les caps des niveaux 6, 8, 12 et 16.

Les cinq badges secrets gardent leur nom masqué jusqu’au déblocage :

- **Sous-promotion** : le joueur promeut réellement son pion en tour, fou ou cavalier pendant une Partie libre.
- **Perfectionniste** : une Version étendue est terminée sans erreur, sans Indice demandé et sans Solution.
- **Retour gagnant** : le joueur gagne, puis le Game Review confirme qu’il a été mené d’au moins trois pions ou sous un mat forcé.
- **David contre Goliath** : après une première victoire enregistrée, le joueur bat un niveau supérieur d’au moins quatre rangs à son précédent meilleur résultat.
- **Défier l’impossible** : le joueur bat le Niveau 25 Maximum.

Un badge n’est calculé qu’après l’événement réel correspondant : fin de séance, tactique résolue, partie terminée ou analyse achevée. Plusieurs badges gagnés ensemble sont annoncés l’un après l’autre ; un badge acquis n’est jamais annoncé une seconde fois.

## Tactiques d’ouverture

Chaque ouverture propose deux exercices, indépendants de ses six variantes. Ils commencent directement depuis une position réelle, avec le camp à jouer en bas : il peut s’agir de l’autre camp que celui travaillé dans le trainer théorique. Les exercices comprennent **1 à 3 décisions de l’élève** ; **19 sur 20 demandent plusieurs coups**. Les réponses adverses sont prédéfinies et l’aide ne révèle que le coup courant.

Un coup inattendu est refusé, avec le même feedback rouge et compteur d’erreurs. Un bon coup reçoit une coche verte avant la réponse automatique. La fiche **Tactique réussie** explique le motif, le gain et le principe à retenir ; elle propose Rejouer, Tactique suivante si disponible, et Retour à l’ouverture. L’état intermédiaire n’est pas sauvegardé, mais la réussite alimente la progression locale.

Les positions proviennent de parties publiques et de puzzles **Lichess CC0**. Leur provenance complète, leur FEN et leur combinaison sont rejouées avec chess.js ; les solutions sont vérifiées séparément avec le Stockfish local. Ces positions illustrent des occasions possibles, pas des gains garantis dans toute partie. Certaines réponses illustrées ont des alternatives : seule la continuation pédagogique enregistrée est acceptée.

Voir le [catalogue des 20 tactiques, leurs sources et la méthode de validation](TACTICS.md).

## Jouer contre l’ordinateur

Depuis **ENTRAÎNEMENT LIBRE**, choisir Blancs, Noirs ou Aléatoire, puis une force de **1 à 25**. Le camp choisi est toujours en bas ; Stockfish commence si tu joues les Noirs. Tous les coups légaux sont autorisés, y compris le roque, la prise en passant et les quatre promotions.

La partie se termine par mat, pat, répétition, règle des 50 coups, matériel insuffisant ou abandon confirmé. Les nulles par répétition et 50 coups sont déclarées automatiquement dans ce prototype, sans procédure de réclamation. Il n’y a pas de chronomètre. L’historique affiche les coups en notation française.

Après la partie, **Analyser ma partie** lance le bilan. Il comprend les six catégories de coups, une précision estimée, la courbe d’évaluation interactive, la navigation dans les positions, un commentaire pour chacun de tes coups, le meilleur coup trouvé et une suite de six demi-coups au maximum. **Voir le meilleur coup** ramène le plateau à la position avant ton coup pour tracer une flèche légale.

La dernière partie **terminée**, puis son bilan, sont sauvegardés dans `localStorage` sur cet appareil uniquement. Après une actualisation, ouvrir **Configurer une partie**, puis **Retrouver la partie** ou **Revoir le bilan**. Rien n’est envoyé à un serveur. Le stockage privé/bloqué peut empêcher cette sauvegarde ; un message prévient alors de garder l’onglet ouvert. Une partie encore en cours n’est pas sauvegardée. Supprimer les données du site efface la sauvegarde.

### Niveaux et temps de calcul

Pour les niveaux 1–24, la force est affichée comme **Niveau X · catégorie · ≈ Elo**, avec la mention « Force estimée — peut différer d’un classement humain réel ». Le Maximum n’affiche aucun Elo humain. Les huit raccourcis placent le curseur sur 3, 8, 14, 18, 20, 22, 24 ou 25. Le dernier choix est mémorisé ; une valeur invalide revient au niveau 6. Les anciens bilans restent lisibles grâce à une migration des trois noms historiques.

Les niveaux 1–15 choisissent parmi 12 coups réellement évalués, selon six budgets de gravité et une protection contre les pertes immédiates de pièces. Les niveaux 16–24 utilisent la limitation native calibrée de Stockfish. Le niveau 25, « Maximum — Stockfish non affaibli », joue toujours le meilleur coup trouvé, sans Elo imposé : jusqu’à 4,5 secondes, profondeur 26 ou 1,8 million de nœuds. Un délai visuel de 250 ms précède la réflexion. Le **bilan reste fort**, indépendamment du niveau joué : Skill 20, profondeur 14 ou 350 ms. Voir [DIFFICULTY.md](DIFFICULTY.md) pour les 25 profils, leurs limites et la calibration réelle.

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
src/components/             Accueil, introductions, glossaire, plateau, évaluation et bilan
src/progress/               Progression locale, migrations, badges et notifications
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
pnpm validate:difficulty # Calibration réelle des 25 niveaux (plus long)
pnpm validate:tactics # Recontrôler les 20 solutions avec le moteur local (plus lent)
pnpm run licenses   # Régénérer les crédits après une mise à jour des dépendances
```

Ne pas ouvrir `dist/index.html` en double-cliquant : les Workers/WASM doivent être servis par HTTP(S). `pnpm preview` reproduit le préfixe GitHub Pages.

### Tests et runners GitHub Actions

Les tests historiques sont conservés et adaptés. La suite compte désormais **1 293 tests dans 31 fichiers**. Les nouveaux contrôles couvrent notamment les introductions, les 120 séances, la diversité des intentions, les infobulles, les migrations, les badges visibles/secrets, la Partie libre épurée, le logo et les mesures de rendu. Les cartes mobiles, le drag tactile, les 25 niveaux, la protection matérielle et la calibration enregistrée restent couverts. Aucun test n’est supprimé ou désactivé. Les résultats sont consignés dans [VALIDATION.md](VALIDATION.md).

Dans `vite.config.ts`, le délai maximum par test est de **20 secondes en CI**, contre **5 secondes en local**. GitHub définit automatiquement `CI=true` : le workflow existant bénéficie donc du délai adapté aux runners partagés. Aucun test n’est désactivé et les échecs réels restent bloquants. Pour reproduire cette configuration localement : `CI=true pnpm test`. Ce réglage ne modifie pas les délais de l’application ni les recherches Stockfish. La concurrence est limitée à deux processus pour éviter que les rendus du plateau ne se disputent le CPU. `pnpm test` utilise directement cette limite, sans augmenter les 5 secondes locales.

## Modifier les variantes

Les données sont regroupées dans **`src/data/`** :

- **`openings.ts`** décrit les ouvertures, les modes et conserve les 16 lignes essentielles historiques.
- **`repertoire.json`** contient un objet par variante. Les 44 nouvelles variantes y possèdent `openingId`, `id`, `name`, `description`, `eco`, `moves` et `extension`. Pour les 16 historiques, seuls les identifiants et `extension` sont nécessaires.
- **`moves`** contient la ligne essentielle. **`extension` contient uniquement les coups supplémentaires**, sans répéter le début. Chaque coup associe `san` et `explanation`. Le premier coup de l’extension est celui du camp dont c’est le tour à la fin de la ligne essentielle.
- Le trainer assemble automatiquement `moves + extension` en version étendue. Chaque explication est affichée après le coup correspondant de l’élève.

Exemple d’un coup : `{ "san": "Nf3", "explanation": "Le cavalier contrôle le centre et prépare le roque." }`.

Les indices sont préparés localement dans `src/trainer/hints.ts`, à partir du coup légal reconstruit par chess.js et de son explication : centre, développement, sécurité, tempo, pression, échange, structure ou activité. Ils apparaissent automatiquement sous forme d’intention pendant la première découverte, puis uniquement sur demande. Ils suggèrent une direction générale sans nommer la pièce, la case ou le déplacement. Les règles restent prudentes et n’inventent pas une combinaison. Stockfish n’intervient pas dans les indices.

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

La suite complète préserve les 120 lignes et leurs préfixes, les 16 variantes historiques, les 20 tactiques, les règles d’échecs, le bilan, le graphique, le stockage, les thèmes et le clavier. Elle couvre aussi les 25 niveaux et la calibration enregistrée. Les tests UI utilisent les vrais composants de plateau avec Worker simulé ; le vrai moteur est également exécuté dans le navigateur de production et dans les bancs de calibration/tactiques séparés. Les mesures de rendu réelles sont conservées avec l’empreinte des composants contrôlés.

La compilation cible Chrome 107+, Firefox 104+ et Safari 16+. Le moteur amont vise les navigateurs modernes avec WebAssembly (notamment iOS 16+). La version de production est à vérifier sur HTTP(S), à l’URL avec son sous-répertoire. Si un appareil refuse le WASM, l’exercice reste accessible.

Le catalogue utilise des aperçus statiques légers ; seule la séance sélectionnée est compilée avec chess.js. Le module Partie libre est chargé à la demande. Stockfish ne démarre ni sur l’accueil, ni sur l’écran de configuration, ni pendant les tactiques. Dans les parties et le trainer, il ne calcule que la position courante ; dans le bilan, il parcourt la partie une position à la fois. Les rapports de validation tactique restent dans les tests et ne sont pas chargés par le site.

Le contrôle navigateur réalisé lors de la livraison et ses limites sont consignés dans `VALIDATION.md`. Une simulation de taille mobile ne remplace pas un test sur un appareil physique.

## Sécurité et confidentialité

Le [rapport d’audit local](SECURITY.md) décrit les contrôles, corrections et limites. Aucun secret détecté dans le périmètre examiné ; `pnpm audit` ne signale aucune vulnérabilité connue à la date de validation. Le build ajoute une CSP compatible avec le Worker/WASM local et une politique `no-referrer`. Les types des sauvegardes et les messages du moteur sont validés ; les données invalides ne sont pas exécutées comme du HTML. Aucun tracking ni compte n’a été ajouté. Le JavaScript reste public, comme pour tout site statique.

## Licence

Application sous **GPL-3.0-only** ; dépendances sous leurs licences respectives. Les textes et sources nécessaires accompagnent le site, via **Logiciels libres & crédits**. Lire `LICENSE`, `THIRD_PARTY_NOTICES.md` et `public/engine/README.md` avant de redistribuer une version modifiée.

**Chess Progress Project 2026 — Prototype pédagogique**
