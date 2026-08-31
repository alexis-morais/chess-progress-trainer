# Tactiques d’ouverture — catalogue et validation

**20 exercices, deux par ouverture.** Un exercice à une décision, quatorze à deux décisions et cinq à trois décisions : **19 combinaisons multi-coups**. Quatre exercices sont classés Facile, seize Intermédiaire ; le modèle prévoit aussi Difficile.

Les sources sont des parties publiques et des puzzles de la [base Lichess, publiée sous CC0](https://database.lichess.org/#puzzles). Aucun compte, téléchargement ou accès à Lichess n’est nécessaire pour jouer : toutes les positions et réponses sont livrées avec le site. Le camp résolvant le puzzle n’est pas nécessairement celui du trainer théorique de l’ouverture.

## Provenance et cohérence

Chaque entrée de `src/data/tactics.json` conserve l’identifiant de son ouverture, son titre, son motif, sa difficulté, sa FEN, le camp au trait, la suite SAN complète depuis la position initiale et les liens vers le jeu et le puzzle sources. Les coups de la solution alternent avec les réponses adverses dans `sequence`. Le champ `side` détermine lesquels appartiennent à l’élève.

Les tests rejouent strictement tous les coups de provenance et de solution avec chess.js. Ils exigent la FEN exacte et le bon camp au trait. Ils vérifient également une position caractéristique de l’ouverture dans les premiers coups, en acceptant les transpositions ; pour le Londres et l’Est-Indienne, ils vérifient la structure de développement correspondante. Les positions ont été sélectionnées dans les catégories d’ouverture Lichess et examinées avec leur contexte de partie.

Une provenance légale ne suffirait pas à prouver la combinaison : la vérification moteur est donc indépendante.

## Vérification avec le vrai Stockfish local

Commande : `pnpm validate:tactics`. Elle réutilise les fichiers Stockfish 18 Lite livrés dans `public/engine`, sans requête réseau ni dépendance supplémentaire. La recherche est séquentielle, avec Skill Level 20, Hash 32 Mo, MultiPV 3 et une limite **profondeur 18 ou 1 500 ms par position**. Les **68 positions** précédant chacun des coups des 20 séquences sont vérifiées, y compris les réponses adverses.

Pour chaque décision de l’élève, le coup enregistré doit être le meilleur coup trouvé. Son score doit indiquer un avantage d’au moins 150 centipions ou un mat favorable. Pour les réponses adverses, la continuation stockée doit figurer parmi les trois choix analysés et rester à au plus 50 centipions du meilleur score, ou conserver le même score de mat. La profondeur atteinte doit être au moins 14 ; la validation enregistrée atteint 16 à 18 selon les positions.

**Résultat de préparation : 20/20 exercices validés.** Le rapport `src/test/fixtures/tactics-verification.json` conserve les positions, coups, scores, profondeurs et variantes principales. Une empreinte SHA-256 relie chaque résultat à la provenance et à la solution exactes. Les tests rapides vérifient cette correspondance et les critères sans relancer Stockfish à chaque test. Le rapport n’est pas importé par l’application et n’alourdit pas le chargement web.

Le script s’arrête si une solution n’est plus la meilleure dans sa recherche ou si une défense ne respecte pas les critères. Après une modification volontaire, utiliser `pnpm validate:tactics --write` pour régénérer le rapport **uniquement après validation réussie**. Le temps dépend de la machine ; le budget maximal cumulé de recherche est d’environ 102 secondes, hors chargement.

## Ajouter un exercice sans modifier les composants

1. Ajouter un objet au tableau `src/data/tactics.json`, en prenant un exercice existant comme modèle. Donner un `id` unique et un `openingId` présent dans `openings.ts`.
2. Conserver une provenance vérifiable, complète depuis le départ, avec les liens sources et leur licence. La FEN doit représenter exactement la position de départ du puzzle, et le trait doit être celui de `side`.
3. Fournir la `sequence` en SAN internationale : coup de l’élève, réponse, coup de l’élève, etc. Terminer sur un coup de l’élève. Chaque entrée possède `san` et `explanation` ; `hint` est facultatif et doit donner une idée sans désigner le coup. Ne pas dévoiler les coups futurs dans les commentaires intermédiaires.
4. Rédiger `explanation`, `gain` et `principle` pour la fiche finale. Ne promettre que ce que la ligne démontre. Choisir `Facile`, `Intermédiaire` ou `Difficile`.
5. Exécuter `pnpm validate:tactics --write`, `pnpm test`, `CI=true pnpm test` et `pnpm build` ; contrôler le parcours dans le navigateur. Ne pas modifier le rapport manuellement pour contourner un échec.

Le catalogue filtre automatiquement par ouverture et numérote les exercices selon leur ordre dans les données. Le bouton suivant reste dans la même ouverture ; le dernier exercice propose Rejouer et Retour à l’ouverture. Les compteurs visibles sont calculés à partir des données. Les tests de quantité décrivent volontairement la livraison actuelle (10 ouvertures, 2 à 3 exercices chacune) : les ajuster explicitement si un futur catalogue change ce contrat, sans retirer les tests de légalité ou de qualité.

Les ouvertures et variantes restent dans `src/data/openings.ts` et `src/data/repertoire.json`. Leur sélection, les comptes visibles et le trainer ne nécessitent pas de nouveau composant pour un ajout. Conserver aussi leurs références de nommage et adapter les attentes de quantité lors d’une extension volontaire du catalogue.

## Trois rôles du moteur, sans mélange

- **Ouvertures** : évaluation uniquement ; coups scriptés.
- **Tactiques** : validation hors ligne lors de la préparation ; aucun Worker pendant l’exercice, coups scriptés.
- **Partie libre et bilan** : Stockfish choisit les coups en partie, puis analyse après la fin.

Les deux types d’exercice partagent le plateau, les transitions, les compteurs, les temporisations et le composant facultatif **Indice | Solution**. Leurs données et leurs écrans de fin restent distincts. Un ajout tactique ne nécessite pas de modifier le moteur de partie libre.

## Limites pédagogiques

Ces positions illustrent des motifs pouvant apparaître dans l’ouverture ; elles ne signifient pas que l’adversaire jouera toujours exactement cette ligne. Certains exercices proviennent d’une transition vers le milieu de jeu. Les défenses enregistrées ne sont pas toutes uniques ni obligatoirement forcées : elles montrent une continuation vérifiée. La solution actuelle seule est acceptée, même si un autre coup légal peut garder un avantage.

Une recherche finie n’est pas une preuve mathématique exhaustive. Une recherche plus longue peut modifier une évaluation ou départager différemment des coups proches. Les explications sont locales et concises, sans API d’IA ni garantie de remplacer l’analyse d’un professeur.

## Catalogue

| Ouverture    | Titre                             | Motif                                  | Camp du joueur | Coups du joueur | Sources                                                                               |
| ------------ | --------------------------------- | -------------------------------------- | -------------- | --------------: | ------------------------------------------------------------------------------------- |
| Italienne    | Fourchette avec échec             | Fourchette et gain de dame             | Blancs         |               2 | [Partie](https://lichess.org/sMMrz6Hk) · [Puzzle](https://lichess.org/training/NgMmK) |
| Italienne    | Deux menaces à la fois            | Attaque double                         | Noirs          |               2 | [Partie](https://lichess.org/dNSLD6Iy) · [Puzzle](https://lichess.org/training/s2mJI) |
| Écossaise    | Déjouer la fourchette             | Défense tactique et échange            | Blancs         |               2 | [Partie](https://lichess.org/VqqVl2DF) · [Puzzle](https://lichess.org/training/0RJBp) |
| Écossaise    | Échanger avec tempo               | Déviation et échange avec échec        | Blancs         |               3 | [Partie](https://lichess.org/lK1JAN0H) · [Puzzle](https://lichess.org/training/Uf6V1) |
| Viennoise    | Guider le roi vers le coin        | Réseau de mat                          | Blancs         |               3 | [Partie](https://lichess.org/1pqMnt81) · [Puzzle](https://lichess.org/training/GbH9Q) |
| Viennoise    | Deux cibles sur une diagonale     | Attaque double                         | Blancs         |               2 | [Partie](https://lichess.org/iLqxvARD) · [Puzzle](https://lichess.org/training/11jP6) |
| Gambit Dame  | Attirer le roi                    | Attraction et mat                      | Blancs         |               2 | [Partie](https://lichess.org/A09LMHoH) · [Puzzle](https://lichess.org/training/WW9ym) |
| Gambit Dame  | Une prise avec tempo              | Échec intermédiaire et gain de qualité | Blancs         |               2 | [Partie](https://lichess.org/h7cYT7Sl) · [Puzzle](https://lichess.org/training/56FTv) |
| Londres      | Un défenseur immobilisé           | Clouage et attaque du roi              | Noirs          |               2 | [Partie](https://lichess.org/39jD4e6A) · [Puzzle](https://lichess.org/training/91tuc) |
| Londres      | Coordonner l’attaque              | Mat sur les cases noires               | Blancs         |               1 | [Partie](https://lichess.org/r2rUYyQb) · [Puzzle](https://lichess.org/training/ySOdN) |
| Française    | Punir la sortie de dame           | Piège de dame                          | Blancs         |               2 | [Partie](https://lichess.org/v6axqK4e) · [Puzzle](https://lichess.org/training/2xaSj) |
| Française    | Deux pièces alignées              | Enfilade dame-tour                     | Noirs          |               2 | [Partie](https://lichess.org/ILIqEilr) · [Puzzle](https://lichess.org/training/QdG70) |
| Scandinave   | Retirer l’obstacle                | Échange avec échec et attaque double   | Blancs         |               3 | [Partie](https://lichess.org/Ul1xC7UG) · [Puzzle](https://lichess.org/training/oGkvq) |
| Scandinave   | Fermer les issues                 | Réseau de mat sur l’aile dame          | Blancs         |               3 | [Partie](https://lichess.org/fWcybXN7) · [Puzzle](https://lichess.org/training/wZXiD) |
| Caro-Kann    | Une ouverture de colonne calculée | Échanges et pièce non protégée         | Blancs         |               3 | [Partie](https://lichess.org/jrTKHi8i) · [Puzzle](https://lichess.org/training/iEem1) |
| Caro-Kann    | Un duo décisif                    | Mat avec tour et cavalier              | Blancs         |               2 | [Partie](https://lichess.org/O3H0yhJy) · [Puzzle](https://lichess.org/training/dFvFv) |
| Sicilienne   | Maintenir la pression             | Menace sur le roi et interposition     | Blancs         |               2 | [Partie](https://lichess.org/X0NcAZmB) · [Puzzle](https://lichess.org/training/VmR1K) |
| Sicilienne   | Avancer avec du soutien           | Poussée tactique et pièce protégée     | Blancs         |               2 | [Partie](https://lichess.org/poyoVhJC) · [Puzzle](https://lichess.org/training/E28CM) |
| Est-Indienne | Libérer une colonne               | Attaque à la découverte et déviation   | Noirs          |               2 | [Partie](https://lichess.org/KLsuOucL) · [Puzzle](https://lichess.org/training/W7mno) |
| Est-Indienne | Éloigner le défenseur             | Déviation de la dame                   | Noirs          |               2 | [Partie](https://lichess.org/vnT0s8t4) · [Puzzle](https://lichess.org/training/jMfAh) |
