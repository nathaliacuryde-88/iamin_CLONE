import { createRequire } from "module"; const { chromium } = createRequire(import.meta.url)(process.env.PW);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 2000 } });
p.on("pageerror", (e) => console.log("ERR", e.message));
await p.goto("file://" + process.cwd() + "/posts.html"); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(800);
const ids = await p.evaluate(() => [...document.querySelectorAll(".s")].map((e) => e.id));
for (const id of ids) await p.locator("#" + id).screenshot({ path: `out/${id}.png` });
console.log(ids.length, "slides"); await b.close();
