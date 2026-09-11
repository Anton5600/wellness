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
    },
    // ВЫКЛЮЧЕНО намеренно: плагин перехватывает fetch/XHR внутри WebView и гонит их
    // нативным HTTP. Стриминговый канал Firestore (WebChannel) это ломает — в приложении
    // вход по email работал, а Firestore не читался и не писался ни в каком режиме
    // (проверяли и с experimentalForceLongPolling — не помогло). Включали его ради VK ID
    // (коммит 7e8e692), но сторонних API в клиенте нет: все внешние запросы живут на
    // сервере, а свой API отдаёт `origin: '*'` (server.ts), поэтому WebView-fetch хватает.
    CapacitorHttp: {
      enabled: false
    },
    Haptics: {}
  }
};

export default config;
