# 가구 그림 다듬기: 가구마다 네 단계(old, 기본, fresh, shiny) 그림을 같은 틀(네 장을 합친 테두리)로 잘라요.
# 그래야 단계가 바뀌어도 가구 자리와 크기가 튀지 않아요. 결과 폴더를 embed_assets.py로 넣어요.
# 쓰는 법: python3 prep_furniture.py <art/v150/furniture 폴더> <내보낼 폴더>
import pathlib, sys
from PIL import Image

STAGES = ['_old', '', '_fresh', '_shiny']


def main(src, out):
    src, out = pathlib.Path(src), pathlib.Path(out)
    out.mkdir(parents=True, exist_ok=True)
    ids = sorted({p.stem[4:].replace('_old', '').replace('_fresh', '').replace('_shiny', '') for p in src.glob('fur_*.png')})
    for i in ids:
        ims = [Image.open(src / f'fur_{i}{s}.png').convert('RGBA') for s in STAGES]
        box = None
        for im in ims:
            b = im.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox()
            box = b if box is None else (min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3]))
        for s, im in zip(STAGES, ims):
            im.crop(box).save(out / f'fur_{i}{s}.png')
        print(i, box)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
