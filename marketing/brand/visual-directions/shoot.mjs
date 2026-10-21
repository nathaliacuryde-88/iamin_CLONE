import { createRequire } from "module"; const { chromium } = createRequire(import.meta.url)(process.env.PW);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 });
await p.goto("file://" + process.cwd() + "/" + (process.argv[2] || "directions.html"), { waitUntil: "networkidle" }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(1200);
for (const id of await p.evaluate(() => [...document.querySelectorAll(".row")].map((e) => e.id))) await p.locator("#" + id).screenshot({ path: `out/${id}.png` });
await b.close();
