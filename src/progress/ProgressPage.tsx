import { ArrowLeft, Award, Lock, ShieldCheck, Sparkles } from 'lucide-react';
import { badges } from './badges';
import { useProgress } from './ProgressContext';

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
      <section className="badge-grid" aria-label="Accomplissements">
        {badges.map((badge) => {
          const date = data.unlocked[badge.id];
          const [value, goal] = badge.progress(data);
          const hidden = badge.secret && !date;
          return (
            <article className={`badge-card ${date ? 'unlocked' : 'locked'}`} key={badge.id}>
              <div className="badge-medallion" aria-hidden="true">{date ? <ShieldCheck /> : <Lock />}</div>
              <span className="eyebrow">{badge.secret ? 'BADGE SECRET' : 'ACCOMPLISSEMENT'}</span>
              <h2>{hidden ? '???' : badge.name}</h2>
              <p>{hidden ? 'Continue à explorer Chess Progress pour révéler ce badge.' : badge.description}</p>
              {date ? (
                <small>Débloqué le {new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(date))}</small>
              ) : !hidden ? (
                <div className="badge-progress"><progress value={value} max={goal} aria-label={`${badge.name} : ${value} sur ${goal}`} /><span>{value} / {goal}</span></div>
              ) : null}
            </article>
          );
        })}
      </section>
      <p className="local-progress-note"><Sparkles size={15} /> Ta progression reste uniquement sur cet appareil. Aucun compte ni serveur n’est utilisé.</p>
    </main>
  );
}

export function BadgeToast() {
  const { notice, dismiss } = useProgress();
  if (!notice) return null;
  return (
    <aside className="badge-toast" role="status" aria-live="polite">
      <Award size={22} />
      <span><small>Badge débloqué</small><strong>{notice}</strong></span>
      <button onClick={dismiss} aria-label="Fermer la notification">×</button>
    </aside>
  );
}
