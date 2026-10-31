# 1.5.0, 1.6.0 그림 넣기: PNG 원본 폴더를 받아 webp로 줄이고, forest-school.html 안의 그림 묶음(window.FS_IMG)을 새로 써요.
# 쓰는 법: python3 embed_assets.py <원본 폴더> [<원본 폴더2> ...]
#   1.7.0 그림은 따로 둔 묶음(window.FS_IMG170)에 넣어요: python3 embed_assets.py --block 170 <도감> <이벤트> <특별 손님> <테마 지도> <2단계 건물> <2단계 지붕>
#   (특별 손님 chr_은 chr_ 규칙, 테마 지도 map_kinder_spring 등은 map_ 규칙, 학교급별 건물 bld_*_s2와 지붕 roof_*_s2는 bld_, roof_ 규칙)
#   폴더 안의 파일 이름(확장자 뺀 것)이 그대로 열쇠가 돼요. 예: map_kinder, bld_classroom_on, ic_home
# 원본 PNG는 저장소에 넣지 않아요(1차 에셋 zip, art/v150-assets 브랜치). 게임은 한 파일로 돌아가야 해서 그림을 글자로 바꿔 넣어요.
import base64, io, pathlib, re, sys
from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent
SRC = HERE / 'forest-school.html'
BEGIN, END, VAR = '<!-- FS_IMG:BEGIN -->', '<!-- FS_IMG:END -->', 'FS_IMG'
# 1.7.0 묶음(--block 170): 1.6.0 퍼즐 그림과 같은 묶음을 고치지 않게 따로 둬요
BLOCKS = {'170': ('<!-- FS_IMG170:BEGIN -->', '<!-- FS_IMG170:END -->', 'FS_IMG170'),
          '171': ('<!-- FS_IMG171:BEGIN -->', '<!-- FS_IMG171:END -->', 'FS_IMG171'),   # 1.7.1 업적, 방 꾸밈 소품, 새 선생님, 행사 그림
          '174': ('<!-- FS_IMG174:BEGIN -->', '<!-- FS_IMG174:END -->', 'FS_IMG174'),   # 1.7.4 꾸미기(장식, 마크, 간판, 꾸미기 가게)
          '180': ('<!-- FS_IMG180:BEGIN -->', '<!-- FS_IMG180:END -->', 'FS_IMG180'),   # 1.8.0 숲속 합치기 (작업지시서 13)
          '200': ('<!-- FS_IMG200:BEGIN -->', '<!-- FS_IMG200:END -->', 'FS_IMG200'),
          '213': ('<!-- FS_IMG213:BEGIN -->', '<!-- FS_IMG213:END -->', 'FS_IMG213'),
          '220': ('<!-- FS_IMG220:BEGIN -->', '<!-- FS_IMG220:END -->', 'FS_IMG220'),
          '230': ('<!-- FS_IMG230:BEGIN -->', '<!-- FS_IMG230:END -->', 'FS_IMG230'),
          '231': ('<!-- FS_IMG231:BEGIN -->', '<!-- FS_IMG231:END -->', 'FS_IMG231')}   # 2.3.1 뱀과 매 침입자 동작(작업지시서 44)   # 2.3.0 창문 불빛, 새 선생님, 졸업식 (작업지시서 39, 40, 42)   # 2.2.0 야간 건설, 텃밭, 생물 탐사, 대항전 (작업지시서 36, 37)   # 2.1.3 숲속 패스, 반짝 친구, 시즌 기념 장식 (작업지시서 17, 23, 34)   # 2.0.0 중학교 (작업지시서 19, 20)

