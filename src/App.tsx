import { Component, useMemo, useState, type ReactNode } from 'react';
import { ArrowUpRight, BookOpen, ShieldCheck } from 'lucide-react';
import { openings } from './data/openings';
import { compileLesson, type CompiledLesson } from './trainer/model';
import { OpeningLibrary } from './components/OpeningLibrary';
import { Trainer } from './components/Trainer';

export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error) {
    console.error('Chess Progress :', error);
  }
  render() {
    if (this.state.error)
      return (
        <main className="error-page">
          <h1>Cette séance ne peut pas être chargée.</h1>
          <p>
            Une donnée de variante est invalide ou une erreur est survenue. Le détail est disponible
            dans la console.
          </p>
          {import.meta.env.DEV && <pre>{this.state.error.message}</pre>}
          <button className="button primary" onClick={() => window.location.reload()}>
            Recharger l’application
          </button>
        </main>
      );
    return this.props.children;
  }
}

export default function App() {
  const lessons = useMemo(
    () =>
      openings.flatMap((opening) =>
        opening.variations.map((variation) => compileLesson(opening, variation)),
      ),
    [],
  );
  const [active, setActive] = useState<CompiledLesson | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [session, setSession] = useState(0);
  function goHome() {
    setActive(null);
    setExpanded(null);
    setSelected(null);
    window.scrollTo(0, 0);
  }
  function variants() {
    setActive(null);
    window.scrollTo(0, 0);
  }
  return (
    <>
      <a href="#main" className="skip-link">
        Aller au contenu
      </a>
      <header className="site-header">
        <div className="page-width header-inner">
          <button
            className="brand"
            onClick={goHome}
            aria-label="Chess Progress, retour à l’accueil"
          >
            <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width="39" height="39" />
            <span>
              Chess Progress<small>OPENING TRAINER</small>
            </span>
          </button>
          <nav aria-label="Navigation principale">
            <button className="nav-active" onClick={variants}>
              <BookOpen size={16} />
              Entraînement
            </button>
            <a href="#comment-ca-marche" onClick={() => setActive(null)}>
              Comment ça marche <ArrowUpRight size={13} />
            </a>
          </nav>
          <span className="free-badge">
            <ShieldCheck size={15} />
            Gratuit & sans inscription
          </span>
        </div>
      </header>
      {active ? (
        <Trainer
          key={`${active.variation.id}-${session}`}
          lesson={active}
          onRestart={() => setSession((value) => value + 1)}
          onVariants={variants}
          onHome={goHome}
        />
      ) : (
        <OpeningLibrary
          openings={openings}
          lessons={lessons}
          expanded={expanded}
          selected={selected}
          onExpand={(id) => {
            setExpanded(expanded === id ? null : id);
            setSelected(null);
          }}
          onSelect={setSelected}
          onStart={(lesson) => {
            setActive(lesson);
            setSession((value) => value + 1);
            window.scrollTo(0, 0);
          }}
        />
      )}
      <footer className="site-footer page-width">
        <p>Chess Progress Project 2026 — Prototype pédagogique</p>
        <a href={`${import.meta.env.BASE_URL}licences.html`} target="_blank" rel="noreferrer">
          Logiciels libres & crédits <ArrowUpRight size={12} />
        </a>
      </footer>
    </>
  );
}
