import type { Preview } from '@storybook/react-vite';
import '../src/styles/global.css';
import './preview.css';
import '../src/i18n';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: { color: /(background|color)$/i, date: /Date$/i },
    },
    backgrounds: {
      options: {
        sky: { name: 'Sky', value: '#bfe4f8' },
        dark: { name: 'Dark', value: '#101830' },
        grass: { name: 'Grass', value: '#74c850' },
      },
    },
    a11y: { test: 'todo' },
  },
  initialGlobals: {
    backgrounds: { value: 'sky' },
  },
};

export default preview;
