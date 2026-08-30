import { Component, lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ArrowUpRight, BookOpen, Cpu, House, Moon, Sun } from 'lucide-react';
import { openings, type LessonMode, type Opening, type Variation } from './data/openings';
import { compileLesson } from './trainer/model';
import { OpeningLibrary } from './components/OpeningLibrary';
import { Trainer } from './components/Trainer';
import { HomePage } from './components/HomePage';
import { useTheme } from './ui/theme';
import { useNavigation, type AppView } from './ui/navigation';

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
  const { view, navigate } = useNavigation();
  const { theme, toggle } = useTheme();
  useEffect(() => {
    setActive(null);
  }, [view]);
  function openView(next: AppView) {
    setActive(null);
    navigate(next);
  }
  function goHome() {
    navigate('home');
    setActive(null);
    setExpanded(null);
    setSelected(null);
    setMode(null);
    window.scrollTo(0, 0);
  }
  function variants() {
    navigate('openings');
    setActive(null);
    window.scrollTo(0, 0);
  }
  return (
    <>
      <a
        href="#main"
        className="skip-link"
        onClick={(event) => {
          event.preventDefault();
          const main = document.getElementById('main');
          if (main) {
            main.tabIndex = -1;
            main.focus();
          }
        }}
      >
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
              Chess Progress<small>LE JEU. LA PROGRESSION.</small>
            </span>
          </button>
          <nav aria-label="Navigation principale">
            <button aria-current={view === 'home' ? 'page' : undefined} onClick={goHome}>
              <House size={16} />
              Accueil
            </button>
            <button aria-current={view === 'openings' ? 'page' : undefined} onClick={variants}>
              <BookOpen size={16} />
              Ouvertures
            </button>
            <button
              aria-current={view === 'computer' ? 'page' : undefined}
              onClick={() => openView('computer')}
            >
              <Cpu size={16} />
              Partie libre
            </button>
          </nav>
          <button
            className="theme-switch"
            onClick={toggle}
            aria-label={`Activer le thème ${theme === 'dark' ? 'clair' : 'sombre'}`}
            title={`Passer au thème ${theme === 'dark' ? 'clair' : 'sombre'}`}
          >
            {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
            <span>{theme === 'dark' ? 'Sombre' : 'Clair'}</span>
          </button>
        </div>
      </header>
      {view === 'home' ? (
        <HomePage onOpenings={() => openView('openings')} onComputer={() => openView('computer')} />
      ) : view === 'computer' ? (
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
          onHome={goHome}
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
