# Les 25 niveaux de Chess Progress

Les Elo affichés restent des **repères pédagogiques de force estimée**, pas des classements humains certifiés. Les mesures ci-dessous comparent aussi la qualité absolue des décisions à une analyse forte ; elles ne démontrent pas qu’un joueur FIDE, Chess.com ou Lichess donné aura un taux de victoire précis. Le niveau 25 n’a plus d’Elo humain affiché.

Le corpus comporte 40 cas, représentant **39 positions distinctes** : le mat en deux apparaît aussi dans l’exercice Gambit Dame du catalogue. Cette répétition historique reste dans les mesures avant/après pour conserver le même corpus ; elle ne constitue pas une observation indépendante supplémentaire.

Le [rapport chiffré de la politique livrée](calibration/QUALITY.md) rassemble les résultats des 25 niveaux, les motifs tactiques, les phases de partie du niveau 8 et les matchs, avec liens vers toutes les données brutes. Il est régénéré par la fusion des mesures ; aucun chiffre n’est saisi à la main dans ses tableaux.

## Pourquoi l’ancien niveau 8 donnait des pièces

L’ancienne politique tirait une « erreur » dans 55 % des décisions, avec une perte cible de 140 centipions et une queue de distribution autorisant des pertes bien plus importantes. Les habitudes d’ouverture réduisaient ce taux au début, puis cette protection disparaissait. La pondération protégeait surtout la dame, sans contrôler les autres pièces gratuitement capturables. Une hiérarchie favorable dans les matchs entre bots masquait ce défaut de qualité absolue.

La mesure avant modification, conservée dans `calibration/quality-before.json`, utilise les mêmes 40 positions que la nouvelle suite : niveau 8, perte moyenne de **181,6 cp**, **25,2 %** de gaffes (≥200 cp), **8,7 %** de matériel offert selon le détecteur. Dans les quatre positions post-ouverture, le matériel offert atteint **21,5 %**. Ce dernier chiffre décrit cet échantillon, pas toutes les parties possibles.

## Nouvelle politique

- **1–5** : alternance de coups raisonnables, imprécisions et fautes. Les pertes importantes restent possibles, sans choisir des coups légaux au hasard en dehors des candidats évalués.
- **6–11** : erreurs encore présentes, principalement petites ou moyennes. Les oublis immédiats de pièces deviennent rares. Les principes d’ouverture s’atténuent progressivement du quatrième au seizième coup, sans changement brutal après le développement.
- **12–15** : prolongement graduel de la politique personnalisée ; forte diminution des fautes grossières. Cela évite un saut prématuré vers la limitation native.
- **16–24** : `UCI_LimitStrength` et cibles natives mesurées. Les valeurs UCI techniques ne sont pas les Elo humains affichés. Le raccord a été réglé entre un premier essai trop faible et un second trop fort, puis les niveaux 17–18 prolongent cette transition.
- **25** : aucune sélection probabiliste, aucune erreur injectée, aucune limite Elo, Skill 20, MultiPV 1. Le meilleur coup réellement trouvé est joué directement. Limites : **4 500 ms, profondeur 26, 1 800 000 nœuds**. Ce n’est pas une promesse de puissance identique à un moteur de serveur ou à un ordinateur plus rapide.

### Six budgets de gravité

Pour les niveaux 1–15, Stockfish analyse jusqu’à **12 candidats**. Leur écart au meilleur score, du point de vue du camp au trait, détermine six tranches : ≤20, ≤60, ≤130, ≤250, ≤500 et >500 centipions. Le tirage choisit d’abord une tranche ; **si elle est vide, il revient vers une tranche meilleure**, jamais vers une faute plus grave. Le rang MultiPV seul ne détermine pas la qualité.

Le niveau 8 utilise les probabilités 26 / 35 / 26 / 11,5 / 1,3 / 0,2 %. Ce sont des budgets, pas les fréquences finales observées : une position peut ne proposer aucun candidat d’une tranche, et la sécurité matérielle peut l’écarter. Tous les budgets cumulés de faute et taux d’oubli diminuent entre niveaux voisins.

Le contrôle `materialExposure` examine les captures adverses légales après chaque candidat. Il prend en compte le matériel déjà gagné et une recapture possible sur la case d’arrivée. Une perte supplémentaire d’au moins deux pions est normalement écartée ; l’oubli reste possible selon un taux décroissant (0,8 % au niveau 8, avant le tirage de gravité), divisé par cinq pour une dame. Un sacrifice presque équivalent selon le moteur n’est pas interdit. Il s’agit d’un signal conservateur sur une réponse, pas d’une preuve tactique exhaustive : clouages, compensations à long terme et échanges complexes restent du ressort de l’évaluation.

