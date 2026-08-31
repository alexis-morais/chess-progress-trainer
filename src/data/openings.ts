import repertoire from './repertoire.json';

export type Side = 'w' | 'b';
export type LessonMode = 'essential' | 'extended';
export const lessonModes: { id: LessonMode; name: string; description: string }[] = [
  {
    id: 'essential',
    name: 'Ligne essentielle',
    description: 'Apprends les coups fondamentaux de cette variante.',
  },
  {
    id: 'extended',
    name: 'Version étendue',
    description: 'Continue plus loin pour découvrir les plans, stratégies et tactiques typiques.',
  },
];
export const modeName = (mode: LessonMode) => lessonModes.find((item) => item.id === mode)!.name;
export type LessonMove = { san: string; explanation: string; hint?: string };
export type Variation = {
  id: string;
  name: string;
  description: string;
  eco: string;
  moves: LessonMove[];
  extension: LessonMove[];
};
export type Opening = {
  id: string;
  name: string;
  side: Side;
  description: string;
  theme: string;
  previewPly: number;
  variations: Variation[];
};

// Les coups utilisent la notation SAN internationale : N = cavalier, B = fou,
// R = tour, Q = dame, K = roi. L’interface les traduit en français.
const move = (san: string, explanation: string, hint?: string): LessonMove => ({
  san,
  explanation,
  ...(hint === undefined ? {} : { hint }),
});
const e4 = move('e4', 'Tu occupes le centre et libères le passage du fou et de la dame.');
const e5 = move('e5', 'Le pion noir occupe le centre et répond à e4.');
const nf3 = move('Nf3', 'Tu développes ton cavalier, attaques e5 et prépares le roque.');
const nc6 = move('Nc6', 'Le cavalier noir se développe et défend le pion e5.');
const bc4 = move('Bc4', 'Ton fou vise la case f7, près du roi adverse.');
const castle = move('O-O', 'Tu mets ton roi à l’abri et rapproches la tour du centre.');
const openGame = [e4, e5, nf3, nc6];
const italian = [...openGame, bc4];
const scotch = [
  ...openGame,
  move('d4', 'Tu contestes le centre et ouvres des lignes pour tes pièces.'),
  move('exd4', 'Les Noirs échangent leur pion central.'),
];
const french = [
  e4,
  move('e6', 'Tu prépares la poussée d5 et ouvres la diagonale de ton fou.'),
  move('d4', 'Les Blancs installent deux pions au centre.'),
  move('d5', 'Tu contestes immédiatement le centre blanc avec d5.'),
];
const scandi = [
  e4,
  move('d5', 'Tu attaques tout de suite le pion e4 et contestes le centre.'),
  move('exd5', 'Les Blancs capturent ton pion central.'),
];
const scandiQueen = [
  ...scandi,
  move('Qxd5', 'Tu récupères le pion avec ta dame. Attention aux attaques sur celle-ci !'),
  move('Nc3', 'Les Blancs développent leur cavalier en attaquant ta dame.'),
];

