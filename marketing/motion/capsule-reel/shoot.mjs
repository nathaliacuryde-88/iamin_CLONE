// Render frames of index.html: node shoot.mjs [frames comma list | all] [outdir]
import fs from "fs"; import { createRequire } from "module";
const { chromium } = createRequire(import.meta.url)(process.env.PW);
const which = process.argv[2] || "all", OUT = process.argv[3] || "frames"; fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
p.on("pageerror", (e) => console.log("ERR", e.message)); p.on("console", (m) => { if (m.type() === "error") console.log("CONSOLE", m.text().slice(0, 200)); });
await p.goto("http://127.0.0.1:8771/index.html"); await p.waitForFunction(() => window.render);
const total = Math.round(await p.evaluate(() => window.DUR * window.FPS));
const list = which === "all" ? [...Array(total).keys()] : which.split(",").map((s) => Math.round(+s * 30));
const t0 = Date.now();
for (const f of list) {
  await p.evaluate((f) => window.render(f), f);
  await p.screenshot({ path: `${OUT}/${String(f).padStart(4, "0")}.png` });
  if (f % 60 === 0) console.log(f, "/", total, ((Date.now() - t0) / 1000).toFixed(0) + "s");
}
console.log("done", list.length, "frames", total, "total");
await b.close();
