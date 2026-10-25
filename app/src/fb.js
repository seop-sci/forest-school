// 안드로이드 판 서버 저장: Firebase를 앱 안에 넣어 둬요 (게임은 GitHub 판과 같은 서버 저장 코드를 써요).
// 로그인은 앱(WebView)에 맞게 Firebase Auth 모듈로 만들고, 게임이 쓰는 모양(firebase.auth())으로 감싸요.
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import {
  initializeAuth, indexedDBLocalPersistence, browserLocalPersistence, onAuthStateChanged,
  signInAnonymously, signInWithCredential, linkWithCredential, reauthenticateWithCredential, GoogleAuthProvider,
} from 'firebase/auth';

const cfg = window.FOREST_FIREBASE;
if (cfg) {
  const app = firebase.initializeApp(cfg);
  const auth = initializeAuth(app._delegate || app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence] });
  // 게임은 예전 모양(user.linkWithCredential(c))으로 불러요. 1.5.4: 계정 지우기 전에 다시 로그인하는 reauthenticateWithCredential도 붙여요
  const wrap = (u) => {
    if (u && !u.linkWithCredential) u.linkWithCredential = (c) => linkWithCredential(u, c);
    if (u && !u.reauthenticateWithCredential) u.reauthenticateWithCredential = (c) => reauthenticateWithCredential(u, c);
    return u;
  };
  const facade = {
    get currentUser() { return wrap(auth.currentUser); },
    onAuthStateChanged: (next, err) => onAuthStateChanged(auth, (u) => next(wrap(u)), err),
    signInAnonymously: async () => ({ user: wrap((await signInAnonymously(auth)).user) }),
    signInWithCredential: async (c) => ({ user: wrap((await signInWithCredential(auth, c)).user) }),
  };
  firebase.auth = Object.assign(() => facade, { GoogleAuthProvider: { credential: (idToken) => GoogleAuthProvider.credential(idToken) } });
  window.firebase = firebase;
  window.FOREST_FB = Promise.resolve(firebase);
} else {
  window.FOREST_FB = Promise.resolve(null);
}