# 열쇠 앞부분마다 줄일 크기(긴 변 픽셀)와 화질
RULES = [
    ('trl_fx_', 128, 84),        # 2.3.1 침입자 깃털, 풀잎
    ('trl_', 220, 82),           # 2.3.1 뱀과 매 동작(작업지시서 44, 512 캔버스)
    ('glow_', 400, 80),          # 2.3.0 창문 불빛 조각(작업지시서 42, 건물 그림과 같은 400 캔버스)
    ('cere_curtain_', 640, 76),  # 2.3.0 졸업식(작업지시서 40)
    ('cere_banner', 640, 80),
    ('cere_podium', 240, 82),
    ('cere_flower_stand', 300, 82),
    ('cere_light', 480, 74),
    ('cere_photo_frame', 480, 80),
    ('cere_fw_', 256, 80),
    ('cere_petal_', 64, 84),
    ('cere_balloon_', 150, 84),
    ('cere_confetti', 256, 80),
    ('cere_flash', 256, 78),
    ('cere_sparkle', 128, 84),
    ('cere_', 256, 82),          # 졸업장, 학사모, 꽃다발, 사진기
    ('garden_bg', 720, 72),     # 2.2.0 학교 텃밭(작업지시서 37-A)
    ('garden_bubble', 96, 86),
    ('plot_', 160, 84),
    ('crop_', 160, 84),
    ('item_', 112, 86),
    ('menu_', 192, 82),
    ('bio_hut', 240, 82),       # 2.2.0 생물 탐사(작업지시서 37-B)
    ('bio_rustle', 128, 84),
    ('bio_lens', 128, 86),
    ('bio_', 192, 82),
    ('league_banner', 720, 75), # 2.2.0 동아리 대항전
    ('league_podium', 240, 82),
    ('league_', 112, 86),
    ('flag_', 200, 82),
    ('pass_bg', 720, 72),       # 2.1.3 숲속 패스(작업지시서 23, 34)
    ('pass_ribbon', 512, 84),
    ('pass_node_', 96, 86),
    ('pass_flag', 96, 86),
    ('pass_chest_', 160, 84),
    ('pass_badge', 160, 84),
    ('pass_deco_', 240, 82),
    ('pass_fur_', 240, 80),
    ('rare_badge', 96, 86),     # 2.1.3 반짝 친구 표시(작업지시서 17)
    ('season_', 240, 82),       # 2.1.3 랭킹 시즌 기념 장식 4장
    ('map_kinder_', 720, 55),   # 1.7.0 테마 지도 10장: 파일이 너무 커지지 않게 기본 지도보다 화질을 낮춰요
    ('map_elem_', 720, 55),
    ('map_middle_', 720, 55),   # 2.0.0 중학교 테마 지도 5장
    ('map_', 720, 70),
    ('bld_', 400, 80),
    ('boost_', 128, 86),   # 1.7.2 미니게임 부스터 아이콘 5장
    ('street_bg', 720, 70),
    ('hall_bg', 1024, 74),    # 2.0.0 학교 복도 배경(세로 2:3). 2.0.1부터 방까지 한 장이라 크게(작업지시서 30-2)
    ('hall_sign', 256, 84),   # 2.0.0 복도 입구 단추 그림
    ('hall_', 480, 80),       # 2.0.0 복도 방문(투명, 가게 그림과 같은 캔버스)
    ('club_bg', 720, 72),     # 2.0.0 동아리실 맨 위 그림
    ('club_show', 720, 72),   # 2.0.0 동아리 발표회
    ('elect_bg', 720, 72),    # 2.0.1 반장 선거 창 맨 위 그림(작업지시서 11)
    ('elect_card', 320, 82),  # 2.0.1 반장 후보 카드 틀(밝은 판, 어두운 판)
    ('elect_', 160, 84),      # 2.0.1 반장 배지, 투표함, 투표 용지, 연설대, 공약 아이콘 4장
    ('lab_bg', 720, 72),      # 2.0.1 과학 탐구 실험 창 맨 위 그림(작업지시서 18)
    ('lab_note_', 720, 74),   # 2.0.1 실험 노트 펼친 면(밝은 판, 어두운 판)
    ('lab_flask', 220, 84),   # 2.0.1 섞는 플라스크와 섞기 효과
    ('lab_mix', 220, 84),
    ('lab_in_', 112, 86),     # 2.0.1 재료 7개
    ('lab_', 192, 82),        # 2.0.1 결과 카드 20장(lab_r_), 실패 카드 4장(lab_f_)
    ('book_', 200, 82),
    ('arena_bg', 720, 72),    # 2.0.1 숲속 대결(작업지시서 29): 대결장
    ('card_battle', 320, 80), # 공부 탭 카드 그림
    ('bev_', 112, 86),        # 종목 아이콘 5장(ev_ 규칙과 겹치지 않게 b를 붙임)
    ('bmark_', 112, 86),      # 상대 학교 마크 8장(1.7.4 mark_와 겹치지 않게)
    ('bfx_', 160, 84),        # 응원, 승리, 패배 도장
    ('medal_', 128, 86),      # 리그 메달 6장
    ('exam_bg', 720, 72),     # 2.0.1 시험 기간(작업지시서 21, art/v210/exam)
    ('exam_banner', 720, 72),
    ('exam_report', 480, 80), # 성적표 종이(768×1024)
    ('exam_award', 240, 82),  # 전교 1등 상장
    ('exam_desk', 220, 82),
    ('exam_', 112, 86),       # 연필, 책, 종 아이콘
    ('grade_', 96, 86),       # 등급 도장 A~D       # 2.0.1 책 읽기 책 표지 12권(작업지시서 29-1, 512×640 세로)
    ('club_', 128, 86),       # 2.0.0 동아리 배지 4장   # 1.7.2 상점 거리 배경(세로 2:3)
    ('shop_', 480, 80),       # 1.7.2 상점 거리 가게 건물(투명)
    ('ic_', 112, 86),
    ('notice_head', 720, 76),   # 2.0.0 공지 창 맨 위 그림(작업지시서 23)
    ('deco_', 200, 80),
    ('evd_', 240, 82),    # 2.0.0 이벤트 한정 지도 장식 23종(작업지시서 26, 400x400 투명)
    ('sign_', 400, 82),   # 1.7.4 학교 간판(가로 2:1)
    ('mark_', 128, 86),   # 1.7.4 학교 마크 바탕과 문양(회색, 게임이 색을 입혀요)
    ('orn_hud_', 320, 82),   # 홈 현황판 꾸밈 2장(잎 덩굴 320×160, 꽃 240×160): 가로로 길어서 원본 크기 그대로
    ('orn_', 160, 80),
    ('chr_', 220, 82),
    ('tea_', 260, 82),
    ('room_', 900, 72),
    ('fur_', 200, 78),
    ('roof_', 400, 80),
    ('oak', 300, 80),
    # 1.7.0 도감, 이벤트 (자세한 것을 먼저 적어요)
    ('dex_unknown', 220, 80),
    ('dex_card', 400, 80),
    ('dex_complete', 400, 80),
    ('dex_', 720, 78),
    ('ev_stamp', 112, 84),
    ('ev_box', 220, 82),
    ('ev_wait', 400, 80),
    ('ev_', 720, 75),
    # 1.6.0 블록 퍼즐
    ('pz_bg', 720, 70),
    ('pz_board', 640, 80),
    ('pz_', 96, 84),
    ('fx_scaffold', 320, 80),   # 1.8.0 짓기 효과 (작업지시서 22). 반짝이, 망치, 배지는 아래 fx_ 규칙(96)
    ('fx_ribbon', 320, 84),
    ('fx_dust_', 160, 80),
    ('fx_', 96, 84),
    ('timer_bar', 256, 84),     # 2.1.0 공사 진행 막대 틀(작업지시서 22, art/build-fx)
    ('ticket_', 128, 86),
    ('picnic_trail', 720, 72),  # 2.1.0 숲속 소풍 창 맨 위 그림(작업지시서 11, art/v174/picnic)
    ('picnic_', 160, 84),       # 바구니, 돗자리, 보따리, 희귀 열매, 아이콘, 도시락(작업지시서 16)
    ('sticker_board_', 560, 74),  # 2.1.0 칭찬 스티커판 달마다 12장(작업지시서 12, art/v18x/sticker, 1024×768)
    ('sticker_prize', 320, 80),
    ('sticker_', 96, 86),       # 스티커 8종       # 2.1.0 시간 단축권 넷(ticket_1m, 5m, 10m, 30m을 색 순서대로 m5, m30, h1, h3로 바꿔 넣어요)
    ('essence_', 240, 82),
    ('cos_', 160, 84),
    # 2.1.1 학생과 추억(작업지시서 16 art/v181, 작업지시서 12 art/v18x/album, birthday). 고깔모자는 cos_hat_bday로 바꿔 넣어요(위 cos_ 규칙)
    ('snack_bg', 720, 72),      # 2.1.2 매점 간식 뽑기(작업지시서 21, art/v210/snack)
    ('snack_machine', 360, 82),
    ('snack_', 160, 84),        # 간식 20종, 캡슐 둘
    ('mood_', 96, 86),          # 학교 기분 아이콘 셋
    ('donate_bg', 720, 72),     # 2.1.2 마을 기부 창 위 그림(작업지시서 16, art/v185)
    ('donate_m', 256, 84),      # 기념물 8단계(512 캔버스, 바닥 y=472 같은 자리)
    ('donate_', 200, 84),       # 기부함, 아이콘
    ('bond_paper_', 560, 74),   # 편지지(768×1024)
    ('bond_bubble_', 360, 82),  # 말풍선(512×256)
    ('bond_letter', 240, 82),
    ('bond_', 112, 86),         # 하트, 빈 하트, 쓰다듬기, 선물
    ('bday_banner', 480, 80),
    ('bday_', 200, 84),         # 케이크, 색종이, 선물 상자
    ('album_page_', 900, 74),   # 펼친 앨범(1024×768)
    ('album_cover', 420, 78),
    ('album_', 160, 84),        # 사진 틀, 금빛 모서리
    # 1.7.1 (python3 embed_assets.py --block 171 <폴더>, 그림 둘레 투명 여백은 미리 잘라서 넣어요)
    ('prop_', 220, 80),
    ('ach_popup', 320, 82),
    ('ach_', 128, 84),
    ('title_ribbon', 384, 82),
    ('ic_trophy', 112, 86),
    ('fest_stage', 560, 78),
    ('fest_garland', 480, 80),
    ('fest_camera', 220, 82),
    ('fest_ic_', 112, 86),
    ('fest_', 96, 86),   # 1.6.0 정수 상점 한정 모자 (fur_sp_ 특별 가구는 fur_ 규칙)
    # 1.8.0 숲속 합치기 (python3 embed_assets.py --block 180 <폴더>)
    ('mg_bg', 720, 70),
    ('mg_board', 640, 80),
    ('mg_card', 240, 82),
    ('mg_help_', 320, 80),
    ('mg_ic_', 96, 84),
    ('mg_gen_', 160, 84),
    ('mg_', 128, 84),   # 조각 mg_a_01 … mg_v_10
]
SKIP = {'building_positions', 'mg_order_light', 'mg_order_dark'}   # 주문 쪽지 틀은 가로 그림이라 세로 카드에 안 맞아요


