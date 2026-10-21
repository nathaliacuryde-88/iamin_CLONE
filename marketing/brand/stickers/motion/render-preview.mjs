// node render-preview.mjs  (PW=<path to playwright>) → frames → ffmpeg
import { createRequire } from "module"; const { chromium } = createRequire(import.meta.url)(process.env.PW || "playwright");
import fs from "fs";
const out = process.argv[2] || "frames"; fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1350 } });
await p.goto("file://" + process.cwd() + "/preview.html", { waitUntil: "networkidle" }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
const N = 30 * 7.8;
for (let f = 0; f < N; f++) { await p.evaluate((t) => window.setT(t), (f * 1000) / 30); await p.screenshot({ path: `${out}/f${String(f).padStart(4, "0")}.png` }); }
await b.close();
