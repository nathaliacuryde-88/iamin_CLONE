# Score + sound effects for the time capsule reel, written in Python (120 BPM, A minor: Am F C G).
import numpy as np, wave, sys
SR = 48000; DUR = 30.5; N = int(SR * DUR); BEAT = .5; BAR = 2.0
rng = np.random.default_rng(7)
mixL = np.zeros(N); mixR = np.zeros(N)
def add(sig, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR);
    if i >= N: return
    s = sig[: N - i] * gain; l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    mixL[i:i + len(s)] += s * l * 1.414; mixR[i:i + len(s)] += s * r * 1.414
def tt(d): return np.arange(int(d * SR)) / SR
def env(d, a=.005, r=.2, s=None):
    t = tt(d); e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / r); return e
def lp(x, fc):  # one-pole low-pass
    a = np.exp(-2 * np.pi * fc / SR); y = np.empty_like(x); z = 0.0
    for i in range(len(x)): z = (1 - a) * x[i] + a * z; y[i] = z
    return y
def lp_fast(x, fc, n=2):
    # cheap FFT low-pass for long signals
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X *= 1 / np.sqrt(1 + (f / fc) ** (2 * n)); return np.fft.irfft(X, len(x))
def hp_fast(x, fc, n=2):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X *= 1 / np.sqrt(1 + (fc / np.maximum(f, 1)) ** (2 * n)); return np.fft.irfft(X, len(x))
def saw(f, t): return 2 * ((f * t) % 1) - 1
def note(n): return 440 * 2 ** ((n - 69) / 12)

# ---------------- arrangement ----------------
# section gains per time (intro dusk, night build, peak, morning breakdown, finale)
def sect(t):
    if t < 6: return dict(kick=0 if t < 2 else .8, bass=.0 if t < 2 else .7, hat=.5, clap=0, arp=.5, pad=.9)
    if t < 12: return dict(kick=1, bass=1, hat=.8, clap=.8, arp=.6, pad=.8)
    if t < 18: return dict(kick=1, bass=1, hat=1, clap=1, arp=1, pad=.8)
    if t < 20: return dict(kick=0, bass=0, hat=.3, clap=0, arp=.7, pad=1)
    if t < 24: return dict(kick=.9, bass=.9, hat=.8, clap=.8, arp=.8, pad=.9)
    if t < 28: return dict(kick=1, bass=1, hat=1, clap=1, arp=1, pad=.8)
    return dict(kick=0, bass=0, hat=0, clap=0, arp=0, pad=1)
CH = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]   # Am F C G
ROOT = [45, 41, 36, 43]

# pads (one chord per bar), detuned saws, low-passed
pad = np.zeros(N)
for b in range(int(DUR / BAR) + 1):
    t0 = b * BAR; d = BAR + .3; t = tt(d); g = sect(t0)["pad"]; ch = CH[b % 4]
    s = sum(saw(note(n + 12) * (1 + dt), t) for n in ch for dt in (-.004, 0, .004)) / 9
    e = np.minimum(1, t / .25) * np.minimum(1, (d - t) / .3)
    i = int(t0 * SR); seg = (s * e * g)[: N - i]; pad[i:i + len(seg)] += seg
pad = lp_fast(pad, 1400); add(pad, 0, .22, -.15); add(np.roll(pad, 480), 0, .22, .15)

# arp: 16ths over chord tones, pluck
for k in range(int(DUR / (BEAT / 4))):
    t0 = k * BEAT / 4; g = sect(t0)["arp"]
    if g == 0 or t0 >= 28: continue
    ch = CH[int(t0 / BAR) % 4]; n = [ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[1] + 24][k % 4]
    t = tt(.22); s = np.sign(np.sin(2 * np.pi * note(n) * t)) * .5 + saw(note(n), t) * .5
    s = lp(s * env(.22, .002, .07), 3200); add(s, t0, .055 * g, .35 if k % 2 else -.35)

# bass: 8ths, root with octave bounce
for k in range(int(DUR / (BEAT / 2))):
    t0 = k * BEAT / 2; g = sect(t0)["bass"]
    if g == 0: continue
    r = ROOT[int(t0 / BAR) % 4] - 12 + (12 if k % 2 else 0); t = tt(.24)
    s = lp(saw(note(r), t) * env(.24, .004, .12), 500); add(s, t0, .32 * g)

# drums
def kick():
    t = tt(.45); f = 45 + 85 * np.exp(-t / .045); ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t / .16) + rng.normal(0, 1, len(t)) * np.exp(-t / .004) * .2
def clap():
    t = tt(.3); n = rng.normal(0, 1, len(t)); e = sum(np.exp(-np.maximum(0, t - o) / .012) * (t >= o) for o in (0, .011, .022)) * .4 + np.exp(-t / .09) * (t > .022)
    return hp_fast(n * e, 900)
def hat(open_=False):
    t = tt(.25 if open_ else .06); return hp_fast(rng.normal(0, 1, len(t)), 7000) * np.exp(-t / (.08 if open_ else .015))
