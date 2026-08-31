# Les 25 niveaux de Chess Progress

Les valeurs affichées sont des **forces estimées**, choisies comme repères pédagogiques. Aucun Elo humain, Chess.com, Lichess ou FIDE n’a été mesuré. Le style d’un moteur limité diffère de celui d’une personne.

## Profils réellement utilisés

Stockfish.js **18.0.8 Lite Single-Threaded**, fichiers locaux existants. L’interrogation UCI du binaire livré confirme : Skill Level 0–20, UCI_LimitStrength, UCI_Elo **1320–3190**, MultiPV 1–256, un seul thread. L’application borne MultiPV à 64 et utilise au plus 20 candidats.

Toutes les recherches utilisent Skill Level 20 et Hash 16 Mo. Le moteur s’arrête à la **première** limite atteinte : profondeur, durée ou nœuds. Un délai visuel de 250 ms précède la recherche en partie. La durée dépend de l’appareil ; un Web Worker garde l’interface disponible.

| Niveau | Force estimée | Catégorie          | Politique / cible UCI technique | Profondeur max. | Temps max. | Nœuds max. | MultiPV |
| -----: | ------------: | ------------------ | ------------------------------- | --------------: | ---------: | ---------: | ------: |
|      1 |         ≈ 250 | Débutant           | Sélection pondérée              |               8 |     220 ms |      12000 |      20 |
|      2 |         ≈ 400 | Débutant           | Sélection pondérée              |               8 |     220 ms |      12000 |      20 |
|      3 |         ≈ 550 | Débutant           | Sélection pondérée              |               8 |     220 ms |      12000 |      20 |
|      4 |         ≈ 700 | Débutant           | Sélection pondérée              |               8 |     220 ms |      12000 |      20 |
|      5 |         ≈ 850 | Débutant           | Sélection pondérée              |               8 |     220 ms |      12000 |      20 |
|      6 |        ≈ 1000 | Intermédiaire      | Sélection pondérée              |               8 |     220 ms |      12000 |      20 |
|      7 |        ≈ 1100 | Intermédiaire      | Sélection pondérée              |               8 |     220 ms |      12000 |      20 |
|      8 |        ≈ 1200 | Intermédiaire      | Sélection pondérée              |               8 |     220 ms |      12000 |      20 |
|      9 |        ≈ 1300 | Intermédiaire      | Sélection pondérée              |               8 |     220 ms |      12000 |      20 |
|     10 |        ≈ 1400 | Intermédiaire      | Sélection pondérée              |               8 |     220 ms |      12000 |      20 |
|     11 |        ≈ 1500 | Intermédiaire      | Sélection pondérée              |               8 |     220 ms |      12000 |      20 |
|     12 |        ≈ 1600 | Avancé             | UCI_Elo 1900                    |              13 |     490 ms |      58000 |       1 |
|     13 |        ≈ 1700 | Avancé             | UCI_Elo 2000                    |              13 |     560 ms |      76000 |       1 |
|     14 |        ≈ 1800 | Avancé             | UCI_Elo 2100                    |              14 |     630 ms |      94000 |       1 |
|     15 |        ≈ 1900 | Avancé             | UCI_Elo 2200                    |              14 |     700 ms |     112000 |       1 |
|     16 |        ≈ 2000 | Expert             | UCI_Elo 2300                    |              15 |     770 ms |     130000 |       1 |
|     17 |        ≈ 2100 | Expert             | UCI_Elo 2400                    |              15 |     840 ms |     148000 |       1 |
|     18 |        ≈ 2200 | Expert             | UCI_Elo 2500                    |              16 |     910 ms |     166000 |       1 |
|     19 |        ≈ 2300 | Expert             | UCI_Elo 2600                    |              16 |     980 ms |     184000 |       1 |
|     20 |        ≈ 2400 | Maître             | UCI_Elo 2700                    |              17 |    1050 ms |     202000 |       1 |
|     21 |        ≈ 2500 | Maître             | UCI_Elo 2800                    |              17 |    1120 ms |     220000 |       1 |
|     22 |        ≈ 2600 | Grand maître       | UCI_Elo 2900                    |              18 |    1190 ms |     238000 |       1 |
|     23 |        ≈ 2700 | Grand maître       | UCI_Elo 3000                    |              18 |    1260 ms |     256000 |       1 |
|     24 |        ≈ 2900 | Super grand maître | UCI_Elo 3150                    |              19 |    1330 ms |     274000 |       1 |
|     25 |        ≈ 3200 | Maximum            | Maximum                         |              22 |    1800 ms |     450000 |       1 |

