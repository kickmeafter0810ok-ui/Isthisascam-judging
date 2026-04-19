import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jagatech.isthisascam',
  appName: 'IsThisAScam',
  webDir: 'out',
  server: {
    url: 'https://isthisascam-alpha.vercel.app',
    cleartext: false,
  },
};

export default config;