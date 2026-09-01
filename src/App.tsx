import { Component, lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ArrowUpRight, BookOpen, Cpu, House, Moon, Sun, Trophy } from 'lucide-react';
import { openings, type LessonMode, type Opening, type Variation } from './data/openings';
import { compileLesson } from './trainer/model';
import { OpeningLibrary } from './components/OpeningLibrary';
import { Trainer } from './components/Trainer';
import { HomePage } from './components/HomePage';
import { useTheme } from './ui/theme';
import { useNavigation, type AppView } from './ui/navigation';
import { compileTactic, tacticsFor, type Tactic } from './tactics/model';
import { TacticTrainer } from './tactics/TacticTrainer';
import './ui/mobile.css';
import { OpeningIntroduction } from './components/OpeningIntroduction';
import { ProgressProvider, useProgress } from './progress/ProgressContext';
import { BadgeToast, ProgressPage } from './progress/ProgressPage';
import { BrandMark } from './components/BrandMark';

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
  return <ProgressProvider><AppContent /></ProgressProvider>;
}

function AppContent() {
  const [active, setActive] = useState<Selection | null>(null);
  const [pending, setPending] = useState<(Selection & { firstDiscovery: boolean }) | null>(null);
  const [activeTactic, setActiveTactic] = useState<Tactic | null>(null);
  const [returnOpening, setReturnOpening] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [mode, setMode] = useState<LessonMode | null>(null);
  const [session, setSession] = useState(0);
  const { view, navigate } = useNavigation();
  const { theme, toggle } = useTheme();
  const progress = useProgress();
  useEffect(() => {
    setActive(null);
    setPending(null);
    setActiveTactic(null);
  }, [view]);
  function openView(next: AppView) {
    setActive(null);
    setPending(null);
    setActiveTactic(null);
    navigate(next);
  }
  function goHome() {
    navigate('home');
    setActive(null);
    setPending(null);
    setActiveTactic(null);
    setReturnOpening(null);
    setExpanded(null);
    setSelected(null);
    setMode(null);
    window.scrollTo(0, 0);
  }
  function variants() {
    navigate('openings');
    setActive(null);
    setActiveTactic(null);
    setReturnOpening(null);
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
            <BrandMark className="header-brand-mark" />
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
            <button
              aria-current={view === 'progress' ? 'page' : undefined}
              onClick={() => openView('progress')}
            >
              <Trophy size={16} />
              Progression
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
      ) : view === 'progress' ? (
        <ProgressPage onHome={goHome} />
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
      ) : activeTactic ? (
        <ActiveTactic
          key={`${activeTactic.id}-${session}`}
          puzzle={activeTactic}
          onRestart={() => {
            setSession((value) => value + 1);
            window.scrollTo(0, 0);
          }}
          onBack={() => {
            setReturnOpening(activeTactic.openingId);
            setActiveTactic(null);
          }}
          onNext={(() => {
            const list = tacticsFor(activeTactic.openingId);
            const next = list[list.findIndex((entry) => entry.id === activeTactic.id) + 1];
            return next
              ? () => {
                  setActiveTactic(next);
                  window.scrollTo(0, 0);
                }
              : undefined;
          })()}
          onComplete={(id) => progress.tacticComplete(id)}
        />
      ) : pending ? (
        <OpeningIntroduction
          {...pending}
          onBack={() => setPending(null)}
          onStart={() => {
            progress.discover(pending.opening.id);
            setActive(pending);
            setPending(null);
            setSession((value) => value + 1);
            window.scrollTo(0, 0);
          }}
        />
      ) : active ? (
        <ActiveTrainer
          key={`${active.variation.id}-${active.mode}-${session}`}
          selection={active}
          onRestart={() => {
            setSession((value) => value + 1);
            window.scrollTo(0, 0);
          }}
          onVariants={variants}
          onHome={goHome}
          guided={active.firstDiscovery}
          onComplete={(result) => {
            progress.trainingComplete(result);
            setActive((current) => current ? { ...current, firstDiscovery: false } : current);
          }}
        />
      ) : (
        <OpeningLibrary
          onHome={goHome}
          openings={openings}
          expanded={expanded}
          selected={selected}
          mode={mode}
          focusOpening={returnOpening}
          onTactic={(puzzle) => {
            setActive(null);
            setActiveTactic(puzzle);
            setReturnOpening(null);
            window.scrollTo(0, 0);
          }}
          onMode={setMode}
          onExpand={(id) => {
            setReturnOpening(null);
            setExpanded(expanded === id ? null : id);
            setSelected(null);
            setMode(null);
          }}
          onSelect={(id) => {
            setSelected(id);
            setMode(null);
          }}
          onStart={(opening, variation, mode) => {
            setPending({
              opening,
              variation,
              mode,
              firstDiscovery: !progress.data.training[`${opening.id}/${variation.id}/${mode}`],
            });
            window.scrollTo(0, 0);
          }}
        />
      )}
      <BadgeToast />
      <footer className="site-footer page-width">
        <p>Chess Progress Project 2026 — Prototype pédagogique</p>
        <a href={`${import.meta.env.BASE_URL}licences.html`} target="_blank" rel="noreferrer">
          Logiciels libres & crédits <ArrowUpRight size={12} />
        </a>
      </footer>
    </>
  );
}

function ActiveTactic({
  puzzle,
  ...actions
}: {
  puzzle: Tactic;
  onRestart: () => void;
  onBack: () => void;
  onNext?: () => void;
  onComplete: (id: string) => void;
}) {
  const lesson = useMemo(() => compileTactic(puzzle), [puzzle]);
  return <TacticTrainer lesson={lesson} {...actions} />;
}

type Selection = { opening: Opening; variation: Variation; mode: LessonMode; firstDiscovery?: boolean };
function ActiveTrainer({
  selection,
  ...actions
}: {
  selection: Selection;
  onRestart: () => void;
  onVariants: () => void;
  onHome: () => void;
  guided?: boolean;
  onComplete: (result: {
    openingId: string;
    variationId: string;
    mode: LessonMode;
    errors: number;
    clues: number;
    solutions: number;
  }) => void;
}) {
  // Only the selected lesson is replayed. The catalogue does not run 120 analyses.
  const lesson = useMemo(
    () => compileLesson(selection.opening, selection.variation, selection.mode),
    [selection],
  );
  return <Trainer lesson={lesson} {...actions} />;
}
