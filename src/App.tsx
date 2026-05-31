import { useUIStore } from '@/store';
import { TitleScreen } from '@/ui/screens/TitleScreen';
import { ViewportFrame } from '@/ui/layout/ViewportFrame';

export function App() {
  const screen = useUIStore((s) => s.screen);

  return <ViewportFrame>{screen === 'title' ? <TitleScreen /> : <TitleScreen />}</ViewportFrame>;
}
