# Contrôle de l’évolution locale — 31 août 2026

## Résultat

- **637 tests réussis / 637** dans douze fichiers : les 486 tests existants conservés et 151 contrôles supplémentaires pour les indices et les cartes accessibles. Aucun test supprimé ni désactivé ; seuls les libellés et rôles des contrôles modifiés ont été adaptés dans les anciens parcours.
- **Configuration CI : 637 / 637**, avec `CI=true pnpm test`. Timeout inchangé : 20 secondes en CI, 5 secondes en local. Aucun workflow distant déclenché.
- **120 / 120 séquences légales**, entièrement rejouées depuis la position initiale avec chess.js en SAN stricte : 60 essentielles et 60 étendues.
- Exactement **10 ouvertures, 5 par camp, 6 variantes chacune**.
- Les **16 variantes historiques** gardent leurs identifiants, noms, coups et explications.
- Les 60 prolongements reprennent exactement leur ligne essentielle. Longueurs : 12–14 demi-coups essentiels et 20–29 étendus.
- Les noms ont été recoupés avec **60 positions de référence Lichess CC0**, conservées dans les fixtures. Les transpositions sont comparées par position.
- **Build de production réussi**, TypeScript et intégrité Stockfish compris, sans avertissement de taille.
- **Aucune publication GitHub**, conformément à la demande. Le workflow et le préfixe GitHub Pages restent en place.

## Tests automatiques

