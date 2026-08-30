import { useEffect, useState } from 'react';

export type AppView = 'home' | 'openings' | 'computer';
const paths: Record<AppView, string> = {
  home: '#/',
  openings: '#/ouvertures',
  computer: '#/partie',
};
export function readView(): AppView {
  return location.hash === paths.openings
    ? 'openings'
    : location.hash === paths.computer
      ? 'computer'
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
