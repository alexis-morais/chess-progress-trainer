# Mesures de la politique livrée

Rapport généré le 2026-08-31T20:56:41.246Z. Empreinte de la politique : `6478c6692c0f101c36a9a1637ed938987f6e6d6140ea63ab8d31f42b2343f324`.

**40 cas (39 positions distinctes), 80 000 décisions échantillonnées et 180 parties longues.** 95 fins réglementaires ; 85 arbitrages au plafond de 140 demi-coups supplémentaires. Les tirages d'une même position ne sont pas des observations indépendantes.

Méthode, seuils, sources et limites : [DIFFICULTY.md](../DIFFICULTY.md). Ces mesures ne certifient pas un classement humain. La référence de qualité utilise Stockfish non limité, profondeur 18 / 850 ms / 350 000 nœuds. Les valeurs de mat et avantages extrêmes sont bornés pour calculer le CPL.

Le raccord natif a été remesuré après la série complète : seuls les profils 16–18 ont changé. Les observations des autres profils sont conservées exactement. Les rapports JSON détaillent les sources et remplacements ; la fusion et les tests vérifient que la logique reste identique hors cibles UCI et que toutes les positions/parties affectées ont été remplacées, défaites comprises.

## Qualité absolue, corpus fixe

| Niveau | CPL moyen | Imprécisions | Erreurs | Gaffes | Matériel offert | Tactiques conservées |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 140,6 | 16,6 % | 14,8 % | 20,0 % | 2,1 % | 62,3 % |
| 2 | 114,6 | 15,5 % | 15,4 % | 16,6 % | 1,7 % | 67,9 % |
| 3 | 92,5 | 15,0 % | 16,6 % | 13,5 % | 1,2 % | 73,7 % |
| 4 | 66,7 | 15,1 % | 15,3 % | 9,9 % | 0,2 % | 80,1 % |
| 5 | 60,2 | 16,6 % | 16,6 % | 7,7 % | 1,5 % | 82,5 % |
| 6 | 50,5 | 16,7 % | 15,0 % | 6,0 % | 1,2 % | 85,7 % |
| 7 | 47,4 | 16,7 % | 14,7 % | 5,5 % | 1,1 % | 84,9 % |
| 8 | 42,1 | 15,0 % | 14,8 % | 4,6 % | 1,0 % | 89,6 % |
| 9 | 36,8 | 16,4 % | 12,3 % | 3,4 % | 0,6 % | 90,8 % |
| 10 | 33,9 | 16,0 % | 10,7 % | 3,2 % | 0,5 % | 92,1 % |
| 11 | 31,7 | 15,0 % | 9,6 % | 3,2 % | 0,4 % | 93,4 % |
| 12 | 27,1 | 14,8 % | 7,5 % | 2,7 % | 0,4 % | 94,4 % |
| 13 | 23,5 | 14,1 % | 6,8 % | 2,0 % | 0,3 % | 95,8 % |
| 14 | 21,1 | 14,4 % | 6,0 % | 1,5 % | 0,3 % | 97,1 % |
| 15 | 17,6 | 13,0 % | 4,8 % | 1,2 % | 0,1 % | 97,6 % |
| 16 | 12,2 | 11,9 % | 4,1 % | 0,0 % | 0,0 % | 96,1 % |
| 17 | 9,7 | 6,9 % | 4,4 % | 0,0 % | 0,0 % | 98,4 % |
| 18 | 7,9 | 5,3 % | 2,8 % | 0,3 % | 0,0 % | 98,4 % |
| 19 | 8,8 | 10,0 % | 1,9 % | 0,0 % | 0,0 % | 97,7 % |
| 20 | 8,3 | 7,5 % | 1,6 % | 0,3 % | 0,0 % | 99,2 % |
| 21 | 8,0 | 6,3 % | 3,1 % | 0,0 % | 0,0 % | 99,2 % |
| 22 | 8,1 | 4,1 % | 3,1 % | 0,6 % | 0,0 % | 100,0 % |
| 23 | 6,4 | 5,6 % | 1,6 % | 0,0 % | 0,0 % | 100,0 % |
| 24 | 6,2 | 4,7 % | 2,2 % | 0,3 % | 0,0 % | 100,0 % |
| 25 | 4,8 | 3,4 % | 1,6 % | 0,3 % | 0,0 % | 100,0 % |

