import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  Reflect.deleteProperty(window, 'matchMedia'); // jsdom has none; undo per-test mocks
  document.documentElement.removeAttribute('data-theme');
});
window.scrollTo = () => {};
