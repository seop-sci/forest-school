#!/bin/sh
# 밀어 올리기(push) 전 점검: GitHub의 Build check, Security rules 검사가 실패해서 메일이 가지 않게 같은 것을 먼저 봐요.
# 쓰는 법: sh dev/precheck.sh   (git hook으로: ln -sf ../../dev/precheck.sh .git/hooks/pre-push)
cd "$(git rev-parse --show-toplevel)" || exit 1
ok=0
if ! cmp -s database.rules.json dev/gh_database.rules.json; then
  echo "규칙 파일 두 개가 달라요. 원본은 dev/gh_database.rules.json이에요. 그곳을 고친 뒤 맨 위로 복사해 주세요(cp dev/gh_database.rules.json database.rules.json)"; ok=1
fi
python3 -c "import json; json.load(open('database.rules.json')); json.load(open('live.json'))" || { echo "규칙 파일이나 live.json이 올바른 JSON이 아니에요"; ok=1; }
python3 dev/check_rules.py >/dev/null || { echo "CLAUDE.md와 AGENTS.md의 공통 규칙이 달라요"; ok=1; }
# 4.3.1: Build check처럼 맨 위 index.html이 원본에서 만든 것과 같은지도 봐요(잊으면 실패 메일이 가요)
tmp=$(mktemp -d); python3 dev/build_gh.py "$tmp" >/dev/null 2>&1
if ! cmp -s "$tmp/index.html" index.html; then echo "index.html이 원본과 달라요. python3 dev/build_gh.py . 을 돌려 주세요"; ok=1; fi
rm -rf "$tmp"
[ $ok -eq 0 ] && echo "점검 통과"
exit $ok
