# Claude API를 부르는 작은 도우미(dev/ai_lines.py, dev/ai_proof.py가 써요)
# 키는 환경 변수 ANTHROPIC_API_KEY에서만 읽어요(GitHub Actions의 저장소 Secrets). 저장소나 결과 파일에는 남기지 않아요
import json, os, time, urllib.request, urllib.error

API = 'https://api.anthropic.com/v1/messages'
USAGE = {'in': 0, 'out': 0, 'calls': 0}


FALLBACK = {'claude-fable-5-2': 'claude-opus-5-5'}   # 모델을 못 쓰면 다음 모델로


def ask(system, user, model, max_tokens=8000, tries=6):
    key = os.environ.get('ANTHROPIC_API_KEY', '')
    if not key:
        raise SystemExit('ANTHROPIC_API_KEY가 없어요(저장소 Settings > Secrets and variables > Actions)')
    body = json.dumps({'model': model, 'max_tokens': max_tokens, 'system': system,
                       'messages': [{'role': 'user', 'content': user}]}).encode('utf-8')
    for i in range(tries):
        req = urllib.request.Request(API, data=body, method='POST', headers={
            'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json'})
        try:
            with urllib.request.urlopen(req, timeout=600) as r:
                d = json.loads(r.read())
            u = d.get('usage', {})
            USAGE['in'] += u.get('input_tokens', 0); USAGE['out'] += u.get('output_tokens', 0); USAGE['calls'] += 1
            return ''.join(c.get('text', '') for c in d.get('content', []) if c.get('type') == 'text')
        except urllib.error.HTTPError as e:
            msg = e.read().decode('utf-8', 'replace')[:300]
            if e.code in (400, 403, 404) and model in FALLBACK and 'model' in msg.lower():
                print(f'{model}을 쓸 수 없어 {FALLBACK[model]}로 바꿔요: {msg[:120]}', flush=True)
                return ask(system, user, FALLBACK[model], max_tokens, tries)
            if e.code in (429, 500, 502, 503, 529) and i < tries - 1:
                time.sleep(min(60, 5 * 2 ** i)); continue
            raise SystemExit(f'API 오류 {e.code}: {msg}')
        except (urllib.error.URLError, TimeoutError) as e:
            if i < tries - 1:
                time.sleep(10); continue
            raise SystemExit(f'연결 오류: {e}')


def usage_line():
    return f"API 부름 {USAGE['calls']}번, 입력 토큰 {USAGE['in']:,}, 출력 토큰 {USAGE['out']:,}"
