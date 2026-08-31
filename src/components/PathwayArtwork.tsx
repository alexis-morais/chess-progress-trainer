import { pieceUrl } from '../ui/pieces';

/** Small editorial diagrams, decorative only: the entire parent card is the link. */
export function PathwayArtwork({ kind }: { kind: 'openings' | 'freeplay' }) {
  return (
    <div className={`mobile-path-art art-${kind}`} aria-hidden="true" data-testid={`art-${kind}`}>
      <svg viewBox="0 0 160 160" fill="none">
        {kind === 'openings' ? (
          <>
            <g transform="translate(10 16) rotate(-7 70 64)">
              <rect x="0" y="0" width="140" height="128" rx="11" className="art-board-frame" />
              {Array.from({ length: 36 }, (_, i) => (
                <rect
                  key={i}
                  x={10 + (i % 6) * 20}
                  y={4 + Math.floor(i / 6) * 20}
                  width="20"
                  height="20"
                  className={(i + Math.floor(i / 6)) % 2 ? 'art-square-dark' : 'art-square-light'}
                />
              ))}
              <rect x="70" y="64" width="20" height="20" rx="3" className="art-destination" />
              <path d="M120 114V75H89m7-6-7 6 7 6" className="art-route" />
              <image href={pieceUrl('wN')} x="108" y="101" width="25" height="25" />
              <image href={pieceUrl('wP')} x="47" y="61" width="25" height="25" />
              <image href={pieceUrl('bP')} x="67" y="41" width="25" height="25" />
            </g>
          </>
        ) : (
          <>
            <circle cx="80" cy="73" r="57" className="art-orbit" />
            <circle cx="80" cy="73" r="43" className="art-orbit inner" />
            <path
              d="M16 116h128M23 127h114M42 105l-9 32m37-32-3 32m27-32 3 32m18-32 9 32"
              className="art-grid"
            />
            <ellipse cx="51" cy="105" rx="26" ry="6" className="art-piece-shadow" />
            <ellipse cx="108" cy="80" rx="24" ry="5" className="art-piece-shadow" />
            <g transform="translate(102 0) scale(-1 1)">
              <image href={pieceUrl('wN')} x="19" y="43" width="64" height="64" />
            </g>
            <image href={pieceUrl('bN')} x="79" y="24" width="58" height="58" />
            <circle cx="127" cy="117" r="11" className="art-engine-node" />
            <path d="m123 117 3 3 5-6" className="art-route" />
            <path d="M39 146h82" className="art-eval-track" />
            <path d="M39 146h49" className="art-eval-value" />
          </>
        )}
      </svg>
    </div>
  );
}
