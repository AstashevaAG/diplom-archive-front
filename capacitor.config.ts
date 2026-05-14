import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.diplomarchive.app',
  appName: 'Архив ВКР',
  webDir: 'dist',
  server: {
    androidScheme: 'http',
  },
  android: {
    path: 'android',
    allowMixedContent: true,
    webContentsDebuggingEnabled: true,
  },
  plugins: {
    StatusBar: {
      backgroundColor: '#F4FAFD',
      style: 'LIGHT',
      overlaysWebView: false,
    },
  },
};

export default config;
