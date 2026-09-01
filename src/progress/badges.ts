import type { ProgressData } from './model';

export type Badge = {
  id: string;
  name: string;
  description: string;
  secret?: boolean;
  progress: (data: ProgressData) => [number, number];
  achieved: (data: ProgressData) => boolean;
};

const learned = (data: ProgressData) => Object.keys(data.training);
const essentialPerfect = (data: ProgressData) =>
  Object.entries(data.training).filter(([key, value]) => key.endsWith('/essential') && value.bestErrors === 0).length;
const openingMastered = (data: ProgressData) => {
  const variants = new Map<string, Set<string>>();
  for (const key of learned(data)) {
    const [opening, variation] = key.split('/');
    if (!variants.has(opening)) variants.set(opening, new Set());
    variants.get(opening)!.add(variation);
  }
  return [...variants.values()].some((entries) => entries.size >= 6);
};
const won = (level: number) => (data: ProgressData) => data.wonLevels.some((entry) => entry >= level);
const count = (value: (data: ProgressData) => number, goal: number) => (data: ProgressData): [number, number] => [Math.min(goal, value(data)), goal];
const yes = (value: (data: ProgressData) => boolean) => (data: ProgressData): [number, number] => [value(data) ? 1 : 0, 1];

export const badges: Badge[] = [
  { id: 'first-step', name: 'Premier pas', description: 'Terminer une première variante.', progress: count((d) => learned(d).length, 1), achieved: (d) => learned(d).length >= 1 },
  { id: 'explorer', name: 'Explorateur', description: 'Découvrir les dix ouvertures.', progress: count((d) => d.discoveries.length, 10), achieved: (d) => d.discoveries.length >= 10 },
  { id: 'no-net', name: 'Sans filet', description: 'Terminer une variante sans utiliser Solution.', progress: yes((d) => Object.values(d.training).some((v) => v.withoutSolution)), achieved: (d) => Object.values(d.training).some((v) => v.withoutSolution) },
  { id: 'steel-memory', name: 'Mémoire d’acier', description: 'Terminer une ligne essentielle sans erreur.', progress: count(essentialPerfect, 1), achieved: (d) => essentialPerfect(d) >= 1 },
  { id: 'theorist', name: 'Théoricien', description: 'Maîtriser les six variantes d’une ouverture.', progress: yes(openingMastered), achieved: openingMastered },
  { id: 'second-reading', name: 'Seconde lecture', description: 'Rejouer sans erreur une variante déjà découverte.', progress: yes((d) => Object.values(d.training).some((v) => v.replayedWithoutError === true)), achieved: (d) => Object.values(d.training).some((v) => v.replayedWithoutError === true) },
  { id: 'solid-series', name: 'Série solide', description: 'Terminer cinq lignes différentes sans erreur.', progress: count((d) => Object.values(d.training).filter((v) => v.bestErrors === 0).length, 5), achieved: (d) => Object.values(d.training).filter((v) => v.bestErrors === 0).length >= 5 },
  { id: 'tactical-eye', name: 'Œil tactique', description: 'Résoudre cinq tactiques.', progress: count((d) => d.tactics.length, 5), achieved: (d) => d.tactics.length >= 5 },
  { id: 'tactician', name: 'Tacticien', description: 'Résoudre les vingt tactiques.', progress: count((d) => d.tactics.length, 20), achieved: (d) => d.tactics.length >= 20 },
  { id: 'first-duel', name: 'Premier duel', description: 'Terminer une Partie libre.', progress: count((d) => d.games, 1), achieved: (d) => d.games >= 1 },
  { id: 'first-review', name: 'Première analyse', description: 'Terminer un premier Game Review.', progress: count((d) => d.reviews, 1), achieved: (d) => d.reviews >= 1 },
  { id: 'cap-1000', name: 'Cap des 1000', description: 'Battre le niveau estimé à environ 1000.', progress: yes(won(6)), achieved: won(6) },
  { id: 'cap-1200', name: 'Cap des 1200', description: 'Battre le niveau estimé à environ 1200.', progress: yes(won(8)), achieved: won(8) },
  { id: 'cap-1600', name: 'Cap des 1600', description: 'Battre le niveau estimé à environ 1600.', progress: yes(won(12)), achieved: won(12) },
  { id: 'cap-2000', name: 'Cap des 2000', description: 'Battre le niveau estimé à environ 2000.', progress: yes(won(16)), achieved: won(16) },
  { id: 'underpromotion', name: 'Sous-promotion', description: 'Promouvoir volontairement un pion en tour, fou ou cavalier en Partie libre.', secret: true, progress: yes((d) => d.underpromotion), achieved: (d) => d.underpromotion },
  { id: 'perfectionist', name: 'Perfectionniste', description: 'Terminer une ligne étendue sans erreur, Indice ni Solution.', secret: true, progress: yes((d) => Object.values(d.training).some((v) => v.perfect)), achieved: (d) => Object.values(d.training).some((v) => v.perfect) },
  { id: 'comeback', name: 'Retour gagnant', description: 'Gagner après avoir été nettement moins bien selon le bilan moteur.', secret: true, progress: yes((d) => d.comeback), achieved: (d) => d.comeback },
  { id: 'david', name: 'David contre Goliath', description: 'Battre un niveau au moins quatre niveaux au-dessus de ton précédent meilleur résultat.', secret: true, progress: yes((d) => Object.prototype.hasOwnProperty.call(d.unlocked, 'david')), achieved: (d) => Object.prototype.hasOwnProperty.call(d.unlocked, 'david') },
  { id: 'impossible', name: 'Défier l’impossible', description: 'Battre le Niveau 25 Maximum.', secret: true, progress: yes(won(25)), achieved: won(25) },
];
