import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.pepeducation.app',
  appName: 'Pep Education',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    StatusBar: { style: 'LIGHT', backgroundColor: '#7B2D8B' },
    Keyboard: { resize: 'body', style: 'DARK' }
  }
}

export default config
