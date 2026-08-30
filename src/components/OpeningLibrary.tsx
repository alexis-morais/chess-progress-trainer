import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  Flag,
  Lightbulb,
  MousePointer2,
} from 'lucide-react';
import { Chessboard } from 'react-chessboard';
import type { Opening } from '../data/openings';
import { frenchSan, sideName } from '../data/openings';
import type { CompiledLesson } from '../trainer/model';

type Props = {
  openings: Opening[];
  lessons: CompiledLesson[];
  expanded: string | null;
  selected: string | null;
  onExpand: (id: string) => void;
  onSelect: (id: string) => void;
  onStart: (lesson: CompiledLesson) => void;
};

export function OpeningLibrary({
  openings,
  lessons,
  expanded,
  selected,
  onExpand,
  onSelect,
  onStart,
}: Props) {
  return (
    <main id="main" className="library page-width">
      <section className="intro">
        <div className="eyebrow">
          <span className="live-dot" /> APPRENDRE. COMPRENDRE. PROGRESSER.
        </div>
        <h1>
          Un coup d’avance,
          <br />
          <span>ça s’apprend.</span>
        </h1>
        <p>Entraîne-toi aux ouvertures, coup après coup.</p>
        <div className="intro-facts">
          <span>
            <BookOpen size={15} /> 4 ouvertures essentielles
          </span>
          <i /> <span>16 variantes guidées</span>
          <i />
          <span>À ton rythme</span>
        </div>
        <div className="intro-mark" aria-hidden="true">
          <span>01</span>
          <span>
            LE PREMIER COUP
            <br />
            D’UNE NOUVELLE HABITUDE.
          </span>
        </div>
      </section>
      <section aria-labelledby="library-title">
        <div className="section-heading">
          <div>
            <span className="step-number">01</span>
            <h2 id="library-title">Choisis ton ouverture</h2>
          </div>
          <span className="muted">Les bons débuts font la différence.</span>
        </div>
        <div className="opening-grid">
          {openings.map((opening, index) => {
            const isExpanded = expanded === opening.id;
            const firstLesson = lessons.find((l) => l.opening.id === opening.id)!;
            const chosen = lessons.find(
              (l) => l.opening.id === opening.id && l.variation.id === selected,
            );
            return (
              <article className={`opening-card ${isExpanded ? 'expanded' : ''}`} key={opening.id}>
                <button
                  className="opening-card-trigger"
                  aria-expanded={isExpanded}
                  aria-controls={`variants-${opening.id}`}
                  onClick={() => onExpand(opening.id)}
                >
                  <div className="mini-board" aria-hidden="true" inert>
                    <Chessboard
                      options={{
                        id: `preview-${opening.id}`,
                        position: firstLesson.positions[opening.previewPly],
                        boardOrientation: firstLesson.orientation,
                        allowDragging: false,
                        allowDrawingArrows: false,
                        showNotation: false,
                        showAnimations: false,
                        darkSquareStyle: { backgroundColor: '#637668' },
                        lightSquareStyle: { backgroundColor: '#d8decd' },
                      }}
                    />
                  </div>
                  <div className="opening-card-copy">
                    <span className="card-index">OUVERTURE 0{index + 1}</span>
                    <h3>{opening.name}</h3>
                    <p>{opening.description}</p>
                    <div className="card-meta">
                      <span className="side-badge">
                        <span className={`side-dot ${opening.side === 'b' ? 'black' : ''}`} />
                        {sideName(opening.side)}
                      </span>
                      <span>4 variantes</span>
                    </div>
                  </div>
                  <ChevronDown className="expand-icon" size={19} />
                </button>
                {isExpanded && (
                  <div className="variant-picker" id={`variants-${opening.id}`}>
                    <div className="variant-picker-heading">
                      <span className="step-number">02</span>
                      <h4>Sélectionne une variante</h4>
                    </div>
                    <div className="variant-grid">
                      {opening.variations.map((variation) => {
                        const lesson = lessons.find((l) => l.variation.id === variation.id)!;
                        return (
                          <button
                            className={`variant-option ${selected === variation.id ? 'selected' : ''}`}
                            key={variation.id}
                            aria-pressed={selected === variation.id}
                            onClick={() => onSelect(variation.id)}
                          >
                            <span>
                              <strong>{variation.name}</strong>
                              <small>
                                {lesson.total} coups à jouer · {variation.eco}
                              </small>
                            </span>
                            <span className="radio-indicator">
                              {selected === variation.id && <Check size={12} />}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {chosen ? (
                      <div className="variant-detail">
                        <p>{chosen.variation.description}</p>
                        <div className="line-preview" aria-label="Début de la variante">
                          {chosen.moves.slice(0, 6).map((move, i) => (
                            <span key={i}>
                              {i % 2 === 0 ? `${i / 2 + 1}. ` : ''}
                              {frenchSan(move.san)}
                            </span>
                          ))}
                        </div>
                        <button
                          className="button primary start-button"
                          onClick={() => onStart(chosen)}
                        >
                          Commencer l’entraînement <ArrowRight size={17} />
                        </button>
                      </div>
                    ) : (
                      <p className="selection-prompt">
                        Choisis une ligne pour commencer ton entraînement.
                      </p>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
      <section className="how-it-works" id="comment-ca-marche" aria-labelledby="how-title">
        <div className="section-heading">
          <h2 id="how-title">La théorie, par la pratique.</h2>
          <span className="muted">Quelques minutes suffisent pour progresser.</span>
        </div>
        <div className="how-grid">
          <div>
            <MousePointer2 size={21} />
            <h3>Joue de mémoire</h3>
            <p>Retrouve les coups de ta variante. Ton adversaire suit toujours la ligne prévue.</p>
          </div>
          <div>
            <Lightbulb size={21} />
            <h3>Comprends chaque coup</h3>
            <p>Une explication à chaque réussite et une flèche d’aide si tu hésites.</p>
          </div>
          <div>
            <Flag size={21} />
            <h3>Prends les bons réflexes</h3>
            <p>Rejoue sans limite, à ton rythme. Chaque essai est une occasion d’apprendre.</p>
          </div>
        </div>
      </section>
      <div className="privacy-note">
        <span className="live-dot" /> Tout se passe dans ton navigateur. Aucun compte, aucune
        publicité, aucune donnée personnelle collectée.
      </div>
    </main>
  );
}
