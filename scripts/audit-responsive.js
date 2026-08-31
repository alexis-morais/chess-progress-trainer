// Read-only browser audit. Run this function in the browser, not in jsdom (which has no layout).
() => {
  const selectors = [
    'main',
    'main section',
    '.pathway-card',
    '.pathway-card h2',
    '.pathway-card p',
    '.pathway-top',
    '.pathway-facts',
    '.pathway-cta',
    '.mobile-path-art',
    '.mobile-path-meta',
    '.opening-card',
    '.opening-card-copy',
    '.variant-option',
    '.variant-card',
    '.mode-option',
    '.training-assistance',
    '.assistance-segments',
    '.instruction-copy',
    '.assistance-segments button',
    '.tactic-card',
    '.tactic-explanation',
    '.completion-dialog[open]',
    '.training-board',
    '.training-panel',
    '.computer-board',
    '.computer-panel',
    '.setup-card',
    '.review-summary',
    '.evaluation-chart',
  ];
  const issues = [];
  for (const element of document.querySelectorAll(selectors.join(','))) {
    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height) continue;
    const label = element.getAttribute('aria-label') || element.className || element.tagName;
    if (rect.left < -1 || rect.right > innerWidth + 1) issues.push(`${label} dépasse le viewport`);
    if (element.clientWidth && element.scrollWidth > element.clientWidth + 1)
      issues.push(`${label} contient un débordement horizontal`);
  }
  if (document.documentElement.scrollWidth > innerWidth + 1) issues.push('La page déborde');
  const board = document.querySelector('.training-board, .computer-board');
  const reveal = document.querySelector('.assistance-segments button:last-child');
  return {
    width: innerWidth,
    theme: document.documentElement.dataset.theme,
    issues,
    boardWidth: board ? Math.round(board.getBoundingClientRect().width) : null,
    revealBottom: reveal ? Math.round(reveal.getBoundingClientRect().bottom) : null,
  };
};
