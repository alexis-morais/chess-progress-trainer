import { createHash } from 'node:crypto';

export function tacticFingerprint(puzzle) {
  return createHash('sha256')
    .update(
      JSON.stringify({
        openingId: puzzle.openingId,
        provenance: puzzle.provenance,
        fen: puzzle.fen,
        side: puzzle.side,
        sequence: puzzle.sequence.map((step) => step.san),
      }),
    )
    .digest('hex');
}
