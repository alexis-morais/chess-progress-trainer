import { openings } from '../data/openings';
import {
  catalogueCompletion,
  openingCompletion,
  openingMastered,
  openingStarted,
  type ProgressData,
} from './model';

export const badgeGroups = ['general', 'openings', 'tactics', 'freeplay', 'secret'] as const;
export type BadgeGroup = (typeof badgeGroups)[number];
export const badgeGroupName: Record<BadgeGroup, string> = {
  general: 'Général',
  openings: 'Ouvertures',
  tactics: 'Tactiques',
  freeplay: 'Partie libre',
  secret: 'Badges secrets',
};

export type Badge = {
  id: string;
  name: string;
  description: string;
  group: BadgeGroup;
  secret?: boolean;
  // Per-opening badges are shown inside the compact repertoire panel instead of a full card.
  compact?: boolean;
  progress: (data: ProgressData) => [number, number];
  achieved: (data: ProgressData) => boolean;
};

const learned = (data: ProgressData) => Object.keys(data.training);
const essentialPerfect = (data: ProgressData) =>
  Object.entries(data.training).filter(([key, value]) => key.endsWith('/essential') && value.bestErrors === 0).length;
const anyOpeningMastered = (data: ProgressData) =>
  openings.some((opening) => openingMastered(data, opening.id));
const startedOpenings = (data: ProgressData) =>
  openings.filter((opening) => openingStarted(data, opening.id)).length;
const won = (level: number) => (data: ProgressData) => data.wonLevels.some((entry) => entry >= level);
const count = (value: (data: ProgressData) => number, goal: number) => (data: ProgressData): [number, number] => [Math.min(goal, value(data)), goal];
const yes = (value: (data: ProgressData) => boolean) => (data: ProgressData): [number, number] => [value(data) ? 1 : 0, 1];

// One badge per opening: finishing a first variation, then all of them.
export const openingBadges: Badge[] = openings.flatMap((opening) => [
  {
    id: `opening-${opening.id}`,
    name: `Découverte · ${opening.name}`,
    description: `Terminer une première variante de ${opening.name}.`,
    group: 'openings' as const,
    compact: true,
    progress: count((data) => openingCompletion(data, opening.id).done, 1),
    achieved: (data: ProgressData) => openingStarted(data, opening.id),
  },
  {
    id: `mastery-${opening.id}`,
    name: `Maîtrise · ${opening.name}`,
    description: `Terminer les ${opening.variations.length} variantes de ${opening.name}.`,
    group: 'openings' as const,
    compact: true,
    progress: (data: ProgressData): [number, number] => {
      const { done, total } = openingCompletion(data, opening.id);
      return [done, total];
    },
    achieved: (data: ProgressData) => openingMastered(data, opening.id),
  },
]);

