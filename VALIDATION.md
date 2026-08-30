# Contrôle de l’évolution locale — 30 août 2026

## Résultat

- **473 tests réussis / 473** dans neuf fichiers : les 402 historiques inchangés et 71 nouveaux.
- **120 / 120 séquences légales**, entièrement rejouées depuis la position initiale avec chess.js en SAN stricte : 60 essentielles et 60 étendues.
- Exactement **10 ouvertures, 5 par camp, 6 variantes chacune**.
- Les **16 variantes historiques** gardent leurs identifiants, noms, coups et explications.
- Les 60 prolongements reprennent exactement leur ligne essentielle. Longueurs : 12–14 demi-coups essentiels et 20–29 étendus.
- Les noms ont été recoupés avec **60 positions de référence Lichess CC0**, conservées dans les fixtures. Les transpositions sont comparées par position.
- **Build de production réussi**, TypeScript et intégrité Stockfish compris, sans avertissement de taille.
- **Aucune publication GitHub**, conformément à la demande. Le workflow et le préfixe GitHub Pages restent en place.

## Tests automatiques

| Fichier                             | Tests | Couverture                                                                                                                                                                                                    |
| ----------------------------------- | ----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/test/openings.test.ts`         |   259 | Catalogue 10 × 6, répartition 5/5, identifiants, 120 séquences légales, 60 préfixes exacts, 60 positions nommées, conservation des 16 historiques, données invalides et notation française                    |
| `src/test/trainer.test.ts`          |   127 | Les 120 séances : orientation, réponses scriptées, progression, fin, reset ; coups interdits, erreurs, aides uniques, badges et minuteries périmées                                                           |
| `src/test/engine.test.ts`           |     7 | UCI, scores et mats, point de vue des Blancs, limites de recherche, dernières positions, pannes, délais et destruction                                                                                        |
| `src/test/app.test.tsx`             |     9 | Sélection ouverture/variante/mode, absence de moteur sur l’accueil, vrai échiquier React, refus, couleurs et badges, délais 600/900/1000 ms, flèche, compteurs, clavier, deux modes jusqu’au bilan et reprise |
| `src/test/computer-game.test.ts`    |    13 | Camps, hasard, niveaux, coups illégaux, réponses périmées, mat, pat, répétition, 50 coups, matériel, abandon, roque, prise en passant et promotions                                                           |
| `src/test/computer-engine.test.ts`  |    13 | Options Skill Level, vrai usage de bestmove dans ce module, historique complet, scores, PV, sérialisation, barrières UCI, annulations, pannes et délais                                                       |
| `src/test/computer-review.test.ts`  |    20 | Catégories, scores vus des Noirs, mats et positions déséquilibrées, analyse séquentielle, progression, annulation, navigation, précision et commentaires prudents                                             |
| `src/test/computer-storage.test.ts` |    13 | Dernière partie et bilan restaurés, stockage bloqué, données illégales ou corrompues, résultats incohérents, conservation de la partie si le bilan est endommagé                                              |
| `src/test/computer-ui.test.tsx`     |    12 | Vrai échiquier + protocole UCI simulé : accueil, camps/niveaux, réponse libre, mat, promotion, abandon confirmé, panne/reprise, bilan et sauvegarde, courbe et annulation                                     |

Commandes : `pnpm test`, puis `pnpm check` pour le contrôle final avec build. Le test de panne force l’échec du Worker et vérifie que l’exercice reste utilisable.

Le premier passage a détecté des dépassements de durée des tests UI, dus aux dix aperçus interactifs de l’accueil. Ils ont été remplacés par des aperçus statiques utilisant les mêmes pièces SVG, sans contrôleurs de glisser-déposer. Les délais maximaux de tests n’ont pas été augmentés ; les tests passent après cette amélioration.

## Parcours dans un vrai navigateur

Chromium intégré, en développement puis depuis **le build `dist/`**, servi à `http://127.0.0.1:4173/chess-progress-trainer/`.

### Nouvelle partie libre et bilan

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
- Bundle principal : environ **463 ko de JavaScript (124 ko gzip)** et **24 ko de CSS (6 ko gzip)**. Le nouveau module chargé à la demande ajoute environ **38 ko de JavaScript (14 ko gzip)** et **11 ko de CSS (3 ko gzip)**. Aucun nouveau moteur ou paquet npm n’a été ajouté. Les archives de sources ne sont pas téléchargées pour jouer.
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
