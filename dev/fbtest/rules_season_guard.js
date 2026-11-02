// 테스트 시계만 사용하며 Firebase 운영 서버에는 요청하지 않습니다.
const T=require('targaryen'),rules=require(require('path').resolve(process.argv[2]));
let fail=0;function t(s,g,w){if(g!==w){fail++;console.log('FAIL',s,g,w)}else console.log('ok',s)}
function season(now,sk){return T.database(rules,{}).as({uid:'A'}).write('/forest/rank/A',{name:'A',score:0,at:now,sk,sp:1000},{now}).allowed}
const at=(s)=>Date.parse(s);
for(const [date,n] of [['2026-12-01T00:00:00+09:00',1],['2027-03-01T00:00:00+09:00',2],['2027-06-01T00:00:00+09:00',3],['2027-09-01T00:00:00+09:00',4],['2027-12-01T00:00:00+09:00',5],['2028-03-01T00:00:00+09:00',6],['2029-03-01T00:00:00+09:00',10],['2030-12-01T00:00:00+09:00',17],['2099-12-01T00:00:00+09:00',293],['2100-03-01T00:00:00+09:00',294],['2200-03-01T00:00:00+09:00',694],['2400-03-01T00:00:00+09:00',1494]]){
 const x=at(date);t(date+' 직전 미래 거부',season(x-1,n),false);t(date+' 정각 허용',season(x,n),true);t(date+' 다음 시즌 거부',season(x,n+1),false);if(n>1)t(date+' 이전 시즌 호환',season(x,n-1),true);
}
const x=at('2027-03-02T00:00:00+09:00');t('소수 거부',season(x,1.5),false);t('먼 미래 거부',season(x,9999),false);console.log(fail?`FAIL ${fail}`:'PASS');process.exitCode=fail?1:0;
