import { useEffect, useState } from 'react';

export type AppView = 'home' | 'openings' | 'opening-lab' | 'computer' | 'progress';
const paths: Record<AppView, string> = {
  home: '#/',
  openings: '#/ouvertures',
  'opening-lab': '#/ouvertures/libre',
  computer: '#/partie',
  progress: '#/progression',
};
export function readView(): AppView {
  return location.hash === paths.openings
    ? 'openings'
    : location.hash === paths['opening-lab']
      ? 'opening-lab'
      : location.hash === paths.computer
        ? 'computer'
        : location.hash === paths.progress
          ? 'progress'
          : 'home';
}
export function useNavigation() {
  const [view, setView] = useState(readView);
  useEffect(() => {
    const update = () => {
      setView(readView());
      window.scrollTo(0, 0);
    };
    window.addEventListener('popstate', update);
    window.addEventListener('hashchange', update);
    return () => {
      window.removeEventListener('popstate', update);
      window.removeEventListener('hashchange', update);
    };
  }, []);
  function navigate(next: AppView) {
    if (location.hash !== paths[next]) history.pushState(null, '', paths[next]);
    setView(next);
    window.scrollTo(0, 0);
  }
  return { view, navigate };
}
