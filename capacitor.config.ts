import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.forumsocialx',
  appName: 'ForumSocialX',
  webDir: 'dist/ForumSocialX',
  bundledWebRuntime: false, // Optionnel, à définir si vous ne voulez pas que Capacitor embarque son propre runtime web
  server: {
    androidScheme: 'http', // Utiliser HTTP sur Android
    iosScheme: 'capacitor', // Schéma spécifique pour l'app iOS
   
    cleartext: false, 
     
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    }}
};

export default config;
