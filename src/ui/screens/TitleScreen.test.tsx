import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import '@/i18n';
import { TitleScreen } from './TitleScreen';

describe('TitleScreen', () => {
  it('renders the logo and a New Game action', () => {
    render(<TitleScreen />);
    expect(screen.getByRole('heading', { name: /pokespire/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new game/i })).toBeInTheDocument();
  });

  it('offers a language toggle', () => {
    render(<TitleScreen />);
    expect(screen.getByRole('group', { name: /language/i })).toBeInTheDocument();
  });
});
