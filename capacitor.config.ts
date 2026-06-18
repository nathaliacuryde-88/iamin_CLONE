import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.788c98e27dd541648eb32d8df0e833eb',
  appName: 'iamin',
  webDir: 'dist',
  server: {
    url: 'https://788c98e2-7dd5-4164-8eb3-2d8df0e833eb.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  ios: {
    contentInset: 'always',
    backgroundColor: '#0B0B12',
  },
  android: {
    backgroundColor: '#0B0B12',
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0B0B12',
      overlaysWebView: false,
    },
    Keyboard: {
      resize: 'native',
      style: 'DARK',
    },
    SplashScreen: {
      launchShowDuration: 800,
      backgroundColor: '#0B0B12',
      showSpinner: false,
    },
  },
};

export default config;
