import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

beforeEach(() => {
  history.replaceState(null, '', '/chess-progress-trainer/');
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
Object.defineProperty(window, 'scrollTo', { value: () => {}, writable: true });
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  value: () => {},
  writable: true,
  configurable: true,
});
Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
  value: () => ({
    width: 80,
    height: 80,
    top: 0,
    left: 0,
    right: 80,
    bottom: 80,
    x: 0,
    y: 0,
    toJSON() {},
  }),
});
HTMLDialogElement.prototype.showModal = function () {
  this.setAttribute('open', '');
};
HTMLDialogElement.prototype.close = function () {
  this.removeAttribute('open');
};
