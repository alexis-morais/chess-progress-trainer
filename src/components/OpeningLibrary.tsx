import { ArrowLeft, Check, ChevronDown, Flag, Lightbulb, MousePointer2 } from 'lucide-react';
import { OpeningPreview } from './OpeningPreview';
import { VariationCard } from './VariationCard';
import { TacticCards } from './TacticCards';
import type { Tactic } from '../tactics/model';
import { Chess } from 'chess.js';
import { useEffect, useMemo } from 'react';
import type { Opening, Variation, LessonMode } from '../data/openings';
import { sideName } from '../data/openings';
import { useProgress } from '../progress/ProgressContext';
import { catalogueCompletion, openingCompletion } from '../progress/model';

type Props = {
  focusOpening?: string | null;
  onHome: () => void;
  openings: Opening[];
  expanded: string | null;
  selected: string | null;
  mode: LessonMode | null;
  onMode: (mode: LessonMode) => void;
  onExpand: (id: string) => void;
  onSelect: (id: string) => void;
  onTactic: (puzzle: Tactic) => void;
  onStart: (opening: Opening, variation: Variation, mode: LessonMode) => void;
};

export function OpeningLibrary({
  onHome,
  openings,
  expanded,
  selected,
  mode,
  onMode,
  onExpand,
  onSelect,
  onStart,
  onTactic,
  focusOpening,
}: Props) {
  const { data } = useProgress();
  const catalogue = catalogueCompletion(data);
  useEffect(() => {
    if (!focusOpening) return;
    const frame = requestAnimationFrame(() => {
      const trigger = document.querySelector<HTMLButtonElement>(
        `#opening-${focusOpening} .opening-card-trigger`,
      );
      trigger?.focus({ preventScroll: true });
      trigger?.scrollIntoView({ block: 'start', behavior: 'instant' });
    });
    return () => cancelAnimationFrame(frame);
  }, [focusOpening]);
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
      <div className="breadcrumb">
        <button onClick={onHome}>
          <ArrowLeft size={15} />
          Retour à l’accueil
        </button>
        <span>Le répertoire</span>
      </div>
      <section className="intro library-intro">
        <div className="eyebrow">
          <span className="live-dot" /> L’ESPACE OUVERTURES
        </div>
        <h1>
          Les bonnes bases.
          <br />
          <span>De belles possibilités.</span>
        </h1>
        <p>Entraîne-toi aux ouvertures, coup après coup.</p>
        <div className="intro-facts">
          <span>{openings.length} ouvertures</span>
          <i />{' '}
          <span>
            {openings.reduce((total, opening) => total + opening.variations.length, 0)} variantes
            guidées
          </span>
          <i />
          <span>2 niveaux pour chacune</span>
          <i />
          <span data-testid="catalogue-progress">
            {catalogue.done} / {catalogue.total} terminées
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
              <span>
                {openings.filter((opening) => opening.side === side).length} ouvertures ·{' '}
                {openings
                  .filter((opening) => opening.side === side)
                  .reduce((total, opening) => total + opening.variations.length, 0)}{' '}
                variantes
              </span>
            </div>
            <div className="opening-grid">
              {openings
                .filter((opening) => opening.side === side)
                .map((opening, index) => {
                  const isExpanded = expanded === opening.id;
                  return (
                    <article
                      className={`opening-card ${isExpanded ? 'expanded' : ''}`}
                      key={opening.id}
                      id={`opening-${opening.id}`}
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
                            OUVERTURE{' '}
                            {String(
                              index +
                                1 +
                                (side === 'b'
                                  ? openings.filter((opening) => opening.side === 'w').length
                                  : 0),
                            ).padStart(2, '0')}
                          </span>
                          <h3>{opening.name}</h3>
                          <p>{opening.description}</p>
                          <div className="card-meta">
                            <span className="side-badge">
                              <span className={`side-dot ${opening.side === 'b' ? 'black' : ''}`} />
                              Vous jouez : {sideName(opening.side)}
                            </span>
                            <OpeningProgressBadge opening={opening} data={data} />
                          </div>
                        </div>
                        <ChevronDown className="expand-icon" size={19} />
                      </button>
                      {isExpanded && (
                        <div className="variant-picker" id={`variants-${opening.id}`}>
                          <div className="variant-picker-heading">
                            <span className="step-number">02</span>
                            <div>
                              <span className="eyebrow">APPRENDRE</span>
                              <h4>Sélectionne une variante</h4>
                            </div>
                          </div>
                          <div className="variant-grid">
                            {opening.variations.map((variation) => (
                              <VariationCard
                                key={variation.id}
                                opening={opening}
                                variation={variation}
                                selected={selected === variation.id}
                                mode={mode}
                                onSelect={() => onSelect(variation.id)}
                                onMode={onMode}
                                onStart={(chosenMode) => onStart(opening, variation, chosenMode)}
                              />
                            ))}
                          </div>
                          {!selected && (
                            <p className="selection-prompt">
                              Choisis une ligne pour commencer ton entraînement.
                            </p>
                          )}
                          <TacticCards openingId={opening.id} onStart={onTactic} />
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
            <h3>Réfléchis à ton rythme</h3>
            <p>
              Aucune aide imposée. Demande un indice gratuit si tu souhaites une piste de réflexion.
            </p>
          </div>
          <div>
            <Lightbulb size={21} />
            <h3>Comprends chaque coup</h3>
            <p>
              « Solution » révèle le coup exact et compte une aide. Une explication suit chaque
              réussite.
            </p>
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

// Essential or Extended finished counts the variation once, so the two formats never
// inflate this counter.
function OpeningProgressBadge({
  opening,
  data,
}: {
  opening: Opening;
  data: ReturnType<typeof useProgress>['data'];
}) {
  const { done, total } = openingCompletion(data, opening.id);
  const complete = done === total;
  return (
    <span
      className={`opening-progress ${complete ? 'complete' : ''}`}
      data-testid={`opening-progress-${opening.id}`}
      aria-label={`${done} sur ${total} variantes terminées${complete ? ', ouverture complète' : ''}`}
    >
      {complete ? (
        <>
          {done} / {total} <Check size={13} aria-hidden="true" />
        </>
      ) : (
        `${done} / ${total} variantes terminées`
      )}
    </span>
  );
}
