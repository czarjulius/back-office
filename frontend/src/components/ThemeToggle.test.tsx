import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { ThemeToggle } from './ThemeToggle';

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.colorScheme = '';
    localStorage.setItem('back-office-theme', 'dark');
  });

  it('toggles from dark to light mode and persists the choice', () => {
    render(<ThemeToggle />);

    const button = screen.getByRole('button', { name: /switch to light mode/i });
    expect(button).toHaveTextContent('Light');

    fireEvent.click(button);

    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem('back-office-theme')).toBe('light');
    expect(screen.getByRole('button', { name: /switch to dark mode/i })).toHaveTextContent('Dark');
  });
});
