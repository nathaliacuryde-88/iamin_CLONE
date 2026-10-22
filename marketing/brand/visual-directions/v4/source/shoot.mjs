import { createRequire } from "module"; const { chromium } = createRequire(import.meta.url)(process.env.PW);
import fs from "fs"; fs.mkdirSync("out", { recursive: true });
const areas = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 2800, height: 1400 }, deviceScaleFactor: 2 });
const warn = []; p.on("console", (m) => { if (m.type() === "warning" || m.type() === "error") warn.push(m.text()); });
for (const a of areas) {
  await p.goto("file://" + process.cwd() + "/index.html?a=" + encodeURIComponent(a), { waitUntil: "networkidle" });
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(900);
  const key = a.replace(/ /g, "");
  for (const t of ["d", "l"]) await p.locator(`#row-${key}-${t}`).screenshot({ path: `out/${key}-${t}.png` });
  for (const id of await p.evaluate(() => [...document.querySelectorAll(".ph")].map((e) => e.id))) await p.locator("#" + id).screenshot({ path: `out/${key}__${id}.png` });
}
console.log([...new Set(warn)].join("\n"));
await b.close();
