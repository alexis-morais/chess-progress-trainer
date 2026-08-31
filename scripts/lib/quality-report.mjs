const decimal = (value) => value.toFixed(1).replace('.', ',');
const percent = (value) => `${decimal(value * 100)} %`;
const phases = {
  opening: 'Coups 1–8',
  'post-opening': 'Coups 9–20',
  middlegame: 'Milieu de jeu',
  endgame: 'Finale',
};

export function qualityMarkdown(report, positions, games, neighbors) {
  const lines = [
    '# Mesures de la politique livrée',
    '',
    `Rapport généré le ${report.completedAt}. Empreinte de la politique : \`${report.policyHash}\`.`,
    '',
    `**${report.positions} cas (${report.distinctPositions} positions distinctes), ${report.decisions.toLocaleString('fr-FR')} décisions échantillonnées et ${report.games} parties longues.** ${report.naturalEnds} fins réglementaires ; ${report.games - report.naturalEnds} arbitrages au plafond de 140 demi-coups supplémentaires. Les tirages d'une même position ne sont pas des observations indépendantes.`,
    '',
    'Méthode, seuils, sources et limites : [DIFFICULTY.md](../DIFFICULTY.md). Ces mesures ne certifient pas un classement humain. La référence de qualité utilise Stockfish non limité, profondeur 18 / 850 ms / 350 000 nœuds. Les valeurs de mat et avantages extrêmes sont bornés pour calculer le CPL.',
    ...(report.nativeRevisions?.length
      ? [
          '',
          'Le raccord natif a été remesuré après la série complète : seuls les profils 16–18 ont changé. Les observations des autres profils sont conservées exactement. Les rapports JSON détaillent les sources et remplacements ; la fusion et les tests vérifient que la logique reste identique hors cibles UCI et que toutes les positions/parties affectées ont été remplacées, défaites comprises.',
        ]
      : []),
    '',
    '## Qualité absolue, corpus fixe',
    '',
    '| Niveau | CPL moyen | Imprécisions | Erreurs | Gaffes | Matériel offert | Tactiques conservées |',
    '| ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
    ...report.levels.map(
      (s) =>
        `| ${s.level} | ${decimal(s.meanLoss)} | ${percent(s.inaccuracyRate)} | ${percent(s.errorRate)} | ${percent(s.blunderRate)} | ${percent(s.offeredRate)} | ${percent(s.phases.tactics.tacticalRate)} |`,
    ),
    '',
    'La dernière colonne porte seulement sur les 16 cas tactiques ; les autres colonnes couvrent les 40 cas. « Matériel offert » désigne une capture immédiatement coûteuse et une perte confirmée par la référence, pas chaque sacrifice.',
    '',
    '## Niveau 8 : motifs élémentaires',
    '',
    '| Cas | Critère | Réussite mesurée |',
    '| --- | --- | ---: |',
    ...[
      ['mat-un', 'Mat effectivement joué', 'mateRate'],
      [
        'mat-deux',
        'Mat forcé conservé (réponses légales également vérifiées)',
        'preservesMateRate',
      ],
      ['capture-dame', 'Choix tactique quasi équivalent au meilleur', 'tacticalRate'],
      ['capture-tour', 'Choix tactique quasi équivalent au meilleur', 'tacticalRate'],
      ['defense-mat', 'Choix de défense quasi équivalent au meilleur', 'tacticalRate'],
    ].map(([id, criterion, metric]) => {
      const row = positions.rows.find((r) => r.level === 8 && r.position === id);
      return `| ${row.kind} | ${criterion} | ${percent(row[metric])} |`;
    }),
    '',
    'Chaque motif est une position particulière échantillonnée plusieurs fois, pas un taux de réussite garanti sur toutes les positions du même motif.',
    '',
    '## Niveau 8 : phases de parties réellement jouées',
    '',
    '| Phase | Décisions auditées | CPL moyen | Imprécisions | Erreurs | Gaffes | Matériel offert |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: |',
    ...Object.entries(report.gameQuality.find((s) => s.level === 8).phases).map(
      ([phase, s]) =>
        `| ${phases[phase]} | ${s.samples} | ${decimal(s.meanLoss)} | ${percent(s.inaccuracyRate)} | ${percent(s.errorRate)} | ${percent(s.blunderRate)} | ${percent(s.offeredRate)} |`,
    ),
    '',
    'Ces positions diffèrent du corpus fixe : les moyennes ne sont pas directement comparables. Chaque coup du niveau 8 est audité ; les autres niveaux sont contrôlés à des emplacements répartis dans leurs parties.',
    '',
    '## Matchs : score du niveau supérieur',
    '',
    '| Paire | Série principale, 6 parties | Confirmation, 12 parties | Score cumulé |',
    '| --- | ---: | ---: | ---: |',
    ...games.summary.map((pair) => {
      const confirm = neighbors.summary.find(
        (p) => p.lower === pair.lower && p.higher === pair.higher,
      );
      const total =
        (pair.higherScore * pair.games + (confirm ? confirm.higherScore * confirm.games : 0)) /
        (pair.games + (confirm?.games ?? 0));
      return `| ${pair.lower}–${pair.higher === 'reference' ? 'contrôle UCI 1600' : pair.higher} | ${percent(pair.higherScore)} | ${confirm ? percent(confirm.higherScore) : '—'} | ${percent(total)} |`;
    }),
    '',
    `Hors adversaire de contrôle, ${percent(report.higherScore)} des points reviennent au niveau supérieur. Une nulle vaut un demi-point. Le contrôle UCI 1600 ne vaut pas une certification humaine à 1600 Elo. Six ou dix-huit parties restent un petit échantillon, particulièrement entre voisins.`,
    '',
    '### Contrôles supplémentaires autour du raccord',
    '',
    '| Paire | Parties | Score du niveau supérieur |',
    '| --- | ---: | ---: |',
    ...report.adjacentPairs.map(
      (p) => `| ${p.lower}–${p.higher} | ${p.games} | ${percent(p.higherScore)} |`,
    ),
    '',
    'Ces 18 parties supplémentaires font partie du total. [Données brutes](quality-native-final-adjacent.json).',
    '',
    '## Premier coup du niveau 8',
    '',
  ];
  const opening = positions.openingHabits.find((s) => s.level === 8);
  lines.push(
    `${opening.samples} tirages : ${percent(opening.naturalRate)} de coups de développement/centre, ${percent(opening.edgePawnRate)} de pions de bord, ${percent(opening.edgeKnightRate)} de cavaliers au bord. Aucun début de partie n'est imposé dans l'application.`,
    '',
    'Données complètes : [positions](quality-results.json), [parties](quality-games.json), [confirmations](quality-neighbors.json), [synthèse JSON](quality-summary.json). Les essais antérieurs sont conservés séparément, sans être mélangés à ces chiffres.',
    '',
  );
  return lines.join('\n');
}
