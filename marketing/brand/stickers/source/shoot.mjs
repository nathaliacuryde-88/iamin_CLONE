import { createRequire } from "module"; const { chromium } = createRequire(import.meta.url)(process.env.PW);
import fs from "fs";
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1720, height: 1200 }, deviceScaleFactor: 2 });
const url = (q) => "file://" + process.cwd() + "/board.html" + q;
for (const m of ["d", "l"]) {
  await p.goto(url("?m=" + m), { waitUntil: "networkidle" }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(800);
  await p.locator("#board").screenshot({ path: `out/board_${m}.png` });
}
await p.goto(url("?solo=1"), { waitUntil: "networkidle" }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(800);
fs.mkdirSync("out/png", { recursive: true });
const p1 = await b.newPage({ viewport: { width: 1720, height: 1200 }, deviceScaleFactor: 1 });
await p1.goto(url("?solo=1"), { waitUntil: "networkidle" }); await p1.evaluate(() => document.fonts.ready); await p1.waitForTimeout(800);
for (const id of await p1.evaluate(() => [...document.querySelectorAll("#solo .s")].map((e) => e.id))) await p1.locator("#" + id).screenshot({ path: `out/png/${id.slice(2)}.png`, omitBackground: true });
await b.close();
