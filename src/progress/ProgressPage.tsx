import { useEffect } from 'react';
import { ArrowLeft, Award, Check, Lock, ShieldCheck, Sparkles } from 'lucide-react';
import { openings } from '../data/openings';
import { badgeGroupName, badgeGroups, badges, type Badge } from './badges';
import { catalogueCompletion, openingCompletion } from './model';
import { useProgress } from './ProgressContext';
import { GlossaryText } from '../components/InfoTooltip';
import type { ProgressData } from './model';

export const NOTICE_MS = 5200;

function BadgeCard({ badge, data }: { badge: Badge; data: ProgressData }) {
  const date = data.unlocked[badge.id];
  const [value, goal] = badge.progress(data);
  const hidden = badge.secret && !date;
  return (
    <article className={`badge-card ${date ? 'unlocked' : 'locked'}`}>
      <div className="badge-medallion" aria-hidden="true">{date ? <ShieldCheck /> : <Lock />}</div>
      <span className="eyebrow">{badge.secret ? 'BADGE SECRET' : 'ACCOMPLISSEMENT'}</span>
      <h3>{hidden ? '???' : badge.name}</h3>
      <p>
        {hidden ? (
          'Continue à explorer Chess Progress pour révéler ce badge.'
        ) : (
          <GlossaryText>{badge.description}</GlossaryText>
        )}
      </p>
      {date ? (
        <small>Débloqué le {new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(date))}</small>
      ) : !hidden ? (
        <div className="badge-progress"><progress value={value} max={goal} aria-label={`${badge.name} : ${value} sur ${goal}`} /><span>{value} / {goal}</span></div>
      ) : null}
    </article>
  );
}

// The twenty per-opening badges live here instead of twenty extra cards: one readable row
// per opening, with its variation count and its two milestones.
function RepertoireProgress({ data }: { data: ProgressData }) {
  const catalogue = catalogueCompletion(data);
  return (
    <section className="repertoire-progress" aria-labelledby="repertoire-title">
      <div className="repertoire-heading">
        <div>
          <span className="eyebrow">TON RÉPERTOIRE</span>
          <h3 id="repertoire-title">Variantes terminées</h3>
        </div>
        <strong data-testid="catalogue-progress">
          {catalogue.done} / {catalogue.total} variantes
        </strong>
      </div>
      <ul className="repertoire-list">
        {openings.map((opening) => {
          const { done, total } = openingCompletion(data, opening.id);
          const discovered = Boolean(data.unlocked[`opening-${opening.id}`]) || done > 0;
          const mastered = Boolean(data.unlocked[`mastery-${opening.id}`]) || (total > 0 && done === total);
          return (
            <li key={opening.id} className={mastered ? 'mastered' : ''}>
              <span className="repertoire-name">{opening.name}</span>
              <span
                className="repertoire-count"
                data-testid={`repertoire-${opening.id}`}
              >
                {done} / {total}
                {mastered && (
                  <Check size={13} className="repertoire-check" aria-hidden="true" />
                )}
              </span>
              <span className="repertoire-medals">
                <span
                  className={`repertoire-medal ${discovered ? 'earned' : ''}`}
                  aria-label={`Découverte · ${opening.name} : ${discovered ? 'obtenu' : 'à obtenir'}`}
                >
                  Découverte
                </span>
                <span
                  className={`repertoire-medal ${mastered ? 'earned' : ''}`}
                  aria-label={`Maîtrise · ${opening.name} : ${mastered ? 'obtenu' : 'à obtenir'}`}
                >
                  Maîtrise
                </span>
              </span>
              <progress value={done} max={total} aria-label={`${opening.name} : ${done} sur ${total} variantes terminées`} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function ProgressPage({ onHome }: { onHome: () => void }) {
  const { data } = useProgress();
  const unlocked = badges.filter((badge) => data.unlocked[badge.id]).length;
  return (
    <main id="main" className="page-width progress-page">
      <button className="back-link" onClick={onHome}><ArrowLeft size={16} /> Retour à l’accueil</button>
      <header className="progress-hero">
        <span className="eyebrow">TON PARCOURS</span>
        <h1>Progression</h1>
        <p>Chaque badge marque une étape réelle de ton apprentissage et de ta pratique.</p>
        <div className="progress-overview"><Award size={22} /><strong>{unlocked} / {badges.length}</strong><span>accomplissements révélés</span></div>
      </header>
      {badgeGroups.map((group) => {
        const cards = badges.filter((badge) => badge.group === group && !badge.compact);
        const total = badges.filter((badge) => badge.group === group).length;
        const earned = badges.filter((badge) => badge.group === group && data.unlocked[badge.id]).length;
        return (
          <section className="badge-group" key={group} aria-labelledby={`group-${group}`}>
            <div className="badge-group-heading">
              <h2 id={`group-${group}`}>{badgeGroupName[group]}</h2>
              <span>{earned} / {total}</span>
            </div>
            {group === 'openings' && <RepertoireProgress data={data} />}
            <div className="badge-grid">
              {cards.map((badge) => <BadgeCard key={badge.id} badge={badge} data={data} />)}
            </div>
          </section>
        );
      })}
      <p className="local-progress-note"><Sparkles size={15} /> Ta progression reste uniquement sur cet appareil. Aucun compte ni serveur n’est utilisé.</p>
    </main>
  );
}

export function BadgeToast() {
  const { notice, dismiss } = useProgress();
  // Successive badges announce themselves one after another without asking for a click.
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(dismiss, NOTICE_MS);
    return () => window.clearTimeout(timer);
  }, [notice, dismiss]);
  if (!notice) return null;
  return (
    <aside className="badge-toast" role="status" aria-live="polite">
      <Award size={22} />
      <span><small>Badge débloqué</small><strong>{notice}</strong></span>
      <button onClick={dismiss} aria-label="Fermer la notification">×</button>
    </aside>
  );
}
