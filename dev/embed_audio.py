# 배경음악 파일 넣기: 반복 구간으로 잘라 둔 m4a(AAC) 파일을 저장소 맨 위 audio 폴더에 bgm_*.mp4 이름으로 넣어요.
# 1.8.0부터 곡은 게임 파일(forest-school.html) 밖의 따로 된 파일이에요(게임 파일이 너무 커지지 않게, 지섭 결정).
#   웹(GitHub Pages)은 index.html 옆 audio 폴더, 안드로이드는 app/build-www.mjs가 www/audio로, 토스는 toss/build.mjs가 dist/audio로 복사해요.
#   자동 시험판(dev/test.html)만 dev/wrap.py가 곡을 글자로 넣어요(file:// 주소에서는 파일을 받을 수 없어서).
# 쓰는 법: python3 embed_audio.py <m4a 폴더>
#   파일 이름(확장자 뺀 것)이 열쇠예요: bgm_home(홈), bgm_room(그 밖의 화면), bgm_festival(학교 행사), bgm_play(미니게임),
#   bgm_spring, bgm_summer, bgm_autumn, bgm_winter, bgm_xmas, bgm_space, bgm_retro(배경 테마 곡, 1.8.0)
#   곡 원본은 지섭이 Suno 유료 플랜으로 만든 mp3예요. 반복 구간 자르기는 dev/bgm_loop.py
import pathlib, shutil, sys

HERE = pathlib.Path(__file__).resolve().parent
AUD = HERE.parent / 'audio'

def main(d):
    files = sorted(pathlib.Path(d).glob('bgm_*.m4a'))
    if not files:
        sys.exit('bgm_*.m4a 파일이 없어요')
    AUD.mkdir(exist_ok=True)
    for p in files:
        shutil.copyfile(p, AUD / (p.stem + '.mp4'))   # AAC 소리만 든 mp4(m4a와 같은 파일). Claude 화면 게임이 .m4a 이름을 못 실어서 .mp4로
    print(f'곡 {len(files)}개를 audio 폴더에 넣었어요 ({sum(p.stat().st_size for p in files) / 1024:.0f} KB)')

if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit('m4a 폴더를 적어 주세요')
    main(sys.argv[1])
