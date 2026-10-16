// Time capsule reel captures from the 13 Oct build: 393x798 @3x (iPhone 15 Pro app area).
import fs from "fs"; import { createRequire } from "module"; import { makeDB, install, pid, ME } from "./fakebackend.mjs";
const { chromium } = createRequire(import.meta.url)(process.env.PW);
const OUT = "out"; fs.mkdirSync(OUT, { recursive: true }); const only = process.argv[2];
const run = (k) => !only || only.split(",").includes(k);
const b = await chromium.launch();
const EVID = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const AV = (n) => `https://demo.supabase.co/storage/v1/object/public/avatars/av_${n}.jpg`;
const NOTES = [[ME, "Timo ends up dancing on the bar. Calling it now 🔮"], [104, "Jonas loses his jacket. Again."], [103, "Home before 4. Lol."]];
const cast = (db) => {
  const set = (u, dn, un, av) => { const p = db.profiles.find((x) => x.user_id === u); if (p) Object.assign(p, { display_name: dn, username: un, avatar_url: av }); };
  set(ME, "Nina Alves", "nina", AV("nina")); set(pid(101), "Timo Berger", "timo", AV("timo"));
  set(pid(103), "Jonas Weber", "jonas.w", AV("jonas")); set(pid(104), "Marie Klein", "marie", AV("marie"));
  const e = db.events.find((x) => x.id === EVID(30));
  if (e) Object.assign(e, { name: "Saturday dinner & drinks", time: "19:30", location: "Bar Lola", image_url: null, description: "[[cover:🍝|14 85% 55%]]", visibility: "circle", created_by: ME });
  const who = [ME, pid(104), pid(103), ME, pid(101)];
  (db.time_capsule_photos || []).forEach((ph, i) => { ph.user_id = who[i % who.length]; });
};
async function fresh(dbOpts, at, extra = () => {}, poll = false) {
  const ctx = await b.newContext({ viewport: { width: 393, height: 798 }, deviceScaleFactor: 3, colorScheme: "dark", timezoneId: "Europe/Berlin" });
  globalThis.FAKE_NOW = new Date(at).toISOString(); const db = makeDB(dbOpts); cast(db); extra(db); await install(ctx, db, undefined, ME);
  if (!poll) await ctx.addInitScript(() => sessionStorage.setItem("exit-poll-prompted", "1"));
  await ctx.addInitScript(() => { for (const k of ["iamin.coach.feed.v1", "iamin.coach.v1", "iamin.gesture.v1"]) localStorage.setItem(k, "1"); });
  for (const h of ["https://geocoding-api.open-meteo.com/**", "https://api.open-meteo.com/**", "https://nominatim.openstreetmap.org/**"]) await ctx.route(h, (r) => r.fulfill({ json: {} }));
  const p = await ctx.newPage(); await p.clock.setFixedTime(new Date(at)); p.on("pageerror", (e) => console.log("ERR", e.message.slice(0, 140)));
  return { ctx, p, db };
}
const go = async (p, u) => { await p.goto("http://127.0.0.1:8080" + u, { waitUntil: "networkidle" }); await p.waitForTimeout(2000); };
const imgs = (p) => p.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0), null, { timeout: 12000 }).catch(() => console.log("imgs pending"));
const still = (p) => p.evaluate(() => document.getAnimations().forEach((a) => { try { a.finish(); } catch {} }));
const box = (loc) => loc.evaluate((e) => { const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map((v) => Math.round(v * 10) / 10); });
const B = fs.existsSync(`${OUT}/boxes.json`) ? JSON.parse(fs.readFileSync(`${OUT}/boxes.json`)) : {};
const save = () => fs.writeFileSync(`${OUT}/boxes.json`, JSON.stringify(B, null, 1));