Les coups de développement, centraux et le roque ont une préférence légère. Les sorties précoces de dame/tour, pions de bord et allers-retours sont freinés, sans bibliothèque d’ouverture imposée. La variété vient du choix entre candidats plausibles ; les hauts niveaux utilisent la variété native de Stockfish.

## Profils réellement utilisés

Stockfish.js 18.0.8 Lite Single-Threaded local, inchangé. Toutes les recherches utilisent Skill 20 et Hash 16 Mo. La **première limite atteinte** (temps, profondeur ou nœuds) termine la recherche. Le délai visuel de 250 ms précède la réflexion. Le Worker conserve une interface disponible.

| Niveau | Force estimée | Politique / cible technique | Profondeur max. | Temps max. | Nœuds max. | MultiPV |
| -----: | ------------: | --------------------------- | --------------: | ---------: | ---------: | ------: |
|      1 |         ≈ 250 | Budgets de gravité          |              10 |     370 ms |      36000 |      12 |
|      2 |         ≈ 400 | Budgets de gravité          |              10 |     390 ms |      42000 |      12 |
|      3 |         ≈ 550 | Budgets de gravité          |              10 |     410 ms |      48000 |      12 |
|      4 |         ≈ 700 | Budgets de gravité          |              10 |     430 ms |      54000 |      12 |
|      5 |         ≈ 850 | Budgets de gravité          |              10 |     450 ms |      60000 |      12 |
|      6 |        ≈ 1000 | Budgets de gravité          |              10 |     470 ms |      66000 |      12 |
|      7 |        ≈ 1100 | Budgets de gravité          |              10 |     490 ms |      72000 |      12 |
|      8 |        ≈ 1200 | Budgets de gravité          |              10 |     510 ms |      78000 |      12 |
|      9 |        ≈ 1300 | Budgets de gravité          |              10 |     530 ms |      84000 |      12 |
|     10 |        ≈ 1400 | Budgets de gravité          |              10 |     550 ms |      90000 |      12 |
|     11 |        ≈ 1500 | Budgets de gravité          |              10 |     570 ms |      96000 |      12 |
|     12 |        ≈ 1600 | Budgets de gravité          |              10 |     590 ms |     102000 |      12 |
|     13 |        ≈ 1700 | Budgets de gravité          |              10 |     610 ms |     108000 |      12 |
|     14 |        ≈ 1800 | Budgets de gravité          |              10 |     630 ms |     114000 |      12 |
|     15 |        ≈ 1900 | Budgets de gravité          |              10 |     650 ms |     120000 |      12 |
|     16 |        ≈ 2000 | UCI 2750                    |              15 |     770 ms |     130000 |       1 |
|     17 |        ≈ 2100 | UCI 2820                    |              15 |     840 ms |     148000 |       1 |
|     18 |        ≈ 2200 | UCI 2920                    |              16 |     910 ms |     166000 |       1 |
|     19 |        ≈ 2300 | UCI 3020                    |              16 |     980 ms |     184000 |       1 |
|     20 |        ≈ 2400 | UCI 3060                    |              17 |    1050 ms |     202000 |       1 |
|     21 |        ≈ 2500 | UCI 3095                    |              17 |    1120 ms |     220000 |       1 |
|     22 |        ≈ 2600 | UCI 3130                    |              18 |    1190 ms |     238000 |       1 |
|     23 |        ≈ 2700 | UCI 3160                    |              18 |    1260 ms |     256000 |       1 |
|     24 |        ≈ 2900 | UCI 3190                    |              19 |    1330 ms |     274000 |       1 |
|     25 |       Maximum | Non affaibli                |              26 |    4500 ms |    1800000 |       1 |

## Protocole de calibration reproductible

```sh
pnpm validate:difficulty
# Ou phases séparées, puis contrôle de leurs empreintes :
pnpm validate:difficulty --phase=positions
pnpm validate:difficulty --phase=matches
pnpm validate:difficulty --phase=neighbors
pnpm validate:difficulty --phase=adjacent
pnpm validate:difficulty --phase=merge
# Essais isolés, sans écraser le rapport final :
pnpm validate:difficulty --phase=positions --levels=8 --seed=20260902 --output=calibration/essai.json
pnpm validate:difficulty --phase=matches --pairs=7-8,8-9 --rounds=12 --seed=20260909 --output=calibration/voisins-essai.json
```

Le script utilise **le vrai protocole, les profils et la sélection de l’application**, compilés temporairement pour Node, et le même WASM local. Ce banc n’est jamais exécuté dans l’accueil ni dans le site publié. Il peut prendre longtemps ; les tests CI rejouent ses preuves enregistrées, sans relancer les matchs à chaque build.

