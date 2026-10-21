/* 숲속 동물 학교 서버 설정
   Firebase 콘솔 > 프로젝트 설정 > 내 앱 > 웹 앱의 firebaseConfig 값을 아래 null 대신 넣어요.
   null로 두면 서버 없이 이 기기에만 저장하는 체험판으로 열려요.
   이 값들은 공개돼도 괜찮아요. 데이터는 database.rules.json의 규칙이 지켜요.

   넣은 모습 예:
   window.FOREST_FIREBASE = {
     apiKey: "AIza...",
     authDomain: "forest-school-xxxx.firebaseapp.com",
     databaseURL: "https://forest-school-xxxx-default-rtdb.asia-southeast1.firebasedatabase.app",
     projectId: "forest-school-xxxx",
     appId: "1:1234567890:web:abcdef"
   };
*/
window.FOREST_FIREBASE = null;
