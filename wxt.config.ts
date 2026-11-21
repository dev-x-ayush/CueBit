import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: 'CueBit',
    description: 'Save timestamped notes on YouTube videos.',
    icons: { 16: 'icon/16.png', 32: 'icon/32.png', 48: 'icon/48.png', 96: 'icon/96.png', 128: 'icon/128.png' },
    permissions: ['activeTab', 'scripting'],
    host_permissions: ['https://www.youtube.com/*'],
    commands: {
      'add-note': {
        suggested_key: { default: 'Alt+Shift+N', mac: 'Alt+Shift+N' },
        description: 'Add a note at the current video time',
      },
    },
    action: {
      default_title: 'CueBit',
    },
  },
});