def rule(key):
    for pre, size, q in RULES:
        if key.startswith(pre):
            return size, q
    return None


def clean_alpha(im):
    # 거의 불투명한 곳(250~254)은 완전히 불투명하게, 아주 옅은 얼룩(16 이하)은 투명하게 해요
    if im.mode != 'RGBA':
        return im
    a = im.getchannel('A').point(lambda v: 255 if v >= 250 else (0 if v <= 16 else v))
    im.putalpha(a)
    return im


def encode(path):
    key = path.stem
    r = rule(key)
    if not r:
        return None
    size, q = r
    im = Image.open(path)
    im = im.convert('RGBA') if im.mode in ('RGBA', 'LA', 'P') else im.convert('RGB')
    im = clean_alpha(im)
    im.thumbnail((size, size), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, 'WEBP', quality=q, method=6)
    return key, 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode()


def main(dirs, block=''):
    BEGIN, END, VAR = BLOCKS.get(block, ('<!-- FS_IMG:BEGIN -->', '<!-- FS_IMG:END -->', 'FS_IMG'))
    imgs = {}
    for d in dirs:
        for p in sorted(pathlib.Path(d).glob('*.png')):
            if p.stem in SKIP:
                continue
            got = encode(p)
            if got:
                imgs[got[0]] = got[1]
    src = SRC.read_text(encoding='utf-8')
    old = {}
    if BEGIN in src:
        block = src[src.index(BEGIN):src.index(END)]
        for k, v in re.findall(r'"([A-Za-z0-9_]+)":"(data:image/[^"]+)"', block):
            old[k] = v
    old.update(imgs)   # 이번에 준 폴더의 그림만 바꾸고, 전에 넣은 그림은 그대로 둬요(webp가 아닌 SVG 같은 그림도, 2.2.0)
    body = ',\n'.join(f'"{k}":"{v}"' for k, v in sorted(old.items()))
    new = f'{BEGIN}\n<script>window.{VAR}={{\n{body}\n}};</script>\n{END}'
    if BEGIN in src:
        src = src[:src.index(BEGIN)] + new + src[src.index(END) + len(END):]
    elif block:
        sys.exit(f'{BEGIN} 표시가 없어요')
    else:
        at = src.index('\n<script>\n') + 1
        src = src[:at] + new + '\n' + src[at:]
    SRC.write_text(src, encoding='utf-8')
    total = sum(len(v) for v in old.values())
    print(f'그림 {len(old)}개 (이번에 {len(imgs)}개), 글자 크기 {total / 1024:.0f} KB')


if __name__ == '__main__':
    args = sys.argv[1:]
    block = ''
    if args[:1] == ['--block'] and len(args) >= 2:
        block = args[1]; args = args[2:]
        if block not in BLOCKS:
            sys.exit('아는 묶음은 ' + ', '.join(BLOCKS) + '뿐이에요')
    if not args:
        sys.exit('원본 폴더를 적어 주세요')
    main(args, block)
