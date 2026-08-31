# Validation finale de la finition produit — 31 août 2026

- **1 269 / 1 269 tests, 27 fichiers, en local et en configuration CI.** Les 997 tests de la version précédente sont conservés/adaptés ; 272 cas supplémentaires contrôlent notamment le rendu enregistré, la protection matérielle, le Maximum, les parties longues et la provenance des mesures. Aucun test désactivé. Le replay des nouvelles parties évite seulement de reconstruire tout l’historique à chaque demi-coup, sans réduire les coups ou assertions vérifiés.
- **CI inchangée** : 5 secondes par test en local, 20 secondes en CI, deux workers. Les commandes `pnpm test` et `CI=true pnpm test` ont réellement terminé avec succès. Cela teste la configuration CI localement ; aucun workflow distant n’a été déclenché.
- **Build de production réussi** : TypeScript, ressources Stockfish locales vérifiées, archive source GPL, Vite, durcissement CSP et base `/chess-progress-trainer/`. Le mode de navigation par fragment est conservé.
- **Audit des dépendances : zéro vulnérabilité connue**, 219 dépendances au total (11 d’exécution, 208 de développement). Aucun ajout de dépendance ni changement du lockfile. Détection de secrets sans résultat positif dans les sources et les huit commits accessibles, 272 blobs historiques.
- **Calibration finale : 40 cas / 39 positions distinctes, 25 profils, 80 000 décisions échantillonnées et 180 parties longues**. 95 fins réglementaires, 85 arbitrages au plafond. Les 90 parties historiques restent aussi rejouées par les tests. Les essais intermédiaires sont archivés séparément ; les profils inchangés ne perdent aucune mesure.
- **Raccord retenu 15–16 : 61,1 % des points au 16 sur 18 parties**, contre un saut excessif à 97,2 % avec le réglage rejeté. CPL des niveaux 14–17 : 21,1 / 17,6 / 12,2 / 9,7. Toutes les inversions entre voisins restent visibles dans [DIFFICULTY.md](DIFFICULTY.md) et [le rapport généré](calibration/QUALITY.md).
- **Aucun commit, push ou déploiement.**

## Vérification dans le navigateur

Prévisualisation de production sous Chromium : accueil en clair/sombre à **320 × 568, 375 × 812, 390 × 844, 430 × 932, 820 × 1180 et 1440 × 1000**. Aucun débordement horizontal ou texte coupé sur les cartes contrôlées ; à 320 px, les deux cartes finissent à 559,5 px et restent dans le premier écran. Les flèches déclenchent la même navigation que les cartes. Le desktop conserve sa composition.

La finition tactile retient **142 %**, après comparaison à 135 % et 150 %, au lieu de 125 %. Décalage selon la case, environ **49 px à 390 px**, contre environ 40 px auparavant ; halo, origine, cible courante, points et anneaux conservés. Huit scénarios rejoués dans les deux thèmes : pion blanc/noir, capture noire, deux roques, prise en passant, sous-promotion en cavalier et refus pédagogique. Les autres promotions, annulations, gestes souris et commandes clavier restent couverts par les tests.

Partie libre contrôlée avec le Worker réel aux niveaux **1, 3, 8, 15, 16 et 25**, y compris les Noirs au premier coup. Le Maximum affiche « Stockfish non affaibli » ; un changement de thème a répondu en environ 268 ms pendant son démarrage/réflexion. Ce temps inclut l’automatisation et n’est pas un benchmark universel. La mémorisation du niveau a été vérifiée ; le sélecteur est remis sur 8 pour le prochain essai. La migration des anciennes difficultés est vérifiée par les tests automatisés.

Le bilan d’une partie de contrôle du niveau 8 a été généré : classification, commentaire prudent, meilleure variante, flèche sur la position d’origine, navigation et courbe disponibles sans débordement. Le bilan reste indépendant de l’affaiblissement du jeu. Ouverture italienne essentielle contrôlée : indice gratuit, solution comptée, mauvais coup refusé avec croix rouge, bon coup, explication et réponse scriptée. Française étendue contrôlée avec les Noirs en bas. Tactique française « Deux pièces alignées » terminée (2/2), avec son écran de réussite. Stockfish d’évaluation actif, aucune erreur ni alerte importante dans les consoles de production et du banc tactile.

Mesures détaillées : [qa/product-finish-validation.json](qa/product-finish-validation.json), avec empreinte des composants et passage final horodaté. Le banc tactile n’est pas une entrée du site publié.

