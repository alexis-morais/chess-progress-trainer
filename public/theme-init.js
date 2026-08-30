// Apply the preference before the first paint. Keep the key/colors aligned with src/ui/theme.ts.
(() => {
  let chosen;
  try {
    chosen = localStorage.getItem('chess-progress:theme:v1');
  } catch {
    /* Storage is optional. */
  }
  const theme =
    chosen === 'light' || chosen === 'dark'
      ? chosen
      : window.matchMedia?.('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
  document.documentElement.dataset.theme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'dark' ? '#14201e' : '#f6f7f2');
})();
