import { defineConfig } from '@apps-in-toss/web-framework/config';

// appName은 앱인토스 콘솔에 등록한 앱 이름(영문)과 같아야 해요
export default defineConfig({
  appName: 'forest-school',
  brand: {
    primaryColor: '#2C4A3D', // 칠판 초록
  },
  permissions: [],
  webBundleDir: 'dist',
});
