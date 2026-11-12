// 서버에 요청하지 않고 저장/백업 규칙만 로컬에서 검증합니다.
const T = require('targaryen');
const rules = require(require('path').resolve(process.argv[2]));
const doc = {d:'{}', at:1700000000000, v:'2.3.3'};
const db = () => T.database(rules,{});
const write = (path, val, uid='A') => db().as({uid}).write(path,val).allowed;
let failed = 0;
function test(n, got, want) { if(got!==want){failed++;console.log('FAIL',n,'got',got,'want',want)}else console.log('ok',n); }
for(const path of ['/forest/saves/A','/forest/bak/A/0']) {
 test(path+' 정상',write(path,doc),true);
 test(path+' 1MiB 임의 필드',write(path,{...doc,junk:'x'.repeat(1048576)}),false);
 test(path+' 1MiB 버전',write(path,{...doc,v:'x'.repeat(1048576)}),false);
 test(path+' 알 수 없는 필드',write(path,{...doc,other:42}),false);
 test(path+' 버전 자료형',write(path,{...doc,v:123}),false);
 test(path+' 시각 자료형',write(path,{...doc,at:'123'}),false);
 test(path+' 타인 쓰기',write(path,doc,'B'),false);
 test(path+' 삭제',write(path,null),true);
}
test('리비전 정상',write('/forest/saves/A',{...doc,r:5}),true);
test('리비전 음수',write('/forest/saves/A',{...doc,r:-1}),false);
test('4.1.1 백업 99,999자',write('/forest/bak/A/0',{...doc,d:'x'.repeat(99999)}),true);
test('4.1.1 백업 100,000자 거부',write('/forest/bak/A/0',{...doc,d:'x'.repeat(100000)}),false);
test('4.1.1 저장은 199,999자까지 그대로',write('/forest/saves/A',{...doc,d:'x'.repeat(199999)}),true);
test('백업 메타데이터 정상',write('/forest/bak/A/0',{...doc,pid:'ABC123',prog:20015,sum:'학교',sv:1700000000000,why:'백업'}),true);
test('백업 메타데이터 과다',write('/forest/bak/A/0',{...doc,why:'x'.repeat(1048576)}),false);
{
 const seeded=T.database(rules,{forest:{saves:{A:doc},bak:{A:{0:doc}}}});
 const own=seeded.as({uid:'A'}),other=seeded.as({uid:'B'});
 test('기존 저장 리비전 부분 갱신',own.write('/forest/saves/A/r',1).allowed,true);
 test('저장 임의 자식 추가 거부',own.write('/forest/saves/A/junk','x').allowed,false);
 test('백업 임의 자식 추가 거부',own.write('/forest/bak/A/0/junk','x').allowed,false);
 test('타인 저장 읽기 거부',other.read('/forest/saves/A').allowed,false);
 test('타인 백업 읽기 거부',other.read('/forest/bak/A').allowed,false);
 test('타인 저장 삭제 거부',other.write('/forest/saves/A',null).allowed,false);
 test('타인 백업 삭제 거부',other.write('/forest/bak/A/0',null).allowed,false);
}
console.log(failed ? `FAIL ${failed}` : 'PASS'); process.exitCode=failed?1:0;