export const badges: Badge[] = [
  { id: 'first-step', name: 'Premier pas', description: 'Terminer une première variante.', group: 'general', progress: count((d) => learned(d).length, 1), achieved: (d) => learned(d).length >= 1 },
  { id: 'explorer', name: 'Explorateur', description: 'Terminer au moins une variante dans chacune des dix ouvertures.', group: 'openings', progress: count(startedOpenings, openings.length), achieved: (d) => startedOpenings(d) >= openings.length },
  { id: 'no-net', name: 'Sans filet', description: 'Terminer une variante sans utiliser Solution.', group: 'general', progress: yes((d) => Object.values(d.training).some((v) => v.withoutSolution)), achieved: (d) => Object.values(d.training).some((v) => v.withoutSolution) },
  { id: 'steel-memory', name: 'Mémoire d’acier', description: 'Terminer une ligne essentielle sans erreur.', group: 'general', progress: count(essentialPerfect, 1), achieved: (d) => essentialPerfect(d) >= 1 },
  { id: 'theorist', name: 'Première maîtrise', description: 'Terminer toutes les variantes d’une première ouverture.', group: 'openings', progress: yes(anyOpeningMastered), achieved: anyOpeningMastered },
  { id: 'grand-theorist', name: 'Grand Théoricien', description: 'Terminer toutes les variantes de toutes les ouvertures du catalogue.', group: 'openings', progress: (d) => { const { done, total } = catalogueCompletion(d); return [done, total]; }, achieved: (d) => { const { done, total } = catalogueCompletion(d); return total > 0 && done === total; } },
  { id: 'second-reading', name: 'Seconde lecture', description: 'Rejouer sans erreur une variante déjà découverte.', group: 'general', progress: yes((d) => Object.values(d.training).some((v) => v.replayedWithoutError === true)), achieved: (d) => Object.values(d.training).some((v) => v.replayedWithoutError === true) },
  { id: 'solid-series', name: 'Série solide', description: 'Terminer cinq lignes différentes sans erreur.', group: 'general', progress: count((d) => Object.values(d.training).filter((v) => v.bestErrors === 0).length, 5), achieved: (d) => Object.values(d.training).filter((v) => v.bestErrors === 0).length >= 5 },
  { id: 'tactical-eye', name: 'Œil tactique', description: 'Résoudre cinq tactiques.', group: 'tactics', progress: count((d) => d.tactics.length, 5), achieved: (d) => d.tactics.length >= 5 },
  { id: 'tactician', name: 'Tacticien', description: 'Résoudre les vingt tactiques.', group: 'tactics', progress: count((d) => d.tactics.length, 20), achieved: (d) => d.tactics.length >= 20 },
  { id: 'first-duel', name: 'Premier duel', description: 'Terminer une Partie libre.', group: 'freeplay', progress: count((d) => d.games, 1), achieved: (d) => d.games >= 1 },
  { id: 'first-review', name: 'Première analyse', description: 'Terminer un premier Game Review.', group: 'freeplay', progress: count((d) => d.reviews, 1), achieved: (d) => d.reviews >= 1 },
  { id: 'cap-1000', name: 'Cap des 1000', description: 'Battre le niveau estimé à environ 1000.', group: 'freeplay', progress: yes(won(6)), achieved: won(6) },
  { id: 'cap-1200', name: 'Cap des 1200', description: 'Battre le niveau estimé à environ 1200.', group: 'freeplay', progress: yes(won(8)), achieved: won(8) },
  { id: 'cap-1600', name: 'Cap des 1600', description: 'Battre le niveau estimé à environ 1600.', group: 'freeplay', progress: yes(won(12)), achieved: won(12) },
  { id: 'cap-2000', name: 'Cap des 2000', description: 'Battre le niveau estimé à environ 2000.', group: 'freeplay', progress: yes(won(16)), achieved: won(16) },
  ...openingBadges,
  { id: 'underpromotion', name: 'Sous-promotion', description: 'Promouvoir volontairement un pion en tour, fou ou cavalier en Partie libre.', group: 'secret', secret: true, progress: yes((d) => d.underpromotion), achieved: (d) => d.underpromotion },
  { id: 'perfectionist', name: 'Perfectionniste', description: 'Terminer une ligne étendue sans erreur, Indice ni Solution.', group: 'secret', secret: true, progress: yes((d) => Object.values(d.training).some((v) => v.perfect)), achieved: (d) => Object.values(d.training).some((v) => v.perfect) },
  { id: 'comeback', name: 'Retour gagnant', description: 'Gagner après avoir été nettement moins bien selon le bilan moteur.', group: 'secret', secret: true, progress: yes((d) => d.comeback), achieved: (d) => d.comeback },
  { id: 'david', name: 'David contre Goliath', description: 'Battre un niveau au moins quatre niveaux au-dessus de ton précédent meilleur résultat.', group: 'secret', secret: true, progress: yes((d) => Object.prototype.hasOwnProperty.call(d.unlocked, 'david')), achieved: (d) => Object.prototype.hasOwnProperty.call(d.unlocked, 'david') },
  { id: 'impossible', name: 'Défier l’impossible', description: 'Battre le Niveau 25 Maximum.', group: 'secret', secret: true, progress: yes(won(25)), achieved: won(25) },
];