| Fichier                             | Tests | Couverture                                                                                                                                                                                                                                |
| ----------------------------------- | ----: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/test/openings.test.ts`         |   259 | Catalogue 10 × 6, répartition 5/5, identifiants, 120 séquences légales, 60 préfixes exacts, 60 positions nommées, conservation des 16 historiques, données invalides et notation française                                                |
| `src/test/trainer.test.ts`          |   127 | Les 120 séances : orientation, réponses scriptées, progression, fin, reset ; coups interdits, erreurs, aides uniques, badges et minuteries périmées                                                                                       |
| `src/test/engine.test.ts`           |     7 | UCI, scores et mats, point de vue des Blancs, limites de recherche, dernières positions, pannes, délais et destruction                                                                                                                    |
| `src/test/app.test.tsx`             |     9 | Sélection ouverture/variante/mode, absence de moteur sur l’accueil, vrai échiquier React, refus, couleurs et badges, délais 600/900/1000 ms, flèche, compteurs, clavier, deux modes jusqu’au bilan et reprise                             |
| `src/test/computer-game.test.ts`    |    13 | Camps, hasard, niveaux, coups illégaux, réponses périmées, mat, pat, répétition, 50 coups, matériel, abandon, roque, prise en passant et promotions                                                                                       |
| `src/test/computer-engine.test.ts`  |    13 | Options Skill Level, vrai usage de bestmove dans ce module, historique complet, scores, PV, sérialisation, barrières UCI, annulations, pannes et délais                                                                                   |
| `src/test/computer-review.test.ts`  |    20 | Catégories, scores vus des Noirs, mats et positions déséquilibrées, analyse séquentielle, progression, annulation, navigation, précision et commentaires prudents                                                                         |
| `src/test/computer-storage.test.ts` |    13 | Dernière partie et bilan restaurés, stockage bloqué, données illégales ou corrompues, résultats incohérents, conservation de la partie si le bilan est endommagé                                                                          |
| `src/test/computer-ui.test.tsx`     |    13 | Vrai échiquier + protocole UCI simulé : accueil, camps/niveaux, réponse libre, mat, promotion, abandon confirmé, panne/reprise, bilan et sauvegarde, courbe, redimensionnement et annulation                                              |
| `src/test/appearance.test.tsx`      |    12 | Système clair/sombre, préférence mémorisée, stockage bloqué, changement entre onglets, navigation et liens directs, retour, lien clavier, séance conservée pendant le changement de thème, initialisation avant React et douze SVG locaux |
| `src/test/hints.test.ts`            |   144 | Indice gratuit à chaque décision des 120 séances, absence de coordonnées dans les indices automatiques, captures, quatre roques orientés, promotions, prise en passant, déplacements factuels, override et données invalides              |
| `src/test/guidance.test.tsx`        |     7 | Deux camps × deux formats sur le vrai échiquier : indice, erreur, révélation exacte et flèche unique, reset au coup suivant ; cartes-liens, clic surface/texte/flèche, focus et contrat d’activation clavier                              |

Le nouveau test de graphique vérifie le changement de largeur, les libellés non étirés, la sélection conservée et le retrait de l’observateur à la fermeture.

Commandes : `pnpm test`, puis `pnpm check` pour le contrôle final avec build. Le test de panne force l’échec du Worker et vérifie que l’exercice reste utilisable.

L’optimisation précédente des aperçus statiques est conservée. Pour les runners GitHub partagés, `vite.config.ts` conserve **20 000 ms par test si `CI` est défini**, et **5 000 ms en local**. Aucun contournement des assertions ni nouvelle tentative automatique. La suite complète est également exécutée localement avec `CI=true pnpm test`. Aucun workflow distant n’a été déclenché.

## Mise à jour ciblée : débutants et petits écrans

- L’indice apparaît avant chaque coup de l’élève, sans action ni incrément de compteur. Il décrit des faits issus du coup légal de chess.js et reste distinct de l’explication pédagogique conservée après le coup. Aucun changement de ligne ou de décision du moteur.
- « Voir le coup » est placé sous le titre, avant le plateau. Deux clics pendant le même tour donnent une seule aide, le nom de la pièce, les coordonnées et la flèche existante. Après le bon coup, la flèche et les coordonnées disparaissent ; l’indice suivant arrive après la réponse scriptée.
- Italienne / Giuoco Piano / essentielle : indice du pion devant le roi, révélation e2 → e4, deux clics = 1 aide, d2 → d4 refusé avec croix rouge, e2 → e4 validé avec coche verte, e5 automatique, puis indice du cavalier et révélation g1 → f3. Recommencer remet les compteurs à zéro.
- Française / Avance / étendue : Noirs en bas, pas d’indice pendant le premier coup blanc automatique ; indice du pion devant le roi, flèche e7 → e6, deux clics = 1 aide ; e6 accepté, d4 automatique puis indice du pion devant la dame. Le changement de thème conserve l’exercice.
- Parties libres : e4 joué contre le vrai Stockfish Débutant, réponse e5 et retour « À toi de jouer ». Dernier bilan sauvegardé restauré sans nouveau calcul ; navigation précédent, commentaire, résumé, graphique et orientation conservés. Aucune modification des fichiers de la partie libre.
- Accueil : titres **OUVERTURES** et **ENTRAÎNEMENT LIBRE**, carte entière et flèche dans un seul lien natif, sans bouton imbriqué. Les deux flèches ont déclenché leur navigation dans le navigateur. Le focus, le rôle lien, les destinations et l’activation par clic clavier sont testés automatiquement. La simulation navigateur des touches natives Tab/Entrée ne déplaçait pas le focus dans cet environnement ; elle n’est pas présentée comme une validation clavier physique.
- Seule la signature « L’art de progresser » reste en italique ; les autres titres sont droits. Bordures fines et atténuées, espacements et tailles de cartes adaptés au téléphone. Les décorations de l’accueil sont dimensionnées sans débordement ; aucun masquage global du débordement n’a été ajouté.
- Stockfish affiche « Analyse locale active » depuis le build. Console de ces parcours sans avertissement ni erreur. Thèmes clair/sombre contrôlés et préférence toujours mémorisée.

### Mesures dans Chromium, depuis le build final

| Largeur du viewport | Accueil clair/sombre | Catalogue et sélection | Trainer clair/sombre | Partie libre : réglages et bilan | Largeur du plateau d’ouverture |
| ------------------- | -------------------- | ---------------------- | -------------------- | -------------------------------- | -----------------------------: |
| 320 px              | Sans débordement     | Sans débordement       | Sans débordement     | Sans débordement                 |                         259 px |
| 375 px              | Sans débordement     | Sans débordement       | Sans débordement     | Sans débordement                 |                         314 px |
| 390 px              | Sans débordement     | Sans débordement       | Sans débordement     | Sans débordement                 |                         329 px |
| 430 px              | Sans débordement     | Sans débordement       | Sans débordement     | Sans débordement                 |                         369 px |
| 820 px              | Sans débordement     | Sans débordement       | Sans débordement     | Sans débordement                 |                         702 px |
| 1366 px             | Sans débordement     | Sans débordement       | Sans débordement     | Sans débordement                 |                         742 px |

Contrôle des rectangles visibles, `scrollWidth`/`clientWidth`, du viewport et de la largeur du plateau avec `scripts/audit-responsive.js`, complété par des captures réelles. Ce fichier contient une fonction de lecture du DOM à exécuter dans un navigateur disposant d’un moteur de rendu, pas dans jsdom. Pour reproduire : afficher chaque vue à chacune des six largeurs, appeler la fonction, puis vérifier `issues.length === 0` ; tout résultat non vide est un échec. Les redimensionnements sont attendus jusqu’à ce que `innerWidth` corresponde à la largeur demandée. Les contrôles de mise en page sont complémentaires aux 637 tests unitaires/UI, qui ne prétendent pas mesurer le rendu dans jsdom.

Sur mobile, le bas du bouton « Voir le coup » se situe environ entre 382 et 439 px depuis le haut de page selon le texte révélé. Il est donc accessible dès le premier écran dans les hauteurs 780/844 px utilisées. Les plateaux conservent leurs grandes dimensions ; à 1366 px, le panneau reste à droite. Les contrôles de largeur ont aussi été exécutés à 900 px de hauteur. Pas de téléphone physique ni de nouvelle exécution dans Safari/Firefox : ces limites restent celles précisées plus bas.

## Contrôle conservé de la refonte UX/UI du 30 août

- Trois vues distinctes : Accueil, Ouvertures, Partie libre. Navigation par fragments `#/`, `#/ouvertures`, `#/partie`, compatible avec une actualisation sous le préfixe GitHub Pages. Retour du navigateur contrôlé.
- Thèmes clair et sombre vérifiés dans le build : le choix survit à l’actualisation. Basculer pendant une séance conserve la position, les erreurs, les aides et le format.
- Palette crème/pierre/vert en clair, verts profonds en sombre. Tous les composants, sélecteurs, modales, bilans et la page de licences suivent la palette. Transitions discrètes et préférence de réduction des animations respectée.
- Douze pièces classiques **cburnett** en SVG local, attribution Colin M. L. Burnett et GPLv3 fournie, sources vectorielles incluses dans l’archive distribuée. Toutes les images de pièces se chargent correctement sous `/chess-progress-trainer/pieces/`.
- À **1366 × 900**, plateau d’ouverture de **742 px** avec panneau latéral de 340 px. La taille s’adapte à la largeur et à la hauteur de l’écran. À 820 px, le plateau d’analyse atteint **740 px** et le panneau passe dessous. À 390 px : plateau d’ouverture **329 px**, plateau de partie/bilan **358 px**.
- Largeurs **320, 390, 820, 1366 et 1440 px** contrôlées, sans débordement horizontal du contenu. Aucun téléphone physique utilisé.
- Italienne / Giuoco Piano essentielle : refus de d2–d4, compteur d’erreurs, flèche e2–e4, badge vert et réponse scriptée e7–e5. Française / Avance étendue sur mobile : Noirs en bas, e4 automatique ; d7–d5 refusé avec croix en d5, e7–e6 accepté avec coche en e6, réponse d4. Réinitialisation des compteurs et du mode contrôlée.
- Parcours final de l’Italienne essentielle jusqu’au bilan **7/7**, avec sept aides et zéro erreur. Glisser-déposer réel de c2 vers c3 avec les nouveaux SVG ; modale de fin et bouton Rejouer contrôlés, compteurs remis à zéro.
- Vraie partie libre **Débutant, Noirs** : `1. e4 e5 2. d4 Cf6 3. Cf3`, choix de l’ordinateur effectué par Stockfish. Abandon confirmé, analyse séquentielle terminée, bilan de deux décisions sauvegardé puis restauré. e5 est classé Meilleur coup ; Cf6 Imprécision avec suggestion exd4 et suite proposée. Aucun changement des règles de classification.
- Bilan dans les deux thèmes : précédent/suivant, flèche sur la position avant le coup et sélection par clic réel dans la courbe contrôlés. Le graphique ajuste son repère à la largeur de l’écran afin de ne plus comprimer ou étirer ses libellés ; les valeurs extrêmes restent bornées.
- Stockfish affiche « Analyse locale active » dans le trainer et répond effectivement dans le mode libre. Les modules moteur, les règles d’échecs, les données d’ouverture et les calculs de bilan n’ont pas été modifiés.
- Console du build sans erreur ni avertissement durant ces parcours. Le build et le formatage passent sans avertissement. Les validations historiques ci-dessous restent documentées séparément.

