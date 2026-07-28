import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wellness.app',
  appName: 'Внутренний компас',
  webDir: 'dist',
  server: {
    cleartext: true
  },
  plugins: {
    CapacitorUpdater: {
      autoUpdate: false,
      statsUrl: "https://capgo.app/api/stats"
    }
  }
};

export default config;
