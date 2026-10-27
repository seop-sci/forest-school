// 안드로이드 판 구글 로그인: 원하는 사람만 설정의 '구글 계정 연결'로 써요 (window.FOREST_GOOGLE)
import { SocialLogin } from '@capgo/capacitor-social-login';

// Firebase 콘솔 > Authentication > 로그인 방법 > Google > 웹 SDK 구성의 '웹 클라이언트 ID'
const WEB_CLIENT_ID = '371851641750-c206d9dtea31k8rdq6ctcd3jru0pkvsh.apps.googleusercontent.com';

if (WEB_CLIENT_ID) {
  let ready = null;
  const init = () => ready || (ready = SocialLogin.initialize({ google: { webClientId: WEB_CLIENT_ID } }));
  window.FOREST_GOOGLE = {
    async login() {
      await init();
      // 1.7.2: scopes를 넘기면 플러그인이 MainActivity를 고치라며 늘 거절해요("You CANNOT use scopes without modifying the main activity").
      // 이메일과 프로필은 기본으로 받으니 넘기지 않아요
      const r = await SocialLogin.login({ provider: 'google', options: {} });
      const res = r && r.result;
      if (!res || !res.idToken) throw { code: 'no-id-token' };
      return { idToken: res.idToken, email: res.profile && res.profile.email };
    },
  };
}