// Les 16 lignes d’origine restent intactes ; leurs prolongements sont dans repertoire.json.
const originalOpenings: (Omit<Opening, 'variations'> & {
  variations: Omit<Variation, 'extension'>[];
})[] = [
  {
    id: 'italian',
    name: 'Ouverture italienne',
    side: 'w',
    theme: 'Développer avec harmonie',
    description: 'Active tes pièces, vise f7 et prépare la sécurité de ton roi.',
    previewPly: 6,
    variations: [
      {
        id: 'giuoco-piano',
        name: 'Giuoco Piano',
        eco: 'C54',
        description: 'Construis un centre de pions avec c3 et d4.',
        moves: [
          ...italian,
          move('Bc5', 'Le fou noir se développe sur une diagonale active.'),
          move('c3', 'Tu prépares d4 en donnant un soutien à ton futur pion central.'),
          move('Nf6', 'Les Noirs développent leur cavalier et attaquent e4.'),
          move('d4', 'Tu gagnes de l’espace au centre tout en attaquant le fou.'),
          move('exd4', 'Les Noirs échangent un pion au centre.'),
          move('cxd4', 'Tu reprends vers le centre et gardes deux pions côte à côte.'),
          move('Bb4+', 'Le fou noir donne échec sur la diagonale du roi.'),
          move('Bd2', 'Tu pares l’échec avec ton fou et proposes un échange.'),
        ],
      },
      {
        id: 'two-knights',
        name: 'Deux Cavaliers',
        eco: 'C55',
        description: 'Réponds au développement rapide des cavaliers noirs.',
        moves: [
          ...italian,
          move('Nf6', 'Les Noirs développent leurs deux cavaliers et attaquent e4.'),
          move('d3', 'Tu protèges e4 et ouvres la diagonale de ton second fou.'),
          move('Bc5', 'Le fou noir rejoint une case active.'),
          move('c3', 'Tu prépares une future poussée d4 au centre.'),
          move('d6', 'Les Noirs consolident e5.'),
          castle,
          move('O-O', 'Le roi noir se met à l’abri.'),
        ],
      },
      {
        id: 'pianissimo',
        name: 'Giuoco Pianissimo',
        eco: 'C50',
        description: 'Un développement calme, avec un centre bien protégé.',
        moves: [
          ...italian,
          move('Bc5', 'Le fou noir se développe face à ton petit roque.'),
          move('d3', 'Tu soutiens e4 et choisis une construction calme du centre.'),
          move('Nf6', 'Les Noirs développent leur cavalier.'),
          move('Nc3', 'Tu développes ton second cavalier et renforces le contrôle de d5.'),
          move('d6', 'Les Noirs soutiennent leur pion central.'),
          move('h3', 'Tu empêches un fou ou un cavalier adverse de venir en g4.'),
          move('a6', 'Les Noirs préparent une case de retraite pour leur fou.'),
        ],
      },
      {
        id: 'hungarian',
        name: 'Défense hongroise',
        eco: 'C50',
        description: 'Occupe le centre face à une défense noire solide.',
        moves: [
          ...italian,
          move('Be7', 'Le fou noir choisit une case prudente et prépare le roque.'),
          move('d4', 'Tu profites du jeu calme adverse pour occuper le centre.'),
          move('d6', 'Les Noirs renforcent leur pion e5.'),
          move('Nc3', 'Tu développes une pièce et renforces ton contrôle du centre.'),
          move('Nf6', 'Les Noirs développent leur cavalier et préparent le roque.'),
          castle,
          move('O-O', 'Les Noirs mettent aussi leur roi à l’abri.'),
        ],
      },
    ],
  },
  {
    id: 'scotch',
    name: 'Ouverture écossaise',
    side: 'w',
    theme: 'Prendre le centre',
    description: 'Ouvre le jeu tôt et donne de l’espace à tes pièces.',
    previewPly: 7,
    variations: [
      {
        id: 'scotch-classical',
        name: 'Variante classique',
        eco: 'C45',
        description: 'Développe-toi face au fou noir en c5.',
        moves: [
          ...scotch,
          move('Nxd4', 'Tu reprends le pion avec une pièce active au centre.'),
          move('Bc5', 'Le fou noir attaque ton cavalier d4.'),
          move('Be3', 'Tu développes ton fou tout en défendant le cavalier.'),
          move('Qf6', 'La dame noire renforce la pression sur d4.'),
          move('c3', 'Tu soutiens ton cavalier central avec un pion.'),
          move('Nge7', 'Le cavalier noir se développe sans bloquer la dame.'),
          move('Bc4', 'Tu actives ton fou en direction de f7 et prépares le roque.'),
          move('O-O', 'Le roi noir se met à l’abri.'),
        ],
      },
      {
        id: 'schmidt',
        name: 'Variante Schmidt',
        eco: 'C45',
        description: 'Échange au centre et termine ton développement.',
        moves: [
          ...scotch,
          move('Nxd4', 'Ton cavalier récupère le pion et occupe le centre.'),
          move('Nf6', 'Les Noirs attaquent e4 en développant une pièce.'),
          move('Nc3', 'Ton second cavalier défend e4 et contrôle le centre.'),
          move('Bb4', 'Le fou noir cloue ton cavalier devant ton roi.'),
          move('Nxc6', 'Tu échanges le cavalier central et modifies les pions adverses.'),
          move('bxc6', 'Les Noirs reprennent vers le centre.'),
          move('Bd3', 'Tu développes le fou, protèges e4 et prépares le roque.'),
          move('d5', 'Les Noirs contestent le centre avec leurs pions.'),
        ],
      },
      {
        id: 'scotch-gambit',
        name: 'Gambit écossais',
        eco: 'C44',
        description: 'Privilégie le développement avant de récupérer le pion.',
        moves: [
          ...scotch,
          move('Bc4', 'Tu développes ton fou plutôt que de reprendre immédiatement le pion.'),
          move('Bc5', 'Les Noirs activent aussi leur fou.'),
          move('c3', 'Tu proposes un pion pour ouvrir le centre et accélérer le développement.'),
          move('Nf6', 'Les Noirs développent une pièce et attaquent e4.'),
          move('e5', 'Tu gagnes de l’espace en attaquant le cavalier f6.'),
          move('d5', 'Les Noirs contre-attaquent au centre et attaquent ton fou.'),
          move('Bb5', 'Tu retires ton fou et cloues le cavalier c6 devant le roi.'),
          move('Ne4', 'Le cavalier noir rejoint une case centrale.'),
        ],
      },
      {
        id: 'steinitz',
        name: 'Variante Steinitz',
        eco: 'C45',
        description: 'Développe tes pièces face à une sortie précoce de la dame.',
        moves: [
          ...scotch,
          move('Nxd4', 'Tu reprends le pion et centralises ton cavalier.'),
          move('Qh4', 'La dame noire sort tôt pour attaquer le pion e4.'),
          move('Nc3', 'Tu développes ton cavalier en protégeant le pion e4.'),
          move('Bb4', 'Le fou noir cloue ton cavalier c3.'),
          move(
            'Be2',
            'Tu prépares le roque. Dans cette ligne, tu offres e4 pour développer tes pièces.',
          ),
          move('Qxe4', 'Les Noirs prennent le pion offert ; leur dame reste exposée.'),
        ],
      },
    ],
  },
  {
    id: 'french',
    name: 'Défense française',
    side: 'b',
    theme: 'Construire et contre-attaquer',
    description: 'Bâtis une défense solide, puis conteste le centre blanc.',
    previewPly: 6,
    variations: [
      {
        id: 'advance',
        name: 'Variante d’avance',
        eco: 'C02',
        description: 'Attaque la base de la chaîne de pions blanche.',
        moves: [
          ...french,
          move('e5', 'Les Blancs gagnent de l’espace et ferment le centre.'),
          move('c5', 'Tu attaques d4, la base de la chaîne de pions blanche.'),
          move('c3', 'Les Blancs soutiennent leur centre.'),
          move('Nc6', 'Tu développes ton cavalier et augmentes la pression sur d4.'),
          move('Nf3', 'Les Blancs développent leur cavalier.'),
          move('Qb6', 'Ta dame attaque d4 et regarde aussi le pion b2.'),
          move('a3', 'Les Blancs préparent b4 pour gagner de l’espace.'),
          move('Nh6', 'Ton cavalier se prépare à rejoindre f5 pour attaquer d4.'),
        ],
      },
      {
        id: 'exchange',
        name: 'Variante d’échange',
        eco: 'C01',
        description: 'Développe tes pièces dans une structure symétrique.',
        moves: [
          ...french,
          move('exd5', 'Les Blancs choisissent un échange central.'),
          move('exd5', 'Tu reprends vers le centre et libères ton fou c8.'),
          move('Nf3', 'Les Blancs développent leur cavalier.'),
          move('Nf6', 'Tu développes ton cavalier et contrôles e4.'),
          move('Bd3', 'Le fou blanc vise ton aile roi.'),
          move('Bd6', 'Tu développes ton fou sur une diagonale active.'),
          move('O-O', 'Les Blancs mettent leur roi à l’abri.'),
          castle,
        ],
      },
      {
        id: 'tarrasch',
        name: 'Variante Tarrasch',
        eco: 'C05',
        description: 'Conteste le centre face au cavalier blanc en d2.',
        moves: [
          ...french,
          move('Nd2', 'Les Blancs défendent e4 sans bloquer le pion c2.'),
          move('Nf6', 'Tu développes ton cavalier en attaquant e4.'),
          move('e5', 'Les Blancs gagnent de l’espace en attaquant ton cavalier.'),
          move('Nfd7', 'Tu retires ton cavalier et prépares une attaque du centre.'),
          move('Bd3', 'Le fou blanc se développe.'),
          move('c5', 'Tu attaques le pion d4, point de soutien du centre blanc.'),
          move('c3', 'Les Blancs renforcent d4.'),
          move('Nc6', 'Ton second cavalier rejoint la bataille pour le centre.'),
        ],
      },
      {
        id: 'french-classical',
        name: 'Variante classique',
        eco: 'C14',
        description: 'Développe-toi et prépare la rupture c5.',
        moves: [
          ...french,
          move('Nc3', 'Les Blancs défendent e4 avec leur cavalier.'),
          move('Nf6', 'Tu attaques e4 avec ton cavalier : c’est la défense classique.'),
          move('Bg5', 'Les Blancs clouent ton cavalier devant la dame.'),
          move('Be7', 'Tu prépares le roque et permets de répondre à un échange en f6.'),
          move('e5', 'Les Blancs avancent leur centre en attaquant ton cavalier.'),
          move('Nfd7', 'Tu retires ton cavalier pour ensuite contester le centre.'),
          move('Bxe7', 'Les Blancs proposent un échange de fous.'),
          move('Qxe7', 'Tu reprends le fou et libères le passage pour le roque.'),
          move('f4', 'Les Blancs soutiennent leur pion e5.'),
          move('c5', 'Tu attaques la base du centre blanc avec ton pion c.'),
        ],
      },
    ],
  },
  {
    id: 'scandinavian',
    name: 'Défense scandinave',
    side: 'b',
    theme: 'Défier le centre immédiatement',
    description: 'Prends l’initiative avec d5 et trouve les bonnes cases.',
    previewPly: 6,
    variations: [
      {
        id: 'queen-a5',
        name: 'Ligne principale · Da5',
        eco: 'B01',
        description: 'Place ta dame en a5 et développe ton fou avant e6.',
        moves: [
          ...scandiQueen,
          move('Qa5', 'Tu mets ta dame à l’abri de l’attaque du cavalier.'),
          move('d4', 'Les Blancs occupent le centre.'),
          move('Nf6', 'Tu développes ton cavalier et contrôles e4.'),
          move('Nf3', 'Les Blancs poursuivent leur développement.'),
          move('Bf5', 'Tu sors ton fou avant de jouer e6 pour ne pas l’enfermer.'),
          move('Bc4', 'Le fou blanc vise f7.'),
          move('e6', 'Tu consolides le centre et ouvres le passage de ton fou f8.'),
        ],
      },
      {
        id: 'queen-d6',
        name: 'Variante avec Dd6',
        eco: 'B01',
        description: 'Garde ta dame près du centre, puis prépare le développement.',
        moves: [
          ...scandiQueen,
          move('Qd6', 'Ta dame se retire en restant proche du centre.'),
          move('d4', 'Les Blancs occupent le centre.'),
          move('Nf6', 'Ton cavalier se développe et contrôle e4.'),
          move('Nf3', 'Les Blancs développent leur cavalier.'),
          move('a6', 'Tu empêches un cavalier ou un fou blanc de venir en b5.'),
          move('g3', 'Les Blancs préparent le développement du fou en g2.'),
          move('Bg4', 'Tu développes ton fou et cloues le cavalier devant la dame.'),
        ],
      },
      {
        id: 'queen-d8',
        name: 'Retraite de la dame · Dd8',
        eco: 'B01',
        description: 'Remets ta dame en sécurité et construis une position solide.',
        moves: [
          ...scandiQueen,
          move('Qd8', 'Tu remets ta dame en sécurité pour développer tes autres pièces.'),
          move('d4', 'Les Blancs occupent le centre.'),
          move('Nf6', 'Tu développes ton cavalier et contrôles e4.'),
          move('Nf3', 'Les Blancs développent leur cavalier.'),
          move('Bg4', 'Tu actives ton fou avant de fermer sa diagonale avec e6.'),
          move('Be2', 'Les Blancs préparent le roque et neutralisent le clouage.'),
          move('e6', 'Tu consolides ta position et libères ton second fou.'),
        ],
      },
      {
        id: 'modern',
        name: 'Variante moderne · Cf6',
        eco: 'B01',
        description: 'Récupère le pion avec un cavalier plutôt qu’avec la dame.',
        moves: [
          ...scandi,
          move('Nf6', 'Tu développes ton cavalier pour reprendre d5 sans exposer ta dame.'),
          move('d4', 'Les Blancs occupent le centre.'),
          move('Nxd5', 'Tu récupères le pion avec un cavalier actif au centre.'),
          move('c4', 'Les Blancs attaquent ton cavalier et gagnent de l’espace.'),
          move('Nb6', 'Tu retires ton cavalier sur une case sûre.'),
          move('Nf3', 'Les Blancs développent une pièce.'),
          move('g6', 'Tu prépares le développement de ton fou sur la grande diagonale.'),
          move('Nc3', 'Les Blancs développent leur second cavalier.'),
          move('Bg7', 'Ton fou rejoint la grande diagonale et tu prépares le roque.'),
        ],
      },
    ],
  },
];

