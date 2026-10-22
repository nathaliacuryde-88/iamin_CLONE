import { createRequire } from "module"; const { chromium } = createRequire(import.meta.url)(process.env.PW);
import fs from "fs"; fs.mkdirSync("out/v3full", { recursive: true });
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 2200, height: 1200 }, deviceScaleFactor: 2 });
await p.goto("file://" + process.cwd() + "/v3full.html", { waitUntil: "networkidle" }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(1200);
for (const id of await p.evaluate(() => [...document.querySelectorAll(".ph")].map((e) => e.id))) await p.locator("#" + id).screenshot({ path: `out/v3full/${id}.png` });
for (const id of ["rd", "rl"]) await p.locator("#" + id).screenshot({ path: `out/v3full/${id}.png` });
await b.close();
