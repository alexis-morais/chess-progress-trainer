# Références du répertoire

- `original-variations.json` : copie des 16 variantes existantes avant l’évolution, avec leurs noms, coups et explications. Le test de non-régression garantit leur conservation intégrale.
- `opening-references.json` : 60 positions de référence sélectionnées dans les fichiers `a.tsv` à `e.tsv` du [répertoire Lichess chess-openings](https://github.com/lichess-org/chess-openings), consultés le 30 août 2026. Données sous **CC0**. Les champs `name`, `eco` et `pgn` sont ceux de cette source ; `atPly` indique où la ligne essentielle rejoint la position. Les transpositions sont comparées sans les compteurs de coups FEN.

Ces références vérifient l’identité de l’ouverture ; elles ne prétendent pas certifier chaque prolongement comme une variante forcée ou une suite de meilleurs coups. Les continuations et explications françaises sont des exemples pédagogiques : les deux camps suivent un scénario choisi pour montrer une idée. Les structures du Londres sont nommées selon la réponse noire, et non comme six ouvertures indépendantes. La Sicilienne ouverte introduit ici une structure classique, distincte des introductions Najdorf et Dragon.

Les tests lisent ces fichiers localement. Ils n’effectuent aucun téléchargement ni appel réseau. Pour modifier volontairement une des 16 lignes historiques à l’avenir, adapter également sa référence de non-régression après vérification.
