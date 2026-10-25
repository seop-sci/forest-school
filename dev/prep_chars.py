# 동물 그림 다듬기: 학생(chr_)과 선생님(tea_) 그림을 몸에 딱 맞게 잘라요(가장자리 2% 여백).
# 게임은 발이 그림 맨 아래에 닿는다고 보고 세워요. 결과 폴더를 embed_assets.py로 넣고, 출력되는 비율표를 CHR_AR에 적어요.
# 쓰는 법: python3 prep_chars.py <art/v150/characters 폴더> <내보낼 폴더>
import pathlib, sys
from PIL import Image


def main(src, out):
    src, out = pathlib.Path(src), pathlib.Path(out)
    out.mkdir(parents=True, exist_ok=True)
    ar = {}
    for p in sorted(src.glob('*.png')):
        im = Image.open(p).convert('RGBA')
        b = im.getchannel('A').point(lambda v: 255 if v > 60 else 0).getbbox()
        m = int(max(b[2] - b[0], b[3] - b[1]) * 0.02)
        box = (max(0, b[0] - m), max(0, b[1] - m), min(im.width, b[2] + m), b[3])
        c = im.crop(box); c.save(out / p.name)
        ar[p.stem] = round(c.width / c.height, 2)
    print('{ ' + ', '.join(f'{k}: {v}' for k, v in ar.items()) + ' }')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
