import {
  ArrowRight,
  BookOpen,
  Cpu,
  ShieldCheck,
  Sparkles,
  Target,
  MoveUpRight,
} from 'lucide-react';
import { pieceUrl } from '../ui/pieces';
import type { MouseEvent } from 'react';

function openPathway(event: MouseEvent<HTMLAnchorElement>, navigate: () => void) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
    return;
  event.preventDefault();
  navigate();
}

export function StudyIllustration() {
  return (
    <div className="study-illustration" aria-hidden="true">
      <div className="study-orbit orbit-one" />
      <div className="study-orbit orbit-two" />
      <div className="study-board">
        {Array.from({ length: 36 }, (_, i) => (
          <span key={i} className={(Math.floor(i / 6) + (i % 6)) % 2 ? 'dark' : 'light'}>
            {i === 26 && <img src={pieceUrl('wN')} alt="" />}
            {i === 3 && <img src={pieceUrl('bK')} alt="" />}
            {i === 8 && <img src={pieceUrl('bP')} alt="" />}
            {i === 21 && <img src={pieceUrl('wP')} alt="" />}
          </span>
        ))}
        <svg className="study-path" viewBox="0 0 360 360">
          <path
            d="M150 267V150H203"
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="m191 140 13 10-13 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="study-label">
        <span className="study-label-icon">
          <Sparkles size={18} />
        </span>
        <div>
          <strong>Un coup. Une idée.</strong>
          <small>Comprendre change la partie.</small>
        </div>
      </div>
      <span className="study-coordinate coordinate-top">PENSER</span>
      <span className="study-coordinate coordinate-bottom">JOUER · PROGRESSER</span>
    </div>
  );
}

export function HomePage({
  onOpenings,
  onComputer,
}: {
  onOpenings: () => void;
  onComputer: () => void;
}) {
  return (
    <main id="main" className="home-page page-width">
      <section className="home-hero">
        <div className="hero-copy">
          <span className="eyebrow hero-kicker">
            <span className="live-dot" /> TON PROCHAIN COUP COMMENCE ICI
          </span>
          <h1>
            Le plaisir de jouer.
            <br />
            <span className="hero-signature">L’art de progresser.</span>
          </h1>
          <p>
            Des premiers coups aux meilleures décisions.
            <br className="desktop-break" /> Un espace pour comprendre les échecs, à ton rythme.
          </p>
          <div className="hero-assurance">
            <ShieldCheck size={17} />
            <span>Libre d’accès. Sans compte. Sans limite.</span>
          </div>
        </div>
        <StudyIllustration />
      </section>
      <section className="pathways" aria-label="Choisis ton espace d’entraînement">
        <a
          className="pathway-card repertoire-path"
          href="#/ouvertures"
          aria-labelledby="openings-path-title"
          aria-describedby="openings-path-description"
          onClick={(event) => openPathway(event, onOpenings)}
        >
          <div className="pathway-top">
            <span className="pathway-icon">
              <BookOpen size={24} />
            </span>
            <span>01 / APPRENDRE</span>
            <MoveUpRight size={20} data-testid="openings-card-arrow" aria-hidden="true" />
          </div>
          <h2 id="openings-path-title">OUVERTURES</h2>
          <p id="openings-path-description">
            Construis un répertoire solide. Découvre les bons coups et les idées qui les relient.
          </p>
          <div className="pathway-facts">
            <span>
              <strong>10</strong> ouvertures
            </span>
            <span>
              <strong>60</strong> variantes
            </span>
            <span>
              <strong>2</strong> formats
            </span>
          </div>
          <span className="button primary pathway-cta" aria-hidden="true">
            Explorer les ouvertures <ArrowRight size={18} />
          </span>
        </a>
        <a
          className="pathway-card freeplay-path"
          href="#/partie"
          aria-labelledby="computer-path-title"
          aria-describedby="computer-path-description"
          onClick={(event) => openPathway(event, onComputer)}
        >
          <div className="pathway-top">
            <span className="pathway-icon">
              <Cpu size={24} />
            </span>
            <span>02 / JOUER</span>
            <MoveUpRight size={20} data-testid="computer-card-arrow" aria-hidden="true" />
          </div>
          <h2 id="computer-path-title">ENTRAÎNEMENT LIBRE</h2>
          <p id="computer-path-description">
            Fais tes propres choix face à Stockfish. Reviens sur chaque décision avec un bilan de ta
            partie.
          </p>
          <div className="pathway-facts">
            <span>
              <strong>3</strong> niveaux
            </span>
            <span>
              <Target size={17} /> Analyse coup par coup
            </span>
          </div>
          <span className="button secondary pathway-cta" aria-hidden="true">
            Configurer une partie <ArrowRight size={18} />
          </span>
        </a>
      </section>
      <section className="home-manifesto" aria-label="L’esprit Chess Progress">
        <span className="eyebrow">MOINS D’HÉSITATION. PLUS DE COMPRÉHENSION.</span>
        <p>Chaque partie a quelque chose à t’apprendre.</p>
        <span>Entraînement guidé ou jeu libre, tout se passe dans ton navigateur.</span>
      </section>
    </main>
  );
}
