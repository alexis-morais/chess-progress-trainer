import type { MouseEvent } from 'react';
import { scoreLabel, whiteScore } from './review';
import type { PositionAnalysis } from './types';

export function EvaluationChart({
  positions,
  selected,
  onSelect,
}: {
  positions: PositionAnalysis[];
  selected: number;
  onSelect: (ply: number) => void;
}) {
  const width = 720,
    height = 170,
    left = 38,
    right = 12,
    top = 15,
    bottom = 25;
  const count = positions.length - 1;
  const x = (ply: number) => left + (count ? ply / count : 0) * (width - left - right);
  const y = (ply: number) =>
    top +
    ((9 - Math.max(-9, Math.min(9, whiteScore(positions[ply].score) / 100))) / 18) *
      (height - top - bottom);
  const points = positions.map((_, ply) => `${x(ply)},${y(ply)}`).join(' ');
  function select(event: MouseEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const local = ((event.clientX - bounds.left) / bounds.width) * width;
    onSelect(
      Math.max(0, Math.min(count, Math.round(((local - left) / (width - left - right)) * count))),
    );
  }
  return (
    <section className="evaluation-chart" aria-label="Courbe d’évaluation de la partie">
      <div className="chart-heading">
        <h3>Le fil de la partie</h3>
        <strong>
          {selected ? `Après le demi-coup ${selected}` : 'Position initiale'} ·{' '}
          {scoreLabel(positions[selected].score)}
        </strong>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="Évaluation du point de vue des Blancs. Touche la courbe pour choisir une position, ou utilise le curseur situé dessous."
        onClick={select}
      >
        <rect
          x={left}
          y={top}
          width={width - left - right}
          height={(height - top - bottom) / 2}
          fill="#d5e1bd0c"
        />
        {[8, 0, -8].map((value) => {
          const yy = top + ((9 - value) / 18) * (height - top - bottom);
          return (
            <g key={value}>
              <line
                x1={left}
                x2={width - right}
                y1={yy}
                y2={yy}
                stroke={value === 0 ? '#91a481' : '#394535'}
                strokeDasharray={value === 0 ? '' : '3 5'}
              />
              <text x="3" y={yy + 4}>
                {value > 0 ? '+' : ''}
                {value}
              </text>
            </g>
          );
        })}
        <polyline
          points={points}
          fill="none"
          stroke="#c1d59b"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {positions.map((position, ply) => (
          <g key={ply}>
            <circle
              cx={x(ply)}
              cy={y(ply)}
              r={selected === ply ? 5 : 2}
              fill={selected === ply ? '#f1d086' : '#c1d59b'}
            >
              <title>
                {ply ? `Demi-coup ${ply}` : 'Début'} : {scoreLabel(position.score)}
              </title>
            </circle>
            {'mate' in position.score && (
              <text x={x(ply)} y={Math.max(11, y(ply) - 8)} textAnchor="middle">
                M
              </text>
            )}
          </g>
        ))}
        <line
          x1={x(selected)}
          x2={x(selected)}
          y1={top}
          y2={height - bottom}
          stroke="#f1d086"
          strokeDasharray="3 3"
        />
        {[0, Math.floor(count / 2), count]
          .filter((value, index, array) => array.indexOf(value) === index)
          .map((ply) => (
            <text key={ply} x={x(ply)} y={height - 5} textAnchor="middle">
              {ply === 0 ? 'Début' : `Coup ${Math.ceil(ply / 2)}`}
            </text>
          ))}
      </svg>
      <input
        type="range"
        min="0"
        max={Math.max(1, count)}
        value={selected}
        disabled={!count}
        step="1"
        aria-label="Position sur la courbe"
        aria-valuetext={
          selected
            ? `Demi-coup ${selected}, ${scoreLabel(positions[selected].score)}`
            : 'Position initiale'
        }
        onChange={(event) => onSelect(Math.min(count, Number(event.target.value)))}
      />
      <p>+ : avantage Blancs · − : avantage Noirs · Échelle bornée, mats repérés par M.</p>
    </section>
  );
}
