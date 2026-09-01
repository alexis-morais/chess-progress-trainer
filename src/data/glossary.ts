export const glossary = {
  Promotion:
    'Lorsqu’un pion atteint la dernière rangée, il devient une dame, une tour, un fou ou un cavalier.',
  Roque: 'Un coup spécial qui met le roi à l’abri et développe une tour en même temps.',
  'Prise en passant':
    'Une capture spéciale possible juste après qu’un pion adverse avance de deux cases à côté du tien.',
  Fourchette: 'Une même pièce attaque au moins deux cibles en même temps.',
  Clouage: 'Une pièce ne peut pas bouger sans exposer une pièce plus importante derrière elle.',
  Enfilade: 'Une pièce de grande valeur doit bouger et laisse une autre cible derrière elle.',
  Découverte: 'Une pièce bouge et libère l’attaque d’une autre pièce placée derrière elle.',
  'Fianchetto': 'Développement d’un fou sur une grande diagonale, derrière un pion avancé.',
  'Gaffe': 'Un coup qui détériore très fortement la position, souvent en perdant du matériel.',
  'Précision estimée':
    'Un indicateur local calculé à partir des pertes d’évaluation de tes coups. Ce n’est pas une note officielle.',
} as const;

export type GlossaryTerm = keyof typeof glossary;