## Limites explicites

- Les gestes tactiles sont simulés dans un navigateur de bureau. Défilement natif, zoom, interruption de geste et confort sous un vrai pouce restent à confirmer sur téléphone physique.
- Safari et Firefox sont ciblés par le build, mais n’ont pas été exécutés ici.
- Les Elo sont des estimations pédagogiques, sans certification humaine. Le hasard natif, le matériel et les petites séries expliquent une part de la variance. Les moyennes et taux du corpus ne sont pas des garanties pour toutes les parties.

---

# Historique des validations antérieures

## Mise à jour mobile Focus et difficulté 1–25

- **997 / 997 tests dans 22 fichiers** : les 770 cas précédents sont conservés/adaptés et 227 cas supplémentaires couvrent les profils, la migration, le protocole MultiPV, le feedback et les matchs enregistrés.
- **Local et CI réussis**. Timeout conservé : 5 secondes en local, **20 secondes en CI**. Deux fichiers de tests au maximum tournent simultanément pour éviter la contention CPU entre les rendus jsdom ; aucun test retiré, aucune assertion désactivée. Le premier essai sans cette limite avait dépassé les 5 secondes sur plusieurs tests UI.
- **Build de production réussi** : TypeScript, intégrité Stockfish, sources GPL, Vite, CSP et préfixe `/chess-progress-trainer/`.
- **Audit des dépendances : 0 vulnérabilité connue** ; aucune dépendance ajoutée. Détecteur de secrets sans résultat positif sur les sources et l’historique local accessible.
- **Calibration réelle terminée** : 90 matchs finaux, 16 positions, 24 320 choix et 5 632 tirages d’ouverture. 73,3 % des points aux niveaux supérieurs ; 88 matchs arbitrés, 2 fins réglementaires. Résultats, inversions, ajustements et limites dans [DIFFICULTY.md](DIFFICULTY.md).
- **Aucun commit, push ou déploiement.**

### Contrôles navigateur de cette mise à jour

Prévisualisation de production dans Chromium, thèmes clair/sombre, largeurs **320, 375, 390, 430, 820 et 1440 px**. Aucun débordement horizontal des composants principaux contrôlés. L’accueil mobile garde ses deux cartes côte à côte, entièrement visibles au premier écran (bas des cartes à 559,5 px pour un viewport de 320 × 568). Les deux flèches sont contenues dans leurs liens et déclenchent la bonne navigation.

| Largeur | Plateau mobile conservé | Position initiale du plateau Focus ouverture/tactique |            Partie libre |
| ------: | ----------------------: | ----------------------------------------------------: | ----------------------: |
|     320 |                  304 px |                               haut 201 px, bas 505 px | haut 174 px, bas 478 px |
|     375 |                  359 px |                                           haut 201 px |             haut 174 px |
|     390 |                  374 px |                                           haut 201 px |             haut 174 px |
|     430 |                  414 px |                                           haut 201 px |             haut 174 px |

Mesures initiales sans aide dépliée. L’indice/solution et un message peuvent prendre davantage de hauteur lorsqu’ils sont ouverts. Les détails restent après le plateau ; ils ne sont pas supprimés. Sur tablette/desktop, les plateaux et panneaux latéraux gardent leurs dimensions antérieures : ouverture 702/832 px, tactique 740/870 px et partie libre 740/830 px aux largeurs 820/1440.

- **Ouvertures** : Italienne essentielle avec Blancs et Française/Tarrasch étendue avec Noirs ; premier coup scripté, trois tentatives erronées, distinction illégal/légal hors ligne, invitation sans révélation, Indice gratuit, Solution/flèche comptée une seule fois, coup correct et réponse scriptée. Évaluation Stockfish active.
- **Tactiques** : position italienne avec Blancs et française avec Noirs ; plateau immédiat, aide, message spécifique et orientation. Les 20 exercices et leurs solutions restent intégralement testés.
- **Partie libre** : vrai premier coup Stockfish aux niveaux **1, 3, 6, 8, 12, 16, 20, 23, 24, 25**, avec Noirs en bas et retour du trait au joueur. Parties de contrôle terminées par abandon confirmé aux niveaux 8 et 25.
- **Bilan** : analyse locale complète après la partie, commentaire du coup e5, classification, courbe, précédent/suivant et flèche de meilleur coup. La recherche du bilan reste indépendante de l’affaiblissement du bot.
- **Stockage** : ancien bilan restauré avant les parties d’essai ; dernier niveau conservé après rechargement, dont 25 puis 8. Les cas corrompus et anciens noms sont aussi couverts automatiquement.
- **Interaction** : clic-clic et drag conservés, clavier et règles spéciales couverts par les tests existants. Aucune erreur importante de console provenant de l’application dans les parcours contrôlés.

