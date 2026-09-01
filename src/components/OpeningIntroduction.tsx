import { ArrowLeft, ArrowRight, BookOpen, Check } from 'lucide-react';
import { lessonIntroduction } from '../data/pedagogy';
import { modeName, sideName, type LessonMode, type Opening, type Variation } from '../data/openings';
import { GlossaryText } from './InfoTooltip';

export function OpeningIntroduction({
  opening,
  variation,
  mode,
  firstDiscovery,
  onBack,
  onStart,
}: {
  opening: Opening;
  variation: Variation;
  mode: LessonMode;
  firstDiscovery: boolean;
  onBack: () => void;
  onStart: () => void;
}) {
  const content = lessonIntroduction(opening, variation, mode);
  return (
    <main id="main" className="page-width lesson-introduction">
      <button className="back-link" onClick={onBack}>
        <ArrowLeft size={16} /> Retour aux variantes
      </button>
      <section className="intro-lesson-card" aria-labelledby="lesson-intro-title">
        <div className="intro-lesson-icon"><BookOpen size={26} /></div>
        <span className="eyebrow">COMPRENDRE CETTE OUVERTURE</span>
        <h1 id="lesson-intro-title">{opening.name}</h1>
        <p className="intro-variation">{variation.name} · {modeName(mode)}</p>
        <p className="intro-idea"><GlossaryText>{content.idea}</GlossaryText></p>
        <div className="intro-objectives">
          <h2>Tes trois repères</h2>
          <ul>
            {content.objectives.map((objective) => <li key={objective}><Check size={16} /> <GlossaryText>{objective}</GlossaryText></li>)}
          </ul>
        </div>
        <div className="intro-variation-focus">
          <strong>Le plan de cette variante</strong>
          <p>{content.variation}</p>
          <small>{content.depth}</small>
        </div>
        {firstDiscovery && (
          <p className="discovery-note">
            Première découverte : certaines décisions seront accompagnées d’une intention. La réponse exacte restera cachée.
          </p>
        )}
        <div className="intro-lesson-meta">
          <span>Tu joues les {sideName(opening.side)}</span>
          <span>Lecture : moins de 30 secondes</span>
        </div>
        <button className="button primary" onClick={onStart}>
          Commencer l’entraînement <ArrowRight size={17} />
        </button>
      </section>
    </main>
  );
}