## Parcours dans un vrai navigateur

Chromium intégré, en développement puis depuis **le build `dist/`**, servi à `http://127.0.0.1:4173/chess-progress-trainer/`.

### Parcours historiques conservés : partie libre et bilan

- **Débutant, Blancs** : tentative e2–e5 refusée, pion conservé en e2 et badge rouge ; partie `1. e4 e6 2. Cf3 d5 3. exd5 c6`, choisie librement par le vrai Stockfish. Abandon annulé une première fois, puis confirmé. Bilan de trois décisions, terminé sans erreur moteur.
- **Intermédiaire, Noirs** : premier coup blanc automatique, Noirs en bas ; partie `1. Cf3 c5 2. Cc3 e6 3. e4`. Abandon et bilan des deux décisions des Noirs. Signes des évaluations et commentaires contrôlés.
- **Expert, Blancs** : vraie partie terminée par mat après `1. f3 e5 2. g4 Dh4#`. Résultat « Défaite — Échec et mat », plateau bloqué. Bilan : f3 est une imprécision, g4 une gaffe, score après g4 `−M1`, commentaire prudent sur le mat forcé et proposition Cc3. Le graphique représente le mat sans déformer l’échelle.
- Navigation précédent/suivant/début ; sélection dans l’historique ; badge vert pour les bons coups, rouge pour g4. Flèche de d2 vers d4 sur la **position avant Cf3**, suite proposée de six demi-coups en français.
- Rechargement de la page après le premier bilan : accès **Configurer une partie → Revoir le bilan**, avec la partie, les commentaires et le même résumé restaurés sans nouveau calcul.
- Formats téléphone **390 × 844** et tablette **820 × 1180** : partie avec les Noirs, commandes, bilan et graphique accessibles, aucun élément du contenu ne déborde horizontalement. Une seule instance du plateau et du panneau de bilan dans le DOM.
- Petit écran **320 × 780** : bilan sans débordement, échiquier de 288 px, commandes précédent/suivant utilisables. Un clic réel dans la courbe sélectionne la position correspondante ; les coordonnées et les bornes sont également vérifiées dans le test du graphique.
- Console de production : aucun avertissement ni erreur pendant ces parcours. Le test unitaire de protocole couvre en plus le `stop`, l’ignorance des réponses tardives et les annulations à chaque phase ; le test UI vérifie la destruction du Worker à la sortie du bilan.
- Le **trainer d’ouvertures a été recontrôlé après l’ajout** : Italienne/Giuoco Piano essentielle jusqu’au bilan 7/7 avec aide, refus de d4, badges rouge/vert, réponses prévues et barre active. Française/Avance étendue : Noirs en bas, e4 automatique, flèche e7–e6 et coup e6 accepté.

