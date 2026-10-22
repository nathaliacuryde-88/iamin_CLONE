import { createRequire } from "module"; const { chromium } = createRequire(import.meta.url)(process.env.PW);
import fs from "fs"; fs.mkdirSync("shots", { recursive: true });
const b = await chromium.launch(); const errs = [];
for (const scheme of ["dark", "light"]) {
  const p = await b.newPage({ viewport: { width: 1000, height: 920 }, deviceScaleFactor: 1, colorScheme: scheme });
  p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  await p.goto("file://" + process.cwd() + "/preview.html", { waitUntil: "networkidle" }); await p.evaluate(() => document.fonts.ready);
  for (const path of ["person", "organizer"]) {
    await p.click(`#pathSeg button[data-v="${path}"]`);
    const n = await p.evaluate(() => document.querySelectorAll("#jump button").length);
    for (let k = 0; k < n; k++) {
      await p.click(`#jump button[data-j="${k}"]`); await p.waitForTimeout(3300);
      await p.locator("#device").screenshot({ path: `shots/${scheme}-${path}-${String(k).padStart(2, "0")}.png` });
    }
  }
  await p.close();
}
console.log("errors:", [...new Set(errs)].join(" | ") || "none");
await b.close();
