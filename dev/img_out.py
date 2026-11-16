# 원본(dev/forest-school.html) 안의 base64 그림을 img/a 파일로 꺼내고 주소로 바꿔요. 여러 번 돌려도 같아요.
#   python3 dev/img_out.py           꺼내기(그림 넣는 도구 embed_assets.py가 끝에 저절로 불러요)
#   python3 dev/img_out.py --check   검사만: 원본이 부르는 파일이 모두 있고 이름의 지문이 내용과 맞는지, 남은 base64가 없는지(끝 코드 1이면 틀림)
#   python3 dev/img_out.py --inline 파일   옛 꼴(그림을 품은 한 파일)을 그 파일로 만들어요. 되돌릴 때나 한 파일로 건넬 때 써요
import sys
import imglib
def main():
    a = sys.argv[1:]; src = imglib.SRC.read_text(encoding='utf-8')
    if '--check' in a:
        bad = imglib.check(src)
        for b in bad[:20]: print('  틀림:', b)
        print(f'그림 주소 {len(imglib.refs(src))}개' + ('' if bad else ', 모두 맞아요')); sys.exit(1 if bad else 0)
    if '--inline' in a:
        out, n = imglib.inline(src); open(a[a.index('--inline') + 1], 'w', encoding='utf-8').write(out); print(f'그림 {n}곳을 다시 넣었어요, {len(out.encode()) / 1e6:.1f}MB'); return
    out, used = imglib.externalize(src)
    if out != src: imglib.SRC.write_text(out, encoding='utf-8')
    print(f'꺼낸 그림 {len(used)}장, 원본 {len(src.encode()) / 1e6:.1f}MB → {len(out.encode()) / 1e6:.1f}MB')
    bad = imglib.check(out)
    for b in bad[:20]: print('  틀림:', b)
    sys.exit(1 if bad else 0)
if __name__ == '__main__': main()
