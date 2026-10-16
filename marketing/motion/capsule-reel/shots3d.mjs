// 3D iPhone shots for the capsule reel v2, rendered as transparent PNG sequences.
// node shots3d.mjs [intro,table,receipt,share] [stills]
import fs from "fs"; import { createRequire } from "module";
const { chromium } = createRequire(import.meta.url)(process.env.PW);
const which = (process.argv[2] || "intro,table,receipt,share").split(","), stills = process.argv[3] === "stills";
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
p.on("pageerror", (e) => console.log("ERR", e.message)); p.on("console", (m) => { if (m.type() === "error") console.log("CONSOLE", m.text().slice(0, 160)); });
await p.goto("http://127.0.0.1:8771/3d/phone.html"); await p.waitForFunction(() => window.READY, null, { timeout: 60000 });
const clamp = (x) => Math.max(0, Math.min(1, x)), lin = (t, a, b) => clamp((t - a) / (b - a));
const eo = (x) => 1 - Math.pow(1 - clamp(x), 3), eio = (x) => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const back = (x, s = 1.7) => { x = clamp(x); return 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2); };
const mix = (a, b, k) => a + (b - a) * k;
const dW = (px) => 256200 / px;   // camera distance for a phone width in px
async function shot(name, N, fn) {
  const dir = `../a/3d/${name}`; fs.mkdirSync(dir, { recursive: true }); const rects = [];
  const list = stills ? [0, .25, .5, .75, 1].map((k) => Math.round(k * (N - 1))) : [...Array(N).keys()];
  for (const i of list) { await fn(i); rects[i] = await p.evaluate(() => [...window.rect(), ...(window.meshRect("paper") || window.meshRect("story") || [])]); await p.screenshot({ path: `${dir}/${String(i).padStart(3, "0")}.png`, omitBackground: true }); }
  if (!stills) fs.writeFileSync(`${dir}/rects.json`, JSON.stringify(rects.map((r) => r.map((v) => Math.round(v)))));
  console.log(name, "done", list.length);
}
const reset = () => p.evaluate(async () => { window.setBg(null); window.setOv(null); await window.setAvatars([]); await window.setFliers([]); await window.setPins([]); window.pinState([]); });

if (which.includes("intro")) {   // rises from below, turning, Capsules list on screen
  await reset(); await p.evaluate(async () => { await window.setScreen("tex/list.png"); });
  await shot("intro", 90, async (i) => {
    const k = eo(i / 42), r = eio(i / 89);
    const q = { sx: 540, sy: mix(2500, 1130, k), dist: dW(400), rx: mix(16, 3, k), ry: mix(-42, 10, r), rz: mix(-8, 0, k), isl: 1, sheenOp: .06 };
    await p.evaluate((q) => window.pose2(q), q);
  });
}
if (which.includes("table")) {   // lying on the dinner table; the sealed notes pop out on stems, lock, drop back
  await reset(); await p.evaluate(async () => { await window.setScreen("tex/sealed.png");
    await window.setPins([["nina", 300, 820], ["marie", 770, 1200], ["jonas", 340, 1640]].map(([n, x, y]) => ({ src0: `tex/note_${n}_0.png`, src1: `tex/note_${n}_1.png`, x, y, w: 64 }))); });
  const H = [64, 44, 26];
  await shot("table", 150, async (i) => {
    const k = eo(i / 20), drift = i / 149;
    const q = { sx: 540, sy: 1300, dist: dW(520) * mix(1.45, 1, k), rx: -58, ry: 3, rz: mix(-30, -14, k) + drift * 4, isl: 1, sheenOp: .05 };
    const st = H.map((h, j) => { const up = back(lin(i, 20 + j * 12, 36 + j * 12)), down = eio(lin(i, 108, 128));
      const hh = h * up * (1 - down) + Math.sin(i / 9 + j) * .8 * up * (1 - down); return { h: Math.max(0, hh), op: clamp(up * 3) * (1 - lin(i, 118, 128)), lock: i >= 78 + j * 8 ? 1 : 0 }; });
    await p.evaluate(([q, st]) => { window.pinState(st); window.pose2(q); }, [q, st]);
  });
}
const RQ = { sx: 540, sy: 1480, dist: dW(430), rx: 8, ry: -16, rz: 2, isl: 1, sheenOp: .05 };
if (which.includes("receipt")) {   // the morning-after receipt prints out of the top of the phone
  await reset(); await p.evaluate(async () => { await window.setScreen("tex/caps.png"); await window.setPaper("tex/paper.png"); });
  await shot("receipt", 150, async (i) => {
    const k = eo(i / 16), push = eio(lin(i, 112, 149));
    const q = { ...RQ, sy: mix(1760, RQ.sy, k) + push * 170, dist: RQ.dist * mix(1, .82, push), ry: RQ.ry + push * 6 };
    const lt = lin(i, 18, 96), pr = lt + Math.sin(lt * 70) * .006 * (lt > 0 && lt < 1);   // printer stutter
    const sk = lin(i, 100, 110);
    await p.evaluate(([q, pr, sk]) => { window.paperState(pr); window.stampState(sk, pr); window.pose2(q); }, [q, clamp(pr), sk]);
  });
  await p.evaluate(() => { window.paperState(0); window.stampState(0, 0); });
}
if (which.includes("share")) {   // the story card lifts off the screen towards the camera
  await reset(); await p.evaluate(async () => { window.paperState(0); window.stampState(0, 0); await window.setScreen("tex/story.png"); await window.setStory("tex/storycard.png", { x: 170, y: 511, w: 742, h: 1020 }); });
  await shot("share", 90, async (i) => {
    const k = eo(i / 12), e = eio(lin(i, 14, 58)), fl = Math.sin(i / 10) * .6 * lin(i, 58, 70);
    const q = { ...RQ, sy: mix(1700, RQ.sy, k), ry: RQ.ry + e * 4 };
    const to = { x: 0, y: 38 + fl, z: 85, rx: -.14, ry: .34, rz: -.035, s: 1.55 };
    await p.evaluate(([q, e, to]) => { window.storyState(e, to); window.pose2(q); }, [q, e, to]);
  });
}
await b.close();