Les mesures sont des simulations de dimensions dans Chromium, pas des essais sur des téléphones physiques. `svh` et les safe areas sont pris en compte ; Safari iOS, Chrome Android et leurs barres système doivent encore être essayés sur appareils réels. Les cibles Safari 16/Firefox du build sont conservées. Le benchmark ne certifie ni un Elo humain ni un ordre parfait entre tous les niveaux voisins.

Les sections suivantes documentent les versions antérieures.

## Mise à jour interaction et sécurité

- **770 / 770 tests**, dans 19 fichiers : les 715 tests existants sont conservés ; ajout de 32 tests d’interaction, 12 tests de règles/géométrie, 4 tests d’animation et 7 tests de robustesse/sécurité.
- **CI : 770 / 770**, exécutés avec `CI=true pnpm test` et le timeout existant de 20 secondes. Aucun test désactivé, aucun workflow distant déclenché.
- **Build de production réussi**, vérification TypeScript, intégrité et licences Stockfish, archive source, assets et CSP comprise. Aucun avertissement important.
- **Audit dépendances : aucune vulnérabilité connue**. Aucun secret détecté dans les fichiers texte audités et les six commits locaux accessibles (187 blobs texte historiques). Voir [le périmètre, les corrections et les limites de sécurité](SECURITY.md).
- **Aucun commit, push ou déploiement.**

### Mesures du plateau avant / après

Largeur extérieure mesurée dans le navigateur, en pixels ; aucune largeur de page supérieure au viewport. Ratio carré conservé.

| Viewport | Ouvertures avant | Ouvertures après | Tactiques / libre / bilan avant |    Après |
| -------: | ---------------: | ---------------: | ------------------------------: | -------: |
|      320 |              259 |              304 |                             288 |      304 |
|      375 |              314 |              359 |                             343 |      359 |
|      390 |              329 |              374 |                             358 |      374 |
|      430 |              369 |              414 |                             398 |      414 |
|      820 |              702 |              702 |                             740 |      740 |
|     1440 |              832 |              832 |        870 tactique / 830 libre | Inchangé |

Les mesures antérieures ont été prises sur le projet avant modification. Sur mobile, 8 px de marge de chaque côté et barre d’évaluation horizontale sous le trainer. Panneaux latéraux et tailles desktop conservés. Rectangles et `scrollWidth` contrôlés aux six tailles pour les écrans de jeu ; accueil vérifié en clair et sombre. Aucun débordement horizontal des composants principaux dans les parcours examinés.

### Interactions vérifiées dans le navigateur

- **Souris native** : sélection, changement de pièce, clic-clic et glisser-déposer. Italienne : e2-e3 légal mais refusé avec erreur, puis e2-e4 accepté ; réponse e7-e5 scriptée. Française/Tarrasch étendue : Noirs en bas, premier coup automatique, Indice gratuit, Solution e7-e6 comptée une fois, puis drag e7-e6 accepté.
- **Tactique italienne** : les huit destinations du cavalier sont indiquées, dont deux captures, tandis que la flèche Solution désigne seulement c7. Cxc7+ accepté, réponse scriptée, sélection et marqueurs remis à zéro.
- **Partie libre** : e4 contre le vrai Stockfish Débutant, réponse d5, anneau de capture d5, exd5 joué par drag natif. Depuis le build avec CSP, Stockfish répond à nouveau et le joueur récupère le trait. Difficultés et algorithmes de bilan inchangés.
- **Bilan existant** : sauvegarde restaurée sans l’écraser, navigation 5/5 → 4/5, commentaire de Cf6, suite conseillée, flèche du meilleur coup et graphique conservés.
- **Touch simulé** dans le [banc local](qa/README.md), avec le véritable composant partagé : pièce à 125 %, centre environ 40 px au-dessus du contact à 390 px, repères visibles durant le maintien, capture et orientation noire. Petit/grand roque, en passant, sous-promotion cavalier et refus pédagogique exécutés dans le navigateur. Les quatre promotions sont aussi testées en clic et drag automatiquement.
- Tests supplémentaires : pièce clouée, roi en échec, absence de roque à travers une attaque, promotion unique avec quatre choix, retour d’un drag invalide/hors plateau, capture du pointeur, absence de clic parasite, micro-mouvement tactile, annulations/blur/resize/démontage, positions obsolètes, gestes hors pièce jouable, clavier et réduction des animations.
- **Production `/chess-progress-trainer/`** : CSP présente, évaluation locale active (+0.3 observé), Worker/WASM, chargement du module Partie libre, styles, SVG et navigation fonctionnels. Aucun avertissement ou erreur important provenant du build dans les parcours contrôlés.

