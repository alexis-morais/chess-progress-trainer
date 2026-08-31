import type { CSSProperties } from 'react';
import type { AnalysisState, Evaluation } from '../engine/StockfishEngine';

export function evaluationLabel(evaluation: Evaluation | null) {
  if (!evaluation) return '—';
  if (evaluation.mate !== undefined)
    return `${evaluation.mate < 0 ? '−' : ''}M${Math.abs(evaluation.mate)}`;
  const value = (evaluation.cp ?? 0) / 100;
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}`;
}

export function EvaluationBar({
  analysis,
  orientation,
}: {
  analysis: AnalysisState;
  orientation: 'white' | 'black';
}) {
  const score = analysis.evaluation;
  const whitePercent =
    score?.mate !== undefined
      ? score.mate >= 0
        ? 100
        : 0
      : 50 + 45 * Math.tanh((score?.cp ?? 0) / 400);
  const label = evaluationLabel(score);
  const description =
    score?.mate !== undefined
      ? `Mat en ${Math.abs(score.mate)} pour les ${score.mate < 0 ? 'Noirs' : 'Blancs'}`
      : score
        ? `Évaluation ${label} ; une valeur positive favorise les Blancs`
        : 'Analyse en attente';
  return (
    <div className="evaluation" aria-label={description}>
      <span className="eval-value" data-testid="evaluation-value">
        {label}
      </span>
      <div
        className={`eval-track ${orientation === 'black' ? 'flipped' : ''}`}
        style={{ '--white-share': `${whitePercent}%` } as CSSProperties}
      >
        <div className="eval-white" />
        <span className="eval-midline" />
      </div>
      <span className="eval-side" title="Évaluation du point de vue des Blancs">
        ±
      </span>
    </div>
  );
}
