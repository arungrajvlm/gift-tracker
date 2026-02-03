import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gifttracker.app',
  appName: 'App',
  webDir: 'www',
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '232283150109-fl0vmtve0r82rco630qfdk1h8cabdup8.apps.googleusercontent.com',
      forceCodeForRefreshToken: false,
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