## Affaiblissement pédagogique

- **1–9** : niveaux inférieurs au minimum UCI natif. Stockfish évalue jusqu’à 20 candidats légaux. Un tirage pondéré choisit parmi eux ; aucun coup légal arbitraire n’est inventé.
- **10–11** : zone de raccord, utilisant encore cette sélection. Le premier essai natif à 1400 a régressé sur le benchmark tactique ; étendre le raccord évite cette rupture.
- **12–24** : limitation native UCI_LimitStrength + UCI_Elo. Les budgets augmentent. Stockfish choisit directement son coup. La cible UCI technique est supérieure de 300 à l’estimation affichée (3150 au niveau 24) : les essais ont montré qu’à ce contrôle de temps court, la cible native brute régressait face à la politique personnalisée. Cet ajustement ne constitue pas une conversion entre Elo humain et Elo moteur.
- **25** : aucune limitation native ni sélection affaiblie, jusqu’à 1,8 seconde, profondeur 22 et 450 000 nœuds.

La sélection personnalisée distingue une décision correcte d’une erreur. La fréquence, la perte cible et la gravité des erreurs diminuent avec le niveau. Les pertes sont calculées du point de vue du camp qui joue. Les mats sont ramenés à une échelle finie pour permettre de manquer une tactique sans rendre tout choix impossible.

Les faibles niveaux favorisent les poussées centrales, le développement et le roque. Les sorties précoces de dame/tour, les cavaliers de bord et les allers-retours reçoivent moins de poids. Une dame immédiatement prenable est fortement pénalisée, sans interdire tous les sacrifices. Pendant les premiers coups d’une position calme avec presque tout le matériel, les erreurs sont moins fréquentes : un débutant peut commencer naturellement puis manquer une combinaison. Ces heuristiques restent simples ; elles n’imitent pas un cerveau humain.

Une limite **souple**, plutôt qu’une exclusion absolue des pertes élevées, évite qu’une capture passe brutalement d’« ignorée » à « toujours trouvée » entre deux niveaux. Une erreur importante reste possible, mais devient plus rare.

Le curseur et les huit raccourcis utilisent le même identifiant numérique. Le dernier choix est conservé sous `chess-progress:level:v1`, avec contrôle du type et des bornes. Valeur par défaut : niveau 6. Les anciennes sauvegardes beginner/intermediate/expert sont converties respectivement vers 3/8/25 ; leur partie et leur bilan restent lisibles.

## Séparation des usages

- Ouvertures : réponses scriptées, moteur d’évaluation distinct inchangé.
- Tactiques : réponses scriptées ; aucun adversaire calculé.
- Partie libre : seuls ComputerEngine et chooseMove consomment le choix moteur.
- Bilan : **Skill 20, profondeur 14 ou 350 ms**, aucune limitation Elo, MultiPV 1 ; aucune sélection pédagogique.

Chaque recherche restaure les options avant une barrière `isready`. Les recherches sont séquentielles. Annuler envoie `stop`, ignore les anciens résultats, puis vide la requête avant de poursuivre. Quitter la partie détruit le Worker. Les PV reçues sont rejouées avec chess.js, les messages et paramètres sont bornés.

## Banc de calibration

```sh
pnpm validate:difficulty
# Essai rapide, distinct du rapport complet :
pnpm validate:difficulty --quick --output=calibration/essai-rapide.json
# Seed de la politique personnalisée :
CALIBRATION_SEED=20260831 pnpm validate:difficulty
```