### Contrôles conservés de l’évolution du catalogue

- Accueil : deux sections de cinq cartes, six variantes par carte, deux niveaux explicites. Le bouton Commencer reste désactivé tant qu’aucun niveau n’est sélectionné.
- Italienne étendue sur ordinateur : mauvaise tentative d2–d4 refusée, pion conservé en d2, case d4 rouge et croix ; e2–e4 accepté, case verte et coche avant la réponse e7–e5. Stockfish actif.
- **Londres / Fianchetto avec d5 / Version étendue** : parcours complet 12/12 jusqu’au bilan, 0 erreur, 12 aides ; les roques et les échanges sont joués réellement sur l’échiquier.
- **Est-Indienne / Petrosian / Version étendue** sur smartphone simulé : Noirs en bas, premier coup d4 automatique ; d7–d5 refusé avec badge en d5, g8–f6 accepté avec badge en f6. Parcours complet 14/14, bilan avec 1 erreur et 13 aides.
- Rejouer l’Est-Indienne : progression 0/14, erreurs 0, aides 0, même mode conservé.
- **Viennoise / Gambit viennois / Ligne essentielle** : mauvais glisser-déposer d2–d4 refusé avec retour en d2 et croix rouge ; glisser-déposer e2–e4 accepté ; parcours jusqu’au bilan 6/6, 1 erreur et 5 aides.
- **Sicilienne / Dragon / Ligne essentielle** sur tablette simulée : premier coup e4 automatique, moteur actif, parcours complet 6/6, 0 erreur et 6 aides.
- Mode essentiel et mode étendu également parcourus jusqu’au bilan dans les tests UI de la Caro-Kann ; l’Italienne essentielle conserve son parcours de non-régression.
- Console sans avertissement ni erreur pendant les contrôles de production.

