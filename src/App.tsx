import { useUIStore } from '@/store';
import { TitleScreen } from '@/ui/screens/TitleScreen';

export function App() {
  const screen = useUIStore((s) => s.screen);

  switch (screen) {
    case 'title':
      return <TitleScreen />;
    default:
      return <TitleScreen />;
  }
}