const newOpenings: Omit<Opening, 'variations'>[] = [
  {
    id: 'vienna',
    name: 'Partie viennoise',
    side: 'w',
    theme: 'Préparer un jeu dynamique',
    description: 'Développe le cavalier dame et découvre la force de la poussée f4.',
    previewPly: 4,
  },
  {
    id: 'queens-gambit',
    name: 'Gambit Dame',
    side: 'w',
    theme: 'Construire le centre',
    description: 'Conteste d5 avec c4 et découvre les grandes structures de pions.',
    previewPly: 4,
  },
  {
    id: 'london',
    name: 'Système de Londres',
    side: 'w',
    theme: 'Comprendre une structure',
    description: 'Place ton fou en f4 et adapte ton plan aux réponses des Noirs.',
    previewPly: 6,
  },
  {
    id: 'caro-kann',
    name: 'Défense Caro-Kann',
    side: 'b',
    theme: 'Solidité et activité',
    description: 'Prépare d5 avec c6, puis trouve de bonnes cases pour tes pièces.',
    previewPly: 4,
  },
  {
    id: 'sicilian',
    name: 'Défense sicilienne',
    side: 'b',
    theme: 'Créer du contre-jeu',
    description: 'Déséquilibre le centre et explore les plans sur les deux ailes.',
    previewPly: 6,
  },
  {
    id: 'kings-indian',
    name: 'Défense Est-Indienne',
    side: 'b',
    theme: 'Frapper au bon moment',
    description: 'Prépare ton fianchetto avant de défier le grand centre blanc.',
    previewPly: 8,
  },
];