// Before the night: write the note and seal it (Sat 3 Oct, 18:40 Berlin)
if (run("seal")) {
  const { ctx, p } = await fresh({ reel2b: true, notes: [] }, "2026-10-03T16:40:00Z");
  await go(p, "/event/" + EVID(30)); await imgs(p); await still(p);
  fs.writeFileSync(`${OUT}/event_text.txt`, await p.locator("body").innerText());
  const head = p.getByText(/Message to the future/i).first();
  for (let i = 0; i < 25 && !(await head.count()); i++) { await p.mouse.wheel(0, 350); await p.waitForTimeout(450); }
  if (!(await head.count())) { console.log("no capsule composer on event page"); await p.screenshot({ path: `${OUT}/event_top.png` }); }
  else {
    await head.evaluate((e) => { document.scrollingElement.scrollTop += e.getBoundingClientRect().y - 250; }); await p.waitForTimeout(700); await still(p);
    await p.screenshot({ path: `${OUT}/seal_00_empty.png` });
    const ta = p.locator("textarea").first(); B.textarea = await box(ta);
    await ta.click(); await p.waitForTimeout(400); await p.screenshot({ path: `${OUT}/seal_01_focus.png` });
    const txt = NOTES[0][1]; const chars = [...txt]; fs.mkdirSync(`${OUT}/typing`, { recursive: true });
    for (let i = 0; i < chars.length; i++) { await p.keyboard.type(chars[i]); await p.screenshot({ path: `${OUT}/typing/${String(i + 1).padStart(3, "0")}.png` }); }
    await p.evaluate(() => document.activeElement && document.activeElement.blur()); await p.waitForTimeout(300);
    await p.screenshot({ path: `${OUT}/seal_02_typed.png` });
    const btn = p.getByRole("button", { name: /Seal it/i }).first(); B.sealBtn = await box(btn);
    await btn.click(); await p.waitForTimeout(400); await p.screenshot({ path: `${OUT}/seal_03_mid.png` });
    await p.waitForTimeout(1500); await still(p); await p.screenshot({ path: `${OUT}/seal_04_sealed.png` });
    B.sealedCard = await box(p.getByText(/^Sealed$/).first().locator("xpath=ancestor::div[3]")).catch(() => null);
  }
  save(); await ctx.close();
}

// The morning after: the capsule opens (Sun 4 Oct, 10:12 Berlin)
if (run("open")) {
  const { ctx, p } = await fresh({ reel2b: true, photos: true, score: true, notes: NOTES }, "2026-10-04T08:12:00Z");
  await go(p, "/time-capsule/" + EVID(30)); await imgs(p); await p.waitForTimeout(800); await still(p);
  fs.writeFileSync(`${OUT}/open_text.txt`, await p.locator("body").innerText());
  await p.screenshot({ path: `${OUT}/open_top.png` });
  await p.screenshot({ path: `${OUT}/open_full.png`, fullPage: true });
  const rev = p.getByText(/Opened from the capsule|Revealed/i).first(); if (await rev.count()) B.revealed = await box(rev);
  for (let i = 1; i <= 3; i++) { await p.mouse.wheel(0, 380); await p.waitForTimeout(800); await imgs(p); await still(p); await p.screenshot({ path: `${OUT}/open_s${i}.png` }); }
  save(); await ctx.close();
}

