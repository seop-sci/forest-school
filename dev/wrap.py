import sys
body=open('forest-school.html',encoding='utf-8').read()
# 2026-11-17 원본에는 그림 주소(img/a/...)만 있어요. 시험판은 file:// 주소라 그림을 글 안에 base64로 다시 넣어요(아래 곡과 같아요). 넣은 결과는 예전 원본과 글자까지 같아요
import imglib
body, _n = imglib.inline(body)
assert _n > 1900 and not imglib.refs(body), ('그림을 다시 넣지 못했어요', _n)
head='''<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,sans-serif;background:#fafaf8}img{max-width:100%}[hidden]{display:none!important}</style></head><body>'''
# 1.8.0 곡은 게임 밖의 audio 폴더 파일이에요. 자동 시험은 file:// 주소라 파일을 받을 수 없어서 시험판에만 글자로 넣어요
import base64, pathlib
aud = pathlib.Path(__file__).resolve().parent.parent / 'audio'
songs = ',\n'.join(f'"{p.stem}":"data:audio/mp4;base64,{base64.b64encode(p.read_bytes()).decode()}"' for p in sorted(aud.glob('bgm_*.mp4')))
body = body.replace('<!-- FS_AUD:', f'<script>window.FS_AUD={{\n{songs}\n}};</script>\n<!-- FS_AUD:', 1)
open('test.html','w',encoding='utf-8').write(head+body+'</body></html>')
