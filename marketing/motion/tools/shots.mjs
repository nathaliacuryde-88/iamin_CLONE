// node shots.mjs [razzia|radar|morning] [stills]
import { createRequire } from "module"; import fs from "fs"; const { chromium } = createRequire(import.meta.url)(process.env.PW);
const which = (process.argv[2] || "razzia,radar,morning").split(","), stills = process.argv[3] === "stills";
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
p.on("pageerror", (e) => console.log("ERR", e.message));
await p.goto("http://127.0.0.1:8765/phone3d.html"); await p.waitForFunction(() => window.READY, null, { timeout: 30000 });
const clamp = (x) => Math.max(0, Math.min(1, x));
const ease = (x) => 1 - Math.pow(1 - clamp(x), 3);
const inout = (x) => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const smooth = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
const lerp = (a, b, k) => a + (b - a) * k;
const isl = (q, FB) => Math.max(0, Math.min(1, (q.dist - FB.dist * 1.08) / (FB.dist * .25)));
const mix = (A, B, k) => { const o = {}; for (const key of new Set([...Object.keys(A), ...Object.keys(B)])) o[key] = lerp(A[key] ?? 0, B[key] ?? 0, k); return o; };
async function shot(name, N, fn) {
  const dir = `shots/${name}`; fs.mkdirSync(dir, { recursive: true });
  const list = stills ? (process.env.IDX ? process.env.IDX.split(",").map(Number) : [0, .2, .4, .6, .8, 1].map((k) => Math.round(k * (N - 1)))) : [...Array(N).keys()];
  for (const i of list) { await fn(i / (N - 1), i); await p.screenshot({ path: `${dir}/${String(i).padStart(3, "0")}.png` }); }
  console.log(name, "done", list.length);
}
if (which.includes("razzia")) {
  await p.evaluate(async () => { window.FILL = "rgb(17,18,23)"; await window.setScreen("tex/razzia_tall.png"); window.setBg(null); window.setOv(null); await window.setAvatars([]); await window.setFliers([]); });
  const FB = await p.evaluate(() => window.fullBleed(0));
  const A = { rx: 0, ry: 0, rz: 0, x: 0, y: 0, dist: FB.dist, ty: FB.ty }, Bp = { rx: 7, ry: -30, rz: -4, x: 0, y: 6, dist: FB.dist * 2.15, ty: 4 }, Cp = { rx: 4, ry: 22, rz: 2, x: 0, y: 6, dist: FB.dist * 2.05, ty: 4 };
  await shot("razzia", 50, async (t) => {
    const q = t < .32 ? mix(A, Bp, inout(t / .32)) : t < .66 ? mix(Bp, Cp, smooth((t - .32) / .34)) : mix(Cp, A, inout((t - .66) / .34));
    q.isl = isl(q, FB); await p.evaluate((q) => window.pose(q), q);
  });
}
if (which.includes("radar")) {
  const FB = await p.evaluate(() => window.fullBleed(520));
  await p.evaluate(async () => { window.setBg(null); await window.setFliers([]);
    await window.setAvatars([{ src: "tex/av0.png", x: 528, y: 374, r: 54 }, { src: "tex/av1.png", x: 770, y: 358, r: 54 }, { src: "tex/av2.png", x: 684, y: 590, r: 54 }, { src: "tex/av3.png", x: 286, y: 670, r: 54 }]); });
  const A = { rx: 0, ry: 0, rz: 0, x: 0, y: 0, dist: FB.dist, ty: FB.ty }, Bp = { rx: -52, ry: 0, rz: -14, x: 0, y: -10, dist: FB.dist * 1.25, ty: 12 }, Cp = { rx: -48, ry: 0, rz: 8, x: 0, y: -10, dist: FB.dist * 1.2, ty: 12 };
  await shot("radar", 48, async (t, i) => {
    const f = 225 + i;
    const q = t < .3 ? mix(A, Bp, inout(t / .3)) : t < .7 ? mix(Bp, Cp, smooth((t - .3) / .4)) : mix(Cp, A, inout((t - .7) / .3));
    q.isl = isl(q, FB);
    const lift = t < .25 ? 0 : t < .4 ? ease((t - .25) / .15) : t < .65 ? 1 : 1 - inout((t - .65) / .12);
    await p.evaluate(async ([f, q, lift]) => { await window.setScreenMix(`tex/radarA_${f}.png`, `tex/radarB_${f}.png`, 1 - q.isl);
      await window.setOv(`all/${String(f + 1).padStart(4, "0")}.png`, 1, "inset(0 0 1400px 0)"); window.liftAvatars(lift * 13); window.pose(q); }, [f, q, lift]);
  });
}
if (which.includes("morning")) {
  // sleep (face-down, zzz) -> buzz -> flip & rise -> photos + note fly in -> push into the capsule
  const FB = await p.evaluate(() => window.fullBleed(300));
  const PH = [[188, 404, 344, 344], [549, 433, 340, 337], [192, 794, 335, 335], [548, 818, 340, 343], [371, 1179, 337, 338]];
  const froms = [{ x: -95, y: 60, z: 140, rx: .6, ry: -.9, rz: -.5, s: 1.6 }, { x: 105, y: 80, z: 160, rx: -.5, ry: .8, rz: .6, s: 1.5 }, { x: -110, y: -40, z: 120, rx: .4, ry: .9, rz: .4, s: 1.7 },
    { x: 115, y: -30, z: 150, rx: -.6, ry: -.7, rz: -.5, s: 1.6 }, { x: 10, y: -120, z: 170, rx: .8, ry: .2, rz: .7, s: 1.8 }, { x: -20, y: 150, z: 180, rx: -.7, ry: .3, rz: -.3, s: 1.4 }];
  await p.evaluate(async ([PH, froms]) => { window.FILL = "rgb(13,8,7)"; await window.setAvatars([]); await window.setScreen("tex/caps_empty.png");
    await window.setFliers([...PH.map(([x, y, w, h], i) => ({ src: `tex/ph${i}.png`, x, y, w, h, from: froms[i] })), { src: "tex/note0.png", x: 113, y: 1692, w: 854, h: 439, from: froms[5] }]); }, [PH, froms]);
  const N = 105, T = (f) => f / (N - 1);
  const S = { rx: -70, ry: 180, rz: -6, x: 0, y: -92, dist: FB.dist * 2.25, ty: -18 };
  const M = { rx: -14, ry: 4, rz: -3, x: 0, y: -14, dist: FB.dist * 2.15, ty: -10 };
  const E = { rx: 0, ry: 0, rz: 0, x: 0, y: 0, dist: FB.dist, ty: FB.ty };
  await shot("morning", N, async (t, i) => {
    let q;
    if (i < 32) { q = { ...S }; q.y += Math.sin(i / 32 * Math.PI * 2) * .6 - 70 * Math.pow(1 - Math.min(1, i / 12), 3); }
    else if (i < 42) { q = { ...S }; const k = i - 32; q.rz += Math.sin(k * 2.6) * 2.2 * (1 - k / 10); q.x += Math.sin(k * 3.1) * 1.2 * (1 - k / 10); }
    else if (i < 66) { const k = (i - 42) / 24; q = mix(S, M, inout(k)); q.y += Math.sin(Math.PI * k) * 14; }
    else if (i < 86) q = { ...M, rz: lerp(M.rz, 2, smooth((i - 66) / 20)), ry: lerp(M.ry, -4, smooth((i - 66) / 20)) };
    else q = mix({ ...M, rz: 2, ry: -4 }, E, inout((i - 86) / (N - 1 - 86)));
    q.isl = isl(q, FB);
    // zzz above the sleeping phone (world coords)
    const zz = [0, 1, 2].map((k) => { const u = ((i + k * 10) % 30) / 30, on = i < 36 ? 1 : 0;
      return { x: 4 + k * 12 + u * 14, y: -82 + u * 38 + k * 9, z: 20, s: 13 + k * 5, op: on * Math.sin(Math.PI * u) * (i < 30 ? 1 : 1 - (i - 30) / 6) }; });
    // photos fly in from 60, note at 76; land by 84
    const fl = [0, 1, 2, 3, 4].map((k) => (i - 60 - k * 3) / 12).concat([(i - 74) / 12]).map((v) => (v < 0 ? -1 : (i >= 86 ? 2 : Math.min(1, v))));
    const texFull = i >= 86;
    const bgOp = 1 - smooth((i - 42) / 22), bgDy = -260 * smooth((i - 42) / 24), ovOp = smooth((i - 92) / 12);
    await p.evaluate(async ([q, zz, fl, texFull, bgOp, bgDy, ovOp]) => {
      await window.setScreen(texFull ? "tex/caps_full.png" : "tex/caps_empty.png");
      await window.setBg("all/0467.png", bgOp, bgDy); await window.setOv("all/0605.png", ovOp, "inset(0 0 1620px 0)");
      window.setZ(zz); window.flyT(fl); window.pose(q); }, [q, zz, fl, texFull, bgOp, bgDy, ovOp]);
  });
}
await b.close();
