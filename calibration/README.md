# Mesures de difficulté

- **difficulty-results.json** : rapport final de référence (90 matchs, 16 positions), utilisé par les tests.
- **difficulty-positions-calibrated.json** et **difficulty-matches-calibrated.json** : deux phases finales du même code, fusionnées par `node scripts/merge-difficulty.mjs`.
- Autres JSON : essais antérieurs et explorations du raccord. Ils ne décrivent pas tous les profils livrés et ne doivent pas être mélangés à la dernière mesure.

Reproduction : `pnpm validate:difficulty`. Protocole, paramètres, tableaux, ajustements, limites et reproductibilité partielle sont détaillés dans [DIFFICULTY.md](../DIFFICULTY.md).

Les tests détectent un changement de politique sans recalibration grâce à son empreinte SHA-256. Aucun résultat ne mesure un Elo humain officiel. Les matchs sont majoritairement arbitrés pour borner la durée du banc.
