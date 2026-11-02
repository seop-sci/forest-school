# 2.3.3 출시 전 보안 작업: 검토 중

이 브랜치는 **초안이며 운영 Firebase에 게시하거나 배포하지 않습니다.** 기준 main `9aac073` (2.3.3). 운영 서버에 공격 요청을 보내지 않았습니다.

## 로컬에서 재현하고 수정한 부분

- 기존 `saves`와 `bak`에서 1MiB `junk`, 1MiB 버전, 임의 필드가 허용됐고 음수 저장 리비전과 긴 백업 메타데이터도 허용됐습니다. `rules_storage_guard.js`는 수정 전 8개 FAIL, 변경 후 PASS. 문서 필드는 저장 `d, at, v, r`, 백업 `d, at, v, pid, prog, sum, sv, why`로 제한했습니다. 삭제와 이전 문서의 리비전 없는 형태는 유지합니다.
- 기존 시즌 규칙에서 미래 9999와 소수 시즌이 허용됨을 로컬 재현했습니다. 시즌 번호를 정수와 서버 시각에 맞는 현재 또는 과거 번호로 제한했습니다. 시즌 시작 시점은 한국 시간입니다. 규칙의 달력은 3000년 3월 전까지만 계산하므로 그 전에 갱신해야 합니다.
- 기존 시즌 점수 상위 60개를 먼저 받아 현재 시즌이 밀리는 현상을 가짜 서버에서 재현했습니다. 제안 코드는 `sk`로 현재 시즌을 받아 기존 레코드도 이용합니다. 시즌이 바뀌면 30초 안에 다시 구독하고, 기존 학교 파워와 주간/대결 순위 조회는 변경하지 않습니다. `season_query_test.js` PASS.

## 배포 전 필수 확인 (아직 미완료)

1. 제안한 현재 시즌 전체 조회는 레코드가 늘면 데이터 사용량과 지연이 늘 수 있습니다. 사용자 수가 많을 때 규모를 측정하고, 필요하면 서버가 신뢰성 있게 관리하는 시즌별 색인과 기존 기록 전환을 설계해야 합니다. 옛 앱의 전역 상위 60 조회는 옛 앱에서 계속 밀릴 수 있습니다.
2. Targaryen은 Firebase 공식 Emulator와 완전히 같다고 보장할 수 없습니다. 특히 규칙의 나머지 연산과 큰 식, 부분 갱신, 트랜잭션, 옛 앱 저장의 실제 Emulator 검증과 쿼리 전환을 완료하기 전 규칙을 게시하지 않습니다.
3. AdMob 8.2.1 Android 소스에 `privacyOptionsRequirementStatus`와 `showPrivacyOptionsForm()`이 있는 것을 확인했습니다. 요구 시 설정 진입점을 표시하고 동의 변경 전 준비 광고와 캐시를 무효화하며, 변경 후 SDK 답으로 다시 판단하도록 구현했습니다. 공식 Google 문서는 이 환경의 네트워크 정책에서 차단되어 최신 내용을 확인하지 못했습니다. 테스트는 가짜 SDK이며 실제 Android SDK와 기기 검증이 필요합니다.
4. 운영 Firebase 규칙과 이 저장소의 일치 여부, App Check 토큰과 강제 적용, API 키 제한/비용 경보는 콘솔 접근 권한이 없어 확인하지 않았습니다. 운영 규칙을 바꾸거나 App Check를 강제하지 않았습니다.
5. 기존 2.3.3 AAB는 Android Actions에서 빌드 성공했지만 이 환경의 결과물 다운로드 주소가 차단돼 릴리스 서명, debuggable 및 병합 manifest를 검사하지 못했습니다. 소스 manifest에 `allowBackup=true`가 있으며 인증 백업과 기기 이전 실제 범위는 미확인입니다.
6. `npm audit --omit=dev` 결과 high 6, moderate 6. 경고는 취약점의 실제 브라우저 포함/실행 여부나 Android 네이티브 SDK 취약점 수와 같지 않습니다. esbuild의 Android JavaScript 번들 입력에서는 `@firebase/auth`가 포함됐지만 경고 원인인 Node `undici`, `@grpc/grpc-js`, `@fastify/busboy`는 포함되지 않았습니다. 네이티브 SDK는 별도입니다. 호환 가능한 업데이트 검증은 미완료입니다.
7. 자기 저장과 광고 횟수는 클라이언트에서 위조할 수 있고 점수 역시 실제 플레이를 서버가 검증하지 않습니다. 난독화나 App Check만으로 해결되지 않습니다. 서버 권위 검증과 광고 SSV는 별도 설계 및 비용 평가가 필요합니다.

## 실행 기록

- `wrap.py`, s37, s71, s72, s98, `check_ads.mjs`: PASS. Playwright는 시험용 HTTP 서버와 시스템 Chromium을 사용했습니다.
- Targaryen `rules_test.js` 112/112, `rules_sec.js`, `rules_bt.js` 17/17, `rules_storage_guard.js`, `rules_season_guard.js`: PASS. 시즌 조회 가짜 서버 시험 PASS. 일부 시험의 자동 코드는 종료 코드뿐 아니라 마지막 결과도 확인했습니다.
- 광고 시험은 가짜 SDK로 개인정보 옵션 요구, 동의 철회, 재허락, 옵션 창 오류 뒤 광고 준비와 캐시를 확인했습니다. 실제 Android SDK와 운영 광고 검증은 하지 않았습니다.
- production AAB, 운영 Firebase 콘솔, AdMob/Play 콘솔, 실제 광고, Firebase 공식 Emulator는 시험하지 않았습니다.