Le script compile **le protocole et la politique de l’application**, puis pilote le même WASM local dans des processus Node séparés. Ce sont des outils hors ligne de développement ; aucun serveur n’est ajouté au site.

Le banc complet contient :

- 16 positions : dame/tour gratuites, mat en un/deux, fourchette, pièce et dame attaquées, défense et positions issues des tactiques réelles du catalogue.
- Pour chaque position et chaque niveau personnalisé : une recherche et 128 tirages avec seed. Pour les niveaux natifs : huit recherches, car leur choix fait partie du moteur.
- Une évaluation de référence plus forte (profondeur 16, 500 ms, 180 000 nœuds) avant et après chaque choix distinct.
- Un contrôle du premier coup, avec 512 tirages par niveau personnalisé, pour mesurer développement naturel, cavaliers de bord et pions de bord.
- 90 matchs : 15 paires de niveaux, six parties par paire, trois débuts (italienne, gambit Dame, sicilienne), chaque fois avec couleurs inversées.
- Les parties appliquent les règles chess.js. Elles sont arbitrées à un avantage d’au moins 6,5 pions après la phase initiale, ou après 80 demi-coups supplémentaires (gain si avantage ≥ 2,5 pions, sinon nulle). Le rapport distingue les fins réglementaires et les arbitrages.

Les pertes de référence sont bornées à ±20 pions par position pour traiter les mats. « Tactique trouvée » signifie meilleur coup de référence ou perte ≤30 centipions ; cela peut inclure plusieurs coups équivalents. « Gaffe » signifie perte ≥200 centipions. Ces métriques ne changent pas la classification du Game Review.

## Résultats réellement obtenus le 31 août 2026

Le rapport de référence est [calibration/difficulty-results.json](calibration/difficulty-results.json). Il rassemble les deux phases finales exécutées avec la même empreinte de code et les mêmes profils : **90 matchs, 16 positions, 24 320 choix mesurés**, plus **5 632 tirages du premier coup**. Les 128 tirages d’un niveau personnalisé partagent une analyse de position ; ce ne sont pas 128 observations indépendantes de force.

**73,3 % des points** reviennent aux niveaux supérieurs sur l’ensemble des matchs (victoire = 1, nulle = 0,5). **2 parties** se terminent selon les règles d’échecs, **88 sont arbitrées** avec la politique décrite ci-dessus. Ces matchs ne sont donc pas présentés comme 90 parties allant jusqu’au mat.

| Paire | Parties | Points du niveau supérieur |
| ----- | ------: | -------------------------: |
| 1–3   |       6 |                     83,3 % |
| 3–5   |       6 |                     83,3 % |
| 5–6   |       6 |                     50,0 % |
| 6–8   |       6 |                     83,3 % |
| 8–11  |       6 |                    100,0 % |
| 11–12 |       6 |                     50,0 % |
| 12–15 |       6 |                    100,0 % |
| 15–16 |       6 |                     75,0 % |
| 16–19 |       6 |                     83,3 % |
| 19–20 |       6 |                     66,7 % |
| 20–21 |       6 |                     83,3 % |
| 21–22 |       6 |                     16,7 % |
| 22–23 |       6 |                     83,3 % |
| 23–24 |       6 |                     66,7 % |
| 24–25 |       6 |                     75,0 % |

Le niveau 22 perd cette série contre le 21 : cette inversion est conservée, pas filtrée. Six parties ne permettent pas d’ordonner sûrement deux niveaux proches. Les paires 5–6 et 11–12 font également jeu égal. La tendance globale est ascendante ; la force exacte de chaque voisin reste incertaine.

