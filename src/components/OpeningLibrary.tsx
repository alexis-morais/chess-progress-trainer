import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  Flag,
  Lightbulb,
  MousePointer2,
} from 'lucide-react';
import { OpeningPreview } from './OpeningPreview';
import { Chess } from 'chess.js';
import { useMemo } from 'react';
import type { Opening, Variation, LessonMode } from '../data/openings';
import { frenchSan, sideName, lessonModes, learnerMoveCount } from '../data/openings';

type Props = {
  openings: Opening[];
  expanded: string | null;
  selected: string | null;
  mode: LessonMode | null;
  onMode: (mode: LessonMode) => void;
  onExpand: (id: string) => void;
  onSelect: (id: string) => void;
  onStart: (opening: Opening, variation: Variation, mode: LessonMode) => void;
};

export function OpeningLibrary({
  openings,
  expanded,
  selected,
  mode,
  onMode,
  onExpand,
  onSelect,
  onStart,
}: Props) {
  const previews = useMemo(
    () =>
      Object.fromEntries(
        openings.map((opening) => {
          const game = new Chess();
          opening.variations[0].moves
            .slice(0, opening.previewPly)
            .forEach((move) => game.move(move.san, { strict: true }));
          return [opening.id, game.fen()];
        }),
      ),
    [openings],
  );
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
            <BookOpen size={15} /> 10 ouvertures
          </span>
          <i /> <span>60 variantes guidées</span>
          <i />
          <span>2 niveaux pour chacune</span>
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
        {(['w', 'b'] as const).map((side) => (
          <section className="side-library" key={side} aria-labelledby={`library-${side}`}>
            <div className="side-library-heading">
              <h3 id={`library-${side}`}>
                <span className={`side-dot ${side === 'b' ? 'black' : ''}`} />
                Jouer avec les {sideName(side)}
              </h3>
              <span>5 ouvertures · 30 variantes</span>
            </div>
            <div className="opening-grid">
              {openings
                .filter((opening) => opening.side === side)
                .map((opening, index) => {
                  const isExpanded = expanded === opening.id;
                  const chosen = opening.variations.find((variation) => variation.id === selected);
                  return (
                    <article
                      className={`opening-card ${isExpanded ? 'expanded' : ''}`}
                      key={opening.id}
                    >
                      <button
                        className="opening-card-trigger"
                        aria-expanded={isExpanded}
                        aria-controls={`variants-${opening.id}`}
                        onClick={() => onExpand(opening.id)}
                      >
                        <OpeningPreview fen={previews[opening.id]} black={side === 'b'} />
                        <div className="opening-card-copy">
                          <span className="card-index">
                            OUVERTURE {String(index + 1 + (side === 'b' ? 5 : 0)).padStart(2, '0')}
                          </span>
                          <h3>{opening.name}</h3>
                          <p>{opening.description}</p>
                          <div className="card-meta">
                            <span className="side-badge">
                              <span className={`side-dot ${opening.side === 'b' ? 'black' : ''}`} />
                              Vous jouez : {sideName(opening.side)}
                            </span>
                            <span>6 variantes</span>
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
                                      {learnerMoveCount(side, variation.moves.length)} coups
                                      essentiels · {variation.eco}
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
                              <p>{chosen.description}</p>
                              <div className="line-preview" aria-label="Début de la variante">
                                {chosen.moves.slice(0, 6).map((move, i) => (
                                  <span key={i}>
                                    {i % 2 === 0 ? `${i / 2 + 1}. ` : ''}
                                    {frenchSan(move.san)}
                                  </span>
                                ))}
                              </div>
                              <fieldset className="mode-picker">
                                <legend>
                                  <span className="step-number">03</span>Choisis ton niveau
                                </legend>
                                {lessonModes.map((option) => (
                                  <label
                                    key={option.id}
                                    className={`mode-option ${mode === option.id ? 'selected' : ''}`}
                                  >
                                    <input
                                      type="radio"
                                      name="lesson-mode"
                                      value={option.id}
                                      checked={mode === option.id}
                                      onChange={() => onMode(option.id)}
                                    />
                                    <span>
                                      <strong>{option.name}</strong>
                                      <small>{option.description}</small>
                                      <em>
                                        {learnerMoveCount(
                                          side,
                                          chosen.moves.length +
                                            (option.id === 'extended'
                                              ? chosen.extension.length
                                              : 0),
                                        )}{' '}
                                        coups à jouer
                                      </em>
                                    </span>
                                  </label>
                                ))}
                              </fieldset>
                              <button
                                className="button primary start-button"
                                disabled={!mode}
                                onClick={() => {
                                  if (mode) onStart(opening, chosen, mode);
                                }}
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
        ))}
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
