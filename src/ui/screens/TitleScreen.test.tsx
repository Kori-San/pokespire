import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import '@/i18n';
import { TitleScreen } from './TitleScreen';

describe('TitleScreen', () => {
  it('renders the logo and a New Game action', () => {
    render(<TitleScreen />);
    expect(screen.getByRole('heading', { name: /pokespire/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new game/i })).toBeInTheDocument();
  });

  it('opens a language menu with flags from the globe button', () => {
    render(<TitleScreen />);
    const trigger = screen.getByRole('button', { name: /language/i });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    fireEvent.click(trigger);
    expect(screen.getByRole('menu', { name: /language/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitemradio', { name: /english/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitemradio', { name: /français/i })).toBeInTheDocument();
  });
});