La suite de positions est fixe : 16 situations tactiques (mat en 1/2, dame/tour pendante, menace de mat, défense et exercices du catalogue), 20 positions extraites de quatre parties longues légales et quatre finales. Répartition : 16 tactiques, huit ouvertures, quatre post-ouvertures, huit milieux de jeu et quatre finales. Les extractions restent liées au rapport historique v1, conservé intact, pour éviter de déplacer le benchmark après chaque réglage.

Pour chacune des 40 positions, les 25 profils sont évalués : **128 tirages** d’une même analyse pour chaque profil personnalisé et **huit recherches natives** pour chaque profil 16–25. Ces 80 000 décisions échantillonnées ne sont pas 80 000 positions indépendantes. Chaque coup distinct reçoit une analyse de référence avant/après : Skill 20, profondeur 18, **850 ms / 350 000 nœuds**, sans limite Elo. Les premiers coups sont aussi mesurés séparément (512 tirages par profil personnalisé, huit recherches pour les autres).

Les parties complètes de référence opposent 19 paires, six parties chacune, avec trois débuts équilibrés par inversion des couleurs. Ces préfixes de six/huit demi-coups sont seulement des conditions expérimentales ; ils n’existent pas dans le mode Partie libre. Aucune adjudication anticipée à +6,5 comme auparavant : les règles de fin sont appliquées jusqu’à **140 demi-coups supplémentaires**. Au plafond seulement, l’analyse forte arbitre un gain si l’avantage est d’au moins trois pions, sinon une nulle. Les fins réglementaires et les arbitrages sont rapportés séparément.

Chaque décision du niveau 8 dans ces parties est auditée. Pour les autres, douze emplacements répartis dans la partie sont examinés. Les phases correspondent aux coups complets 1–8, 9–20, puis milieu de jeu/finale (au plus douze pièces). Les moyennes de parties ne sont pas directement comparables au corpus fixe : positions, couleurs et nombre d’observations diffèrent.

Un adversaire de contrôle UCI 1600, profondeur 14, 500 ms / 100 000 nœuds, complète les matchs entre niveaux. Sa force humaine n’est pas certifiée ; il ne remplace pas l’évaluation forte des coups. Le premier pilote contre UCI 1320 a surtout montré la faiblesse de ce contrôle à temps court, pas une preuve que notre bot vaut exactement 1320.

Une seconde série ajoute 48 parties (12 pour chacune des paires 7–8, 8–9, 9–10 et 15–16), avec une autre seed. Enfin, 18 parties contrôlent 14–15, 16–17 et 17–18, six par paire. La fusion vérifie les empreintes et paramètres, puis conserve les résultats séparés et agrégés. Il y a donc **180 parties dans la validation finale**, sans remplacer les défaites de la première série : **95 fins réglementaires, 85 arbitrages au plafond**.

Les fichiers `quality-results.json`, `quality-games.json`, `quality-neighbors.json` et leur fusion `quality-summary.json` désignent la politique livrée. Les fichiers `quality-before`, `quality-pilot*`, `quality-games-pilot*`, `quality-pass2-*`, `quality-pass3-*`, `quality-native-trial*` et `quality-native-confirm*` conservent les essais précédents. **Les confirmations 2700/2900 sont des essais intermédiaires, pas des résultats du réglage livré.** Le rapport historique `difficulty-results.json` reste intact ; ses 90 parties restent rejouées par les anciens tests.

La dernière révision ne change que trois cibles UCI : 16–18. Pour ne pas jeter les observations valables, les autres profils conservent exactement les mesures de la série complète précédente. Les 120 observations position/niveau affectées (huit recherches chacune) et toutes les parties impliquant un profil modifié sont intégralement remesurées. `nativeRevision` dans chaque rapport détaille ces remplacements. Le script de fusion vérifie les sources archivées, l’égalité du code hors table UCI, les paramètres inchangés, les corpus et l’exhaustivité des remplacements. Il refuse de ne remplacer que les victoires. Les seeds effectives des parties remplacées sont celles des paires initiales. `referenceSets` conserve les analyses fortes associées à chaque groupe de profils : leurs évaluations peuvent varier légèrement entre recherches, malgré des budgets identiques. `node scripts/compose-native-calibration.mjs` reproduit cette composition vérifiée. Une validation complète future reste possible avec la commande habituelle, sans réutilisation.

## Résultats retenus et raccord 14–17

Sur le corpus fixe, le niveau 8 termine à **42,1 cp** de perte moyenne, **14,8 % d’erreurs**, **4,6 % de gaffes** et **1,0 % de matériel offert**. Il reste imparfait. Sur les décisions de parties réellement auditées, ses CPL moyens sont **49,6 / 54,9 / 77,3 / 65,3 cp** en ouverture, coups 9–20, milieu de jeu et finale. Le matériel offert reste entre **0,4 et 0,9 %** selon la phase ; la fin de l’ouverture ne déclenche plus un effondrement artificiel.

