// 3D iPhone shots for the launch reel v5 (transparent PNG sequences). node shots.mjs [hook,flyer,crew,tonight] [stills]
import fs from "fs"; import { createRequire } from "module";
const { chromium } = createRequire(import.meta.url)(process.env.PW);
const which = (process.argv[2] || "hook,flyer,crew,tonight").split(","), stills = process.argv[3] === "stills";
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
p.on("pageerror", (e) => console.log("ERR", e.message));
await p.goto("http://127.0.0.1:8772/3d/phone.html"); await p.waitForFunction(() => window.READY, null, { timeout: 60000 });
const clamp = (x) => Math.max(0, Math.min(1, x)), lin = (t, a, b) => clamp((t - a) / (b - a));
const eo = (x) => 1 - Math.pow(1 - clamp(x), 3), eio = (x) => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const back = (x, s = 1.7) => { x = clamp(x); return 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2); };
const mix = (a, b, k) => a + (b - a) * k;
const dW = (px) => 256200 / px;
const BEAT = 30 * .44118;   // frames per beat at 136 BPM
async function shot(name, N, fn) {
  const dir = `../a/3d/${name}`; fs.mkdirSync(dir, { recursive: true }); const rects = [];
  const list = stills ? [0, .25, .5, .75, 1].map((k) => Math.round(k * (N - 1))) : [...Array(N).keys()];
  for (const i of list) { await fn(i); rects[i] = await p.evaluate(() => window.rect()); await p.screenshot({ path: `${dir}/${String(i).padStart(3, "0")}.png`, omitBackground: true }); }
  if (!stills) fs.writeFileSync(`${dir}/rects.json`, JSON.stringify(rects.map((r) => r.map((v) => Math.round(v)))));
  console.log(name, "done", list.length);
}
const reset = () => p.evaluate(async () => { window.setBg(null); window.setOv(null); await window.setAvatars([]); await window.setFliers([]); await window.setPins([]); window.pinState([]); window.liftAvatars(0); });

if (which.includes("hook")) {   // 4 bars: spins in on the kicks, lands facing on bar 2, floats
  await reset(); await p.evaluate(async () => { await window.setScreen("tex/feed.png"); });
  await shot("hook", 212, async (i) => {
    const land = 4 * BEAT, k = eo(i / land), fl = lin(i, land, 211);
    const q = { sx: 540, sy: mix(1700, 1200, k), dist: dW(440) * mix(1.6, 1, k), rx: mix(20, 4, k) + Math.sin(i / 25) * 1.5 * fl, ry: mix(-200, 0, eio(i / land)) + Math.sin(i / 30) * 7 * fl, rz: mix(-10, 0, k), isl: 1, sheenOp: .06 };
    await p.evaluate((q) => window.pose2(q), q);
  });
}
if (which.includes("flyer")) {  // the flyer flies from the screenshot into the app; the screen reads it
  await reset(); await p.evaluate(async () => { await window.setScreen("tex/add_empty.png");
    await window.setFliers([{ src: "tex/flyer_sq.png", x: 135, y: 347, w: 176, h: 181, from: { x: -30, y: 40, z: 300, rx: .25, ry: .6, rz: -.2, s: 8 } }]); });
  await shot("flyer", 106, async (i) => {
    const k = eo(i / 12);
    const q = { sx: 600, sy: 1170, dist: dW(420) * mix(1.25, 1, k), rx: 6, ry: -14 + i * .08, rz: 2, isl: 1, sheenOp: .05 };
    const fk = lin(i, 12, 44); const tex = i < 46 ? "tex/add_empty.png" : i < 72 ? "tex/add_parsing.png" : "tex/add_filled.png";
    await p.evaluate(async ([q, fk, tex]) => { await window.setScreen(tex); window.flyT([fk <= 0 ? -1 : fk >= 1 ? 2 : fk]); window.pose2(q); }, [q, fk, tex]);
  });
}
if (which.includes("crew")) {   // friends pop out of the event page: "Timo is in", "Jonas is in", "Marie is in"
  await reset(); await p.evaluate(async () => { await window.setScreen("tex/event.png");
    await window.setPins([["timo", 300, 2140], ["jonas", 560, 2160], ["marie", 800, 2140]].map(([n, x, y]) => ({ src0: `tex/chip_${n}.png`, src1: `tex/chip_${n}.png`, x, y, w: 46 }))); });
  const H = [78, 56, 34];
  await shot("crew", 106, async (i) => {
    const k = eo(i / 12);
    const q = { sx: 560, sy: 1330, dist: dW(430) * mix(1.25, 1, k), rx: -40, ry: -6 + i * .05, rz: 4, isl: 1, sheenOp: .05 };
    const st = H.map((h, j) => { const up = back(lin(i, 14 + j * BEAT, 14 + j * BEAT + 14)); return { h: h * up + Math.sin(i / 8 + j) * .7 * up, op: clamp(up * 3), lock: 0 }; });
    await p.evaluate(([q, st]) => { window.pinState(st); window.pose2(q); }, [q, st]);
  });
}
if (which.includes("tonight")) {  // phone lying like a map; the Today strip friends lift on stems
  await reset(); await p.evaluate(async () => { await window.setScreen("tex/feed.png");
    await window.setAvatars([{ src: "tex/av_jonas.png", x: 541, y: 550, r: 85 }, { src: "tex/av_timo.png", x: 750, y: 550, r: 85 }, { src: "tex/av_marie.png", x: 959, y: 550, r: 85 }]); });
  await shot("tonight", 106, async (i) => {
    const k = eo(i / 14);
    const q = { sx: 540, sy: 1240, dist: dW(520) * mix(1.4, 1, k), rx: -56, ry: 2, rz: mix(-24, -10, k) + i * .03, isl: 1, sheenOp: .05 };
    const lift = back(lin(i, 16, 34)) * (1 - eio(lin(i, 92, 105)));
    await p.evaluate(([q, lift]) => { window.liftAvatars(lift * 26); window.pose2(q); }, [q, lift]);
  });
}
await b.close();
