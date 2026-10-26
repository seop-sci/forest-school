# 1.7.3 배경음악 파일 넣기: 반복 구간으로 잘라 둔 m4a(AAC) 파일을 글자(base64)로 바꿔 forest-school.html의 window.FS_AUD 묶음에 넣어요.
# 쓰는 법: python3 embed_audio.py <m4a 폴더>
#   파일 이름(확장자 뺀 것)이 열쇠예요: bgm_home(홈), bgm_room(그 밖의 화면), bgm_festival(학교 행사), bgm_play(미니게임)
#   곡 원본은 지섭이 Suno 유료 플랜으로 만든 mp3예요. 반복 구간 자르기와 줄이기는 dev/README.md "배경음악 파일" 참고
import base64, pathlib, sys

HERE = pathlib.Path(__file__).resolve().parent
SRC = HERE / 'forest-school.html'
BEGIN, END = '<!-- FS_AUD:BEGIN -->', '<!-- FS_AUD:END -->'

def main(d):
    files = sorted(pathlib.Path(d).glob('bgm_*.m4a'))
    if not files:
        sys.exit('bgm_*.m4a 파일이 없어요')
    body = ',\n'.join(f'"{p.stem}":"data:audio/mp4;base64,{base64.b64encode(p.read_bytes()).decode()}"' for p in files)
    new = f'{BEGIN}\n<script>window.FS_AUD={{\n{body}\n}};</script>\n{END}'
    src = SRC.read_text(encoding='utf-8')
    if BEGIN in src:
        src = src[:src.index(BEGIN)] + new + src[src.index(END) + len(END):]
    else:
        at = src.index('<!-- FS_IMG:BEGIN -->')
        src = src[:at] + new + '\n' + src[at:]
    SRC.write_text(src, encoding='utf-8')
    print(f'곡 {len(files)}개, 글자 크기 {sum(p.stat().st_size for p in files) * 4 / 3 / 1024:.0f} KB')

if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit('m4a 폴더를 적어 주세요')
    main(sys.argv[1])
