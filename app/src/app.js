// 안드로이드 판 앱 기능: 오른쪽 위 X로 학교 문을 닫으면 앱을 끄고, 뒤로 가기 버튼은 닫기 확인 창을 열어요 (window.FOREST_APP)
import { App } from '@capacitor/app';

window.FOREST_APP = {
  exit: () => App.exitApp().catch(() => App.minimizeApp().catch(() => undefined))
};
App.addListener('backButton', () => {
  if (typeof window.FOREST_BACK === 'function') window.FOREST_BACK();
  else App.exitApp();
});
