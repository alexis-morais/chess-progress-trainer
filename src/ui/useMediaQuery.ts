import { useEffect, useState } from 'react';

// Small helper for the few places where the composition itself changes, not only its style:
// on phones the evaluation bar becomes the control that opens the game thread.
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(
    () => window.matchMedia?.(query).matches ?? false,
  );
  useEffect(() => {
    const media = window.matchMedia?.(query);
    if (!media) return;
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, [query]);
  return matches;
}

export const COMPACT_REVIEW_QUERY = '(max-width: 900px)';