## Moteur et fichiers de production

- **Stockfish 18 Lite fonctionne toujours** depuis le build : état « Analyse locale active », évaluation numérique puis nouvelles valeurs après les coups.
- JavaScript et WASM servis localement sous `/chess-progress-trainer/engine/` ; WASM HTTP 200, type `application/wasm`, **7 295 411 octets**.
- Vérification des empreintes du moteur, des sources amont, du réseau NNUE et des licences à chaque build.
- Sources de cette version régénérées dans `source/chess-progress-source.tar.gz`, liées depuis la page de licences.
- Le trainer ne reçoit aucun coup de Stockfish. Les messages `bestmove` terminent seulement l’analyse ; leur contenu n’est pas interprété.
- L’analyse précédente est arrêtée et ses scores tardifs ignorés. Aucune analyse du catalogue au démarrage.
- Bundle principal après refonte : environ **470 ko de JavaScript (126 ko gzip)** et **29 ko de CSS (7 ko gzip)**. Le module Partie libre chargé à la demande ajoute environ **39 ko de JavaScript (14 ko gzip)** et **14 ko de CSS (3 ko gzip)**. Aucun nouveau moteur ou paquet npm n’a été ajouté. Les archives de sources ne sont pas téléchargées pour jouer.
- Partie libre : Skill 0/7/20, limites respectives profondeur 3/8/18 et 100/350/1 200 ms. Bilan : Skill 20, profondeur 14 ou 350 ms par position, Worker unique, Hash 16 Mo. Les fichiers Stockfish locaux sont réutilisés.

## Responsive et limites

Largeurs contrôlées : **320, 390, 768 et 1280 px**. Aucun débordement horizontal. Panneau sous le plateau sur mobile/tablette, à droite sur ordinateur. Sélecteur de niveau et bilan utilisables à 390 × 844. Les badges sont placés dans la case elle-même : aucune conversion fragile des coordonnées lorsque le plateau est retourné.

Chrome/Chromium a été exécuté réellement. Les cibles Firefox 104+ et Safari 16+ sont vérifiées par le build et les API employées, **pas par une exécution dans ces navigateurs**. Aucun téléphone physique n’a été utilisé. Les tailles mobiles sont simulées ; le déplacement en deux touches et le glisser-déposer de la bibliothèque sont conservés.

Les prolongements sont des scénarios pédagogiques cohérents, pas une promesse de meilleurs coups forcés ni une validation par un professeur d’échecs. Ils expliquent notamment les ruptures, les colonnes ouvertes, les trajets de cavaliers et les échanges de structure.

Le bilan de partie libre repose sur des recherches courtes, une classification propre au projet et des commentaires à règles locales. Il n’offre pas la profondeur d’un service d’analyse prolongée ni des explications humaines exhaustives. La précision n’est pas une métrique officielle Chess.com. Les niveaux ne garantissent aucun Elo ; même Débutant peut être difficile pour un novice. La sauvegarde concerne uniquement la dernière partie terminée et dépend de l’autorisation de stockage du navigateur.

## Livraison locale

- Version de développement : `http://127.0.0.1:5173/chess-progress-trainer/`.
- Version de production locale : `http://127.0.0.1:4173/chess-progress-trainer/`.
- Pas de push, pas de déploiement, pas de modification des paramètres GitHub.
- Les licences et le workflow Pages sont conservés. Aucune action GitHub n’est nécessaire pour essayer cette évolution en local.