Les valeurs 140 ms (snap) et 170 ms (coups par clic/automatiques) n’ajoutent aucun délai à la logique d’échecs ; les délais pédagogiques restent inchangés. Les badges attendent la fin de la courte transition avant d’apparaître.

### Limites de la validation

Exécution réelle dans le navigateur Chromium intégré ; dimensions mobiles simulées. Les événements tactiles du banc sont synthétiques : ils permettent le contrôle visuel, **pas une certification de l’arbitrage natif du scroll de Safari iOS ou Chrome Android**. Le CSS réserve les gestes uniquement aux pièces jouables ; les cases vides et zones extérieures conservent `pan-y`/le défilement normal. Un essai sur téléphone physique reste recommandé, en particulier pour le zoom et les interruptions système. Safari/Firefox sont des cibles du build, pas des navigateurs exécutés durant cet audit. Un avertissement de rechargement React est apparu sur le banc de développement pendant son édition ; son nettoyage HMR a été corrigé et il ne concerne pas le build livré.

Les rapports précédents sont conservés ci-dessous comme historique des fonctionnalités et vérifications pédagogiques.

## Résultat de la version structurelle précédente

- **715 tests réussis / 715** dans quinze fichiers : les 637 tests précédents conservés et 78 contrôles supplémentaires pour les tactiques et la sélection des modes. Aucun test supprimé ni désactivé ; les assertions d’assistance ont été adaptées au comportement explicitement demandé (indice facultatif, Solution comptée).
- **Configuration CI : 715 / 715**, avec `CI=true pnpm test`. Timeout inchangé : 20 secondes en CI, 5 secondes en local. Aucun workflow distant déclenché.
- **120 / 120 séquences légales**, entièrement rejouées depuis la position initiale avec chess.js en SAN stricte : 60 essentielles et 60 étendues.
- Exactement **10 ouvertures, 5 par camp, 6 variantes chacune**.
- Les **16 variantes historiques** gardent leurs identifiants, noms, coups et explications.
- Les 60 prolongements reprennent exactement leur ligne essentielle. Longueurs : 12–14 demi-coups essentiels et 20–29 étendus.
- Les noms ont été recoupés avec **60 positions de référence Lichess CC0**, conservées dans les fixtures. Les transpositions sont comparées par position.
- **Build de production réussi**, TypeScript et intégrité Stockfish compris, sans avertissement de taille.
- **20 tactiques sur 20 validées** : provenance complète, identité d’ouverture, FEN, trait, solution et réponses légales. Vérification séparée des **68 positions** avec Stockfish 18 Lite ; 44 décisions de l’élève, toutes égales au meilleur coup trouvé. **19 exercices multi-coups**. Méthode, limites et sources dans [TACTICS.md](TACTICS.md).
- **Aucune publication GitHub**, conformément à la demande. Le workflow et le préfixe GitHub Pages restent en place.

## Tests automatiques