export const openings: Opening[] = [...originalOpenings, ...newOpenings].map((opening) => {
  const original = originalOpenings.find((item) => item.id === opening.id);
  return {
    ...opening,
    variations: repertoire
      .filter((item) => item.openingId === opening.id)
      .map((item) => {
        const legacy = original?.variations.find((variation) => variation.id === item.id);
        if (legacy) return { ...legacy, extension: item.extension };
        if (!item.name || !item.eco || !item.description || !item.moves) {
          throw new Error(`Données de variante incomplètes : ${item.id}`);
        }
        return {
          id: item.id,
          name: item.name,
          eco: item.eco,
          description: item.description,
          moves: item.moves,
          extension: item.extension,
        };
      }),
  };
});

// L’extension contient uniquement les nouveaux coups : le préfixe ne peut pas diverger.
export const getLessonMoves = (variation: Variation, mode: LessonMode): LessonMove[] =>
  mode === 'essential' ? variation.moves : [...variation.moves, ...variation.extension];

export const learnerMoveCount = (side: Side, plies: number) =>
  side === 'w' ? Math.ceil(plies / 2) : Math.floor(plies / 2);

export const sideName = (side: Side) => (side === 'w' ? 'Blancs' : 'Noirs');
export const frenchSan = (san: string) =>
  san.replace(/[NBRQK]/g, (piece) => ({ N: 'C', B: 'F', R: 'T', Q: 'D', K: 'R' })[piece]!);
