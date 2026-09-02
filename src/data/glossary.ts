// Single source of truth for every chess word explained to a beginner.
// The key is the canonical wording shown in the tooltip title; `glossaryAliases`
// lists the inflected forms that must open the same definition.
export const glossary = {
  Promotion:
    'Lorsqu’un pion atteint la dernière rangée, il devient une dame, une tour, un fou ou un cavalier.',
  'Sous-promotion':
    'Promouvoir un pion en tour, en fou ou en cavalier plutôt qu’en dame, parce que la position le demande.',
  Roque: 'Un coup spécial qui met le roi à l’abri et développe une tour en même temps.',
  'Petit roque': 'Le roque du côté du roi, le côté le plus court. Il s’écrit O-O.',
  'Grand roque': 'Le roque du côté de la dame, le côté le plus long. Il s’écrit O-O-O.',
  'Prise en passant':
    'Une capture spéciale possible juste après qu’un pion adverse avance de deux cases à côté du tien.',
  Fourchette: 'Une même pièce attaque au moins deux cibles en même temps.',
  Clouage: 'Une pièce ne peut pas bouger sans exposer une pièce plus importante derrière elle.',
  Enfilade: 'Une pièce de grande valeur doit bouger et laisse une autre cible derrière elle.',
  'Attaque à la découverte':
    'Une pièce bouge et libère l’attaque d’une autre pièce placée derrière elle.',
  Découverte: 'Une pièce bouge et libère l’attaque d’une autre pièce placée derrière elle.',
  Fianchetto: 'Développement d’un fou sur une grande diagonale, derrière un pion avancé.',
  Gambit: 'Une ouverture où l’on offre volontairement du matériel pour obtenir du jeu actif.',
  Sacrifice: 'Donner volontairement du matériel pour obtenir une attaque ou un avantage.',
  Tempo: 'Une unité de temps : gagner un tempo, c’est progresser en obligeant l’adversaire à réagir.',
  Initiative: 'La capacité à imposer les menaces et à obliger l’adversaire à répondre.',
  Développement: 'Faire sortir tes pièces de leur case de départ vers des cases actives.',
  Coordination: 'La façon dont tes pièces se défendent et travaillent ensemble sur un même plan.',
  Centre: 'Les cases centrales d4, e4, d5 et e5, d’où les pièces agissent sur les deux ailes.',
  'Aile roi': 'La moitié de l’échiquier du côté du roi, les colonnes e à h.',
  'Aile dame': 'La moitié de l’échiquier du côté de la dame, les colonnes a à d.',
  Colonne: 'Une ligne verticale de l’échiquier, de a à h.',
  Rangée: 'Une ligne horizontale de l’échiquier, de 1 à 8.',
  Diagonale: 'Une ligne oblique de cases de même couleur, empruntée par les fous et la dame.',
  'Colonne ouverte': 'Une colonne sans aucun pion, idéale pour y placer une tour.',
  'Structure de pions':
    'La disposition d’ensemble des pions : elle oriente les plans des deux camps.',
  'Pion isolé': 'Un pion sans pion ami sur les colonnes voisines : il doit être défendu par des pièces.',
  'Pions doublés': 'Deux pions du même camp sur la même colonne, souvent moins mobiles.',
  'Pion passé': 'Un pion qu’aucun pion adverse ne peut plus arrêter sur sa route vers la promotion.',
  Menace: 'Un coup qui prépare un gain immédiat si l’adversaire ne réagit pas.',
  'Contre-attaque': 'Répondre à une menace par une menace au moins aussi forte.',
  Capture: 'Prendre une pièce adverse en occupant sa case.',
  Matériel: 'La valeur totale de tes pièces et de tes pions comparée à celle de l’adversaire.',
  Échec: 'Le roi est attaqué : il faut répondre immédiatement à cette attaque.',
  'Échec et mat': 'Le roi est attaqué et aucune réponse légale ne peut le sauver : la partie est finie.',
  Pat: 'Le camp au trait n’a aucun coup légal et n’est pas en échec : la partie est nulle.',
  Nulle: 'Une partie qui se termine sans vainqueur.',
  Répétition: 'La même position revient trois fois : la partie est déclarée nulle.',
  'Règle des 50 coups':
    'Cinquante coups sans capture ni mouvement de pion : la partie est déclarée nulle.',
  'Matériel insuffisant': 'Aucun camp ne possède assez de matériel pour mater : la partie est nulle.',
  Abandon: 'Reconnaître la défaite avant le mat et arrêter la partie.',
  'Milieu de jeu': 'La phase qui suit l’ouverture, où les plans et les combinaisons se décident.',
  Finale: 'La phase avec peu de pièces, où le roi devient une pièce active et les pions décisifs.',
  Ouverture: 'Les premiers coups d’une partie, qui installent le centre et le développement.',
  Variante: 'Une suite de coups connue à l’intérieur d’une ouverture.',
  'Demi-coup': 'Le mouvement d’un seul camp. Deux demi-coups forment un coup complet.',
  Évaluation:
    'La valeur que le moteur donne à une position. Positive, elle favorise les Blancs ; négative, les Noirs.',
  Gaffe: 'Un coup qui détériore très fortement la position, souvent en perdant du matériel.',
  'Précision estimée':
    'Un indicateur local calculé à partir des pertes d’évaluation de tes coups. Ce n’est pas une note officielle.',
  Elo: 'Une échelle de force. Ici, les valeurs sont des repères estimés, pas un classement humain certifié.',
  ECO: 'Le code international qui identifie une ouverture, par exemple C50 pour l’Italienne.',
} as const;

export type GlossaryTerm = keyof typeof glossary;

// Inflected or alternative wordings that must open the same definition.
export const glossaryAliases: Partial<Record<GlossaryTerm, string[]>> = {
  Fourchette: ['fourchettes'],
  Clouage: ['clouages', 'cloue', 'cloué', 'clouée'],
  Enfilade: ['enfilades'],
  Gambit: ['gambits'],
  Sacrifice: ['sacrifices'],
  Menace: ['menaces'],
  Capture: ['captures'],
  Colonne: ['colonnes'],
  Rangée: ['rangées'],
  Diagonale: ['diagonales'],
  'Colonne ouverte': ['colonnes ouvertes'],
  'Pion isolé': ['pions isolés', 'pion isolé'],
  'Pions doublés': ['pion doublé'],
  'Pion passé': ['pions passés'],
  Promotion: ['promotions'],
  Roque: ['roques'],
  Variante: ['variantes'],
  Ouverture: ['ouvertures'],
  'Demi-coup': ['demi-coups'],
  Évaluation: ['évaluations'],
  Gaffe: ['gaffes'],
  Tempo: ['tempi'],
  Nulle: ['nulles'],
};
