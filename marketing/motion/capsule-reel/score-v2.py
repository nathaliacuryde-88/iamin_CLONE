# Score + sound effects for the time capsule reel, written in Python (120 BPM, A minor: Am F C G).
import numpy as np, wave, sys
SR = 48000; DUR = 40.6; N = int(SR * DUR); BEAT = .5; BAR = 2.0
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
    if t < 3: return dict(kick=0 if t < 2 else .7, bass=0, hat=.35, clap=0, arp=.4, pad=1)
    if t < 8: return dict(kick=.8, bass=.7, hat=.6, clap=.5, arp=.5, pad=.9)
    if t < 13: return dict(kick=1, bass=1, hat=.8, clap=.8, arp=.6, pad=.8)
    if t < 18: return dict(kick=1, bass=1, hat=1, clap=1, arp=1, pad=.8)
    if t < 20: return dict(kick=0, bass=0, hat=.3, clap=0, arp=.7, pad=1)
    if t < 38: return dict(kick=1, bass=1, hat=1 if t >= 27 else .85, clap=1 if t >= 27 else .8, arp=1 if t >= 27 else .8, pad=.85)
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
    if g == 0 or t0 >= 38: continue
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

def printer(d=2.6):
    t = tt(d); n = rng.normal(0, 1, len(t)); b = hp_fast(lp_fast(n, 3200), 700)
    am = .55 + .45 * (np.sin(2 * np.pi * 21 * t) > 0); e = np.minimum(1, t / .05) * np.minimum(1, (d - t) / .08)
    return b * am * e + np.sin(2 * np.pi * 95 * t) * .25 * e
# S0 intro: dot, logo snaps open, Time Capsule, phone rises, brackets close
add(pop(300, 700, .2), 0.0, .35); add(pop(300, 700, .2), .5, .2)
add(pop(380, 760), .55, .3, -.4); add(pop(400, 800), .6, .3, .4); add(chime((81, 88), .9), .62, .12)
add(chime((76, 81, 84, 88), 1.6), 1.6, .22); add(whoosh(.8, True, (300, 3000)), 1.0, .12)
add(pop(380, 760), 2.25, .3, -.4); add(pop(400, 800), 2.3, .3, .4); add(click(1800), 2.35, .2)
# S1 seal (a=3)
add(click(), 3.8, .35)
for i in range(26): add(tick(), 4.1 + i * (1.8 / 26) + rng.uniform(-.015, .015), .16, rng.uniform(-.2, .2))
add(click(), 6.25, .4); add(thunk(), 6.42, .45); add(whoosh(.35, False), 6.42, .12)
add(pop(380, 760), 6.95, .35, -.4); add(pop(400, 800), 7.0, .35, .4); add(chime((81, 88), .9), 7.02, .12)
# S2 table (a=8): notes pop out on stems, lock, drop back
add(whoosh(.5, True, (400, 2500)), 8.0, .1)
for j in range(3): add(pop(520 + j * 120, 980 + j * 120), 8.67 + j * .4, .28, (-.3, .3, 0)[j])
for j in range(3): add(click(1600 + j * 200), 10.6 + j * .27, .3, (-.3, .3, 0)[j])
add(whoosh(.6, False, (300, 2000)), 11.55, .12); add(thunk(), 12.25, .25)
# S3 photos (a=13)
for ts in (.7, 1.5, 2.9, 3.5, 4.1):
    add(shutter(), 13 + ts, .35, -.3); add(whoosh(.42, True, (800, 5000)), 13 + ts + .02, .1, .2); add(pop(900, 1300, .1), 13 + ts + .45, .18, .3)
# S4 morning (a=18)
add(whoosh(.6, True), 18.5, .14); add(chime(), 18.95, .3); add(pop(500, 1000), 20.5, .3, .3)
# S5 poll (a=23)
add(click(), 23.55, .3)
for i in range(8): add(tick(), 23.75 + i * .15, .2, -.2 + i * .05)
add(click(1500), 24.95, .3); add(pop(700, 1200), 25.2, .3, -.2); add(pop(500, 300, .25), 25.3, .2, .2); add(pop(800, 1400, .14), 25.8, .25)
# S6 receipt (a=27)
add(whoosh(.5, True, (300, 2500)), 27.0, .12); add(printer(2.6), 27.6, .22); add(boom()[: int(.5 * SR)], 30.65, .35); add(thunk(), 30.65, .4)
add(whoosh(.6, True, (500, 4000)), 30.55, .12)
# S7 share (a=32)
add(whoosh(1.2, True, (400, 5000)), 32.45, .16); add(chime((84, 88, 91), 1.0), 33.6, .12)
# scene swishes
for t0 in (2.85, 7.85, 12.85, 17.85, 22.85, 26.85, 31.85, 34.85): add(whoosh(.4, True, (400, 2500)), t0, .07)
# S8 list -> riser -> end card
add(whoosh(1.3, True, (300, 6000)), 36.75, .2); add(boom(), 38.0, .55); add(chime((69, 76, 81, 84), 2.4), 38.05, .25)

# ---------------- master ----------------
st = np.stack([mixL, mixR], 1)
fade = np.ones(N); fo = int(.6 * SR); fade[-fo:] = np.linspace(1, 0, fo); st *= fade[:, None]
st = np.tanh(st * 1.1) / np.tanh(1.1)       # gentle soft clip
st /= np.max(np.abs(st)) / .9
with wave.open(sys.argv[1] if len(sys.argv) > 1 else "score.wav", "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767).astype("<i2").tobytes())
print("ok", DUR)