La dernière colonne porte seulement sur les 16 cas tactiques ; les autres colonnes couvrent les 40 cas. « Matériel offert » désigne une capture immédiatement coûteuse et une perte confirmée par la référence, pas chaque sacrifice.

## Niveau 8 : motifs élémentaires

| Cas | Critère | Réussite mesurée |
| --- | --- | ---: |
| Mat en un | Mat effectivement joué | 100,0 % |
| Mat en deux | Mat forcé conservé (réponses légales également vérifiées) | 100,0 % |
| Dame gratuite | Choix tactique quasi équivalent au meilleur | 100,0 % |
| Tour gratuite | Choix tactique quasi équivalent au meilleur | 76,6 % |
| Défense contre un mat | Choix de défense quasi équivalent au meilleur | 100,0 % |

Chaque motif est une position particulière échantillonnée plusieurs fois, pas un taux de réussite garanti sur toutes les positions du même motif.

## Niveau 8 : phases de parties réellement jouées

| Phase | Décisions auditées | CPL moyen | Imprécisions | Erreurs | Gaffes | Matériel offert |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Coups 1–8 | 252 | 49,6 | 34,9 % | 21,0 % | 1,6 % | 0,4 % |
| Coups 9–20 | 648 | 54,9 | 27,0 % | 21,9 % | 3,9 % | 0,6 % |
| Milieu de jeu | 1317 | 77,3 | 18,5 % | 20,1 % | 9,6 % | 0,9 % |
| Finale | 843 | 65,3 | 8,4 % | 7,0 % | 9,0 % | 0,5 % |

Ces positions diffèrent du corpus fixe : les moyennes ne sont pas directement comparables. Chaque coup du niveau 8 est audité ; les autres niveaux sont contrôlés à des emplacements répartis dans leurs parties.

## Matchs : score du niveau supérieur

| Paire | Série principale, 6 parties | Confirmation, 12 parties | Score cumulé |
| --- | ---: | ---: | ---: |
| 1–3 | 91,7 % | — | 91,7 % |
| 3–5 | 83,3 % | — | 83,3 % |
| 5–6 | 66,7 % | — | 66,7 % |
| 6–8 | 100,0 % | — | 100,0 % |
| 7–8 | 100,0 % | 62,5 % | 75,0 % |
| 8–9 | 58,3 % | 75,0 % | 69,4 % |
| 9–10 | 83,3 % | 58,3 % | 66,7 % |
| 8–11 | 100,0 % | — | 100,0 % |
| 11–12 | 66,7 % | — | 66,7 % |
| 12–15 | 91,7 % | — | 91,7 % |
| 15–16 | 83,3 % | 50,0 % | 61,1 % |
| 16–19 | 91,7 % | — | 91,7 % |
| 19–20 | 91,7 % | — | 91,7 % |
| 20–21 | 75,0 % | — | 75,0 % |
| 21–22 | 66,7 % | — | 66,7 % |
| 22–23 | 58,3 % | — | 58,3 % |
| 23–24 | 41,7 % | — | 41,7 % |
| 24–25 | 100,0 % | — | 100,0 % |
| 8–contrôle UCI 1600 | 16,7 % | — | 16,7 % |

Hors adversaire de contrôle, 72,1 % des points reviennent au niveau supérieur. Une nulle vaut un demi-point. Le contrôle UCI 1600 ne vaut pas une certification humaine à 1600 Elo. Six ou dix-huit parties restent un petit échantillon, particulièrement entre voisins.

### Contrôles supplémentaires autour du raccord

| Paire | Parties | Score du niveau supérieur |
| --- | ---: | ---: |
| 14–15 | 6 | 41,7 % |
| 16–17 | 6 | 66,7 % |
| 17–18 | 6 | 41,7 % |

Ces 18 parties supplémentaires font partie du total. [Données brutes](quality-native-final-adjacent.json).

## Premier coup du niveau 8

512 tirages : 85,7 % de coups de développement/centre, 1,6 % de pions de bord, 0,0 % de cavaliers au bord. Aucun début de partie n'est imposé dans l'application.

Données complètes : [positions](quality-results.json), [parties](quality-games.json), [confirmations](quality-neighbors.json), [synthèse JSON](quality-summary.json). Les essais antérieurs sont conservés séparément, sans être mélangés à ces chiffres.
