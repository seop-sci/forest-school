# 1.7.3 배경음악 반복 구간 만들기: Suno mp3를 받아 이음매 없이 되풀이되는 bgm_*.m4a를 만들어요(결과는 embed_audio.py로 넣어요)
# 쓰는 법: python3 bgm_loop.py <열쇠>=<mp3>[@시작-끝] [...] --out <폴더> [--xfade <박자 수>]
#   @시작-끝(초)을 적으면 그 구간을 써요(귀로 듣고 고른 구간). 안 적으면 아래 1)처럼 찾아요. --xfade는 이음매를 겹치는 길이(기본 1박자)
#   예: python3 bgm_loop.py bgm_home=1.mp3 bgm_room=2.mp3 bgm_festival=3.mp3 bgm_play=4.mp3 --out /tmp/bgm
# 필요한 것: ffmpeg, pip install librosa soundfile
# 하는 일
#  1) 박자를 찾고(librosa), 비트마다 화음(chroma)과 음색(MFCC)을 재요
#  2) 앞쪽 절반의 비트 a와 뒤쪽 비트 b 가운데 앞뒤 8박이 가장 비슷한 곳을 골라요(b-a는 16박 배수, 60초 이상, 끝 5초 전)
#  3) b를 파형이 가장 잘 맞게 ±40ms 안에서 다듬고, [a, b)를 잘라 끝 한 박자를 a 바로 앞 한 박자와 겹쳐요(되풀이할 때 a로 자연스럽게 넘어가요)
#  4) -18 LUFS로 소리 크기를 맞추고 AAC 80kbps m4a로 줄여요
import subprocess, sys, pathlib, numpy as np, librosa, soundfile as sf

MIN_LOOP = 60   # 되풀이 구간의 가장 짧은 길이(초). 짧은 곡은 --min으로 줄여요(1.8.0 크리스마스, 여름 곡은 1분 남짓)

def find_loop(path):
    y, sr = librosa.load(path, sr=22050, mono=True); dur = len(y) / sr
    _, beats = librosa.beat.beat_track(y=y, sr=sr, units='frames')
    C = librosa.feature.chroma_cqt(y=y, sr=sr, hop_length=512)
    M = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=20, hop_length=512); M = (M - M.mean(1, keepdims=True)) / (M.std(1, keepdims=True) + 1e-6)
    Fb = librosa.util.sync(np.vstack([C * 3, M]), beats, aggregate=np.mean); Fb /= np.linalg.norm(Fb, axis=0, keepdims=True) + 1e-9
    bt = librosa.frames_to_time(beats, sr=sr, hop_length=512); N = len(bt); W = 8; best = None
    for i in range(W, N // 2):
        for j in range(i + 8, N - W):
            if bt[j] > dur - 5: break
            if (j - i) % 16 or bt[j] - bt[i] < MIN_LOOP: continue
            s = float(np.mean(np.sum(Fb[:, i - W:i + W] * Fb[:, j - W:j + W], axis=0)))
            score = s + 0.04 * (bt[j] - bt[i]) / dur
            if best is None or score > best[0]: best = (score, s, bt[i], bt[j])
    return best[2], best[3], float(np.median(np.diff(bt))), best[1]

def bake(key, path, out, ab=None, xf=1):
    a_t, b_t, beat, sim = find_loop(path)
    if ab: a_t, b_t = ab
    wav = out / f'{key}_src.wav'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(path), '-ar', '44100', '-ac', '2', str(wav)], check=True)
    y, sr = sf.read(wav); m = y.mean(1); a, b = int(a_t * sr), int(b_t * sr)
    win, lag, ref, best = int(2 * sr), int(0.04 * sr), m[int(a_t * sr):int(a_t * sr) + int(2 * sr)], (-1, 0)
    for l in range(-lag, lag + 1):
        seg = m[b + l:b + l + win]; c = float(np.dot(ref, seg) / (np.linalg.norm(ref) * np.linalg.norm(seg) + 1e-9))
        if c > best[0]: best = (c, l)
    b += best[1]; X = int(beat * sr * xf)
    loop = y[a:b].copy(); t = np.linspace(0, 1, X)[:, None]
    loop[-X:] = y[b - X:b] * np.cos(t * np.pi / 2) + y[a - X:a] * np.sin(t * np.pi / 2)
    sf.write(out / f'{key}_loop.wav', loop, sr)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(out / f'{key}_loop.wav'), '-af', 'loudnorm=I=-18:TP=-1.5:LRA=11', '-ar', '44100', '-c:a', 'aac', '-b:a', '80k', str(out / f'{key}.m4a')], check=True)
    print(f'{key}: {a / sr:.2f}초 ~ {b / sr:.2f}초 ({(b - a) / sr:.2f}초), 비슷함 {sim:.2f}')

if __name__ == '__main__':
    args = sys.argv[1:]
    if '--out' not in args: sys.exit('--out <폴더>를 적어 주세요')
    out = pathlib.Path(args[args.index('--out') + 1]); out.mkdir(parents=True, exist_ok=True)
    xf = float(args[args.index('--xfade') + 1]) if '--xfade' in args else 1
    if '--min' in args: MIN_LOOP = float(args[args.index('--min') + 1])
    for kv in [a for a in args[:args.index('--out')] if '=' in a]:
        k, p = kv.split('=', 1); ab = None
        if '@' in p: p, r = p.rsplit('@', 1); ab = tuple(float(x) for x in r.split('-'))
        bake(k, pathlib.Path(p), out, ab, xf)
