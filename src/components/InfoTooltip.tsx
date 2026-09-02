import {
  Fragment,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { Info } from 'lucide-react';
import { glossary, glossaryAliases, type GlossaryTerm } from '../data/glossary';

export function InfoTooltip({ term, children }: { term: GlossaryTerm; children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [offset, setOffset] = useState(0);
  const root = useRef<HTMLSpanElement>(null);
  const pinned = useRef(false);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = root.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.min(280, window.innerWidth - 24);
      const ideal = rect.left + rect.width / 2 - width / 2;
      const left = Math.min(Math.max(12, ideal), window.innerWidth - width - 12);
      setOffset(left - rect.left);
    };
    place();
    const close = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) {
        pinned.current = false;
        setOpen(false);
      }
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        pinned.current = false;
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', escape);
    window.addEventListener('resize', place);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', escape);
      window.removeEventListener('resize', place);
    };
  }, [open]);
  return (
    <span
      ref={root}
      className="info-term"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => !pinned.current && setOpen(false)}
    >
      <span>{children ?? term}</span>
      <button
        type="button"
        className="info-trigger"
        aria-label={`Définition : ${term}`}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={() => {
          if (pinned.current) {
            pinned.current = false;
            setOpen(false);
          } else {
            pinned.current = true;
            setOpen(true);
          }
        }}
        onFocus={() => setOpen(true)}
      >
        <Info size={13} aria-hidden="true" />
      </button>
      {open && (
        <span
          className="info-popover"
          id={id}
          role="tooltip"
          style={{ '--tooltip-left': `${offset}px` } as CSSProperties}
        >
          <strong>{term}</strong>
          {glossary[term]}
        </span>
      )}
    </span>
  );
}

const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Longest wordings first so « colonne ouverte » wins over « colonne ».
const lookup = new Map<string, GlossaryTerm>();
for (const term of Object.keys(glossary) as GlossaryTerm[]) {
  lookup.set(term.toLocaleLowerCase('fr'), term);
  for (const alias of glossaryAliases[term] ?? []) lookup.set(alias.toLocaleLowerCase('fr'), term);
}
const wordings = [...lookup.keys()].sort((a, b) => b.length - a.length);
// Word boundaries keep « pat » out of « compatible » and « roque » out of « roquer ».
const pattern = new RegExp(
  `(?<![\\p{L}\\p{N}\u2019'-])(${wordings.map(escape).join('|')})(?![\\p{L}\\p{N}\u2019'-])`,
  'giu',
);

/**
 * Wraps known chess words with their definition. Only the first occurrence of a term
 * inside one block is decorated, so a paragraph never turns into a wall of icons.
 */
export function GlossaryText({ children }: { children: string }) {
  const seen = new Set<GlossaryTerm>();
  return (
    <>
      {children.split(pattern).map((part, index) => {
        const term = lookup.get(part.toLocaleLowerCase('fr'));
        if (!term || seen.has(term))
          return <Fragment key={`${part}-${index}`}>{part}</Fragment>;
        seen.add(term);
        return (
          <InfoTooltip key={`${part}-${index}`} term={term}>
            {part}
          </InfoTooltip>
        );
      })}
    </>
  );
}

/** Terms actually covered by the glossary, used by the vocabulary test. */
export const glossaryWordings = wordings;
