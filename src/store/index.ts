import { create } from 'zustand';

export type Screen = 'title' | 'starterSelect' | 'map' | 'combat' | 'reward' | 'dex' | 'gameOver';

interface UIState {
  screen: Screen;
  setScreen: (screen: Screen) => void;
}

export const useUIStore = create<UIState>((set) => ({
  screen: 'title',
  setScreen: (screen) => {
    set({ screen });
  },
}));