| Niveau | Perte moyenne (centipions) | Tactiques trouvées | Pertes ≥ 200 cp |
| -----: | -------------------------: | -----------------: | --------------: |
|      1 |                      657,7 |             24,0 % |          68,6 % |
|      2 |                      608,6 |             26,2 % |          65,3 % |
|      3 |                      550,3 |             31,4 % |          60,7 % |
|      4 |                      499,5 |             36,4 % |          57,0 % |
|      5 |                      439,7 |             40,5 % |          52,1 % |
|      6 |                      371,6 |             48,9 % |          44,9 % |
|      7 |                      322,9 |             54,3 % |          39,7 % |
|      8 |                      279,4 |             57,4 % |          36,4 % |
|      9 |                      215,1 |             66,0 % |          28,7 % |
|     10 |                      174,0 |             71,2 % |          24,1 % |
|     11 |                      142,2 |             77,0 % |          19,7 % |
|     12 |                       12,0 |             94,5 % |           3,1 % |
|     13 |                       15,1 |             92,2 % |           3,1 % |
|     14 |                       12,7 |             94,5 % |           3,1 % |
|     15 |                        9,5 |             96,1 % |           2,3 % |
|     16 |                        7,4 |             96,9 % |           1,6 % |
|     17 |                       13,0 |             94,5 % |           3,9 % |
|     18 |                        9,7 |             96,9 % |           1,6 % |
|     19 |                        7,6 |             96,9 % |           1,6 % |
|     20 |                        6,0 |             97,7 % |           0,8 % |
|     21 |                        3,9 |             99,2 % |           0,0 % |
|     22 |                        4,1 |             98,4 % |           0,0 % |
|     23 |                        3,7 |             99,2 % |           0,0 % |
|     24 |                        4,0 |             99,2 % |           0,0 % |
|     25 |                        3,2 |            100,0 % |           0,0 % |

Le niveau 3 trouve 31,4 % des tactiques contre 57,4 % pour le 8, avec une perte moyenne environ deux fois plus forte. Le 8 manque encore des tactiques : il n’est pas simplement un Stockfish fort répondant vite. La baisse des pertes est régulière entre 1 et 11. Aux niveaux natifs, ce petit benchmark sature et fluctue ; le raccord 11–12 est plus visible tactiquement que dans les matchs (égalité sur cette paire).

Sur le contrôle initial, le niveau 1 choisit un coup central ou de développement dans 75 % des tirages ; les cavaliers de bord représentent 1,6 %, les pions de bord 7,0 %. Les heuristiques limitent les débuts absurdes sans imposer une bibliothèque parfaite. Ce contrôle porte sur le premier coup, pas sur toute la partie.

### Ajustements avant de figer ces profils

- Remplacement d’un plafond rigide de perte par une décroissance souple : l’ancien plafond rendait certains niveaux faibles artificiellement parfaits sur les captures de dame et les mats.
- Prolongement de la sélection personnalisée jusqu’au niveau 11 : les premières cibles UCI natives trop basses régressaient à la jonction.
- Plusieurs essais du raccord natif (1600, 1900, 2100), puis étagement des paramètres d’erreur personnalisés et cible native technique ajustée aux recherches courtes.
- Réduction des erreurs en ouverture calme pour favoriser des débuts naturels, tout en conservant des fautes tactiques ensuite.
- Nouveau benchmark complet et nouvelle série complète après les derniers ajustements. **318 matchs ont été exécutés au total** pendant les essais ; seuls les 90 de la dernière politique servent aux résultats ci-dessus. Les fichiers d’essais sont conservés comme historique.

Les tests ordinaires vérifient que l’empreinte et les profils de ce rapport correspondent au code, contrôlent les tendances par grands groupes, puis rejouent les 90 matchs avec chess.js. Ils ne relancent pas la calibration longue et n’imposent pas artificiellement l’issue de futurs matchs.

## Reproductibilité et limites

La seed rend les tirages personnalisés reproductibles pour une même liste de candidats. Le PRNG interne de Stockfish n’expose pas de seed UCI : les coups natifs ne sont pas strictement reproductibles. Les budgets en nœuds limitent les variations de charge, mais le plafond temporel et la table de transposition peuvent aussi modifier les évaluations.

Les matchs courts arbitrés et seize positions ne suffisent pas à établir un classement Elo. Quelques résultats voisins peuvent s’inverser ; aux niveaux élevés les tactiques simples saturent. Il faut juger les tendances globales et les groupes, pas exiger que le niveau supérieur gagne chaque partie. Un téléphone lent peut atteindre le plafond temporel avant le budget de nœuds.