Le premier essai natif 2500 donnait au niveau 16 seulement **22,2 %** des points contre le 15 sur 18 parties. Le réglage 2900 testé ensuite allait trop loin : **97,2 %** sur 18 parties. Aucun de ces deux profils n’est livré. Les essais intermédiaires 2700, 2750, 2800 et 3000 restent archivés, avec leur variabilité, sans servir de mesures finales.

Le réglage livré du niveau 16 est **UCI 2750** (toujours affiché ≈2000, force estimée). Sa nouvelle série donne **5 points sur 6**, puis **6 sur 12**, soit **61,1 % sur 18 parties**. Le 15 gagne encore réellement des parties. La précision sur corpus progresse de **21,1 → 17,6 → 12,2 → 9,7 cp** pour les niveaux **14 → 15 → 16 → 17** ; les cibles natives 17 et 18 sont 2820 et 2920 pour prolonger la transition. Les voisins 16–17 donnent **66,7 %** au 17 sur six parties.

Les inversions ne sont pas cachées : **14–15, 17–18 et 23–24 donnent seulement 41,7 % au niveau supérieur sur leurs six parties**. Les pertes sur le corpus restent meilleures au niveau supérieur dans ces trois comparaisons ; cela ne transforme pas ces petits matchs en preuves statistiques d’une hiérarchie stricte. De petites inversions de CPL apparaissent aussi en haut de l’échelle (18–19, 21–22). Les corpus simples distinguent mal des moteurs déjà très forts.

Au total, hors adversaire de contrôle, **72,1 % des points** vont au niveau supérieur. Le Maximum gagne les six parties contre le 24 et présente le CPL le plus bas du corpus (**4,8 cp**). Cela confirme son rôle dans cet échantillon, sans garantir qu’il gagne toute partie.

Le contrôle extérieur du niveau 8 avait donné **3 victoires / 3 défaites** dans la série précédente, conservée dans `quality-pass2-games.json`. La série finale donne **5 victoires / 1 défaite** contre le même contrôle UCI 1600. Cette différence est conservée et souligne la variance des petites séries et du moteur natif ; aucune de ces séries ne certifie un Elo humain à 1200.

### Définition des mesures

- **CPL moyen** : perte de score avant/après, valeurs bornées à ±2 000 cp pour contenir les mats et avantages extrêmes ; les améliorations/nuisances de recherche négatives sont ramenées à zéro. Le meilleur coup de référence a une perte nulle par définition.
- **Imprécision** : 30–79 cp ; **erreur** : 80–199 cp ; **gaffe** : ≥200 cp. Ces seuils de calibration ne modifient pas la classification du bilan.
- **Matériel offert** : exposition immédiate ≥200 cp ET perte de référence ≥100 cp ; dame offerte : exposition ≥700 cp. C’est un détecteur d’anomalies, pas une expertise humaine de chaque sacrifice.
- **Tactique conservée** : meilleur coup de référence ou perte ≤30 cp, sur les 16 positions tactiques seulement. Certains motifs ont plusieurs bonnes réponses. Le mat en un est confirmé avec chess.js ; le mat en deux du corpus est également contrôlable par énumération de toutes les réponses légales.

## Séparation des usages, sécurité et compatibilité

Ouvertures et tactiques gardent leurs séquences scriptées. Leur moteur d’évaluation ne choisit aucun coup. Seule la Partie libre consomme `bestmove`. Le bilan conserve une recherche forte indépendante : **Skill 20, profondeur 14 ou 350 ms, MultiPV 1, aucun Elo**. Aucune modification des commentaires, classifications, sauvegardes ou solutions pédagogiques.

Chaque recherche rétablit les options, attend `isready`, annule/ignore les résultats obsolètes et vérifie les coups avec chess.js. Quitter détruit le Worker. Slider, huit raccourcis, dernier niveau mémorisé et migration des anciennes difficultés vers 3/8/25 sont conservés. CSP, licences, chemins GitHub Pages et CI 20 secondes/deux workers inchangés.

## Limites à garder en tête

Un corpus de 40 positions et des matchs de moteurs ne permettent pas de certifier les Elo affichés, ni qu’un joueur humain 1100 battra régulièrement tel niveau. Des sessions répétées avec des joueurs réels restent nécessaires pour valider cette correspondance. Les profils visent des erreurs plus plausibles ; ils ne simulent pas toutes les façons humaines de réfléchir. Les positions tactiques simples saturent aux hauts niveaux.

Les tirages personnalisés sont reproductibles pour une même analyse et seed. Le hasard natif de Stockfish n’est pas pilotable via UCI ; temps, charge de l’appareil et table de transposition changent aussi les résultats. Des voisins peuvent inverser une série courte. Les résultats défavorables sont conservés, sans tri des parties. Un téléphone lent atteindra souvent le plafond temporel avant les nœuds/profondeur.
