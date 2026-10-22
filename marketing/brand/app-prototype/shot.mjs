// node shot.mjs <ids...>  — screenshots screens (s:id) or sheets (h:id) in dark and light
import { createRequire } from "module"; const { chromium } = createRequire(import.meta.url)(process.env.PW);
import fs from "fs"; fs.mkdirSync("shots", { recursive: true });
const ids = process.argv.slice(2); const b = await chromium.launch(); const errs = [];
for (const scheme of ["dark", "light"]) {
  const p = await b.newPage({ viewport: { width: 1000, height: 920 }, colorScheme: scheme });
  p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  await p.goto("file://" + process.cwd() + "/preview.html", { waitUntil: "networkidle" }); await p.evaluate(() => document.fonts.ready);
  for (const id of ids) {
    await p.click(`#jump button[data-j="${id}"]`); await p.waitForTimeout(900);
    await p.locator("#device").screenshot({ path: `shots/${scheme}-${id.replace("|", "_")}.png` });
  }
  await p.close();
}
console.log("errors:", [...new Set(errs)].join(" | ") || "none"); await b.close();