// All capsules: one per night
if (run("list")) {
  const { ctx, p } = await fresh({ reel2b: true, photos: true, notes: NOTES }, "2026-10-04T08:20:00Z", (db) => {
    const past = db.events.filter((e) => e.date < "2026-10-03" && e.id !== EVID(30)).slice(0, 5);
    const NIGHTS = [["Marie’s birthday", "🎂"], ["Karaoke night", "🎤"], ["Rooftop drinks", "🍸"], ["Gig at Wizemann", "🎸"], ["Pasta & wine", "🍷"]];
    past.forEach((e, k) => { e.name = NIGHTS[k % 5][0]; e.description = `[[cover:${NIGHTS[k % 5][1]}|262 70% 60%]]`; e.image_url = null; });
    past.forEach((e, k) => { for (let i = 1; i <= 3 + (k % 3); i++) db.time_capsule_photos.push({ id: `px-${k}-${i}`, event_id: e.id, user_id: [ME, pid(101), pid(103), pid(104)][i % 4],
      image_url: `capsule/${String(((k + i) % 5) + 1).padStart(2, "0")}.jpg`, caption: null, created_at: `${e.date}T22:00:00Z` }); });
    const withPhotos = new Set(db.time_capsule_photos.map((x) => x.event_id));
    db.events.forEach((e) => { if (!withPhotos.has(e.id)) e.capsule_dismissed_at = "2026-10-04T00:00:00Z"; });
  });
  await go(p, "/time-capsule"); await imgs(p); await p.waitForTimeout(800); await still(p);
  fs.writeFileSync(`${OUT}/list_text.txt`, await p.locator("body").innerText());
  await p.screenshot({ path: `${OUT}/list_top.png` });
  await p.screenshot({ path: `${OUT}/list_full.png`, fullPage: true });
  await ctx.close();
}
// Photo grid boxes (for the photos-fly-in beat) and the revealed card
if (run("grid")) {
  const { ctx, p } = await fresh({ reel2b: true, photos: true, score: true, notes: NOTES }, "2026-10-04T08:12:00Z");
  await go(p, "/time-capsule/" + EVID(30)); await imgs(p); await p.waitForTimeout(800); await still(p);
  B.revealedCard = await p.evaluate(() => { const el = [...document.querySelectorAll("*")].find((e) => e.childElementCount === 0 && e.textContent.trim() === "Revealed"); let c = el; for (let i = 0; i < 6 && c; i++) { c = c.parentElement; const r = c.getBoundingClientRect(); if (r.width > 320) return [r.x, r.y, r.width, r.height]; } return null; });
  const findPh = () => p.evaluate(() => { const els = [...document.querySelectorAll("body *")].filter((e) => /Photos\s*\(5\)/.test(e.textContent) && e.getBoundingClientRect().width > 0); els.sort((a, b) => a.getBoundingClientRect().width * a.getBoundingClientRect().height - b.getBoundingClientRect().width * b.getBoundingClientRect().height); const el = els[0]; if (!el) return null; const r = el.getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; });
  const ph0 = await findPh(); console.log("ph0", ph0); if (!ph0) console.log((await p.locator("body").innerText()).slice(0, 400));
  await p.evaluate((y) => { document.scrollingElement.scrollTop += y - 140; }, ph0[1]); await p.waitForTimeout(900); await imgs(p); await still(p);
  await p.screenshot({ path: `${OUT}/grid_full.png` });
  B.gridHead = await findPh();
  B.gridImgs = await p.evaluate(() => [...document.images].map((i) => { const r = i.getBoundingClientRect(); return { src: i.src.split("/").pop().split("?")[0], b: [r.x, r.y, r.width, r.height].map((v) => Math.round(v * 10) / 10) }; }).filter((o) => o.b[2] > 100));
  await p.addStyleTag({ content: "img{visibility:hidden !important}" }); await p.waitForTimeout(300);
  await p.screenshot({ path: `${OUT}/grid_empty.png` });
  save(); await ctx.close();
}
// Exit poll: "How was it?" sheet, slider 0 -> 8
if (run("poll")) {
  const { ctx, p } = await fresh({ reel2b: true, photos: true, notes: NOTES, tab: true }, "2026-10-04T08:14:00Z", (db) => {
    db.attendees.filter((a) => a.event_id !== EVID(30) && a.user_id === ME).forEach((a) => (a.status = "interested"));
    db.events.find((e) => e.id === EVID(30)).created_by = pid(104);
  }, true);
  await go(p, "/time-capsule"); await p.waitForTimeout(1800); await still(p);
  fs.writeFileSync(`${OUT}/poll_text.txt`, await p.locator("body").innerText());
  await p.screenshot({ path: `${OUT}/poll_00.png` });
  const sl = p.getByRole("slider").first();
  if (await sl.count()) {
    B.pollSlider = await box(sl); const tr = p.locator("[data-orientation=horizontal]").first(); B.pollTrack = await box(tr).catch(() => null);
    await sl.focus(); await p.keyboard.press("Home"); await p.waitForTimeout(300); await still(p); await p.screenshot({ path: `${OUT}/poll_v0.png` });
    for (let v = 1; v <= 10; v++) { await p.keyboard.press("ArrowRight"); await p.waitForTimeout(250); await still(p); await p.screenshot({ path: `${OUT}/poll_v${v}.png` }); B["pollThumb" + v] = await box(sl); }
  } else console.log("no slider");
  save(); await ctx.close();
}

// Morning-after receipt and Share to story sheets
if (run("receipt")) {
  const { ctx, p } = await fresh({ reel2b: true, photos: true, score: true, notes: NOTES, tab: true }, "2026-10-04T08:16:00Z");
  await go(p, "/time-capsule/" + EVID(30)); await imgs(p); await p.waitForTimeout(800); await still(p);
  const rc = p.getByText(/Morning-after receipt/i).first();
  await rc.evaluate((e) => e.scrollIntoView({ block: "center" })); await p.waitForTimeout(500); await still(p);
  await p.screenshot({ path: `${OUT}/receipt_btns.png` }); B.receiptBtn = await box(rc); B.storyBtn = await box(p.getByText(/Share to story/i).first());
  await rc.click(); await p.waitForTimeout(2000); await still(p); await p.screenshot({ path: `${OUT}/receipt.png` });
  fs.writeFileSync(`${OUT}/receipt_text.txt`, await p.locator("body").innerText());
  await p.keyboard.press("Escape"); await p.waitForTimeout(800);
  await p.getByText(/Share to story/i).first().click(); await p.waitForTimeout(3500); await imgs(p); await still(p);
  await p.screenshot({ path: `${OUT}/story.png` });
  save(); await ctx.close();
}
await b.close();
