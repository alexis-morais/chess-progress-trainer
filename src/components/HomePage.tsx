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
            <span>L’art de progresser.</span>
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
        <article className="pathway-card repertoire-path">
          <div className="pathway-top">
            <span className="pathway-icon">
              <BookOpen size={24} />
            </span>
            <span>01 / COMPRENDRE</span>
            <MoveUpRight size={20} />
          </div>
          <h2>Apprendre les ouvertures</h2>
          <p>
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
          <button className="button primary" onClick={onOpenings}>
            Explorer les ouvertures <ArrowRight size={18} />
          </button>
        </article>
        <article className="pathway-card freeplay-path">
          <div className="pathway-top">
            <span className="pathway-icon">
              <Cpu size={24} />
            </span>
            <span>02 / METTRE EN PRATIQUE</span>
            <MoveUpRight size={20} />
          </div>
          <h2>Jouer contre l’ordinateur</h2>
          <p>
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
          <button className="button secondary" onClick={onComputer}>
            Configurer une partie <ArrowRight size={18} />
          </button>
        </article>
      </section>
      <section className="home-manifesto" aria-label="L’esprit Chess Progress">
        <span className="eyebrow">MOINS D’HÉSITATION. PLUS DE COMPRÉHENSION.</span>
        <p>Chaque partie a quelque chose à t’apprendre.</p>
        <span>Entraînement guidé ou jeu libre, tout se passe dans ton navigateur.</span>
      </section>
    </main>
  );
}
