import type { LessonMode, Opening, Variation } from './openings';

export type OpeningPedagogy = {
  idea: string;
  objectives: [string, string, string];
};

export const openingPedagogy: Record<string, OpeningPedagogy> = {
  italian: {
    idea: 'Les Blancs occupent le centre, développent rapidement leurs pièces et dirigent le fou vers la zone sensible autour de f7.',
    objectives: ['Contrôler le centre', 'Activer le fou du roi', 'Préparer le roque'],
  },
  scotch: {
    idea: 'Les Blancs ouvrent très tôt le centre afin de donner de l’espace aux pièces et d’obtenir un jeu actif.',
    objectives: ['Ouvrir les lignes', 'Développer avec tempo', 'Stabiliser le centre'],
  },
  french: {
    idea: 'Les Noirs construisent une base solide avec e6 et d5, puis attaquent le centre blanc au bon moment.',
    objectives: ['Contester le centre', 'Préparer la rupture c5', 'Libérer le fou de cases blanches'],
  },
  scandinavian: {
    idea: 'Les Noirs défient immédiatement le pion central blanc et cherchent un développement simple après les premiers échanges.',
    objectives: ['Attaquer e4', 'Mettre la dame en sécurité', 'Développer sans perdre de temps'],
  },
  vienna: {
    idea: 'Les Blancs développent d’abord le cavalier dame et gardent la possibilité de lancer une poussée dynamique à l’aile roi.',
    objectives: ['Renforcer e4', 'Préparer f4', 'Créer une initiative rapide'],
  },
  'queens-gambit': {
    idea: 'Les Blancs mettent le pion d5 sous pression afin d’obtenir davantage d’espace et de meilleures lignes pour leurs pièces.',
    objectives: ['Contester d5', 'Développer les pièces', 'Exploiter la colonne c'],
  },
  london: {
    idea: 'Les Blancs installent une structure fiable et développent leur fou avant de fermer sa diagonale avec e3.',
    objectives: ['Sortir le fou en f4', 'Construire avec e3 et c3', 'Choisir la bonne rupture centrale'],
  },
  'caro-kann': {
    idea: 'Les Noirs préparent d5 avec c6 pour lutter contre e4 tout en gardant une structure de pions très solide.',
    objectives: ['Contester e4', 'Développer le fou avant e6', 'Achever le développement'],
  },
  sicilian: {
    idea: 'Les Noirs répondent à e4 par une attaque latérale du centre et acceptent une position déséquilibrée riche en contre-jeu.',
    objectives: ['Contrôler d4', 'Créer du contre-jeu', 'Développer selon la structure'],
  },
  'kings-indian': {
    idea: 'Les Noirs laissent d’abord les Blancs avancer au centre, mettent leur roi à l’abri, puis préparent une contre-attaque.',
    objectives: ['Installer le fianchetto', 'Roquer rapidement', 'Frapper le centre au bon moment'],
  },
};

export function lessonIntroduction(opening: Opening, variation: Variation, mode: LessonMode) {
  const content = openingPedagogy[opening.id];
  if (!content) throw new Error(`Introduction pédagogique manquante : ${opening.id}`);
  return {
    ...content,
    variation: variation.description,
    depth:
      mode === 'extended'
        ? 'La version étendue poursuit la ligne jusqu’à un plan typique de milieu de jeu.'
        : 'La ligne essentielle fixe les repères indispensables de cette variante.',
  };
}
