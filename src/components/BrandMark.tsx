export function BrandMark({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      role="img"
      aria-label=""
      focusable="false"
    >
      <path
        className="brand-mark-frame"
        d="M7 8.5A5.5 5.5 0 0 1 12.5 3h23A5.5 5.5 0 0 1 41 8.5v31A5.5 5.5 0 0 1 35.5 45h-23A5.5 5.5 0 0 1 7 39.5z"
      />
      <path
        className="brand-mark-symbol"
        fillRule="evenodd"
        d="M14 12h20v6H20v12h14v6H14zm10 7h5v5h5v5h-5v-5h-5z"
      />
    </svg>
  );
}
