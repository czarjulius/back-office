import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyTheme, getStoredTheme } from './theme';

describe('theme utilities', () => {
  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.colorScheme = '';
    vi.unstubAllGlobals();
  });

  it('returns a persisted light theme when saved', () => {
    localStorage.setItem('back-office-theme', 'light');

    expect(getStoredTheme()).toBe('light');
  });

  it('falls back to the system preference when no saved value exists', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme: light)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );

    expect(getStoredTheme()).toBe('light');
  });

  it('applies the selected theme to the document and storage', () => {
    applyTheme('light');

    expect(document.documentElement.dataset.theme).toBe('light');
    expect(document.documentElement.style.colorScheme).toBe('light');
    expect(localStorage.getItem('back-office-theme')).toBe('light');
  });
});
