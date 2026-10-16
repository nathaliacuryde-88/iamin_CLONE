// Launch reel v5 captures (13 Oct build): Friday, Nina is the viewer, cast avatars. 393x798 @3x.
import fs from "fs"; import { createRequire } from "module"; import { makeDB, install, pid, ME } from "./fakebackend.mjs";
const { chromium } = createRequire(import.meta.url)(process.env.PW);
const OUT = "out"; fs.mkdirSync(OUT, { recursive: true }); const only = process.argv[2];
const run = (k) => !only || only.split(",").includes(k);
const b = await chromium.launch();
const EVID = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const AV = (n) => `https://demo.supabase.co/storage/v1/object/public/avatars/av_${n}.jpg`;
const FRI = "2026-10-02T16:30:00Z";   // Friday 18:30 Berlin
const cast = (db) => {
  const set = (u, dn, un, av) => { const p = db.profiles.find((x) => x.user_id === u); if (p) Object.assign(p, { display_name: dn, username: un, avatar_url: av }); };
  set(ME, "Nina Alves", "nina", AV("nina")); set(pid(101), "Timo Berger", "timo", AV("timo")); set(pid(103), "Jonas Weber", "jonas.w", AV("jonas")); set(pid(104), "Marie Klein", "marie", AV("marie"));
  const rz = db.events.find((e) => e.id === EVID(20)); if (rz) rz.date = "2026-10-02";   // tonight = Friday
  db.user_statuses = [[104, "💃", "Razzia later"], [101, "🍻", "Pre-drinks at mine"], [103, "🔥", null]].map(([u, v, w], k) => ({
    user_id: pid(u), status: "available", vibe: v, where_text: w, expires_at: "2026-10-03T04:00:00Z", created_at: "2026-10-02T15:00:00Z", updated_at: `2026-10-02T16:${10 + k}:00Z` }));
  for (const u of [101, 103, 104]) if (!db.attendees.some((a) => a.event_id === EVID(20) && a.user_id === pid(u))) db.attendees.push({ id: `rz-${u}`, event_id: EVID(20), user_id: pid(u), status: "going", comped: false, created_at: "2026-10-01T00:00:00Z" });
};
async function fresh(dbOpts, at = FRI, extra = () => {}) {
  const ctx = await b.newContext({ viewport: { width: 393, height: 798 }, deviceScaleFactor: 3, colorScheme: "dark", timezoneId: "Europe/Berlin" });
  globalThis.FAKE_NOW = new Date(at).toISOString(); const db = makeDB(dbOpts); cast(db); extra(db); await install(ctx, db, undefined, ME);
  await ctx.addInitScript(() => { sessionStorage.setItem("exit-poll-prompted", "1"); for (const k of ["iamin.coach.feed.v1", "iamin.coach.v1", "iamin.gesture.v1"]) localStorage.setItem(k, "1"); });
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

if (run("feed")) {   // Friday feed: Today strip (who's out tonight) + tonight's plans, then tap I'm in
  const { ctx, p } = await fresh({ reel1: true }); await go(p, "/"); await imgs(p); await p.waitForTimeout(800); await still(p);
  fs.writeFileSync(`${OUT}/feed_text.txt`, await p.locator("body").innerText());
  await p.screenshot({ path: `${OUT}/feed.png` });
  const btn = p.getByRole("button", { name: /I.?m in/i }).first(); if (await btn.count()) { B.feedIn = await box(btn); await btn.click(); await p.waitForTimeout(1600); await still(p); await p.screenshot({ path: `${OUT}/feed_in.png` }); }
  save(); await ctx.close();
}
if (run("friend")) {  // tap a friend in the Today strip, wave
  const { ctx, p } = await fresh({ reel1: true }); await go(p, "/"); await imgs(p); await still(p);
  const f = p.getByText(/^Marie$/).first(); if (await f.count()) { B.stripMarie = await box(f); await f.click(); await p.waitForTimeout(1500); await still(p); await p.screenshot({ path: `${OUT}/friend.png` });
    const wave = p.getByRole("button", { name: /wave/i }).first(); if (await wave.count()) { B.wave = await box(wave); await wave.click(); await p.waitForTimeout(1200); await still(p); await p.screenshot({ path: `${OUT}/friend_waved.png` }); } }
  else console.log("no Marie in strip");
  save(); await ctx.close();
}
if (run("event")) {   // who's really in: the event page with friends going
  const { ctx, p } = await fresh({ reel1: true }, FRI, (db) => db.attendees.push({ id: "rz-me", event_id: EVID(20), user_id: ME, status: "going", comped: false, created_at: "2026-10-02T16:29:00Z" }));
  await go(p, "/event/" + EVID(20)); await imgs(p); await p.waitForTimeout(600); await still(p);
  await p.screenshot({ path: `${OUT}/event_top.png` }); fs.writeFileSync(`${OUT}/event_text.txt`, await p.locator("body").innerText());
  for (let i = 0; i < 3; i++) { await p.mouse.wheel(0, 300); await p.waitForTimeout(250); } await p.waitForTimeout(800); await still(p);
  await p.screenshot({ path: `${OUT}/event_scroll.png` });
  await ctx.close();
}
if (run("flyer")) {   // screenshot a flyer -> the app reads it
  const { ctx, p } = await fresh({ reel1: true }, "2026-10-02T09:30:00Z");
  await ctx.route("https://demo.supabase.co/functions/v1/parse-event-screenshot**", async (r) => { await new Promise((s) => setTimeout(s, 1500));
    return r.fulfill({ json: { name: "Midnight Service · Summer Rave", date: "2026-10-10", time: "16:00", end_date: null, end_time: "22:00", location: "Trude", city: "Stuttgart", description: "Open air 16–22h, aftershow from 22h.", vibe_category: "music" } }); });
  await go(p, "/add-event"); await still(p); await p.screenshot({ path: `${OUT}/add_empty.png` });
  await p.locator("input[type=file]").first().setInputFiles("assets/shot_midnight.png"); await p.waitForTimeout(500);
  await p.screenshot({ path: `${OUT}/add_parsing.png` }); await p.waitForTimeout(3200); await imgs(p);
  await p.mouse.click(380, 330); await p.keyboard.press("Escape"); await p.evaluate(() => document.activeElement && document.activeElement.blur()); await p.waitForTimeout(500);
  const ev1 = p.getByText(/^EVENT 1$/i).first(); if (await ev1.count()) await ev1.evaluate((e) => { document.scrollingElement.scrollTop += e.getBoundingClientRect().y - 70; }); await p.waitForTimeout(700);
  await p.screenshot({ path: `${OUT}/add_filled.png` });
  await ctx.close();
}
await b.close();
