import { Component, lazy, Suspense, useMemo, useState, type ReactNode } from 'react';
import { ArrowUpRight, BookOpen, ShieldCheck } from 'lucide-react';
import { openings, type LessonMode, type Opening, type Variation } from './data/openings';
import { compileLesson } from './trainer/model';
import { OpeningLibrary } from './components/OpeningLibrary';
import { Trainer } from './components/Trainer';

const ComputerMode = lazy(() => import('./computer/ComputerMode'));

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
  const [active, setActive] = useState<Selection | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [mode, setMode] = useState<LessonMode | null>(null);
  const [session, setSession] = useState(0);
  const [computer, setComputer] = useState(false);
  function goHome() {
    setComputer(false);
    setActive(null);
    setExpanded(null);
    setSelected(null);
    setMode(null);
    window.scrollTo(0, 0);
  }
  function variants() {
    setComputer(false);
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
            <a
              href="#comment-ca-marche"
              onClick={() => {
                setActive(null);
                setComputer(false);
              }}
            >
              Comment ça marche <ArrowUpRight size={13} />
            </a>
          </nav>
          <span className="free-badge">
            <ShieldCheck size={15} />
            Gratuit & sans inscription
          </span>
        </div>
      </header>
      {computer ? (
        <Suspense
          fallback={
            <main id="main" className="page-width">
              <p role="status">Chargement du mode Partie libre…</p>
            </main>
          }
        >
          <ComputerMode onHome={goHome} />
        </Suspense>
      ) : active ? (
        <ActiveTrainer
          key={`${active.variation.id}-${active.mode}-${session}`}
          selection={active}
          onRestart={() => setSession((value) => value + 1)}
          onVariants={variants}
          onHome={goHome}
        />
      ) : (
        <OpeningLibrary
          onComputer={() => {
            setComputer(true);
            window.scrollTo(0, 0);
          }}
          openings={openings}
          expanded={expanded}
          selected={selected}
          mode={mode}
          onMode={setMode}
          onExpand={(id) => {
            setExpanded(expanded === id ? null : id);
            setSelected(null);
            setMode(null);
          }}
          onSelect={(id) => {
            setSelected(id);
            setMode(null);
          }}
          onStart={(opening, variation, mode) => {
            setActive({ opening, variation, mode });
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

type Selection = { opening: Opening; variation: Variation; mode: LessonMode };
function ActiveTrainer({
  selection,
  ...actions
}: {
  selection: Selection;
  onRestart: () => void;
  onVariants: () => void;
  onHome: () => void;
}) {
  // Only the selected lesson is replayed. The catalogue does not run 120 analyses.
  const lesson = useMemo(
    () => compileLesson(selection.opening, selection.variation, selection.mode),
    [selection],
  );
  return <Trainer lesson={lesson} {...actions} />;
}