| Fichier                                 | Tests | Couverture                                                                                                                                                                                                                                |
| --------------------------------------- | ----: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/test/openings.test.ts`             |   259 | Catalogue 10 × 6, répartition 5/5, identifiants, 120 séquences légales, 60 préfixes exacts, 60 positions nommées, conservation des 16 historiques, données invalides et notation française                                                |
| `src/test/trainer.test.ts`              |   127 | Les 120 séances : orientation, réponses scriptées, progression, fin, reset ; coups interdits, erreurs, aides uniques, badges et minuteries périmées                                                                                       |
| `src/test/engine.test.ts`               |     7 | UCI, scores et mats, point de vue des Blancs, limites de recherche, dernières positions, pannes, délais et destruction                                                                                                                    |
| `src/test/app.test.tsx`                 |     9 | Sélection ouverture/variante/mode, absence de moteur sur l’accueil, vrai échiquier React, refus, couleurs et badges, délais 600/900/1000 ms, flèche, compteurs, clavier, deux modes jusqu’au bilan et reprise                             |
| `src/test/computer-game.test.ts`        |    13 | Camps, hasard, niveaux, coups illégaux, réponses périmées, mat, pat, répétition, 50 coups, matériel, abandon, roque, prise en passant et promotions                                                                                       |
| `src/test/computer-engine.test.ts`      |    13 | Options Skill Level, vrai usage de bestmove dans ce module, historique complet, scores, PV, sérialisation, barrières UCI, annulations, pannes et délais                                                                                   |
| `src/test/computer-review.test.ts`      |    20 | Catégories, scores vus des Noirs, mats et positions déséquilibrées, analyse séquentielle, progression, annulation, navigation, précision et commentaires prudents                                                                         |
| `src/test/computer-storage.test.ts`     |    13 | Dernière partie et bilan restaurés, stockage bloqué, données illégales ou corrompues, résultats incohérents, conservation de la partie si le bilan est endommagé                                                                          |
| `src/test/computer-ui.test.tsx`         |    13 | Vrai échiquier + protocole UCI simulé : accueil, camps/niveaux, réponse libre, mat, promotion, abandon confirmé, panne/reprise, bilan et sauvegarde, courbe, redimensionnement et annulation                                              |
| `src/test/appearance.test.tsx`          |    12 | Système clair/sombre, préférence mémorisée, stockage bloqué, changement entre onglets, navigation et liens directs, retour, lien clavier, séance conservée pendant le changement de thème, initialisation avant React et douze SVG locaux |
| `src/test/hints.test.ts`                |   144 | Indice gratuit à chaque décision des 120 séances, absence de coordonnées dans les indices automatiques, captures, quatre roques orientés, promotions, prise en passant, déplacements factuels, override et données invalides              |
| `src/test/guidance.test.tsx`            |     7 | Deux camps × deux formats sur le vrai échiquier : indice, erreur, révélation exacte et flèche unique, reset au coup suivant ; cartes-liens, clic surface/texte/flèche, focus et contrat d’activation clavier                              |
| `src/test/tactics.test.ts`              |    63 | Catalogue, provenance indépendante, identité des dix ouvertures, légalité, FEN, trait, empreintes des validations Stockfish, meilleures solutions, défenses, erreurs, compteurs, aides, fin et réinitialisation                           |
| `src/test/tactics-ui.test.tsx`          |    13 | Vrai échiquier : une tactique de chaque ouverture jusqu’à la fiche finale, combinaisons, mat en un, refus et feedback, assistance facultative, flèches, replay, suivant, retour, clavier, thèmes et absence de Worker                     |
| `src/test/variation-selection.test.tsx` |     2 | Modes dans la carte sélectionnée, remplacement de la précédente sélection, boutons/radios natifs, remise en vue conditionnelle et réduction des animations                                                                                |

Le nouveau test de graphique vérifie le changement de largeur, les libellés non étirés, la sélection conservée et le retrait de l’observateur à la fermeture.

Commandes : `pnpm test`, puis `pnpm check` pour le contrôle final avec build. Le test de panne force l’échec du Worker et vérifie que l’exercice reste utilisable.

L’optimisation précédente des aperçus statiques est conservée. Pour les runners GitHub partagés, `vite.config.ts` conserve **20 000 ms par test si `CI` est défini**, et **5 000 ms en local**. Aucun contournement des assertions ni nouvelle tentative automatique. La suite complète est également exécutée localement avec `CI=true pnpm test`. Aucun workflow distant n’a été déclenché.

## Nouvelle version structurelle : assistance facultative et tactiques

- Le composant segmenté **Indice | Solution** est partagé par les ouvertures et les tactiques. Aucun texte ni flèche n’apparaît au départ. Indice suggère une idée générale et ne compte aucune aide ; Solution révèle uniquement le coup courant et compte une aide par décision. Tout se cache après chaque coup. Un clic répété ne change pas les compteurs. Les explications après les bons coups d’ouverture restent intactes.
- Les deux formats apparaissent **dans la carte de la variante choisie**. À 320 px, après sélection de Deux Cavaliers, la carte a été remise en vue de 18 à 483 px de hauteur ; ses deux choix étaient entièrement visibles entre 129 et 362 px. Aucun panneau déporté en bas de liste. Le détail de l’ancienne variante se ferme lors du changement.
- **Italienne / Deux Cavaliers / essentielle** terminée dans le vrai navigateur : refus de d4 avec 1 erreur, indice gratuit, flèche e2 → e4, Solution répétée = 1 aide, réponses automatiques, roque, fin 6/6 et replay à zéro.
- **Française / Avance / étendue** terminée : Noirs en bas, premier coup blanc automatique, dix décisions jusqu’à 10/10, flèches correctement orientées et réinitialisation complète au replay. Stockfish affiche « Analyse locale active » depuis le build.
- **Douze tactiques réellement terminées**, couvrant les dix ouvertures : Fourchette avec échec et Deux menaces à la fois (Italienne), Déjouer la fourchette (Écossaise), Guider le roi vers le coin (Viennoise), Attirer le roi (Gambit Dame), Un défenseur immobilisé et Coordonner l’attaque (Londres), Punir la sortie de dame (Française), Retirer l’obstacle (Scandinave), Une ouverture de colonne calculée (Caro-Kann), Maintenir la pression (Sicilienne), Libérer une colonne (Est-Indienne).
- Ces essais couvrent un mat en un, plusieurs combinaisons de trois décisions, les deux orientations, l’aide actuelle seule, les explications finales, Rejouer et Tactique suivante. Retour à l’ouverture retrouve la bonne carte et lui rend le focus. Les tests UI rejouent en plus un mauvais coup et toute la combinaison pour chacune des dix ouvertures, sans aucune création de Worker.
- **Partie libre** : e4 joué contre le vrai Stockfish Débutant, réponse libre d5, retour « À toi de jouer ». Le bilan précédemment sauvegardé a été rouvert sans remplacer la sauvegarde : précision, graphique, commentaire de Cf6, suite conseillée et navigation précédent/suivant conservés. Aucun module de partie libre ou d’analyse modifié.
- Console de ces parcours sans avertissement ni erreur. Aucune requête d’analyse externe ni nouveau paquet npm. Les documents et licences accompagnent les nouvelles données. Le bundle d’échiquier est séparé du principal pour conserver un build sans avertissement, sans changer la limite d’avertissement.

### Responsive de cette version, dans le build de production

| Viewport | Accueil, catalogue et formats | Trainer clair/sombre | Tactiques clair/sombre | Partie libre et bilan | Plateau d’ouverture | Plateau tactique |
| -------- | ----------------------------- | -------------------- | ---------------------- | --------------------- | ------------------: | ---------------: |
| 320 px   | Sans débordement              | Sans débordement     | Sans débordement       | Sans débordement      |              259 px |           288 px |
| 375 px   | Sans débordement              | Sans débordement     | Sans débordement       | Sans débordement      |              314 px |           343 px |
| 390 px   | Sans débordement              | Sans débordement     | Sans débordement       | Sans débordement      |              329 px |           358 px |
| 430 px   | Sans débordement              | Sans débordement     | Sans débordement       | Sans débordement      |              369 px |           398 px |
| 820 px   | Sans débordement              | Sans débordement     | Sans débordement       | Sans débordement      |              702 px |           740 px |
| 1440 px  | Sans débordement              | Sans débordement     | Sans débordement       | Sans débordement      |              832 px |           870 px |

Hauteurs simulées : 844 px pour les cinq premiers formats, 1000 px sur desktop. Le bas du composant Indice | Solution se situe entre **329 et 340 px sur les quatre formats téléphone** au début d’une séance. Les fiches finales ont aussi été contrôlées aux quatre largeurs, sans débordement. Le panneau passe sous le plateau sur petit écran et reste latéral sur desktop.

Mesures avec `scripts/audit-responsive.js` : rectangles des composants, largeur de défilement, cartes, nouveaux modes, assistance et fiches tactiques. Captures réelles complémentaires en clair/sombre. Les simulations ne remplacent pas des appareils physiques. Chromium a été exécuté ; Safari/Firefox restent vérifiés par les cibles du build, pas par une nouvelle exécution. Les contrôles clavier reposent sur les éléments natifs, leurs rôles/focus et les tests de l’échiquier ; pas de clavier physique testé.

## Archive : précédente mise à jour débutants et petits écrans

Les points ci-dessous décrivent la version précédente. Son indice automatique et son libellé « Voir le coup » ont été remplacés par le système facultatif décrit ci-dessus ; les contrôles historiques restent documentés.

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
