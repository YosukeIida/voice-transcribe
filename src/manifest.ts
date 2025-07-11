import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest({
  manifest_version: 3,
  name: 'Voice Transcribe for Notion',
  description: 'Real-time voice transcription using OpenAI GPT-4o-Transcribe for Notion',
  version: '1.0.0',
  icons: {
    '16': 'icons/icon-16.png',
    '32': 'icons/icon-32.png',
    '48': 'icons/icon-48.png',
    '128': 'icons/icon-128.png',
  },
  action: {
    default_popup: 'popup.html',
    default_icon: {
      '16': 'icons/icon-16.png',
      '32': 'icons/icon-32.png',
      '48': 'icons/icon-48.png',
      '128': 'icons/icon-128.png',
    },
  },
  permissions: ['storage', 'scripting', 'contextMenus', 'offscreen'],
  host_permissions: ['https://www.notion.so/*', 'https://api.openai.com/*'],
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: ['https://www.notion.so/*'],
      js: ['src/content/index.ts'],
      run_at: 'document_idle',
    },
  ],
  web_accessible_resources: [
    {
      resources: ['src/content/audio-permission.html', 'src/offscreen/offscreen.html'],
      matches: ['https://www.notion.so/*'],
    },
  ],
});
