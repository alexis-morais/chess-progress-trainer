import type { Category } from '../computer/types';

// The single source of truth for classification colours.
//
// Board values are literal because the two board squares (#eee7d6 / #789586) never change
// with the interface theme: a square tint has to stay readable on those exact colours.
// Interface surfaces use the --class-* custom properties declared in ui/theme.css, which
// do follow the light and dark themes. Nothing else in the app declares these colours.
//
// Both squares of a move share the same hue on purpose — Chess Progress marks "this move",
// not "the good half of it". The fills are translucent (rgba) rather than opaque so they read
// as a tint laid over the square, not a replacement of it: the cream/green checker underneath
// always stays perceptible. The destination carries a stronger fill and a firmer ring than the
// departure, which is enough to establish "this square matters more" without hiding the board.
export type ClassificationVisual = {
  /** Destination square of the move actually played: translucent fill over the natural square. */
  square: string;
  /** Destination contour, drawn inside the square so the piece stays visible. */
  ring: string;
  /** Departure square: same hue, lighter fill — visible, but clearly secondary. */
  origin: string;
  /** Departure contour: thinner and softer than the destination's. */
  originRing: string;
  /** Arrow of the move actually played. */
  arrow: string;
};

export const classificationVisuals: Record<Category, ClassificationVisual> = {
  best: {
    square: 'rgba(43, 156, 92, .44)',
    ring: 'rgba(23, 92, 55, .82)',
    origin: 'rgba(43, 156, 92, .22)',
    originRing: 'rgba(23, 92, 55, .45)',
    arrow: 'rgba(31, 124, 88, .92)',
  },
  excellent: {
    square: 'rgba(29, 141, 173, .42)',
    ring: 'rgba(19, 90, 111, .82)',
    origin: 'rgba(29, 141, 173, .21)',
    originRing: 'rgba(19, 90, 111, .45)',
    arrow: 'rgba(38, 113, 133, .9)',
  },
  good: {
    square: 'rgba(83, 149, 106, .4)',
    ring: 'rgba(46, 92, 63, .78)',
    origin: 'rgba(83, 149, 106, .2)',
    originRing: 'rgba(46, 92, 63, .42)',
    arrow: 'rgba(65, 122, 90, .9)',
  },
  inaccuracy: {
    square: 'rgba(214, 161, 24, .44)',
    ring: 'rgba(133, 98, 12, .82)',
    origin: 'rgba(214, 161, 24, .23)',
    originRing: 'rgba(133, 98, 12, .45)',
    arrow: 'rgba(138, 109, 20, .92)',
  },
  mistake: {
    square: 'rgba(214, 110, 30, .44)',
    ring: 'rgba(140, 76, 21, .82)',
    origin: 'rgba(214, 110, 30, .22)',
    originRing: 'rgba(140, 76, 21, .45)',
    arrow: 'rgba(156, 86, 25, .92)',
  },
  blunder: {
    square: 'rgba(191, 58, 68, .44)',
    ring: 'rgba(138, 41, 49, .84)',
    origin: 'rgba(191, 58, 68, .22)',
    originRing: 'rgba(138, 41, 49, .46)',
    arrow: 'rgba(179, 59, 68, .9)',
  },
};

/** The recommended move always uses the same green, whatever the played move looks like. */
export const BEST_MOVE_ARROW = 'rgba(31, 124, 88, .92)';
/**
 * Outline of the square the recommendation starts from, when the played move has already
 * emptied it. Discreet on purpose: it anchors the arrow without competing with the
 * classified destination.
 */
export const BEST_MOVE_OUTLINE = 'rgba(31, 124, 88, .55)';

// King-in-check overlay. A premium, desaturated red kept deliberately apart from the Gaffe
// classification: it signals the rules state of the position, not the quality of a move.
// Inset-only shadows so the glow never has to paint over a sibling square, and the centre
// of the square stays clear so the king itself remains fully legible.
export type CheckVisual = { fill: string; ring: string };
export const CHECK_VISUAL: CheckVisual = {
  fill: 'linear-gradient(160deg, rgba(196, 64, 73, .3), rgba(196, 64, 73, .15))',
  ring: 'inset 0 0 0 2px rgba(179, 59, 68, .62), inset 0 0 16px 3px rgba(179, 59, 68, .22)',
};
/** Checkmate reuses the same family, only more affirmed. */
export const MATE_VISUAL: CheckVisual = {
  fill: 'linear-gradient(160deg, rgba(179, 44, 54, .42), rgba(179, 44, 54, .22))',
  ring: 'inset 0 0 0 2.5px rgba(155, 32, 42, .88), inset 0 0 22px 5px rgba(155, 32, 42, .34)',
};
/** Steady ring reached once the short "just checked" pulse settles. Kept in sync with the
 * @keyframes check-pulse end state in board.css so the transition never pops. */
export const CHECK_PULSE_SETTLE = CHECK_VISUAL.ring;
export const MATE_BADGE_RING = 'radial-gradient(circle at 34% 30%, #c9454e, #9a1f29)';