K, CL, HA, HO = kick(), clap(), hat(), hat(True)
for k in range(int(DUR / BEAT)):
    t0 = k * BEAT; g = sect(t0)
    if g["kick"]: add(K, t0, .55 * g["kick"])
    if g["clap"] and k % 2 == 1: add(CL, t0, .22 * g["clap"], .05)
    if g["hat"]: add(HA, t0 + BEAT / 2, .10 * g["hat"], .25); add(HA, t0 + BEAT / 4, .04 * g["hat"], -.25)
    if g["hat"] and k % 8 == 7: add(HO, t0 + BEAT / 2, .07 * g["hat"], .2)

# ---------------- sound effects ----------------
def click(f=2400, d=.05):
    t = tt(d); return (np.sin(2 * np.pi * f * t) * .6 + rng.normal(0, 1, len(t)) * .4) * np.exp(-t / .006)
def tick():
    t = tt(.03); return hp_fast(rng.normal(0, 1, len(t)), 2500) * np.exp(-t / .004)
def pop(f0=520, f1=900, d=.16):
    t = tt(d); f = f0 + (f1 - f0) * (1 - np.exp(-t / .03)); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / .05)
def whoosh(d=.5, up=True, fc=(600, 4000)):
    t = tt(d); n = rng.normal(0, 1, len(t)); x = np.linspace(0, 1, len(t)); e = np.sin(np.pi * x) ** 1.5
    lo = lp_fast(n, fc[0]); hi = lp_fast(n, fc[1]); k = x if up else 1 - x
    return (lo * (1 - k) + hi * k) * e
def chime(ns=(76, 81, 84, 88), d=1.4):
    out = np.zeros(int(d * SR))
    for i, n in enumerate(ns):
        t = tt(d - i * .06); s = (np.sin(2 * np.pi * note(n) * t) + .3 * np.sin(4 * np.pi * note(n) * t)) * np.exp(-t / .5)
        out[int(i * .06 * SR): int(i * .06 * SR) + len(s)] += s
    return out / len(ns)
def shutter():
    t = tt(.12); n = rng.normal(0, 1, len(t)); e = np.exp(-t / .01) + .7 * np.exp(-np.maximum(0, t - .055) / .012) * (t > .055)
    return hp_fast(n * e, 1500)
def thunk():
    t = tt(.35); f = 70 + 140 * np.exp(-t / .03); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / .08)
def boom():
    t = tt(2.2); f = 38 + 60 * np.exp(-t / .08); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / .6) + lp_fast(rng.normal(0, 1, len(t)), 300) * np.exp(-t / .3) * .4

# S1: tap the note, type, tap Seal it, the capsule closes
add(click(), .9, .35)
for i in range(26): add(tick(), 1.1 + i * (1.9 / 26) + rng.uniform(-.015, .015), .16, rng.uniform(-.2, .2))
add(click(), 3.45, .4); add(thunk(), 3.62, .45); add(whoosh(.35, False), 3.62, .12)
add(pop(380, 760), 4.42, .35, -.4); add(pop(400, 800), 4.47, .35, .4); add(chime((81, 88), .9), 4.5, .12)
# S2: three notes get sealed, brackets close
for i in range(3): add(pop(600 + i * 120, 1000 + i * 120), 6.38 + i * .5, .28, (-.3, 0, .3)[i])
add(pop(380, 760), 8.32, .35, -.4); add(pop(400, 800), 8.37, .35, .4); add(click(1800), 8.42, .25)
# S3: photos: shutter + fly + land
for ts in (.9, 1.9, 3.55, 4.35, 5.0):
    add(shutter(), 12 + ts, .35, -.3); add(whoosh(.45, True, (800, 5000)), 12 + ts + .02, .1, .2); add(pop(900, 1300, .1), 12 + ts + .5, .18, .3)
# S4: the capsule opens, the photo pops
add(whoosh(.6, True), 18.6, .14); add(chime(), 19.05, .3); add(pop(500, 1000), 20.65, .3, .3)
# scene swishes
for t0 in (5.85, 11.85, 17.85, 23.85): add(whoosh(.4, True, (400, 2500)), t0, .07)
# S5: riser into the end card, then the impact
add(whoosh(1.3, True, (300, 6000)), 26.75, .2); add(boom(), 28.0, .55); add(chime((69, 76, 81, 84), 2.4), 28.05, .25)

# ---------------- master ----------------
st = np.stack([mixL, mixR], 1)
fade = np.ones(N); fo = int(.6 * SR); fade[-fo:] = np.linspace(1, 0, fo); st *= fade[:, None]
st = np.tanh(st * 1.1) / np.tanh(1.1)       # gentle soft clip
st /= np.max(np.abs(st)) / .9
with wave.open(sys.argv[1] if len(sys.argv) > 1 else "score.wav", "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767).astype("<i2").tobytes())
print("ok", DUR)
